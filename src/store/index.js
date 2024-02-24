import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import localForage from "localforage";
import { encryptTransform } from "redux-persist-transform-encrypt";

const SECRET_KEY = "H6&Xb?$Q4ta9e68EPHkk";
const initialState = {
  lossPerTrade: 0,
  exchange: "Binance",
  selectedPair: {},
  apiCredentials: {
    binance: {
      key: "",
      secret: "",
    },
    bybit: {
      key: "",
      secret: "",
    },
    okx: {
      key: "",
      secret: "",
      passphrase: "",
    },
  },
};

const persistConfig = {
  key: "state",
  storage: localForage,
  transforms: [
    encryptTransform({
      secretKey: SECRET_KEY,
      onError: function (error) {
        console.error("redux-persist-transform-encrypt error", error);
      },
    }),
  ],
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "UPDATE_STATE_FROM_LOCAL_STORAGE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

// export default { store, persistor };
