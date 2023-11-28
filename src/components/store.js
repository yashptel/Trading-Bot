// const getAPICredentials = (exchange) => {
//   const defaultCredentials = {
//     apiKey: "",
//     apiSecret: "",
//     passphrase: "",
//   };

import { nanoid } from "nanoid";

//   try {
//     const cred = JSON.parse(localStorage.getItem(`apiCredentials-${exchange}`));
//     if (cred) {
//       setApiCredentials("Bybit", cred);
//     }
//   } catch (error) {}

//   try {
//     return (
//       JSON.parse(localStorage.getItem(`apiCredentials-${exchange}`)) ||
//       defaultCredentials
//     );
//   } catch (error) {
//     return defaultCredentials;
//   }
// };

// const defaultCredentials = {
//   apiKey: "",
//   apiSecret: "",
//   passphrase: "",
// };

const getAPICredentials = (exchange) => {
  return JSON.parse(localStorage.getItem(`apiCredentials-${exchange}`));
};

export const getAPICredentialsList = (exchange) => {
  if (exchange) {
    const creds = getAPICredentials(exchange);
    if (creds) {
      addAPICredentials({
        exchange,
        accountName: `${exchange} Account ${Date.now()}`,
        apiKey: creds.apiKey,
        apiSecret: creds.apiSecret,
        apiPassphrase: creds.passphrase,
      });
      localStorage.removeItem(`apiCredentials-${exchange}`);
    }
  }

  const list = JSON.parse(localStorage.getItem("apiCredentialsList")) || [];
  return list;
};

export const addAPICredentials = (data) => {
  if (!data) return;
  const list = getAPICredentialsList();
  const id = nanoid();
  data.id = id;
  list.push(data);
  localStorage.setItem("apiCredentialsList", JSON.stringify(list));
};

export const removeAPICredentials = (id) => {
  const list = getAPICredentialsList();
  const newList = list.filter((item) => item.id !== id);
  localStorage.setItem("apiCredentialsList", JSON.stringify(newList));
};
