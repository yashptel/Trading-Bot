import { configureStore, nanoid } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import localForage from "localforage";
import { encryptTransform } from "redux-persist-transform-encrypt";
import { combineReducers } from "redux";

const SECRET_KEY = "H6&Xb?$Q4ta9e68EPHkk";
const initialState = {
  lossPerTrade: 0,
  exchange: {},
  selectedPair: {},
  apiCredentials: [
    {
      id: nanoid(),
      exchange: "binance",
      accountName: "Main",
      apiKey: "API_KEY",
      secret: "SECRET",
      passphrase: "PASSPHRASE",
    },
    {
      id: nanoid(),
      exchange: "bybit",
      accountName: "Main",
      apiKey: "API_KEY",
      secret: "SECRET",
      passphrase: "PASSPHRASE",
    },
    {
      id: nanoid(),
      exchange: "okx",
      accountName: "Main",
      apiKey: "API_KEY",
      secret: "SECRET",
      passphrase: "PASSPHRASE",
    },
  ],
  temporaryState: {
    isSettingsOpen: false,
    isLoading: false,
    toasts: [],
    exchangeClient: null,
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
  blacklist: ["temporaryState"],
};

const stateReducer = (state = initialState, action) => {
  switch (action.type) {
    case "UPDATE_STATE_FROM_LOCAL_STORAGE":
      return { ...state, ...action.payload };

    case "ADD_API_CREDENTIALS":
      const newData = { ...action.data, id: nanoid() };
      return {
        ...state,
        apiCredentials: [...state.apiCredentials, newData],
      };

    case "REMOVE_API_CREDENTIALS":
      return {
        ...state,
        apiCredentials: state.apiCredentials.filter(
          (item) => item.id !== action.id
        ),
      };

    case "ADD_TOAST":
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          toasts: [
            ...state.temporaryState.toasts,
            { id: nanoid(), ...action.payload },
          ],
        },
      };

    case "REMOVE_TOAST":
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          toasts: state.temporaryState.toasts.filter(
            (item) => item.id !== action.payload.id
          ),
        },
      };

    default:
      return state;
  }
};

const persistedReducer = persistReducer(persistConfig, stateReducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

// export default { store, persistor };
