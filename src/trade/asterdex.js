import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";
import { store } from "../store/index.js";
import { w3cwebsocket as WebSocket } from "websocket";
import CryptoJS from "crypto-js";

const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOOKBACK_WINDOWS = 12;
const CLIENT_ORDER_ID_PREFIX = "tb";

const SERVER_TIME_CACHE_MS = 60_000;

class AsterDex extends Exchange {
  constructor(args) {
    super(args);
    this.BASE_URL = import.meta.env.VITE_ASTERDEX_URL;
    this.SOCKET_ADDRESS = import.meta.env.VITE_ASTERDEX_SOCKET_ADDRESS;
    this.apiKey = args.apiKey;
    this.secret = args.secret;
    this._serverTimeOffset = null;
    this._serverTimeSyncedAt = 0;
  }

  async takeTrade({
    originalSymbol,
    side,
    type = "MARKET",
    price,
    stopLoss,
    takeProfit,
    takeProfitTrigger,
    quantity,
    timeInForce = "GTC",
    addToast,
  }) {
    const orders = {};
    const orderGroupId = this.createOrderGroupId();

    orders.order = {
      symbol: originalSymbol,
      side,
      positionSide: side === "BUY" ? "LONG" : "SHORT", // Hedge Mode: LONG for BUY, SHORT for SELL
      type,
      quantity: _.toNumber(quantity),
      newClientOrderId: this.buildClientOrderId("entry", orderGroupId),
    };

    if (orders.order.type === "LIMIT") {
      orders.order.price = _.toNumber(price);
      orders.order.timeInForce = timeInForce;
    }

    if (stopLoss) {
      orders.stopLoss = {
        symbol: orders.order.symbol,
        side: orders.order.side === "BUY" ? "SELL" : "BUY",
        positionSide: orders.order.positionSide, // Same position side as entry order
        type: "STOP_MARKET",
        quantity: orders.order.quantity,
        stopPrice: _.toNumber(stopLoss),
        workingType: "MARK_PRICE",
        timeInForce: timeInForce,
        newClientOrderId: this.buildClientOrderId("sl", orderGroupId),
      };
    }

    if (takeProfit) {
      orders.takeProfit = {
        symbol: orders.order.symbol,
        side: orders.order.side === "BUY" ? "SELL" : "BUY",
        positionSide: orders.order.positionSide, // Same position side as entry order
        type: "TAKE_PROFIT",
        quantity: orders.order.quantity,
        stopPrice: _.toNumber(takeProfitTrigger || takeProfit),
        price: _.toNumber(takeProfit),
        timeInForce: timeInForce,
        newClientOrderId: this.buildClientOrderId("tp", orderGroupId),
      };
    }

    const keys = Object.keys(orders);
    const responses = [];
    const timestamp = await this.getServerTime();

    try {
      for (const key of keys) {
        const params = {
          ...orders[key],
          recvWindow: 5000,
          timestamp,
        };

        const signature = this.generateSignature(params);
        params.signature = signature;

        const headers = {
          "X-MBX-APIKEY": this.apiKey,
        };

        const response = await http.request({
          method: "POST",
          url: this.BASE_URL + "/fapi/v1/order",
          params,
          headers,
        });

        const orderName = {
          order: "Entry Order",
          stopLoss: "Stop Loss Order",
          takeProfit: "Take Profit Order",
        };

        addToast({
          type: "success",
          message: `${orderName[key]} placed successfully.`,
        });

        responses.push(response);
      }

      return responses;
    } catch (error) {
      const message = _.get(
        error,
        "response.data.msg",
        "Failed to place order"
      );

      addToast({
        type: "error",
        message,
      });
    }
  }

