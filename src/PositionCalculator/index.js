import axios from "axios";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { w3cwebsocket as WebSocket } from "websocket";
import { gateioFutureContracts } from "./data";
import CryptoJS from "crypto-js";
import ConfirmTradeModal from "../components/confirmTradeModal";
import Toast from "../components/toast";

const randomString = () => Math.random().toString(36).substring(7);

const getSelectedTradingPair = () => {
  const defaultPair = {
    pair: "BTCUSDT",
    baseAsset: "BTC",
    quoteAsset: "USDT",
  };
  try {
    return (
      JSON.parse(localStorage.getItem("selectedTradingPair")) || defaultPair
    );
  } catch (error) {
    return defaultPair;
  }
};

const getAPICredentials = () => {
  const defaultCredentials = {
    apiKey: "",
    apiSecret: "",
  };

  try {
    return (
      JSON.parse(localStorage.getItem("apiCredentials")) || defaultCredentials
    );
  } catch (error) {
    return defaultCredentials;
  }
};

const setApiCredentials = (credentials) => {
  localStorage.setItem("apiCredentials", JSON.stringify(credentials));
};

function roundToSamePrecision(number, sample) {
  // Get the number of decimal places in the sample number.
  const decimalPlaces = _(sample).toString().split(".")[1]?.length || 0;

  // Round the number to the same number of decimal places.
  return _.round(number, decimalPlaces);
}

function generateSignature(params, apiSecret) {
  const keys = Object.keys(params).sort();
  const queryParams = [];

  for (const key of keys) {
    queryParams.push(`${key}=${params[key]}`);
  }

  const queryString = queryParams.join("&");

  const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString(
    CryptoJS.enc.Hex
  );

  return signature;
}

function generateSignatureBinance(params, apiSecret) {
  const keys = Object.keys(params);
  const queryParams = [];

  for (const key of keys) {
    queryParams.push(`${key}=${params[key]}`);
  }

  const queryString = queryParams.join("&");

  const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString(
    CryptoJS.enc.Hex
  );

  return signature;
}

