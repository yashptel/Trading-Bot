import _ from "lodash";
import http from "./api";
import CryptoJS from "crypto-js";

const baseUrl = "https://www.okex.com";

const signMessage = (message, secret) => {
  const signature = CryptoJS.HmacSHA256(message, secret).toString(
    CryptoJS.enc.Base64
  );
  return signature;
};

const serializeParams = (params, method) => {
  if (!params) {
    return "";
  }

  if (method !== "GET") {
    return JSON.stringify(params);
  }

  const queryString = Object.keys(params)
    .map((key) => {
      const value = params[key];
      return `${key}=${value}`;
    })
    .join("&");

  // Prevent trailing `?` if no params are provided
  return queryString ? "?" + queryString : queryString;
};

export const getSwapInstruments = async () => {
  const response = await http.request({
    method: "POST",
    url: "/v1/proxy",
    data: {
      url: `${baseUrl}/api/v5/public/instruments?instType=SWAP`,
      method: "GET",
    },
  });
  return response.data;
};

export const getAccount = async (key, secret, passphrase) => {
  const timestamp = new Date().toISOString();
  const path = "/api/v5/account/balance";
  const signature = signMessage(timestamp + "GET" + path, secret);
  const response = await http.request({
    method: "POST",
    url: "/v1/proxy",
    data: {
      url: `${baseUrl}${path}`,
      method: "GET",
      headers: {
        "OK-ACCESS-KEY": key,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": passphrase,
        "x-simulated-trading": "1", // Remove this line to place real orders
      },
    },
  });
  return response.data;
};

export const getAvailableBalance = async ({
  key,
  secret,
  passphrase,
  currency,
}) => {
  const response = await getAccount(key, secret, passphrase);

  const balances = _.get(response, "body.data[0].details", []);

  const availableBalances = _.chain(balances)
    .map((balance) => {
      return {
        currency: balance.ccy,
        available: parseFloat(balance.availBal),
      };
    })
    .keyBy("currency")
    .value();

  const balance = _.get(availableBalances, `${currency}`, {
    currency: currency,
    available: 0,
  });

  return balance;
};

export const placeOrder = async (data, key, secret, passphrase) => {
  const timestamp = new Date().toISOString();
  const path = "/api/v5/trade/order";
  const body = serializeParams(data, "POST");
  const signature = signMessage(timestamp + "POST" + path + body, secret);
  const response = await http.request({
    method: "POST",
    url: "/v1/proxy",
    data: {
      url: `${baseUrl}${path}`,
      method: "POST",
      headers: {
        "OK-ACCESS-KEY": key,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": passphrase,
        "x-simulated-trading": "1", // Remove this line to place real orders
      },
      body: data,
    },
  });
  return response.data;
};

const roundToSamePrecision = (number, sample) => {
  // Get the number of decimal places in the sample number.
  const decimalPlaces = _(sample).toString().split(".")[1]?.length || 0;

  // Round the number to the same number of decimal places.
  return _.round(number, decimalPlaces);
};

export const takeTrade = async (data) => {
  const sz = Math.floor(data.positionSize / data.selectedTradingPair.obj.ctVal);
  const preparedData = {
    instId: data.selectedTradingPair.obj.instId,
    tdMode: "cross",
    side: _.toLower(data.side),
    posSide: _.toLower(data.side) === "buy" ? "long" : "short",
    ordType: _.toLower(data.orderType),
    sz: sz.toString(),
  };

  if (preparedData.ordType === "limit") {
    preparedData.px = roundToSamePrecision(
      data.price,
      data.selectedTradingPair.obj.tickSz
    );
  }

  if (data.takeProfit) {
    const tpPx = roundToSamePrecision(
      data.takeProfit,
      data.selectedTradingPair.obj.tickSz
    );

    preparedData.tpTriggerPx = tpPx;
    preparedData.tpOrdPx = -1; // Market order
  }

  if (data.stopLoss) {
    const slPx = roundToSamePrecision(
      data.stopLoss,
      data.selectedTradingPair.obj.tickSz
    );

    preparedData.slTriggerPx = slPx;
    preparedData.slOrdPx = -1; // Market order
  }

  const response = await placeOrder(
    preparedData,
    data.apiCredentials.apiKey,
    data.apiCredentials.apiSecret,
    data.apiCredentials.passphrase
  );

  return _.get(response, "body.data[0]");
};

const exportObject = {
  getSwapInstruments,
  placeOrder,
  takeTrade,
  getAvailableBalance,
};

export default exportObject;
