import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";
import { store } from "../store/index.js";
import { w3cwebsocket as WebSocket } from "websocket";

class Binance extends Exchange {
  constructor(args) {
    super(args);
    this.BASE_URL = import.meta.env.VITE_BINANCE_URL;
    this.SOCKET_ADDRESS = import.meta.env.VITE_BINANCE_SOCKET_ADDRESS;
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
      throw new Error("Failed to get server time from Binance.");
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
        `https://fapi.binance.com/fapi/v1/order?` +
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
        url: "https://api.binance.com/api/v3/time",
        method: "GET",
      },
    });

    return _.get(response, "data.body.serverTime");
  }

  async getAllTradingPairs() {
    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/fapi/v1/exchangeInfo",
    });

    return _(response)
      .get("data.symbols")
      .filter((item) => item.contractType === "PERPETUAL")
      .map((item) => {
        return {
          searchName: `${item.baseAsset}${item.quoteAsset}`,
          displayName: `${item.baseAsset}/${item.quoteAsset}`,
          baseAsset: item.baseAsset,
          quoteAsset: item.quoteAsset,
          originalSymbol: item.symbol,
          quantityStep: _.get(
            _.find(item.filters, { filterType: "LOT_SIZE" }),
            "stepSize",
            0
          ),
          tickSize: _.get(
            _.find(item.filters, { filterType: "PRICE_FILTER" }),
            "tickSize",
            0
          ),
        };
      });
  }

  /**
   * Generates a signature for the Binance API.
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

  getLastPrice(pair, callback) {
    const socketAddress = this.SOCKET_ADDRESS;
    const ws = new WebSocket(socketAddress);
    pair = _.toLower(pair);

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
      console.log("Connected to Binance.");
      ws.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [`${pair}@aggTrade`],
          id: 1,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = _.get(data, "p", -1);

      if (price !== -1) {
        setIsLoading(false);
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

export default Binance;
