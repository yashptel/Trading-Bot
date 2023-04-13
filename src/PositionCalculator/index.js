import axios from "axios";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { w3cwebsocket as WebSocket } from "websocket";

const PositionCalculator = () => {
  const [tradingPairs, setTradingPairs] = useState([]);
  const [selectedTradingPair, setSelectedTradingPair] = useState(
    localStorage.getItem("selectedTradingPair") || "BTC"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTradingPairs, setFilteredTradingPairs] = useState([]);
  const [lastPrice, setLastPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [lossPerTrade, setLossPerTrade] = useState(
    localStorage.getItem("lossPerTrade") || 0
  );
  const [positionSize, setPositionSize] = useState(0);
  const [mannualPrice, setMannualPrice] = useState(false);
  const [exchange, setExchange] = useState(
    localStorage.getItem("exchange") || "Binance"
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("exchange", exchange);
    localStorage.setItem("selectedTradingPair", selectedTradingPair);
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
    setIsLoading(true);
    axios
      .get("https://dapi.binance.com/dapi/v1/exchangeInfo")
      .then((response) => {
        const symbols = _.get(response, "data.symbols", []);
        const pairs = _.filter(
          symbols,
          (symbol) => symbol.contractType === "PERPETUAL"
        );
        setTradingPairs(pairs);
        setFilteredTradingPairs(pairs);
      })
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    const diff = Math.abs(Number(stopLoss) - Number(lastPrice));
    const percentage = (diff / Number(lastPrice)) * 100;

    const positionAmount = (100 / percentage) * Number(lossPerTrade);
    const positionSize = positionAmount / Number(lastPrice);
    !_.isNaN(positionSize) && setPositionSize(positionSize);
  }, [lastPrice, stopLoss, lossPerTrade]);

  useEffect(() => {
    const res = _.filter(tradingPairs, (pair) =>
      _.lowerCase(pair.pair).includes(_.lowerCase(searchTerm))
    );
    setFilteredTradingPairs(res);
  }, [searchTerm, tradingPairs]);

  // binance
  useEffect(() => {
    if (exchange !== "Binance") return;
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws`);

    setIsLoading(!mannualPrice && true);
    socket.onopen = () => {
      console.log("WebSocket Client Connected =>", exchange);
      socket.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [`${_.toLower(selectedTradingPair + "usdt")}@ticker`],
          id: 1,
        })
      );
    };

    socket.onmessage = (event) => {
      setIsLoading(false);
      const data = JSON.parse(event.data);
      mannualPrice === false && setLastPrice(data.c);
    };
    return () => {
      socket.close();
    };
  }, [selectedTradingPair, mannualPrice, exchange]);

  // mexc
  useEffect(() => {
    if (exchange !== "Mexc") return;

    const socket = new WebSocket(`wss://contract.mexc.com/ws`);
    setIsLoading(!mannualPrice && true);

    socket.onopen = () => {
      console.log("WebSocket Client Connected =>", exchange);
      socket.send(
        JSON.stringify({
          method: "sub.ticker",
          param: {
            symbol: _.toUpper(selectedTradingPair + "_USDT"),
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
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const channel = _.get(data, "channel", "");
      if (channel !== "push.ticker") return;
      setIsLoading(false);
      const price = _.get(data, "data.lastPrice", 0);
      mannualPrice === false && setLastPrice(price);
    };

    return () => {
      socket.close();
    };
  }, [selectedTradingPair, mannualPrice, exchange]);

  // woox
  useEffect(() => {
    if (exchange !== "WooX") return;

    const applicationId = "d280c0d0-a933-4fa1-8edc-d4dc10281759";
    const socket = new WebSocket(
      `wss://wss.woo.org/ws/stream/${applicationId}`
    );
    setIsLoading(!mannualPrice && true);
    socket.onopen = () => {
      console.log("WebSocket Client Connected =>", exchange);
      socket.send(
        JSON.stringify({
          event: "subscribe",
          topic: `PERP_${_.toUpper(selectedTradingPair)}_USDT@ticker`,
          id: "clientID4",
        })
      );
    };

    socket.onmessage = (event) => {
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
      if (topic !== `PERP_${_.toUpper(selectedTradingPair)}_USDT@ticker`)
        return;

      setIsLoading(false);
      const price = _.get(data, "data.close", 0);
      mannualPrice === false && setLastPrice(price);
    };
    return () => {
      socket.close();
    };
  }, [selectedTradingPair, mannualPrice, exchange]);

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
                  {selectedTradingPair}
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
                          setSelectedTradingPair(pair.baseAsset);
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
                            {pair.pair}
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
                  {_.map(["Binance", "Mexc", "WooX"], (exchange) => {
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
                  })}
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
                  onChange={(e) => handleInputChangeOnlyNumbers(e, setStopLoss)}
                ></input>
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
                  {_.map([5, 10, 14, 19, 24, 29], (loss) => {
                    return (
                      <span
                        class="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-300 hover:cursor-pointer hover:bg-gray-200"
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
              </div>
            </form>

            {isLoading && (
              <div role="status" className="flex justify-center">
                <svg
                  aria-hidden="true"
                  class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
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
                <span class="sr-only">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PositionCalculator;
