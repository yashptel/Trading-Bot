import _ from "lodash";

/**
 *
 * @param {string} info // Information to be hidden
 * @returns {string} // Hidden information
 * @description This function hides 65% of the information passed to it. For example, if the information passed is "Hello World", the function will return "He*** W***d"
 */
export const hideInformation = (info) => {
  if (!info) {
    return "";
  }
  const length = info.length;
  const hiddenLength = Math.round(length * 0.75);

  const firstHalf = info.slice(0, length / 2 - hiddenLength / 2);
  const secondHalf = info.slice(length / 2 + hiddenLength / 2, length);

  return `${firstHalf}***${secondHalf}`;
};

/**
 *
 * @param {string} value - The value to be checked.
 * @param {Function} callbackFn - The function to be called.
 * @returns {void}
 */
export const inputHandlerNumber = (value, callbackFn) => {
  const valid = /^\d*\.?\d*$/.test(value);
  if (!valid) {
    return;
  }
  if (/^0\d/.test(value)) {
    return callbackFn(_.replace(value, /^0/, ""));
  }
  return callbackFn(value || 0);
};

export const roundToSamePrecisionWithCallback = (value, sample, callbackFn) => {
  if (!isNumber(value)) {
    return callbackFn(value);
  }
  const rounded = roundToSamePrecision(value, sample);
  return callbackFn(rounded);
};

/**
 * Get the position size based on the risk and stop loss.
 * @param {number} price - The price of the asset.
 * @param {number} risk - The risk percentage.
 * @param {number} stopLoss - The stop loss.
 * @returns {number} The position size.
 */
export const calcPositionSize = (price, risk, stopLoss) => {
  const difference = Math.abs(stopLoss - price);
  const percentage = (difference / price) * 100;

  const positionAmount = (100 / percentage) * risk;
  const positionSize = positionAmount / price;

  return positionSize;
};

export const roundToSamePrecision = (number, sample) => {
  // Get the number of decimal places in the sample number.
  const decimalPlaces = _(sample).toString().split(".")[1]?.length || 0;

  // Round the number to the same number of decimal places.
  return _.round(number, decimalPlaces);
};

export const isNumber = (value) => {
  return /^((\d+)|(\d+\.\d+))$/.test(value);
};
