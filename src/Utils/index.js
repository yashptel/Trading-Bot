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