const PositionCalculator = () => {
  const [tradingPairs, setTradingPairs] = useState([]);

  const [selectedTradingPair, setSelectedTradingPair] = useState(
    getSelectedTradingPair()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTradingPairs, setFilteredTradingPairs] = useState([]);
  const [lastPrice, setLastPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [lossPerTrade, setLossPerTrade] = useState(
    localStorage.getItem("lossPerTrade") || 0
  );
  const [positionSize, setPositionSize] = useState(0);
  const [mannualPrice, setMannualPrice] = useState(false);
  const [exchange, setExchange] = useState(
    localStorage.getItem("exchange") || "Binance"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [side, setSide] = useState("Buy");
  const [apiCredentials, _setApiCredentials] = useState(getAPICredentials());
  const [apiCredentialsInp, setApiCredentialsInp] = useState({
    apiKey: "",
    apiSecret: "",
  });
  const [timeDiff, setTimeDiff] = useState(0);

  const [toasts, setToasts] = useState([]);

  const addToast = ({ type, message }) => {
    setToasts((toasts) => [
      ...toasts,
      {
        id: randomString(),
        type,
        message,
      },
    ]);
  };

  const removeToast = (id) => {
    setToasts((toasts) => _.filter(toasts, (toast) => toast.id !== id));
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    if (exchange === "Binance") {
      axios
        .get("https://fapi.binance.com/fapi/v1/exchangeInfo")
        .then((response) => {
          const perpetualContracts = _.filter(
            _.get(response, "data.symbols", []),
            (symbol) => symbol.contractType === "PERPETUAL"
          );

          const pairs = _.map(perpetualContracts, (contract) => ({
            pair: contract.pair,
            baseAsset: contract.baseAsset,
            quoteAsset: contract.quoteAsset,
            obj: contract,
          }));

          const pair =
            _.find(
              pairs,
              (pair) =>
                pair.baseAsset === selectedTradingPair.baseAsset &&
                pair.quoteAsset === selectedTradingPair.quoteAsset
            ) || _.first(pairs);

          !cancelled && setTradingPairs([...pairs]);
          !cancelled && setFilteredTradingPairs([...pairs]);
          !cancelled && setSelectedTradingPair(pair);
        })
        .catch((error) => console.log(error));

      axios
        .get("https://fapi.binance.com/fapi/v1/time")
        .then((response) => {
          const serverTime = _.toNumber(_.get(response, "data.serverTime"), 0);
          const diff = serverTime - Date.now();
          setTimeDiff(diff);
        })
        .catch((error) => console.log(error));
    }

    exchange === "Mexc" &&
      axios
        .get("https://contract.mexc.com/api/v1/contract/detail")
        .then((response) => {
          const perpetualContracts = _.filter(
            _.get(response, "data.data", []),
            (symbol) => symbol.futureType === 1
          );

          const pairs = _.map(perpetualContracts, (contract) => ({
            pair: contract.symbol,
            baseAsset: contract.baseCoin,
            quoteAsset: contract.quoteCoin,
          }));

          const pair =
            _.find(
              pairs,
              (pair) =>
                pair.baseAsset === selectedTradingPair.baseAsset &&
                pair.quoteAsset === selectedTradingPair.quoteAsset
            ) || _.first(pairs);

          !cancelled && setTradingPairs([...pairs]);
          !cancelled && setFilteredTradingPairs([...pairs]);
          !cancelled && setSelectedTradingPair(pair);
        })
        .catch((error) => console.log(error));

    exchange === "WooX" &&
      axios
        .get("https://api.woo.org/v1/public/info")
        .then((response) => {
          const perpetualContracts = _.filter(
            _.get(response, "data.rows", []),
            (symbol) => _.get(_.split(symbol.symbol, "_"), 0) === "PERP"
          );

          const pairs = _.map(perpetualContracts, (contract) => {
            const [, baseAsset, quoteAsset] = _.split(contract.symbol, "_");
            return {
              pair: contract.symbol,
              baseAsset,
              quoteAsset,
            };
          });

          const pair =
            _.find(
              pairs,
              (pair) =>
                pair.baseAsset === selectedTradingPair.baseAsset &&
                pair.quoteAsset === selectedTradingPair.quoteAsset
            ) || _.first(pairs);

          !cancelled && setTradingPairs([...pairs]);
          !cancelled && setFilteredTradingPairs([...pairs]);
          !cancelled && setSelectedTradingPair(pair);
        })
        .catch((error) => console.log(error));

    if (exchange === "Gate.io") {
      const pairs = _.map(gateioFutureContracts, (contract) => {
        const [baseAsset, quoteAsset] = _.split(contract.name, "_");
        return {
          pair: contract.name,
          baseAsset,
          quoteAsset,
        };
      });

      const pair =
        _.find(
          pairs,
          (pair) =>
            pair.baseAsset === selectedTradingPair.baseAsset &&
            pair.quoteAsset === selectedTradingPair.quoteAsset
        ) || _.first(pairs);

      !cancelled && setTradingPairs([...pairs]);
      !cancelled && setFilteredTradingPairs([...pairs]);
      !cancelled && setSelectedTradingPair(pair);
    }

    if (exchange === "Bybit") {
      axios
        .get("https://api.bybit.com/v5/market/instruments-info?category=linear")
        .then((response) => {
          const perpetualContracts = _.filter(
            _.get(response, "data.result.list", []),
            (symbol) => symbol.contractType === "LinearPerpetual"
          );

          const pairs = _.map(perpetualContracts, (contract) => {
            return {
              pair: contract.symbol,
              baseAsset: contract.baseCoin,
              quoteAsset: contract.quoteCoin,
              obj: contract,
            };
          });

          const pair =
            _.find(
              pairs,
              (pair) =>
                pair.baseAsset === selectedTradingPair.baseAsset &&
                pair.quoteAsset === selectedTradingPair.quoteAsset
            ) || _.first(pairs);

          !cancelled && setTradingPairs([...pairs]);
          !cancelled && setFilteredTradingPairs([...pairs]);
          !cancelled && setSelectedTradingPair(pair);
        })
        .catch((error) => console.log(error));

      axios
        .get("https://api.bybit.com/v3/public/time")
        .then((response) => {
          const serverTime = _.get(response, "data.time", 0);
          const diff = serverTime - Date.now();
          setTimeDiff(diff);
        })
        .catch((error) => console.log(error));
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchange]);

  useEffect(() => {
    localStorage.setItem("exchange", exchange);
    localStorage.setItem(
      "selectedTradingPair",
      JSON.stringify(selectedTradingPair)
    );
    localStorage.setItem("lossPerTrade", lossPerTrade);
  }, [exchange, lossPerTrade, selectedTradingPair]);

  const handleInputChangeOnlyNumbers = (event, setFn) => {
    const value = event.target.value;
    const valid = /^\d*\.?\d*$/.test(value);
    if (valid) {
      /^0\d/.test(value)
        ? setFn(_.replace(value, /^0/, ""))
        : setFn(value || 0);
    }
  };

  async function copyToClipboard(textToCopy) {
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // Use the 'out of viewport hidden text area' trick
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;

      // Move textarea out of the viewport so it's not visible
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";

      document.body.prepend(textArea);
      textArea.select();

      try {
        document.execCommand("copy");
      } catch (error) {
        console.error(error);
      } finally {
        textArea.remove();
      }
    }
  }

  useEffect(() => {
    const diff = Math.abs(Number(stopLoss) - Number(lastPrice));
    const percentage = (diff / Number(lastPrice)) * 100;

    const positionAmount = (100 / percentage) * Number(lossPerTrade);
    const positionSize = positionAmount / Number(lastPrice);
    !_.isNaN(positionSize) && setPositionSize(positionSize);
  }, [lastPrice, stopLoss, lossPerTrade]);

  useEffect(() => {
    const term = _.replace(searchTerm, /[^a-zA-Z0-9]/g, "");
    const res = _.filter(tradingPairs, (pair) => {
      const { baseAsset, quoteAsset } = pair;
      const pairName = `${baseAsset}${quoteAsset}`;
      return pairName.toLowerCase().includes(term.toLowerCase());
    });
    setFilteredTradingPairs(res);
  }, [searchTerm, tradingPairs]);

  useEffect(() => {
    !mannualPrice && setIsLoading(true);

    const applicationId = "d280c0d0-a933-4fa1-8edc-d4dc10281759"; // woox
    const socketAddress =
      (exchange === "Binance" && `wss://stream.binance.com:9443/ws`) ||
      (exchange === "Mexc" && `wss://contract.mexc.com/ws`) ||
      (exchange === "WooX" && `wss://wss.woo.org/ws/stream/${applicationId}`) ||
      (exchange === "Gate.io" && `wss://fx-ws.gateio.ws/v4/ws/usdt`) ||
      (exchange === "Bybit" && `wss://stream.bybit.com/v5/public/linear`) ||
      (exchange === "OKX" && `wss://ws.okx.com:8443/ws/v5/public`);

    const { baseAsset, quoteAsset } = selectedTradingPair;

    const pair =
      (exchange === "Binance" && _.toLower(`${baseAsset}${quoteAsset}`)) ||
      (exchange === "Mexc" && _.toUpper(`${baseAsset}_${quoteAsset}`)) ||
      (exchange === "WooX" && _.toUpper(`PERP_${baseAsset}_${quoteAsset}`)) ||
      (exchange === "Gate.io" && _.toUpper(`${baseAsset}_${quoteAsset}`)) ||
      (exchange === "Bybit" && selectedTradingPair.pair);

    const socket = new WebSocket(socketAddress);

    const onOpen = {
      Binance: () => {
        console.log("WebSocket Client Connected =>", exchange);
        socket.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: [`${pair}@ticker`],
            id: 1,
          })
        );
      },

      Mexc: () => {
        console.log("WebSocket Client Connected =>", exchange);
        socket.send(
          JSON.stringify({
            method: "sub.ticker",
            param: {
              symbol: pair,
            },
          })
        );

        setInterval(() => {
          socket.send(
            JSON.stringify({
              method: "ping",
            })
          );
        }, 10000);
      },
      WooX: () => {
        console.log("WebSocket Client Connected =>", exchange);
        socket.send(
          JSON.stringify({
            event: "subscribe",
            topic: `${pair}@ticker`,
            id: "clientID4",
          })
        );
      },

      "Gate.io": () => {
        console.log("WebSocket Client Connected =>", exchange);
        socket.send(
          JSON.stringify({
            time: Date.now(),
            channel: "futures.tickers",
            event: "subscribe",
            payload: [pair],
          })
        );
      },

      Bybit: () => {
        console.log("WebSocket Client Connected =>", exchange);
        socket.send(
          JSON.stringify({
            op: "subscribe",
            args: [`tickers.${pair}`],
          })
        );
      },

      // {
      //   "op": "subscribe",
      //   "args": [
      //     {
      //       "channel": "tickers",
      //       "instId": "LTC-USD-200327"
      //     }
      //   ]
      // }

      OKX: () => {
        console.log("WebSocket Client Connected =>", exchange);
        socket.send(
          JSON.stringify({
            op: "subscribe",
            args: [
              {
                channel: "tickers",
                instId: pair,
              },
            ],
          })
        );
      },
    };

    const onMessage = {
      Binance: (event) => {
        const data = JSON.parse(event.data);
        !mannualPrice && setLastPrice(data.c);
        setIsLoading(false);
      },

      Mexc: (event) => {
        const data = JSON.parse(event.data);
        const channel = _.get(data, "channel", "");
        if (channel !== "push.ticker") return;
        const price = _.get(data, "data.lastPrice", 0);
        !mannualPrice && setLastPrice(price);
        setIsLoading(false);
      },

      WooX: (event) => {
        const data = JSON.parse(event.data);

        if (data.event === "ping") {
          socket.send(
            JSON.stringify({
              event: "pong",
            })
          );
          return;
        }

        const topic = _.get(data, "topic", "");
        if (topic !== `${pair}@ticker`) return;

        const price = _.get(data, "data.close", 0);
        !mannualPrice && setLastPrice(price);
        setIsLoading(false);
      },

      "Gate.io": (event) => {
        const data = JSON.parse(event.data);
        const channel = _.get(data, "channel", "");

        if (channel !== "futures.tickers") return;

        const result = _.get(data, "result", []);
        const ticker = _.find(result, { contract: pair });

        if (!ticker) return;

        const price = _.get(ticker, "last", 0);

        !mannualPrice && setLastPrice(price);
        setIsLoading(false);
      },

      Bybit: (event) => {
        const data = JSON.parse(event.data);
        const topic = _.get(data, "topic", "");

        if (topic !== `tickers.${pair}`) return;

        const price = _.get(data, "data.lastPrice", -1);

        !mannualPrice && price !== -1 && setLastPrice(price);
        setIsLoading(false);
      },

      OKX: (event) => {
        const data = JSON.parse(event.data);
        const channel = _.get(data, "arg.channel", "");

        if (channel !== "tickers") return;

        const result = _.get(data, "data", []);
        const ticker = _.find(result, { instId: pair });

        if (!ticker) return;

        const price = _.get(ticker, "last", 0);

        !mannualPrice && setLastPrice(price);
        setIsLoading(false);
      },
    };

    socket.onopen = onOpen[exchange];
    socket.onmessage = onMessage[exchange];

    return () => {
      socket.close();
    };
  }, [selectedTradingPair, mannualPrice, exchange]);

  const takeTradeBinance = async ({
    side,
    positionSize,
    stopLoss,
    takeProfit,
    price,
  }) => {
    const { apiKey, apiSecret } = apiCredentials;

    const orders = {};
    const timestamp = Date.now() + timeDiff;
    side = _.toUpper(side);

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
      type: "LIMIT",
      quantity: roundToSamePrecision(positionSize, quantityPrecision),
      price: roundToSamePrecision(price, pricePrecision),
      timeInForce: "GTC",
    };

    if (stopLoss) {
      orders.stopLoss = {
        symbol: selectedTradingPair.pair,
        side: side === "BUY" ? "SELL" : "BUY",
        positionSide: side === "BUY" ? "LONG" : "SHORT",
        type: "STOP_MARKET",
        quantity: roundToSamePrecision(positionSize, quantityPrecision),
        stopPrice: roundToSamePrecision(stopLoss, pricePrecision),
        closePosition: false,
        workingType: "MARK_PRICE",
        timeInForce: "GTC",
      };
    }

    if (takeProfit) {
      orders.takeProfit = {
        symbol: selectedTradingPair.pair,
        side: side === "BUY" ? "SELL" : "BUY",
        positionSide: side === "BUY" ? "LONG" : "SHORT",
        type: "TAKE_PROFIT_MARKET",
        quantity: roundToSamePrecision(positionSize, quantityPrecision),
        stopPrice: roundToSamePrecision(takeProfit, pricePrecision),
        closePosition: false,
        workingType: "MARK_PRICE",
        timeInForce: "GTC",
      };
    }

    const keys = Object.keys(orders);

    try {
      setIsLoading(true);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const order = {
          ...orders[key],
          recvWindow: 5000,
          timestamp,
        };
        const signature = generateSignatureBinance(order, apiSecret);
        const url = `https://fapi.binance.com/fapi/v1/order`;
        const headers = {
          "X-MBX-APIKEY": apiKey,
        };

        await axios.post(url, null, {
          headers,
          params: {
            ...order,
            signature,
          },
        });

        addToast({
          message: `Order (${
            key === "order" ? "Entry" : key
          }) placed successfully`,
          type: "success",
        });
      }
    } catch (error) {
      console.log(error);
      const msg = _.get(error, "response.data.msg", "");
      addToast({
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const takeTrade = async (side) => {
    if (exchange === "Binance") {
      return await takeTradeBinance({
        side,
        positionSize,
        stopLoss,
        takeProfit,
        price: lastPrice,
      });
    }

    if (exchange === "Bybit") {
      return await takeTradeBybit(side);
    }
  };

  const takeTradeBybit = async (side) => {
    setIsLoading(true);

    const tickSize = _.get(selectedTradingPair, "obj.priceFilter.tickSize", 0);
    const qtyStep = _.get(selectedTradingPair, "obj.lotSizeFilter.qtyStep", 0);
    const pair = _.get(selectedTradingPair, "pair", "");

    const timestamp = Date.now() + timeDiff;
    try {
      const { apiKey, apiSecret } = apiCredentials;

      const params = {
        api_key: apiKey,
        // category: "linear",
        side,
        symbol: pair,
        orderType: "Limit",
        qty: roundToSamePrecision(positionSize, qtyStep),
        // isLeverage: 1,
        price: roundToSamePrecision(lastPrice, tickSize),
        // timeInForce: "GTC",
        stopLoss: roundToSamePrecision(stopLoss, tickSize),
        timestamp,
        recv_window: 20000,
      };

      takeProfit !== 0 &&
        (params.takeProfit = roundToSamePrecision(takeProfit, tickSize));

      const signature = generateSignature(params, apiSecret);
      params.sign = signature;

      // '{"side":"Sell","symbol":"BTCUSDT","orderType":"Limit","qty":"0.001","price":"20000","takeProfit":"0","stopLoss":"0","tpTriggerBy":"LastPrice","slTriggerBy":"LastPrice"}'

      const response = await axios({
        withCredentials: true,
        method: "POST",
        url: `https://api.bybit.com/contract/v3/private/copytrading/order/create`,
        // url: `https://api-testnet.bybit.com/contract/v3/private/copytrading/order/create`,
        data: params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      // {"retCode":10001,"retMsg":"empty value: apiTimestamp[1685474109635] apiKey[] apiSignature[]","result":{},"retExtInfo":{},"time":1685474110152}
      // {"retCode":130076,"retMsg":"params invalid","result":{},"retExtInfo":{},"time":1685474234660}
      // {"retCode":0,"retMsg":"success","result":{"orderId":"51482870-0922-460c-a124-b92e875b2ad0","orderLinkId":""},"retExtInfo":{},"time":1685474269309}

      const retCode = _.get(response, "data.retCode", 0);
      const retMsg = _.get(response, "data.retMsg", "");

      if (retCode !== 0) {
        addToast({
          type: "error",
          message: retMsg,
        });
      } else {
        addToast({
          type: "success",
          message: "Order placed successfully",
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.log("error =>", error);
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 h-full mt-auto">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Position Size Calculator
            </h1>
            <form className="space-y-4 md:space-y-6" action="#">
              <div className="w-full flex justify-between">
                <button
                  id="dropdownSearchButton"
                  data-dropdown-toggle="dropdownSearch"
                  data-dropdown-placement="bottom"
                  className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                >
                  {`${selectedTradingPair.baseAsset}/${selectedTradingPair.quoteAsset}`}
                  <svg
                    className="w-4 h-4 ml-2"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
                <button
                  id="dropdownSearchButtonExchange"
                  data-dropdown-toggle="dropdownSearchExchange"
                  data-dropdown-placement="bottom"
                  className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                >
                  {exchange}
                  <svg
                    className="w-4 h-4 ml-2"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
              </div>

              <div
                id="dropdownSearch"
                className="z-10 hidden bg-white rounded-lg shadow w-60 dark:bg-gray-700"
              >
                <div className="p-3">
                  <label htmlFor="input-group-search" className="sr-only">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="input-group-search"
                      className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Search Pair"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    ></input>
                  </div>
                </div>
                <ul
                  className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
                  aria-labelledby="dropdownSearchButton"
                >
                  {_.map(filteredTradingPairs, (pair) => {
                    return (
                      <li
                        key={pair.pair}
                        onClick={() => {
                          setSelectedTradingPair({
                            ...pair,
                          });
                          const el = document.getElementById(
                            "dropdownSearchButton"
                          );
                          el && el.click();
                        }}
                      >
                        <div className="flex items-center pl-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                          <label
                            htmlFor="checkbox-item-11"
                            className="w-full py-2 ml-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                          >
                            {`${pair.baseAsset}/${pair.quoteAsset}`}
                          </label>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div
                id="dropdownSearchExchange"
                className="z-10 hidden bg-white rounded-lg shadow w-40 dark:bg-gray-700"
              >
                <ul
                  className="h-34 px-3 py-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
                  aria-labelledby="dropdownSearchButton"
                >
                  {_.map(
                    ["Binance", "Bybit", "Mexc", "WooX", "Gate.io"],
                    (exchange) => {
                      return (
                        <li
                          key={exchange}
                          onClick={() => {
                            setExchange(exchange);
                            const el = document.getElementById(
                              "dropdownSearchButtonExchange"
                            );
                            el && el.click();
                          }}
                        >
                          <div className="flex items-center pl-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                            <label
                              htmlFor="checkbox-item-11"
                              className="w-full py-2 ml-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                            >
                              {exchange}
                            </label>
                          </div>
                        </li>
                      );
                    }
                  )}
                </ul>
              </div>

              <div>
                <label
                  htmlFor="lastPrice"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {mannualPrice ? "Manual Price" : "Last Price"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    name="lastPrice"
                    id="lastPrice"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    value={lastPrice || 0}
                    onClick={() => setMannualPrice(true)}
                    onChange={(e) => {
                      mannualPrice &&
                        handleInputChangeOnlyNumbers(e, setLastPrice);
                    }}
                    readOnly={mannualPrice === false}
                  ></input>
                  <button
                    type="button"
                    onClick={() => setMannualPrice(false)}
                    className="text-gray-700 border hover:bg-blue-700 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:focus:ring-blue-800 dark:hover:bg-blue-500"
                  >
                    <svg
                      aria-hidden="true"
                      fill="none"
                      className="w-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                    <span className="sr-only">Icon description</span>
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <div>
                  <label
                    htmlFor="stopLoss"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Stop Loss
                  </label>
                  <input
                    type="tel"
                    name="stopLoss"
                    id="stopLoss"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    required=""
                    value={stopLoss}
                    onChange={(e) =>
                      handleInputChangeOnlyNumbers(e, setStopLoss)
                    }
                  ></input>
                </div>
                <div>
                  <label
                    htmlFor="takeProfit"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Take Profit
                  </label>
                  <input
                    type="tel"
                    name="takeProfit"
                    id="takeProfit"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    required=""
                    value={takeProfit}
                    onChange={(e) =>
                      handleInputChangeOnlyNumbers(e, setTakeProfit)
                    }
                  ></input>
                </div>
              </div>
              <div>
                <label
                  htmlFor="lossPerTrade"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Loss Per Trade
                </label>
                <input
                  type="tel"
                  name="lossPerTrade"
                  id="lossPerTrade"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={lossPerTrade}
                  prefix="$"
                  onChange={(e) =>
                    handleInputChangeOnlyNumbers(e, setLossPerTrade)
                  }
                ></input>

                <div className="mt-1.5">
                  {_.map([1, 2, 3, 5, 9, 14, 21, 29], (loss) => {
                    // {_.map([5, 10, 14, 19, 24, 29], (loss) => {
                    return (
                      <span
                        className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-300 hover:cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          setLossPerTrade(loss);
                        }}
                      >
                        ${loss}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="positionSize"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Position Size
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    id="positionSize"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    value={positionSize}
                    readOnly
                    disabled
                  ></input>
                  <button
                    type="button"
                    className="inline-flex items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={(e) => {
                      e.preventDefault();
                      // navigator.clipboard.writeText(positionSize);

                      copyToClipboard(positionSize);
                    }}
                  >
                    Copy
                  </button>
                </div>
                {_.includes(["Bybit", "Binance"], exchange) && (
                  <div className="">
                    <div className=" pt-5 flex  gap-7  justify-center">
                      <button
                        type="button"
                        data-modal-target="popup-modal"
                        data-modal-toggle="popup-modal"
                        className="inline-flex items-center text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                        onClick={(e) => {
                          e.preventDefault();

                          // takeTrade("Buy");
                          setSide("Buy");
                        }}
                      >
                        Buy / Long
                      </button>
                      <button
                        data-modal-target="authentication-modal"
                        data-modal-toggle="authentication-modal"
                        type="button"
                        className="text-blue-700 border border-blue-700 hover:bg-blue-700 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:focus:ring-blue-800 dark:hover:bg-blue-500"
                      >
                        {/* <svg
                          aria-hidden="true"
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 6v12m6-6H6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg> */}
                        <svg
                          aria-hidden="true"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 6v12m6-6H6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                        <span className="sr-only">Icon description</span>
                      </button>
                      <button
                        type="button"
                        data-modal-target="popup-modal"
                        data-modal-toggle="popup-modal"
                        className="inline-flex items-center text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                        onClick={(e) => {
                          e.preventDefault();
                          // navigator.clipboard.writeText(positionSize);
                          // takeTrade("Sell");
                          setSide("Sell");
                        }}
                      >
                        Sell / Short
                      </button>
                      {/* <button
                        data-modal-target="authentication-modal"
                        data-modal-toggle="authentication-modal"
                        className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                      >
                        Add API
                      </button> */}
                    </div>
                  </div>
                )}
              </div>
            </form>

            {isLoading && (
              <div role="status" className="flex justify-center">
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            )}
          </div>
        </div>

        <div
          // className="toast-container fixed inset-0 flex flex-col items-end justify-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-auto"

          className="fixed right-0 bottom-0 flex flex-col items-end justify-end px-4 py-6 sm:p-6 sm:items-start sm:justify-end"
          id="toast-container"
        >
          {_.map(toasts, ({ id, message, type }) => (
            <Toast
              id={id}
              key={id}
              message={message}
              type={type}
              onClose={() => {
                removeToast(id);
              }}
            ></Toast>
          ))}
        </div>
      </div>

      {/* <!-- Main modal --> */}
      <div
        id="authentication-modal"
        tabIndex="-1"
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full"
      >
        <div className="relative w-full max-w-md max-h-full">
          {/* <!-- Modal content --> */}
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button
              type="button"
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
              data-modal-hide="authentication-modal"
              id="close-authentication-modal"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
            <div className="px-6 py-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">
                Add your Bybit API key
              </h3>
              <form className="space-y-6" action="#">
                <div>
                  <label
                    htmlFor="key"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    API Key
                  </label>
                  <input
                    type="text"
                    name="key"
                    id="key"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="key"
                    onChange={(e) => {
                      setApiCredentialsInp({
                        ...apiCredentialsInp,
                        apiKey: e.target.value,
                      });
                    }}
                    value={apiCredentialsInp.apiKey}
                    required
                  ></input>
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Secret
                  </label>
                  <input
                    autoComplete="disabled"
                    type="password"
                    name="secret"
                    id="secret"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    onChange={(e) => {
                      setApiCredentialsInp({
                        ...apiCredentialsInp,
                        apiSecret: e.target.value,
                      });
                    }}
                    value={apiCredentialsInp.apiSecret}
                    required
                  ></input>
                </div>

                <button
                  type="submit"
                  className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={(e) => {
                    e.preventDefault();
                    setApiCredentials({
                      ...apiCredentialsInp,
                    });

                    _setApiCredentials({
                      ...apiCredentialsInp,
                    });

                    setApiCredentialsInp({
                      apiKey: "",
                      apiSecret: "",
                    });

                    const el = document.getElementById(
                      "close-authentication-modal"
                    );
                    el && el.click();
                  }}
                >
                  Add API Key
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* <button
       
        className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
      >
        Toggle modal
      </button> */}

      <ConfirmTradeModal
        selectedTradingPair={selectedTradingPair}
        lastPrice={lastPrice}
        positionSize={positionSize}
        stopLoss={stopLoss}
        takeTrade={takeTrade}
        side={side}
      ></ConfirmTradeModal>
    </section>
  );
};

export default PositionCalculator;
