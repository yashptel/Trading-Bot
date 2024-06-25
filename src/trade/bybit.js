import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";
import { store } from "../store/index.js";
import { w3cwebsocket as WebSocket } from "websocket";
import CryptoJS from "crypto-js";

class Bybit extends Exchange {
  constructor(args) {
    super(args);
    this.BASE_URL = import.meta.env.VITE_BYBIT_URL;
    this.SOCKET_ADDRESS = import.meta.env.VITE_BYBIT_SOCKET_ADDRESS;
  }

  async takeTrade({
    originalSymbol,
    side,
    type = "MARKET",
    price,
    stopLoss,
    takeProfit,
    quantity,
    timeInForce = "GTC",
    positionIdx = side === "BUY" ? 1 : 2,
    tpslMode = "Partial",
  }) {
    try {
      const orderType = {
        MARKET: "Market",
        LIMIT: "Limit",
      };

      const _side = {
        BUY: "Buy",
        SELL: "Sell",
      };

      const order = {
        category: "linear",
        symbol: originalSymbol,
        side: _side[side],
        orderType: orderType[type],
        qty: _.toString(quantity),
        timeInForce,
        positionIdx,
        tpslMode,
      };

      if (type === "LIMIT") {
        order.price = _.toString(price);
      }

      if (stopLoss) {
        order.stopLoss = _.toString(stopLoss);
      }

      if (takeProfit) {
        order.takeProfit = _.toString(takeProfit);
      }

      const timestamp = await this.getServerTime();

      const signature = this.generateSignature(order, {
        timestamp,
        recvWindow: 5000,
      });

      const response = await http.request({
        method: "POST",
        url: this.BASE_URL + "/v5/order/create",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-BAPI-SIGN-TYPE": "2",
          "X-BAPI-API-KEY": this.apiKey,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": "5000",
          "X-BAPI-SIGN": signature,
        },
        data: order,
      });

      const retCode = _.get(response, "data.retCode", 0);
      const retMsg = _.get(response, "data.retMsg", "");

      if (retCode !== 0) {
        return {
          success: false,
          message: retMsg,
        };
      }

      return {
        success: true,
        message: "Order placed successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message: _.get(error, "message", "Failed to place order."),
      };
    }
  }

  async getServerTime() {
    const response = await http.request({
      url: this.BASE_URL + "/v3/public/time",
      method: "GET",
    });

    return _.get(response, "data.time", 0);
  }

  async getAllTradingPairs() {
    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/v5/market/instruments-info?category=linear",
    });

    return _(response)
      .get("data.result.list")
      .filter(
        (item) =>
          item.contractType === "LinearPerpetual" && item.quoteCoin === "USDT"
      )
      .map((item) => {
        return {
          searchName: `${item.baseCoin}${item.quoteCoin}`,
          displayName: `${item.baseCoin}/${item.quoteCoin}`,
          baseAsset: item.baseCoin,
          quoteAsset: item.quoteCoin,
          originalSymbol: item.symbol,
          quantityStep: item.lotSizeFilter.qtyStep,
          tickSize: item.priceFilter.tickSize,
        };
      });
  }

  /**
   * Generates a signature for the Bybit API.
   * @param {Object} params The parameters to sign.
   * @returns {string} The signature.
   */
  generateSignature(params, { timestamp, recvWindow }) {
    const signRequestParams = JSON.stringify(params);

    const paramsStr = timestamp + this.apiKey + recvWindow + signRequestParams;

    const signature = CryptoJS.HmacSHA256(paramsStr, this.secret).toString(
      CryptoJS.enc.Hex
    );

    return signature;
  }

  getLastPrice(pair, callback) {
    const socketAddress = this.SOCKET_ADDRESS;
    const ws = new WebSocket(socketAddress);

    let isLoading = 0;

    const setIsLoading = (value) => {
      if (!value && isLoading === 0) {
        return;
      }
      isLoading += value ? 1 : -1;
      store.dispatch({
        type: "SET_IS_LOADING",
        payload: value,
      });
    };

    setIsLoading(true);
    ws.onopen = () => {
      console.log("Connected to Bybit.");
      ws.send(
        JSON.stringify({
          op: "subscribe",
          args: [`tickers.${pair}`],
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const topic = _.get(data, "topic", "");

      if (topic !== `tickers.${pair}`) return;

      const price = _.get(data, "data.lastPrice", -1);
      const isLoading = store.getState().temporaryState.isLoading;

      setIsLoading(false);
      if (price !== -1) {
        callback(price);
      }
    };

    ws.onerror = (error) => {
      setIsLoading(false);

      store.dispatch({
        type: "ADD_TOAST",
        payload: {
          message: "Failed to connect to Bybit.",
          type: "error",
        },
      });

      console.error("WebSocket error:", error);
    };

    return () => {
      setIsLoading(false);
      ws.close();
    };
  }
}

export default Bybit;
