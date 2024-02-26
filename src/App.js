import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Outlet } from "react-router-dom";
import "./App.css";
import { COMPANY_NAME } from "./constants";

import { initFlowbite } from "flowbite";
import Footer from "./components/footer";
import Toast from "./components/toast";

import { connect } from "react-redux";

import exchanges from "./trade";
import { store } from "./store";
import _ from "lodash";

const App = (props) => {
  useEffect(() => {
    initFlowbite();
  }, []);

  useEffect(() => {
    const credentials = _.find(
      props?.apiCredentials,
      (item) => item.exchange === props?.exchange.value
    );

    const Client = exchanges[props?.exchange.value];
    if (!Client) {
      return;
    }

    /**
     * @type {import('./trade/exchange').default}
     */
    const client = new exchanges[props?.exchange.value]({
      apiKey: credentials?.apiKey,
      secret: credentials?.secret,
      passphrase: credentials?.passphrase,
    });

    props.updateStateFromLocalStorage({
      temporaryState: {
        exchangeClient: client,
      },
    });

    client.getAllTradingPairs().then((data) => {
      props.updateStateFromLocalStorage({
        temporaryState: {
          tradingPairs: data,
        },
      });

      const selectedTradingPair = _.find(
        data,
        (item) => item.symbol === props?.tradingPair?.symbol
      );

      props.updateStateFromLocalStorage({
        selectedTradingPair,
      });
    });
  }, [props?.exchange]);

  return (
    <div className="min-h-full flex flex-col">
      <Helmet
        title={`Software Development Agency, Product Enginnering & Solutions Company | ${COMPANY_NAME}`}
        meta={[
          {
            name: "description",
            content:
              "Software Development Agency, Product Enginnering & Solutions Company. We are a team of developers who love to create beautiful and functional websites.",
          },
          { name: "keywords", content: "home, page" },
        ]}
      />

      <Outlet />

      <Footer />

      <div
        className="fixed right-0 bottom-0 flex flex-col items-end justify-end px-4 py-6 sm:p-6 sm:items-start sm:justify-end z-50"
        id="toast-container"
      >
        {_.map(props.temporaryState.toasts, ({ id, message, type }) => (
          <Toast
            id={id}
            key={id}
            message={message}
            type={type}
            onClose={() => {
              store.dispatch({
                type: "REMOVE_TOAST",
                payload: { id },
              });
            }}
          ></Toast>
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    exchange: state.exchange,
    temporaryState: state.temporaryState,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateStateFromLocalStorage: (payload) => {
      dispatch({ type: "UPDATE_STATE_FROM_LOCAL_STORAGE", payload });
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
