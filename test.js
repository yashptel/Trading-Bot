// const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const axios = require("axios");
const _ = require("lodash");
const { createHmac } = require("crypto");

const baseUrl = "https://www.okex.com";

// var apiKey = "XVXABITGCLSODYKCEO";
// var secret = "FZDQMYBPBIDSRAYETGTGRMAKFIZPIYNEYFVG";
// var recvWindow = 5000;
// var timestamp = Date.now().toString();

const createSignature = (message, secret) => {
  console.log("message", message);
  console.log("secretKey", secret);

  const signature = CryptoJS.HmacSHA256(message, secret).toString(
    CryptoJS.enc.Base64
  );
  return signature;
};

function signMessage(message, secret) {
  return createHmac("sha256", secret).update(message).digest("base64");
}

const roundToSamePrecision = (number, sample) => {
  // Get the number of decimal places in the sample number.
  const decimalPlaces = _(sample).toString().split(".")[1]?.length || 0;

  // Round the number to the same number of decimal places.
  return _.round(number, decimalPlaces);
};

async function http_request(endpoint, method, data, Info, headers) {
  let fullendpoint = "";

  console.log("endpoint", endpoint);
  if (method === "POST") {
    fullendpoint = baseUrl + endpoint;
  } else {
    fullendpoint = baseUrl + endpoint + "?" + data;
    data = "";
  }
  //endpoint=url+endpoint
  var config = {
    method: method,
    url: fullendpoint,
    headers: headers,
    data: data,
  };
  console.log(Info + " Calling....");

  await axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}

// export function serializeParams(
//   params: object | undefined,
//   method: Method,
//   strict_validation = false
// ): string {
//   if (!params) {
//     return '';
//   }

//   if (method !== 'GET') {
//     return JSON.stringify(params);
//   }

//   const queryString = Object.keys(params)
//     .map((key) => {
//       const value = params[key];
//       if (strict_validation === true && typeof value === 'undefined') {
//         throw new Error(
//           'Failed to sign API request due to undefined parameter'
//         );
//       }
//       return `${key}=${value}`;
//     })
//     .join('&');

//   // Prevent trailing `?` if no params are provided
//   return queryString ? '?' + queryString : queryString;
// }

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

const placeOrder = async (data, key, secret) => {
  // OK-ACCESS-TIMESTAMP The UTC timestamp of your request .e.g : 2020-12-08T09:08:57.715Z
  // millisecond ISO format, e.g. 2020-12-08T09:08:57.715Z
  const timestamp = new Date().toISOString();
  console.log(timestamp);

  const path = "/api/v5/trade/order";
  const body = serializeParams(data, "POST");
  // const signature = createSignature(timestamp, "POST", path, body, secret);
  const signature = createSignature(timestamp + "POST" + path + body, secret);
  // const response = await http.request({
  //   method: "POST",
  //   url: "/v1/proxy",
  //   data: {
  //     url: `${baseUrl}/trade/order`,
  //     method: "POST",
  //     headers: {
  //       "OK-ACCESS-KEY": key,
  //       "OK-ACCESS-SIGN": signature,
  //       "OK-ACCESS-TIMESTAMP": timestamp,
  //       "OK-ACCESS-PASSPHRASE": "59@iDDiMk?X$hdBxTL64",
  //     },
  //     data,
  //   },
  // });

  const headers = {
    "OK-ACCESS-KEY": key,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": "59@iDDiMk?X$hdBxTL64",
    // x-simulated-trading: 1
    "x-simulated-trading": "1",
  };

  const response = http_request(path, "POST", data, "Place Order", headers);

  // console.log(response.data);
  return response.data;
};

//Create Order
async function TestCase() {
  await placeOrder(
    {
      instId: "ETH-USDT-SWAP",
      tdMode: "cross",
      side: "buy",
      posSide: "long",
      ordType: "market",
      sz: 1,
    },
    "be997a38-1829-4d74-a621-7f1850f52c0b",
    "47574BBDF71C77AD5B7BE3990F89100F"
  );

  //Get unfilled Order List
  // endpoint = "/v5/order/realtime";
  // var data = "category=linear&settleCoin=USDT";
  // await http_request(endpoint, "GET", data, "Order List");

  // //Cancel order
  // endpoint = "/v5/order/cancel";
  // var data =
  //   '{"category":"linear","symbol": "BTCUSDT","orderLinkId": "' +
  //   orderLinkId +
  //   '"}';
  // await http_request(endpoint, "POST", data, "Cancel");
}

//Create, List and Cancel Orders
TestCase();

// {
//   "side": "Buy",
//   "positionSize": 1.245322258267383,
//   "stopLoss": 0,
//   "takeProfit": 0,
//   "price": "1606.01",
//   "selectedTradingPair": {
//       "pair": "ETH-USDT-SWAP",
//       "baseAsset": "ETH",
//       "quoteAsset": "USDT",
//       "obj": {
//           "alias": "",
//           "baseCcy": "",
//           "category": "1",
//           "ctMult": "1",
//           "ctType": "linear",
//           "ctVal": "0.1",
//           "ctValCcy": "ETH",
//           "expTime": "",
//           "instFamily": "ETH-USDT",
//           "instId": "ETH-USDT-SWAP",
//           "instType": "SWAP",
//           "lever": "125",
//           "listTime": "1611916828000",
//           "lotSz": "1",
//           "maxIcebergSz": "100000000.0000000000000000",
//           "maxLmtSz": "100000000",
//           "maxMktSz": "20000",
//           "maxStopSz": "20000",
//           "maxTriggerSz": "100000000.0000000000000000",
//           "maxTwapSz": "100000000.0000000000000000",
//           "minSz": "1",
//           "optType": "",
//           "quoteCcy": "",
//           "settleCcy": "USDT",
//           "state": "live",
//           "stk": "",
//           "tickSz": "0.01",
//           "uly": "ETH-USDT"
//       }
//   },
//   "apiCredentials": {
//       "apiKey": "be997a38-1829-4d74-a621-7f1850f52c0b",
//       "apiSecret": "47574BBDF71C77AD5B7BE3990F89100F"
//   },
//   "orderType": "Market"
// }
