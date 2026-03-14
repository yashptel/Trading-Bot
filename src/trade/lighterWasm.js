/**
 * lighterWasm.js
 *
 * Singleton loader for the lighter-signer.wasm module.
 * Exposes wrapped versions of the WASM globals:
 *   - createClient(url, privateKey, chainId, apiKeyIndex, accountIndex)
 *   - createAuthToken(deadline, apiKeyIndex, accountIndex)
 *   - signCreateGroupedOrders(groupingType, orders, nonce, apiKeyIndex, accountIndex)
 *
 * The WASM binary is served from /lighter-signer.wasm alongside wasm_exec.js.
 */

let wasmReady = null;

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
 * @param {string} url           - Lighter API base URL
 * @param {string} privateKey    - hex-encoded Ed25519 private key
 * @param {number} chainId       - e.g. 300 (testnet) or 1 (mainnet)
 * @param {number} apiKeyIndex   - e.g. 13
 * @param {number} accountIndex  - e.g. 72
 */
export function createClient(url, privateKey, chainId, apiKeyIndex, accountIndex) {
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

/**
 * Signs a grouped batch of orders (tx_type 28).
 * @param {number}  groupingType  - 3 for entry+TP+SL
 * @param {Array}   orders        - array of CreateOrderTxReq objects
 * @param {number}  nonce         - -1 to let the client auto-manage
 * @param {number}  apiKeyIndex
 * @param {number}  accountIndex
 * @returns {{ tx_type: number, tx_info: string }}
 */
export function signCreateGroupedOrders(groupingType, orders, nonce, apiKeyIndex, accountIndex) {
  return callWasm("SignCreateGroupedOrders", groupingType, orders, nonce, apiKeyIndex, accountIndex);
}
