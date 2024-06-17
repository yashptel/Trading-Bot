import { combineReducers } from "redux";

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
  temporaryState: {},
};

const stateReducer = (state = initialState, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, counter: state.counter + 1 };
    case "DECREMENT":
      return { ...state, counter: state.counter - 1 };
    case "UPDATE_STATE_FROM_LOCAL_STORAGE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  state: stateReducer,
});

export default rootReducer;
