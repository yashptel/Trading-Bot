import CryptoJS from "crypto-js";

/**
 * @param {string} key - The key of the item to be retrieved from localStorage
 * @param {string} value - The value to be stored in localStorage
 * @returns {void} - No return value
 * @description - This function encrypts the value with
 */

/**
 * @param {string} key - The key of the item to be retrieved from localStorage
 * @param {string} defaultValue - The default value to be used if the item is not found in localStorage
 * @returns {string} The value from localStorage or the default value
 */

const SECRET_KEY = "H6&Xb?$Q4ta9e68EPHkk";

const hash = (input) => {
  return CryptoJS.SHA256(input, SECRET_KEY).toString();
};

const encrypt = (data) => {
  const encryptedData = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  return encryptedData;
};

const decrypt = (encryptedData) => {
  const decryptedData = CryptoJS.AES.decrypt(
    encryptedData,
    SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);
  return decryptedData;
};

const setItem = (key, value) => {
  const hashedKey = hash(key);
  const encryptedValue = encrypt(value);
  localStorage.setItem(hashedKey, encryptedValue);
};

const getItem = (key, defaultValue) => {
  const hashedKey = hash(key);
  const encryptedValue = localStorage.getItem(hashedKey);
  if (encryptedValue) {
    const decryptedValue = decrypt(encryptedValue);
    return decryptedValue;
  }
  return defaultValue;
};

export default { setItem, getItem };
