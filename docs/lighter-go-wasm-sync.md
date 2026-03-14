# Syncing `lighter-go` WASM

The WASM binary (`public/lighter-signer.wasm`) and runtime shim (`public/wasm_exec.js`) are compiled from the [`lighter-go`](https://github.com/elliottech/lighter-go) repository. When Lighter.xyz ships a new SDK version you should rebuild them.

## Prerequisites

- [Go](https://go.dev/dl/) ≥ 1.21 installed
- `git` installed

## Steps

### 1. Pull the latest `lighter-go`

```bash
git clone https://github.com/elliottech/lighter-go /tmp/lighter-go
# or, if already cloned:
cd /tmp/lighter-go && git pull
```

### 2. Vendor dependencies

```bash
cd /tmp/lighter-go
go mod vendor
```

### 3. Compile the WASM binary

```bash
GOOS=js GOARCH=wasm go build -trimpath -o ./build/lighter-signer.wasm ./wasm/
```

### 4. Copy the artefacts into this repo

```bash
# compiled wasm binary
cp ./build/lighter-signer.wasm /path/to/Trading-Bot/public/lighter-signer.wasm

# Go runtime shim (must match the Go version used to compile)
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" /path/to/Trading-Bot/public/wasm_exec.js
```

### 5. Check for API changes in `wasm/main.go`

Open `/tmp/lighter-go/wasm/main.go` and verify that the signatures of the functions we call are unchanged:

| Function | Expected signature |
|---|---|
| `CreateClient` | `url, privateKey, chainId, apiKeyIndex, accountIndex` |
| `CreateAuthToken` | `deadline, apiKeyIndex, accountIndex` |
| `SignCreateGroupedOrders` | `groupingType, ordersArray, nonce, apiKeyIndex, accountIndex` |

Each order object in `ordersArray` must have these integer fields:

```
MarketIndex, ClientOrderIndex, BaseAmount, Price, IsAsk, Type,
TimeInForce, ReduceOnly, TriggerPrice, OrderExpiry,
IntegratorAccountIndex, IntegratorTakerFee, IntegratorMakerFee
```

If any signatures changed, update `src/trade/lighter.js` (the call sites) and `src/trade/lighterWasm.js` (the wrapper) accordingly.

### 6. Return values

`SignCreateGroupedOrders` returns a **camelCase** object:

```js
{ txType: number, txInfo: string, txHash: string }
```

Note: the URL body fields use snake_case (`tx_type`, `tx_info`) when posting to `/api/v1/sendTx`, so we map them manually.

### 7. Test

1. `npm run dev`
2. Select Lighter in the exchange dropdown.
3. Add credentials: **API Key** = private key hex, **API Secret** = account index, **API Passphrase** = API key index.
4. Select a market, wait for the price to populate, and submit a small test order on testnet.
