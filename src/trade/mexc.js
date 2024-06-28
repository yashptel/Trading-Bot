import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";
import { store } from "../store/index.js";
import { w3cwebsocket as WebSocket } from "websocket";
import CryptoJS from "crypto-js";

class Mexc extends Exchange {
  constructor(args) {
    super(args);
    this.BASE_URL = import.meta.env.VITE_MEXC_URL;
    this.SOCKET_ADDRESS = import.meta.env.VITE_MEXC_SOCKET_ADDRESS;
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
    addToast,
  }) {
    const _side = {
      BUY: "1",
      SELL: "2",
    };

    const _type = {
      MARKET: "5",
      LIMIT: "1",
    };

    const order = {
      symbol: originalSymbol,
      price: _.toString(price),
      vol: _.toString(quantity),
      side: _side[side],
      type: _type[type],
      openType: "2",
    };

    if (stopLoss) {
      order.stopLossPrice = _.toString(stopLoss);
    }

    if (takeProfit) {
      order.takeProfitPrice = _.toString(takeProfit);
    }

    const timestamp = await this.getServerTime();

    const signature = this.generateSignature({ order, timestamp });

    const headers = {
      "Content-Type": "application/json",
      "Request-Time": timestamp,
      ApiKey: this.apiKey,
      Signature: signature,
    };

    try {
      const response = await http.request({
        method: "POST",
        url: this.BASE_URL + "/api/v1/private/order/submit",
        data: order,
        headers,
      });

      const message = _.get(response, "data.message", "");
      const code = _.get(response, "data.code", 0);
      const success = _.get(response, "data.success", false);

      if (!success || code != 200) {
        addToast({
          type: "error",
          message,
        });
        return response;
      }

      addToast({
        type: "success",
        message: `Order placed successfully.`,
      });

      return response;
    } catch (error) {
      const message = _.get(error, "response.data.msg", "");

      addToast({
        type: "error",
        message,
      });
    }
  }

  async getServerTime() {
    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/api/v1/contract/ping",
    });

    return _.get(response, "data.data");
  }

  async getAllTradingPairs() {
    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/api/v1/contract/detail",
    });

    return _(response)
      .get("data.data")
      .map((item) => {
        return {
          searchName: `${item.baseCoin}${item.quoteCoin}`,
          displayName: `${item.baseCoin}/${item.quoteCoin}`,
          baseAsset: item.baseCoin,
          quoteAsset: item.quoteCoin,
          originalSymbol: item.symbol,
          quantityStep: item.contractSize,
          tickSize: item.priceUnit,
        };
      });
  }

  /**
   * Generates a signature for the Binance API.
   * @param {Object} params The parameters to sign.
   * @returns {string} The signature.
   */
  generateSignature({ order, timestamp }) {
    const queryString = [this.apiKey, timestamp, JSON.stringify(order)].join(
      ""
    );
    const signature = CryptoJS.HmacSHA256(queryString, this.secret).toString(
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
      console.log("Connected to Mexc.");
      ws.send(
        JSON.stringify({
          method: "sub.deal",
          param: {
            symbol: pair,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      const price = _.get(data, "data.p", -1);

      if (price !== -1) {
        setIsLoading(false);
        callback(price);
      }
    };

    ws.onerror = (error) => {
      setIsLoading(false);

      console.error("WebSocket error:", error);
    };

    return () => {
      setIsLoading(false);
      ws.close();
    };
  }
}

export default Mexc;
