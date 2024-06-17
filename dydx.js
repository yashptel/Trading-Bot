const { default: axios } = require("axios");
const crypto = require("crypto");
const _ = require("lodash");

const API_KEY_PAIRS = {
  walletAddress: "0xB2e87138C22eBa3589d0d894a1467efdC216bf11",
  key: "1a241edd-fba4-de43-c12d-d370a82ff764",
  secret: "wDG-eE266-Cs4yCssjysVLiIs2e5kfW9hnfFC1S_",
  passphrase: "qGfnH4V_IfpTW1xN6zJ-",
  legacySigning: false,
  walletType: "METAMASK",
};

// {
//   "walletAddress": "0xB2e87138C22eBa3589d0d894a1467efdC216bf11",
//   "key": "1a241edd-fba4-de43-c12d-d370a82ff764",
//   "secret": "wDG-eE266-Cs4yCssjysVLiIs2e5kfW9hnfFC1S_",
//   "passphrase": "qGfnH4V_IfpTW1xN6zJ-",
//   "legacySigning": false,
//   "walletType": "METAMASK"
// }

const STARK_KEY_PAIRS = {
  walletAddress: "0xB2e87138C22eBa3589d0d894a1467efdC216bf11",
  publicKey: "064b6445b0b1aba242da8fda5f3ccc10faa87de5f3c479041127dab0db1122d6",
  publicKeyYCoordinate:
    "02e1cca22c21fb8f514e7a1a5c62f3954598804e2eee5de91e95b8304692c257",
  privateKey:
    "065ff0e96198f6e422327322354802bfb0227ff3ede326cead7cffe8575b6690",
  legacySigning: false,
  walletType: "METAMASK",
};

// const BASE_URL = "https://api.dydx.exchange";
const BASE_URL = "https://api.stage.dydx.exchange";

// DYDX-SIGNATURE	yes	HMAC of the request.
// DYDX-API-KEY	yes	Api key for the account.
// DYDX-TIMESTAMP	yes	ISO timestamp of when the request was signed. Must be within 30 seconds of the server time.
// DYDX-PASSPHRASE	yes	The passphrase field of the API key.
// DYDX-ACCOUNT-NUMBER	no	Account number used to scope the request. Defaults to zero.

// sign({
//   requestPath,
//   method,
//   isoTimestamp,
//   data,
// }: {
//   requestPath: string,
//   method: RequestMethod,
//   isoTimestamp: ISO8601,
//   data?: {},
// }): string {
//   const messageString: string = (
//     isoTimestamp +
//     METHOD_ENUM_MAP[method] +
//     requestPath +
//     (_.isEmpty(data) ? '' : JSON.stringify(data))
//   );

//   return crypto.createHmac(
//     'sha256',
//     Buffer.from(this.apiKeyCredentials.secret, 'base64'),
//   ).update(messageString).digest('base64');
// }
// }

const sign = ({ requestPath, method, isoTimestamp, data }) => {
  const messageString =
    isoTimestamp +
    method +
    requestPath +
    (_.isEmpty(data) ? "" : JSON.stringify(data));

  return crypto
    .createHmac("sha256", Buffer.from(API_KEY_PAIRS.secret, "base64"))
    .update(messageString)
    .digest("base64");
};

function generateRandomClientId() {
  return Math.random().toString().slice(2).replace(/^0+/, "");
}

// {
//   "expiration": "2023-09-16T19:15:22.665Z",
//   "limitFee": "0.000500",
//   "market": "BTC-USD",
//   "postOnly": false,
//   "price": "27930",
//   "reduceOnly": false,
//   "side": "BUY",
//   "size": "0.0038",
//   "timeInForce": "FOK",
//   "type": "MARKET",
//   "clientId": "2334175042009279",
//   "signature": "07429bea7693f1ad1ca5e381c4271be8845ff867f3c43fe12566b1edc479b096076ac4282604746b284709bf09722f523a193ab317009a27740b291bf336497c",
//   "client": "00"
// }
const main = async () => {
  // const data = {
  //   market: "BTC-USD",
  //   side: "BUY",
  //   price: "28000",
  //   size: "0.01",
  //   type: "MARKET",
  //   postOnly: false,
  //   limitFee: "0.0005",
  //   expiration: new Date(Date.now() + 1000 * 60 * 60 * 86).toISOString(),
  //   clientId: generateRandomClientId(),
  //   timeInForce: "GTT"
  // };

  const data = {
    expiration: new Date(Date.now()).toISOString(),
    limitFee: "0.000500",
    market: "BTC-USD",
    postOnly: false,
    price: "27930",
    reduceOnly: false,
    side: "BUY",
    size: "0.0038",
    timeInForce: "FOK",
    type: "MARKET",
    clientId: "2334175042009279",
    client: "00",
  };

  const endpoint = "orders";
  const requestPath = `/v3/${endpoint}`;
  const isoTimestamp = new Date(Date.now()).toISOString();
  console.log(isoTimestamp);

  const method = "POST";
  data.signature = sign({
    requestPath,
    method,
    isoTimestamp,
    data: {
      ...data,
      positionId: "1",
    },
  });

  console.log(data.signature);

  // return;

  const headers = {
    "DYDX-SIGNATURE": data.signature,
    "DYDX-API-KEY": API_KEY_PAIRS.key,
    "DYDX-TIMESTAMP": isoTimestamp,
    "DYDX-PASSPHRASE": API_KEY_PAIRS.passphrase,
  };

  try {
    const response = await axios.request({
      method,
      url: `${BASE_URL}${requestPath}`,
      headers,
      data,
    });

    console.log(response.data);
  } catch (e) {
    console.log(e.response.data);
  }
};

main();