  async getServerTime() {
    const now = Date.now();

    if (
      this._serverTimeOffset !== null &&
      now - this._serverTimeSyncedAt < SERVER_TIME_CACHE_MS
    ) {
      return now + this._serverTimeOffset;
    }

    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/fapi/v1/time",
    });

    const serverTime = _.get(response, "data.serverTime");
    this._serverTimeOffset = serverTime - Date.now();
    this._serverTimeSyncedAt = Date.now();

    return serverTime;
  }

  async getAllTradingPairs() {
    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/fapi/v1/exchangeInfo",
    });

    return _(response)
      .get("data.symbols")
      .filter(
        (item) => item.contractType === "PERPETUAL" && item.status === "TRADING"
      )
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

  createOrderGroupId() {
    return `${Date.now().toString(36)}${_.random(0, 1679615)
      .toString(36)
      .padStart(4, "0")}`;
  }

  buildClientOrderId(orderType, orderGroupId = this.createOrderGroupId()) {
    return `${CLIENT_ORDER_ID_PREFIX}_${orderType}_${orderGroupId}`.slice(0, 36);
  }

  async signedRequest({ method = "GET", path, params = {}, timestamp }) {
    const requestTimestamp = timestamp || (await this.getServerTime());
    const requestParams = _.pickBy(
      {
        ...params,
        recvWindow: 5000,
        timestamp: requestTimestamp,
      },
      (value) => !_.isNil(value) && value !== ""
    );

    requestParams.signature = this.generateSignature(requestParams);

    return http.request({
      method,
      url: this.BASE_URL + path,
      params: requestParams,
      headers: {
        "X-MBX-APIKEY": this.apiKey,
      },
    });
  }

  async getUserTrades({
    symbol,
    startTime,
    endTime,
    limit = 1000,
    timestamp,
  }) {
    const response = await this.signedRequest({
      method: "GET",
      path: "/fapi/v1/userTrades",
      params: {
        symbol,
        startTime,
        endTime,
        limit,
      },
      timestamp,
    });

    return _.get(response, "data", []);
  }

  async getAllOrders({
    symbol,
    startTime,
    endTime,
    limit = 1000,
    timestamp,
  }) {
    const response = await this.signedRequest({
      method: "GET",
      path: "/fapi/v1/allOrders",
      params: {
        symbol,
        startTime,
        endTime,
        limit,
      },
      timestamp,
    });

    return _.get(response, "data", []);
  }

  getOrderCategory(order) {
    if (!order) {
      return "unknown";
    }

    const clientOrderId = _.toLower(_.get(order, "clientOrderId", ""));
    if (clientOrderId.startsWith(`${CLIENT_ORDER_ID_PREFIX}_tp_`)) {
      return "takeProfit";
    }

    if (clientOrderId.startsWith(`${CLIENT_ORDER_ID_PREFIX}_sl_`)) {
      return "stopLoss";
    }

    const orderType = _.toUpper(_.get(order, "origType", _.get(order, "type", "")));
    if (["TAKE_PROFIT", "TAKE_PROFIT_MARKET"].includes(orderType)) {
      return "takeProfit";
    }

    if (["STOP", "STOP_MARKET", "TRAILING_STOP_MARKET"].includes(orderType)) {
      return "stopLoss";
    }

    return "other";
  }

  getFeeAmount(commission) {
    const commissionAmount = _.toNumber(commission);
    if (_.isNaN(commissionAmount)) {
      return 0;
    }

    return Math.abs(commissionAmount);
  }

  aggregateRecoverableStopFees({ trades = [], orders = [] }) {
    const orderMap = new Map(
      orders.map((order) => [String(_.get(order, "orderId")), order])
    );

    const classifiedTrades = trades
      .map((trade) => {
        const linkedOrder = orderMap.get(String(_.get(trade, "orderId")));
        return {
          ...trade,
          category: this.getOrderCategory(linkedOrder),
          fee: this.getFeeAmount(_.get(trade, "commission")),
          linkedOrder,
        };
      })
      .filter(({ linkedOrder }) => linkedOrder);

    const takeProfitTrades = _.orderBy(
      classifiedTrades.filter(({ category }) => category === "takeProfit"),
      ["time", "id"],
      ["desc", "desc"]
    );

    const lastTakeProfitTrade = takeProfitTrades[0];
    if (!lastTakeProfitTrade) {
      return {
        totalFees: 0,
        lastTakeProfitTrade: null,
        stopLossTrades: [],
      };
    }

    const stopLossTrades = _.orderBy(
      classifiedTrades.filter(
        ({ category, time }) =>
          category === "stopLoss" &&
          _.toNumber(time) > _.toNumber(lastTakeProfitTrade.time)
      ),
      ["time", "id"],
      ["desc", "desc"]
    );

    return {
      totalFees: _.sumBy(stopLossTrades, "fee"),
      lastTakeProfitTrade,
      stopLossTrades,
    };
  }

  logRecoverableStopFees({
    symbol,
    totalFees,
    lastTakeProfitTrade,
    stopLossTrades = [],
    lookbackWindows,
  }) {
    console.groupCollapsed(
      `[AsterDex] Recoverable stop fees for ${symbol || "unknown"}`
    );
    console.log("Lookback windows scanned:", lookbackWindows);
    console.log("Take profit cutoff trade:", lastTakeProfitTrade);
    console.log("Stop loss trades used in fee sum:", stopLossTrades);
    console.log("Recoverable stop fees total:", totalFees);
    console.groupEnd();
  }

  async getRecoverableStopFees(
    symbol,
    { maxLookbackWindows = MAX_LOOKBACK_WINDOWS } = {}
  ) {
    if (!symbol) {
      return {
        symbol,
        totalFees: 0,
        lastTakeProfitTrade: null,
        stopLossTrades: [],
        lookbackWindows: 0,
      };
    }

    let windowEnd = Date.now();
    const tradesById = new Map();
    const ordersById = new Map();

    // Prime the server-time cache so loop iterations don't hit the network.
    await this.getServerTime();

    for (
      let windowIndex = 0;
      windowIndex < maxLookbackWindows && windowEnd > 0;
      windowIndex += 1
    ) {
      const windowStart = Math.max(0, windowEnd - HISTORY_WINDOW_MS + 1);

      const [trades, orders] = await Promise.all([
        this.getUserTrades({
          symbol,
          startTime: windowStart,
          endTime: windowEnd,
        }),
        this.getAllOrders({
          symbol,
          startTime: windowStart,
          endTime: windowEnd,
        }),
      ]);

      trades.forEach((trade) => {
        tradesById.set(String(_.get(trade, "id")), trade);
      });

      orders.forEach((order) => {
        ordersById.set(String(_.get(order, "orderId")), order);
      });

      const aggregatedFees = this.aggregateRecoverableStopFees({
        trades: Array.from(tradesById.values()),
        orders: Array.from(ordersById.values()),
      });

      if (aggregatedFees.lastTakeProfitTrade) {
        const result = {
          symbol,
          ...aggregatedFees,
          lookbackWindows: windowIndex + 1,
        };
        this.logRecoverableStopFees(result);
        return result;
      }

      windowEnd = windowStart - 1;
    }

    const result = {
      symbol,
      totalFees: 0,
      lastTakeProfitTrade: null,
      stopLossTrades: [],
      lookbackWindows: maxLookbackWindows,
    };
    this.logRecoverableStopFees(result);
    return result;
  }

  /**
   * Generates a HMAC SHA256 signature for Aster DEX API.
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
      console.log("Connected to Aster DEX.");
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
          message: "Failed to connect to Aster DEX.",
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

export default AsterDex;
