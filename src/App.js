import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Outlet } from "react-router-dom";
import "./App.css";
import { COMPANY_NAME } from "./constants";

import Footer from "./components/footer";
import { Alert, Button } from "@material-tailwind/react";
import Settings from "./components/Settings";
import { connect } from "react-redux";

const App = ({ dynamicElements, incrementVisibilityChange }) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        incrementVisibilityChange();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <Helmet
        title={`Trading Bot | ${COMPANY_NAME}`}
        meta={[
          {
            name: "description",
            content:
              "Trading Bot is a platform that allows you to automate your trading strategies on multiple exchanges.",
          },
          { name: "keywords", content: "home, page" },
        ]}
      />

      <Outlet />

      <Footer />

      {dynamicElements
        .filter(({ type }) => type !== "toast")
        .map(({ component }) => component)}

      <div className="fixed bottom-6 right-4 w-80 space-y-4">
        {dynamicElements
          .filter(({ type }) => type === "toast")
          .map(({ component }) => component)}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    isLoading: state.temporaryState.isLoading,
    exchangeId: state.currentSettings.exchangeId,
    tradingPair: state.currentSettings.tradingPair,
    dynamicElements: state.temporaryState.dynamicElements,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setIsLoading: (payload) => {
      dispatch({ type: "SET_IS_LOADING", payload });
    },

    setCurrentSettingsModal: (payload) => {
      dispatch({ type: "SET_CURRENT_SETTINGS_MODAL", payload });
    },

    setExchangeId: (payload) => {
      dispatch({ type: "SET_EXCHANGE_ID", payload });
    },

    setTradingPair: (payload) => {
      dispatch({ type: "SET_TRADING_PAIR", payload });
    },

    incrementVisibilityChange: () => {
      dispatch({ type: "SET_VISIBILITY_CHANGE" });
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
