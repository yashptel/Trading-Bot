import Exchange from "./exchange";
import http from "./api";
import _ from "lodash";
import { store } from "../store";

class Bybit extends Exchange {
  constructor() {
    super("Bybit");
  }

  async takeTrade({
    side,
    size,
    stopLoss,
    takeProfit,
    price,
    tradingPair,
    type = "MARKET",
    selectedPair = store.getState().selectedPair,
  }) {
    if (selectedPair.exchangeName != this.name) {
      throw new Error("Exchange name mismatch.");
    }

    const tickSize = _.get(selectedTradingPair, "priceFilter.tickSize", 0);
    const qtyStep = _.get(selectedTradingPair, "lotSizeFilter.qtyStep", 0);
    const pair = _.get(selectedTradingPair, "pair", "");

    const serverTime = await this.getServerTime();
    const timestamp = serverTime - Date.now();
    side = _.startCase(_.toLower(side));

    const params = {
      catagory: "linear",
      symbol: pair,
      side: side,
      orderType: "Market",
      qty: this.roundToSamePrecision(positionSize, qtyStep).toString(),
      timeInForce: "GTC",
      positionIdx: side === "Buy" ? 1 : 2,
    };

    if (type === "LIMIT") {
      params.orderType = "Limit";
      params.price = this.roundToSamePrecision(price, tickSize).toString();
    }

    if (stopLoss) {
      params.stopLoss = this.roundToSamePrecision(
        stopLoss,
        tickSize
      ).toString();
    }

    if (takeProfit) {
      params.takeProfit = this.roundToSamePrecision(
        takeProfit,
        tickSize
      ).toString();
    }

    const signature = this.generateSignature(params, {
      timestamp,
    });

    const response = await http.request({
      method: "POST",
      data: {
        url: "https://api.bybit.com/v5/order/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-BAPI-SIGN-TYPE": "2",
          "X-BAPI-API-KEY": this.apiKey,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": "5000",
          "X-BAPI-SIGN": signature,
        },
        data: params,
      },
    });

    const retCode = _.get(response, "data.body.retCode", 0);
    const retMsg = _.get(response, "data.body.retMsg", "");

    if (retCode !== 0) {
      store.dispatch({
        type: "ADD_TOAST",
        data: {
          message: retMsg,
          type: "error",
        },
      });

      return response;
    }

    store.dispatch({
      type: "ADD_TOAST",
      data: {
        message: "Order placed successfully.",
        type: "success",
      },
    });

    return response;
  }

  async getServerTime() {
    const response = await http.request({
      method: "POST",
      data: {
        url: "https://api.bybit.com/v3/public/time",
        method: "GET",
      },
    });

    return _.get(response, "data.body.time");
  }

  async getAllTradingPairs() {
    const response = await http.request({
      method: "POST",
      data: {
        url: "https://api.bybit.com/v5/market/instruments-info?category=linear",
        method: "GET",
      },
    });

    return _(response)
      .get("data.body.result.list")
      .filter((item) => item.contractType === "LinearPerpetual")
      .map((item) => {
        return {
          ...item,
          exchangeName: this.name,
          baseAsset: item.baseCoin,
          quoteAsset: item.quoteCoin,
          displayName: `${item.baseCoin}/${item.quoteCoin}`,
        };
      });
  }

  generateSignature(params, { timestamp, recvWindow = 5000 }) {
    const signRequestParams = JSON.stringify(params);
    const paramsStr = timestamp + this.apiKey + recvWindow + signRequestParams;
    const signature = CryptoJS.HmacSHA256(paramsStr, this.secret).toString(
      CryptoJS.enc.Hex
    );

    return signature;
  }
}

export default Bybit;
