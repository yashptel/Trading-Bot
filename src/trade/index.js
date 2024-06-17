import { store } from "../store";
import Binance from "./binance";
import Bybit from "./bybit";

import _ from "lodash";

const exchanges = {
  binance: Binance,
  bybit: Bybit,
};

/**
 * Get the client for the specified exchange.
 * @returns {import('./exchange').default} The client for the specified exchange.
 */
const getClient = () => {
  const state = store.getState();

  const credentials = _.find(
    state?.apiCredentials,
    (item) => item.exchange === state?.exchange.value
  );

  const exchange = state.exchange.value;

  /**
   * @type {import('./exchange').default}
   */
  const Client = exchanges[exchange];

  if (!Client) {
    store.dispatch({
      type: "ADD_TOAST",
      payload: {
        message: "Exchange not supported.",
        type: "error",
      },
    });

    return;
  }

  return new Client({
    apiKey: credentials?.apiKey,
    secret: credentials?.secret,
    passphrase: credentials?.passphrase,
  });
};

// export const takeTrade = async (data) => {

//   const state = store.getState();

//   const credentials = _.find(
//     props?.apiCredentials,
//     (item) => item.exchange === props?.exchange.value
//   );

//   const exchange = state.exchange?value;

export const takeTrade = async (data) => {
  const client = getClient();
  if (!client) {
    return;
  }

  return await client.takeTrade(data);
};

export const getLastPrice = (callback) => {
  const client = getClient();
  if (!client) {
    return;
  }

  return client.getLastPrice(callback);
};

export const getAllTradingPairs = async (data) => {
  const client = getClient();
  if (!client) {
    return [];
  }

  return (await client.getAllTradingPairs(data)) || [];
};

export default {
  takeTrade,
  getAllTradingPairs,
};
