/**
 * lighterWasm.js
 *
 * Singleton loader for the lighter-signer.wasm module.
 * Exposes wrapped versions of the WASM globals:
 *   - createClient(url, privateKey, chainId, apiKeyIndex, accountIndex)
 *   - createAuthToken(deadline, apiKeyIndex, accountIndex)
 *   - signCreateGroupedOrders(groupingType, orders, options)
 *
 * The WASM binary is served from /lighter-signer.wasm alongside wasm_exec.js.
 */

let wasmReady = null;

export const LIGHTER_WASM_VERSION = "v1.0.6";

const GROUPED_ORDERS_SIGNATURE_LEGACY = 1;
const GROUPED_ORDERS_SIGNATURE_WITH_ATTRIBUTES = 2;
const GROUPED_ORDERS_SIGNATURE_VERSION = GROUPED_ORDERS_SIGNATURE_LEGACY;

const DEFAULT_API_KEY_INDEX = 255;
const DEFAULT_ACCOUNT_INDEX = -1;
const DEFAULT_INTEGRATOR_ACCOUNT_INDEX = 0;
const DEFAULT_INTEGRATOR_TAKER_FEE = 0;
const DEFAULT_INTEGRATOR_MAKER_FEE = 0;
const SELF_TRADE_BEHAVIOR_EXPIRE_MAKER = 0;
const SELF_TRADE_EQUALITY_ACCOUNT_INDEX = 0;
const SKIP_NONCE_DISABLED = 0;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Initialises the WASM module once; subsequent calls return the same promise.
 * @returns {Promise<void>}
 */
export function waitForWasm() {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    // 1. Load the Go WASM runtime shim
    await loadScript("/wasm_exec.js");

    // 2. Instantiate the WASM binary
    const go = new window.Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch("/lighter-signer.wasm"),
      go.importObject
    );
    go.run(result.instance); // starts the Go event loop; never resolves
  })();

  return wasmReady;
}

/**
 * Wraps a synchronous WASM global that returns { error? } or a result object.
 * Throws if the WASM returns an error field.
 */
function callWasm(fnName, ...args) {
  const fn = window[fnName];
  if (typeof fn !== "function") {
    throw new Error(`WASM function "${fnName}" is not available yet.`);
  }
  const result = fn(...args);
  if (result && result.error) {
    throw new Error(`[lighter-wasm] ${fnName}: ${result.error}`);
  }
  return result;
}

/**
 * Must be called before any signing. Idempotent — safe to call on every trade.
 * @param {string} privateKey    - hex-encoded Ed25519 private key
 * @param {number} chainId       - e.g. 300 (testnet) or 1 (mainnet)
 * @param {number} apiKeyIndex   - e.g. 13
 * @param {number} accountIndex  - e.g. 72
 */
export function createClient(privateKey, chainId, apiKeyIndex, accountIndex) {
  const url = import.meta.env.VITE_LIGHTER_REAL_URL;
  return callWasm("CreateClient", url, privateKey, chainId, apiKeyIndex, accountIndex);
}

/**
 * Generates a short-lived auth token signed by the private key.
 * @param {number} deadline       - unix timestamp (seconds). 0 = 7h from now.
 * @param {number} apiKeyIndex
 * @param {number} accountIndex
 * @returns {{ authToken: string }}
 */
export function createAuthToken(deadline, apiKeyIndex, accountIndex) {
  return callWasm("CreateAuthToken", deadline, apiKeyIndex, accountIndex);
}

function normalizeGroupedOrderSignerOptions(optionsOrNonce, apiKeyIndex, accountIndex) {
  if (typeof optionsOrNonce === "object" && optionsOrNonce !== null) {
    const useDefaultSigner = optionsOrNonce.useDefaultSigner === true;
    return {
      nonce: optionsOrNonce.nonce ?? -1,
      apiKeyIndex: useDefaultSigner
        ? DEFAULT_API_KEY_INDEX
        : optionsOrNonce.apiKeyIndex,
      accountIndex: useDefaultSigner
        ? DEFAULT_ACCOUNT_INDEX
        : optionsOrNonce.accountIndex,
      integratorAccountIndex:
        optionsOrNonce.integratorAccountIndex ?? DEFAULT_INTEGRATOR_ACCOUNT_INDEX,
      integratorTakerFee:
        optionsOrNonce.integratorTakerFee ?? DEFAULT_INTEGRATOR_TAKER_FEE,
      integratorMakerFee:
        optionsOrNonce.integratorMakerFee ?? DEFAULT_INTEGRATOR_MAKER_FEE,
      selfTradeBehaviorMode:
        optionsOrNonce.selfTradeBehaviorMode ?? SELF_TRADE_BEHAVIOR_EXPIRE_MAKER,
      selfTradeEqualityMode:
        optionsOrNonce.selfTradeEqualityMode ?? SELF_TRADE_EQUALITY_ACCOUNT_INDEX,
      skipNonce: optionsOrNonce.skipNonce ?? SKIP_NONCE_DISABLED,
    };
  }

  return {
    nonce: optionsOrNonce,
    apiKeyIndex,
    accountIndex,
    integratorAccountIndex: DEFAULT_INTEGRATOR_ACCOUNT_INDEX,
    integratorTakerFee: DEFAULT_INTEGRATOR_TAKER_FEE,
    integratorMakerFee: DEFAULT_INTEGRATOR_MAKER_FEE,
    selfTradeBehaviorMode: SELF_TRADE_BEHAVIOR_EXPIRE_MAKER,
    selfTradeEqualityMode: SELF_TRADE_EQUALITY_ACCOUNT_INDEX,
    skipNonce: SKIP_NONCE_DISABLED,
  };
}

/**
 * Signs a grouped batch of orders (tx_type 28).
 * @param {number}  groupingType  - 3 for entry+TP+SL
 * @param {Array}   orders        - array of CreateOrderTxReq objects
 * @param {Object|number} optionsOrNonce - signer options, or legacy nonce
 * @param {number}  apiKeyIndex          - legacy positional api key index
 * @param {number}  accountIndex         - legacy positional account index
 * @returns {{ tx_type: number, tx_info: string }}
 */
export function signCreateGroupedOrders(
  groupingType,
  orders,
  optionsOrNonce,
  apiKeyIndex,
  accountIndex
) {
  const fnName = "SignCreateGroupedOrders";
  const fn = window[fnName];
  if (typeof fn !== "function") {
    throw new Error(`WASM function "${fnName}" is not available yet.`);
  }
  const options = normalizeGroupedOrderSignerOptions(
    optionsOrNonce,
    apiKeyIndex,
    accountIndex
  );

  const result =
    GROUPED_ORDERS_SIGNATURE_VERSION === GROUPED_ORDERS_SIGNATURE_WITH_ATTRIBUTES
      ? fn(
          groupingType,
          orders,
          options.integratorAccountIndex,
          options.integratorTakerFee,
          options.integratorMakerFee,
          options.selfTradeBehaviorMode,
          options.selfTradeEqualityMode,
          options.skipNonce,
          options.nonce,
          options.apiKeyIndex,
          options.accountIndex
        )
      : fn(
          groupingType,
          orders,
          options.nonce,
          options.apiKeyIndex,
          options.accountIndex
        );

  if (result && result.error) {
    console.error(`[lighter-wasm] ${fnName} returned error:`, result.error);
    throw new Error(`[lighter-wasm] ${fnName}: ${result.error}`);
  }
  return result;
}
