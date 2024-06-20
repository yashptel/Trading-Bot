import { configureStore, nanoid } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import localForage from "localforage";
import { encryptTransform } from "redux-persist-transform-encrypt";

const SECRET_KEY = "H6&Xb?$Q4ta9e68EPHkk";

const initialState = {
  currentSettings: {
    apiCredentialId: "",
    exchange: "",
    symbol: "",
  },
  inputState: {
    stopLoss: 0,
    takeProfit: 0,
    lossPerTrade: 0,
  },
  apiCredentials: [],
  temporaryState: {
    isLoading: false,
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
    case "ADD_API_CREDENTIALS":
      return {
        ...state,
        apiCredentials: [
          ...state.apiCredentials,
          {
            ...action.data,
            id: nanoid(),
          },
        ],
      };

    case "DELETE_API_CREDENTIALS":
      return {
        ...state,
        apiCredentials: state.apiCredentials.filter(
          (item) => item.id !== action.id
        ),
      };

    case "SET_IS_LOADING":
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          isLoading: action.payload,
        },
      };

    case "SET_CURRENT_SETTINGS":
      return {
        ...state,
        currentSettings: action.data,
      };

    default:
      return state;
  }
};

const persistedReducer = persistReducer(persistConfig, stateReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);
