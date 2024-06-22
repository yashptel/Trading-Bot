import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";
import { store } from "../store/index.js";
import { w3cwebsocket as WebSocket } from "websocket";

class Bybit extends Exchange {
  constructor(args) {
    super(args);
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

    const orders = {};
    const serverTime = await this.getServerTime();
    if (!serverTime) {
      throw new Error("Failed to get server time from Bybit.");
    }

    const timestamp = serverTime - Date.now();

    const filters = _.get(selectedPair, "obj.filters", []);
    const quantityPrecision = _.toNumber(
      _.find(filters, {
        filterType: "LOT_SIZE",
      })?.stepSize
    );
    const pricePrecision = _.toNumber(
      _.find(filters, {
        filterType: "PRICE_FILTER",
      })?.tickSize
    );

    orders.order = {
      symbol: selectedPair.pair,
      side,
      positionSide: side === "BUY" ? "LONG" : "SHORT",
      type: "MARKET",
      quantity: this.roundToSamePrecision(size, quantityPrecision),
    };

    if (type === "LIMIT") {
      orders.order.type = "LIMIT";
      orders.order.price = this.roundToSamePrecision(price, pricePrecision);
      orders.order.timeInForce = "GTC";
    }

    if (stopLoss) {
      orders.stopLoss = {
        symbol: selectedPair.pair,
        side: side === "BUY" ? "SELL" : "BUY",
        positionSide: side === "BUY" ? "LONG" : "SHORT",
        type: "STOP_MARKET",
        quantity: this.roundToSamePrecision(positionSize, quantityPrecision),
        stopPrice: this.roundToSamePrecision(stopLoss, pricePrecision),
        closePosition: false,
        // workingType: "LAST_PRICE",
        timeInForce: "GTC",
      };
    }

    if (takeProfit) {
      orders.takeProfit = {
        symbol: selectedPair.pair,
        side: side === "BUY" ? "SELL" : "BUY",
        positionSide: side === "BUY" ? "LONG" : "SHORT",
        type: "TAKE_PROFIT_MARKET",
        quantity: this.roundToSamePrecision(positionSize, quantityPrecision),
        stopPrice: this.roundToSamePrecision(takeProfit, pricePrecision),
        closePosition: false,
        // workingType: "LAST_PRICE",
        timeInForce: "GTC",
      };
    }

    const keys = Object.keys(orders);

    const responses = [];

    for (const key of keys) {
      const order = {
        ...orders[key],
        recvWindow: 5000,
        timestamp,
      };

      const signature = this.generateSignature(order);
      const headers = {
        "X-MBX-APIKEY": this.apiKey,
      };
      const url =
        `https://fapi.Bybit.com/fapi/v1/order?` +
        new URLSearchParams({
          ...order,
          signature,
        }).toString();

      new URLSearchParams({
        name: "value",
        other: "value",
      }).toString();

      const response = await http.request({
        method: "POST",
        data: {
          url,
          method: "POST",
          headers,
        },
      });

      responses.push(response);
    }

    return responses;
  }

  async getServerTime() {
    const response = await http.request({
      method: "POST",
      data: {
        url: "https://api.Bybit.com/api/v3/time",
        method: "GET",
      },
    });

    return _.get(response, "data.body.serverTime");
  }

  async getAllTradingPairs() {
    console.log("====================================");
    console.log("Bybit getAllTradingPairs");
    console.log("====================================");

    const response = await http.request({
      method: "GET",
      url: "/https:/api.bybit.com/v5/market/instruments-info?category=linear",
    });

    return _(response)
      .get("data.result.list")
      .filter((item) => item.contractType === "LinearPerpetual")
      .map((item) => {
        return {
          searchName: `${item.baseCoin}${item.quoteCoin}`,
          displayName: `${item.baseCoin}/${item.quoteCoin}`,
          baseAsset: item.baseCoin,
          quoteAsset: item.quoteCoin,
          originalSymbol: item.symbol,
        };
      });
  }

  /**
   * Generates a signature for the Bybit API.
   * @param {Object} params The parameters to sign.
   * @returns {string} The signature.
   */
  generateSignature(params) {
    const keys = Object.keys(params);
    const queryParams = [];

    for (const key of keys) {
      queryParams.push(`${key}=${params[key]}`);
    }

    const queryString = queryParams.join("&");
    const signature = CryptoJS.HmacSHA256(queryString, this.secret).toString(
      CryptoJS.enc.Hex
    );

    return signature;
  }

  getLastPrice(callback) {
    const state = store.getState();
    if (_.isEmpty(state.selectedPair)) {
      return;
    }

    const socketAddress = "wss://fstream.Bybit.com/ws";
    const ws = new WebSocket(socketAddress);
    const { baseAsset, quoteAsset } = state.selectedPair;
    const pair = _.toLower(`${baseAsset}${quoteAsset}`);

    store.dispatch({
      type: "SET_IS_LOADING",
      payload: true,
    });

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [`${pair}@ticker`],
          id: 1,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const lastPrice = _.get(data, "c");
      const isLoading = store.getState().temporaryState.isLoading;

      isLoading &&
        store.dispatch({
          type: "SET_IS_LOADING",
          payload: false,
        });

      if (lastPrice) {
        callback(lastPrice);
      }
    };

    ws.onerror = (error) => {
      store.dispatch({
        type: "SET_IS_LOADING",
        payload: false,
      });

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
      ws.close();
    };
  }
}

export default Bybit;
