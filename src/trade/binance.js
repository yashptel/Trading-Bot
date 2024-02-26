import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";

class Binance extends Exchange {
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
  }) {
    // const diff = serverTime - Date.now();

    const orders = {};
    const serverTime = await this.getServerTime();
    if (!serverTime) {
      throw new Error("Failed to get server time from Binance.");
    }

    const timestamp = serverTime - Date.now();

    const filters = _.get(selectedTradingPair, "obj.filters", []);
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
      symbol: selectedTradingPair.pair,
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
        symbol: selectedTradingPair.pair,
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
        symbol: selectedTradingPair.pair,
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
      method: "POST",
      data: {
        url: "https://fapi.binance.com/fapi/v1/exchangeInfo",
        method: "GET",
      },
    });

    return _(response)
      .get("data.body.symbols")
      .filter((item) => item.contractType === "PERPETUAL")
      .map((item) => {
        return {
          ...item,
          displayName: `${item.baseAsset}/${item.quoteAsset}`,
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
}

export default Binance;
