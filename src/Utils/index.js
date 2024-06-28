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
export const inputHandlerNumber = (
  value,
  callbackFn,
  { allowNegative = false } = {}
) => {
  const valid = /^\d*\.?\d*$/.test(value);
  const validNegative = /^0*-?\d*\.?\d*$/.test(value);

  if ((!allowNegative && !valid) || (allowNegative && !validNegative)) {
    return;
  }
  if (/^0\d/.test(value)) {
    return callbackFn(_.replace(value, /^0/, ""));
  }

  if (/^0*-/.test(value)) {
    return callbackFn(_.replace(value, /^0*-/, "-"));
  }

  if (/-0+\d/.test(value)) {
    return callbackFn(_.replace(value, /^-0+/, "-"));
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
 * @returns {[number, number]} - The position size and amount.
 */
export const calcPositionSize = (price, risk, stopLoss) => {
  const difference = Math.abs(stopLoss - price);
  const percentage = (difference / price) * 100;

  const positionAmount = (100 / percentage) * risk;
  const positionSize = positionAmount / price;

  return [positionSize, positionAmount];
};

/**
 * Round a number to the same precision as a sample number.
 * @param {number|string} number - The number to round.
 * @param {number|string} sample - The number to use as a sample.
 * @returns {string} - The rounded number.
 */
export const roundToSamePrecision = (number, sample) => {
  Number.prototype.noExponents = function () {
    var data = String(this).split(/[eE]/);
    if (data.length == 1) return data[0];

    var z = "",
      sign = this < 0 ? "-" : "",
      str = data[0].replace(".", ""),
      mag = Number(data[1]) + 1;

    if (mag < 0) {
      z = sign + "0.";
      while (mag++) z += "0";
      return z + str.replace(/^\-/, "");
    }
    mag -= str.length;
    while (mag--) z += "0";
    return str + z;
  };

  if (typeof sample === "number") {
    sample = sample.noExponents();
  }

  // Get the number of decimal places in the sample number.
  const decimalPlaces = _(sample).toString().split(".")[1]?.length || 0;
  const arr = _.toString(number).split(".");
  if (arr.length === 1) {
    return number;
  }
  const [int, dec] = arr;
  const newDec = dec.slice(0, decimalPlaces);
  if (newDec.length === 0) {
    return int;
  }
  return `${int}.${newDec}`;
};

export const isNumber = (value) => {
  return /^((-?\d+)|(-?\d+\.\d+))$/.test(value);
};

export const calcRiskReward = (entry, stopLoss, takeProfit) => {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(entry - takeProfit);

  if (
    (stopLoss <= takeProfit && takeProfit <= entry) ||
    (stopLoss >= takeProfit && takeProfit >= entry)
  ) {
    return -(reward / risk) || 0;
  }

  return reward / risk || 0;
};

export const calcTakeProfit = (entry, stopLoss, risk) => {
  risk = risk || 0;
  const reward = risk * Math.abs(entry - stopLoss);

  if (entry < stopLoss) {
    return entry - reward;
  }
  return entry + reward;
};
