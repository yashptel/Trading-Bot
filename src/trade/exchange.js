/**
 * Represents a generic exchange.
 * @constructor
 * @param {Object} options - The options for initializing the exchange.
 * @param {string} options.name - The name of the exchange.
 * @param {string} options.apiKey - The API key for accessing the exchange.
 * @param {string} options.secret - The secret key for accessing the exchange.
 * @param {string} options.passphrase - The passphrase for accessing the exchange.
 */
class Exchange {
  constructor({ name, apiKey, secret, passphrase }) {
    /**
     * The name of the exchange.
     * @type {string}
     */
    this.name = name;
    /**
     * The API key for accessing the exchange.
     * @type {string}
     */
    this.apiKey = apiKey;
    /**
     * The secret key for accessing the exchange.
     * @type {string}
     */
    this.secret = secret;
    /**
     * The passphrase for accessing the exchange.
     * @type {string}
     */
    this.passphrase = passphrase;
  }

  /**
   * Placeholder method for placing a long/short trade.
   * @throws {Error} This method is not implemented in the base class.
   */
  async takeTrade() {
    throw new Error("Method not implemented.");
  }

  /**
   * Placeholder method for placing a short trade.
   * @throws {Error} This method is not implemented in the base class.
   */
  async short() {
    throw new Error("Method not implemented.");
  }

  /**
   * Placeholder method for getting the balance from the exchange.
   * @throws {Error} This method is not implemented in the base class.
   */
  async getBalance() {
    throw new Error("Method not implemented.");
  }

  /**
   * Placeholder method for getting the server time from the exchange.
   * @throws {Error} This method is not implemented in the base class.
   */
  async getServerTime() {
    throw new Error("Method not implemented.");
  }

  /**
   * Placeholder method for generating a signature for the exchange.
   * @throws {Error} This method is not implemented in the base class.
   */
  generateSignature() {
    throw new Error("Method not implemented.");
  }

  async getAllTradingPairs() {
    throw new Error("Method not implemented.");
  }

  /**
   * Placeholder method for getting the last price from the exchange.
   * @throws {Error} This method is not implemented in the base class.
   */
  getLastPrice(callback) {
    throw new Error("Method not implemented.");
  }

  /**
   * Rounds a number to the same precision as a sample number.
   * @param {number} number - The number to round.
   * @param {number} sample - The sample number to use for rounding.
   * @returns {number} The rounded number.
   */
  roundToSamePrecision(number, sample) {
    // Get the number of decimal places in the sample number.
    const decimalPlaces = _(sample).toString().split(".")[1]?.length || 0;

    // Round the number to the same number of decimal places.
    return _.round(number, decimalPlaces);
  }
}

export default Exchange;
