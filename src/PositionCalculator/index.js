import axios from "axios";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { w3cwebsocket as WebSocket } from 'websocket';

const PositionCalculator = () => {
  const [tradingPairs, setTradingPairs] = useState([]);
  const [selectedTradingPair, setSelectedTradingPair] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTradingPairs, setFilteredTradingPairs] = useState([]);
  const [lastPrice, setLastPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [lossPerTrade, setLossPerTrade] = useState(0);
  const [positionSize, setPositionSize] = useState(0);

  const handleInputChangeOnlyNumbers = (event, setFn) => {
    const value = event.target.value;
    const valid = /^\d*\.?\d*$/.test(value);
    if (valid) {
      /^0\d/.test(value) ? setFn(_.replace(value, /^0/, '')) : setFn(value || 0);
    }
  };


  useEffect(() => {
    axios
      .get('https://dapi.binance.com/dapi/v1/exchangeInfo')
      .then(response => {
        const symbols = _.get(response, 'data.symbols', []);
        const pairs = _.filter(symbols, symbol => symbol.contractType === 'PERPETUAL');
        console.log(pairs);
        setTradingPairs(pairs);
        setFilteredTradingPairs(pairs);
        setSelectedTradingPair(_.first(pairs).baseAsset);
      })
      .catch(error => console.log(error));
  }, []);


  useEffect(() => {

    const diff = Math.abs(Number(stopLoss) - Number(lastPrice));
    const percentage = (diff / Number(lastPrice)) * 100;

    const positionAmount = (100 / percentage) * Number(lossPerTrade);
    const positionSize = positionAmount / Number(lastPrice);
    !_.isNaN(positionSize) && setPositionSize(positionSize);

  }, [lastPrice, stopLoss, lossPerTrade]);

  useEffect(() => {
    const res = _.filter(tradingPairs, pair => _.lowerCase(pair.pair).includes(_.lowerCase(searchTerm)));
    setFilteredTradingPairs(res);
  }, [searchTerm, tradingPairs]);

  // useEffect(() => {
  //   const socket = new WebSocket(`wss://stream.binance.com:9443/ws`);

  //   socket.onopen = () => {
  //     console.log('WebSocket Client Connected');
  //     socket.send(JSON.stringify({
  //       method: 'SUBSCRIBE',
  //       params: [
  //         `${_.toLower(selectedTradingPair + 'usdt')}@ticker`
  //       ],
  //       id: 1
  //     }));
  //   };

  //   socket.onmessage = event => {
  //     const data = JSON.parse(event.data);
  //     setLastPrice(data.c);
  //   };
  //   return () => {
  //     socket.close();
  //   };
  // }, [selectedTradingPair]);


  useEffect(() => {
    const socket = new WebSocket(`wss://contract.mexc.com/ws`);

    socket.onopen = () => {
      console.log('WebSocket Client Connected => MEXC');
      socket.send(JSON.stringify({
        "method": "sub.ticker",
        "param": {
          symbol: _.toUpper(selectedTradingPair + '_USDT')
        }
      }));

      setInterval(() => {
        socket.send(JSON.stringify({
          "method": "ping",
        }));
      }, 10000);
    };

    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      const channel = _.get(data, 'channel', '');
      if (channel !== 'push.ticker') return;

      const price = _.get(data, 'data.lastPrice', 0);
      setLastPrice(price);
    }

    return () => {
      socket.close();
    }

  }, [selectedTradingPair])


  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 h-full mt-auto">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Position Size Calculator
            </h1>
            <form className="space-y-4 md:space-y-6" action="#">



              <div class='w-full'>
                <button id="dropdownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" class="mx-auto text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">{selectedTradingPair}<svg class="w-4 h-4 ml-2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button>
              </div>

              <div id="dropdownSearch" class="z-10 hidden bg-white rounded-lg shadow w-60 dark:bg-gray-700">
                <div class="p-3">
                  <label for="input-group-search" class="sr-only">Search</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
                    </div>
                    <input type="text" id="input-group-search" class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search Pair" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}></input>
                  </div>
                </div>
                <ul class="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownSearchButton">
                  {_.map(filteredTradingPairs, pair => {
                    return (
                      <li key={pair.pair} onClick={
                        () => {
                          setSelectedTradingPair(pair.baseAsset);
                          console.log(pair.pair);


                        }
                      }>
                        <div class="flex items-center pl-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                          <label for="checkbox-item-11" class="w-full py-2 ml-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300">{
                            pair.pair
                          }</label>
                        </div>
                      </li>
                    )
                  })}

                </ul>

              </div>


              <div>
                <label htmlFor="lastPrice" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Price</label>
                <input type="text" name="lastPrice" id="lastPrice" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled value={lastPrice || 0}></input>
              </div>
              <div>
                <label htmlFor="stopLoss" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Stop Loss</label>
                <input type="text" name="stopLoss" id="stopLoss" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required="" value={stopLoss} onChange={e => handleInputChangeOnlyNumbers(e, setStopLoss)}></input>
              </div>
              <div>
                <label htmlFor="lossPerTrade" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Loss Per Trade</label>
                <input type="text" name="lossPerTrade" id="lossPerTrade" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" value={lossPerTrade} prefix="$" onChange={e => handleInputChangeOnlyNumbers(e, setLossPerTrade)}></input>
              </div>

              <div class="relative">
                <label htmlFor="positionSize" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position Size</label>
                <input type="text" id="positionSize" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" value={positionSize}></input>
                <button type="button" class="text-white absolute right-1 bottom-[0.16rem] bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(positionSize);
                }}>Copy</button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </section>

  );
};

export default PositionCalculator;
