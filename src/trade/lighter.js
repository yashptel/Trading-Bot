import Exchange from "./exchange.js";
import http from "./api";
import _ from "lodash";
import { store } from "../store/index.js";
import { w3cwebsocket as WebSocket } from "websocket";
import {
  waitForWasm,
  createClient,
  createAuthToken,
  signCreateGroupedOrders,
} from "./lighterWasm.js";

// Order type constants (from lighter-go constants.go)
const ORDER_TYPE_LIMIT = 0;
const ORDER_TYPE_MARKET = 1;
const ORDER_TYPE_STOP_LOSS = 2;
const ORDER_TYPE_TAKE_PROFIT_LIMIT = 5;

// GroupingType for entry + TP + SL
const GROUPING_TYPE_ENTRY_TP_SL = 3;

// TimeInForce
const TIME_IN_FORCE_IOC = 0; // Required by Lighter for market and stop-market orders
const TIME_IN_FORCE_GTC = 1; // Good Till Time

const EXIT_SLIPPAGE_RATE = 0.002; // 0.2% slippage for TP/SL by default, configurable per-trade in takeTrade()

class Lighter extends Exchange {
  constructor(args) {
    super(args);
    this.BASE_URL = import.meta.env.VITE_LIGHTER_URL;
    this.SOCKET_URL = import.meta.env.VITE_LIGHTER_SOCKET_URL;
    this.CHAIN_ID = parseInt(import.meta.env.VITE_LIGHTER_CHAIN_ID || "300");

    // Credential mapping:
    //   apiKey     → Ed25519 private key (hex)
    //   secret     → account index (integer string)
    //   passphrase → api key index (integer string)
    this.privateKey = args.apiKey;
    this.accountIndex = parseInt(args.secret);
    this.apiKeyIndex = parseInt(args.passphrase);

    this._clientInitialised = false;
    this._markets = null; // cached market list
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Lazily initialise the WASM signer client (once per instance).
   */
  async _initWasm() {
    await waitForWasm();
    if (!this._clientInitialised) {
      await createClient(
        this.privateKey,
        this.CHAIN_ID,
        this.apiKeyIndex,
        this.accountIndex,
      );
      this._clientInitialised = true;
    }
  }

  /**
   * Fetch and cache market info from /api/v1/orderbooks.
   * Returns the raw orderbooks array.
   */
  async _getMarkets() {
    if (this._markets) return this._markets;
    const response = await http.request({
      method: "GET",
      url: this.BASE_URL + "/api/v1/orderBooks",
    });
    this._markets = _.get(response, "data.order_books", []);
    return this._markets;
  }

  /**
   * Find market metadata by originalSymbol (= market_id string).
   */
  async _getMarketBySymbol(originalSymbol) {
    const markets = await this._getMarkets();
    return _.find(
      markets,
      (m) => String(m.market_id) === String(originalSymbol),
    );
  }

  /**
   * Convert a human-readable price/size float to the integer representation
   * Lighter expects (multiply by 10^decimals).
   */
  _toInt(value, decimals) {
    return Math.round(parseFloat(value) * Math.pow(10, decimals));
  }

  /**
   * Returns the worst acceptable exit price after slippage.
   */
  _applyExitSlippage(price, isAsk, slippageRate = EXIT_SLIPPAGE_RATE) {
    const numericPrice = parseFloat(price);
    const multiplier = isAsk ? 1 - slippageRate : 1 + slippageRate;
    return numericPrice * multiplier;
  }

  // ---------------------------------------------------------------------------
  // Public Exchange interface
  // ---------------------------------------------------------------------------

  /**
   * Returns the list of tradable perpetual markets.
   */
  async getAllTradingPairs() {
    const markets = await this._getMarkets();
    return markets
      .filter((m) => m.market_type === "perp")
      .map((m) => {
        const sizeDecimals = m.supported_size_decimals ?? 4;
        const priceDecimals = m.supported_price_decimals ?? 2;

        // For perps, symbol is just "BTC" or "ETH". Quote is implicitly "USDC"
        const baseAsset = m.symbol;
        const quoteAsset = "USDC";

        return {
          searchName: `${baseAsset}${quoteAsset}`,
          displayName: `${baseAsset}/${quoteAsset}`,
          baseAsset: baseAsset,
          quoteAsset: quoteAsset,
          originalSymbol: String(m.market_id),
          // quantityStep = smallest tradable unit
          quantityStep: Math.pow(10, -sizeDecimals),
          tickSize: Math.pow(10, -priceDecimals),
          // store decimals for signing
          _sizeDecimals: sizeDecimals,
          _priceDecimals: priceDecimals,
        };
      });
  }

  /**
   * Subscribe to live trade prices for a market via WebSocket.
   * @param {string}   marketIndex  - e.g. "0" or "1"
   * @param {Function} callback     - called with price string on each trade
   * @returns {Function} cleanup fn
   */
  getLastPrice(marketIndex, callback) {
    const ws = new WebSocket(this.SOCKET_URL);

    let isLoading = 0;
    const setIsLoading = (value) => {
      if (!value && isLoading === 0) return;
      isLoading += value ? 1 : -1;
      store.dispatch({ type: "SET_IS_LOADING", payload: value });
    };

    setIsLoading(true);

    ws.onopen = () => {
      console.log("Connected to Lighter WebSocket.");
      ws.send(
        JSON.stringify({ type: "subscribe", channel: `trade/${marketIndex}` }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "update/trade") return;
      // "trades" is an array in the payload
      const price = _.get(data, "trades[0].price", -1);
      if (price !== -1) {
        setIsLoading(false);
        callback(price);
      }
    };

    ws.onerror = (error) => {
      setIsLoading(false);
      store.dispatch({
        type: "ADD_TOAST",
        payload: { message: "Failed to connect to Lighter.", type: "error" },
      });
      console.error("Lighter WebSocket error:", error);
    };

    return () => {
      setIsLoading(false);
      ws.close();
    };
  }

  /**
   * Place a trade with optional Stop Loss and Take Profit as a grouped batch tx.
   */
  async takeTrade({
    originalSymbol, // market_id string
    side, // "BUY" or "SELL"
    type = "MARKET",
    price,
    stopLoss,
    takeProfit,
    takeProfitTrigger,
    quantity,
    slippage = EXIT_SLIPPAGE_RATE,
    addToast,
  }) {
    try {
      // 1. Init WASM signer
      await this._initWasm();

      // 2. Resolve market decimals
      const pairs = await this.getAllTradingPairs();
      const market = _.find(pairs, { originalSymbol: String(originalSymbol) });
      if (!market) throw new Error(`Market ${originalSymbol} not found`);

      const sizeDecimals = market._sizeDecimals;
      const priceDecimals = market._priceDecimals;
      const marketIndex = parseInt(originalSymbol);
      const isAsk = side === "SELL" ? 1 : 0;
      const exitIsAsk = isAsk === 0 ? 1 : 0;

      const expiry = Date.now() + 28 * 24 * 60 * 60 * 1000; // 28 days

      // 3. Build orders array
      const orders = [];

      // Entry order
      const entryBaseAmount = this._toInt(quantity, sizeDecimals);
      const entryPrice = this._toInt(price, priceDecimals);
      const isMarketEntry = type === "MARKET";
      orders.push({
        MarketIndex: marketIndex,
        ClientOrderIndex: 0,
        BaseAmount: entryBaseAmount,
        Price: entryPrice,
        IsAsk: isAsk,
        Type: isMarketEntry ? ORDER_TYPE_MARKET : ORDER_TYPE_LIMIT,
        TimeInForce: isMarketEntry ? TIME_IN_FORCE_IOC : TIME_IN_FORCE_GTC,
        ReduceOnly: 0,
        TriggerPrice: 0,
        OrderExpiry: isMarketEntry ? 0 : expiry,
        IntegratorAccountIndex: 0,
        IntegratorTakerFee: 0,
        IntegratorMakerFee: 0,
      });

      // Take Profit Limit order
      if (takeProfit) {
        const tpTrigger = takeProfit;
        const tpLimitPrice = this._applyExitSlippage(
          tpTrigger,
          exitIsAsk,
          slippage,
        );
        orders.push({
          MarketIndex: marketIndex,
          ClientOrderIndex: 0,
          BaseAmount: 0, // 0 = match position size
          Price: this._toInt(tpLimitPrice, priceDecimals),
          IsAsk: exitIsAsk,
          Type: ORDER_TYPE_TAKE_PROFIT_LIMIT,
          TimeInForce: TIME_IN_FORCE_GTC,
          ReduceOnly: 1,
          TriggerPrice: this._toInt(tpTrigger, priceDecimals),
          OrderExpiry: expiry,
          IntegratorAccountIndex: 0,
          IntegratorTakerFee: 0,
          IntegratorMakerFee: 0,
        });
      }

      // Stop Loss order
      if (stopLoss) {
        const stopLossLimitPrice = this._applyExitSlippage(
          stopLoss,
          exitIsAsk,
          slippage,
        );

        // Stop-market exits must use IOC in Lighter; reliability wins for SL.
        orders.push({
          MarketIndex: marketIndex,
          ClientOrderIndex: 0,
          BaseAmount: 0,
          Price: this._toInt(stopLossLimitPrice, priceDecimals),
          IsAsk: exitIsAsk,
          Type: ORDER_TYPE_STOP_LOSS,
          TimeInForce: TIME_IN_FORCE_IOC,
          ReduceOnly: 1,
          TriggerPrice: this._toInt(stopLoss, priceDecimals),
          OrderExpiry: expiry,
          IntegratorAccountIndex: 0,
          IntegratorTakerFee: 0,
          IntegratorMakerFee: 0,
        });
      }

      // 4. Fetch the next nonce manually via JS to avoid WASM networking issues
      const nonceResponse = await http.request({
        method: "GET",
        url: `${this.BASE_URL}/api/v1/nextNonce?account_index=${this.accountIndex}&api_key_index=${this.apiKeyIndex}`,
      });
      const nonce = parseInt(nonceResponse.data.nonce);

      if (isNaN(nonce)) {
        throw new Error("Failed to fetch next nonce from Lighter API.");
      }

      // 5. Sign the grouped order using the explicit nonce
      const signed = signCreateGroupedOrders(
        GROUPING_TYPE_ENTRY_TP_SL,
        orders,
        {
          nonce,
          apiKeyIndex: this.apiKeyIndex,
          accountIndex: this.accountIndex,
        },
      );

      if (!signed || !signed.txInfo) {
        throw new Error("Signing failed: no txInfo returned");
      }

      // 5. Generate auth token (valid 7h by default)
      const { authToken } = createAuthToken(
        0,
        this.apiKeyIndex,
        this.accountIndex,
      );

      // 6. POST via proxy
      const body = new URLSearchParams({
        tx_type: String(signed.txType),
        tx_info: signed.txInfo,
        price_protection: "false",
      }).toString();

      await http.request({
        method: "POST",
        url: this.BASE_URL + "/api/v1/sendTx",
        data: body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: authToken,
          PreferAuthServer: "true",
        },
      });

      addToast({ type: "success", message: "Order placed on Lighter." });
    } catch (error) {
      const message = _.get(
        error,
        "response.data.message",
        error.message || "Failed to place order on Lighter.",
      );
      addToast({ type: "error", message });
      console.error("[Lighter] takeTrade error:", error);
    }
  }
}

export default Lighter;
