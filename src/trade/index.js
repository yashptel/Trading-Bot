import Binance from "./binance";
import Bybit from "./bybit";
import Mexc from "./mexc";

/**
 *
 * @param {String} exchangeId
 * @param {*} args
 * @returns {Bybit|Binance|Mexc}
 */
const getTradeInstance = (exchangeId, args = {}) => {
  switch (exchangeId) {
    case "E0GKF97sIEnbz0i1GeFx2":
      return new Binance(args);
    case "6Y6brH-PFp8gWe5eLEVEL":
      return new Bybit(args);
    case "lSd7NssEYffk-Ah8-e0wJ":
      return new Mexc(args);
    default:
      // throw new Error("Exchange not supported.");
      console.error("Exchange not supported.");
  }
};

export default getTradeInstance;
