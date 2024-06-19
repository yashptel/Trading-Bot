import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NotFound from "./404";
import App from "./App";
import "./index.css";
import PositionCalculator from "./PositionCalculator";
import Winrate from "./Winrate";
import CopyTrade from "./CopyTrade";

import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { persistor, store } from "./store";
import PositionCalculatorV2 from "./PositionCalculatorV2";
import { ThemeProvider } from "@material-tailwind/react";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <React.StrictMode>
        <ThemeProvider
          value={{
            select: {
              styles: {
                base: {
                  container: {
                    minWidth: "min-w-[100px]",
                  },
                },
              },
            },
            input: {
              styles: {
                base: {
                  container: {
                    minWidth: "min-w-[100px]",
                  },
                },
              },
            },
          }}
        >
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />}>
                <Route
                  path="/"
                  element={<Navigate replace to="/position-calculator-v2" />}
                />
                <Route
                  path="/position-calculator"
                  element={<PositionCalculator />}
                />
                <Route
                  path="/position-calculator-v2"
                  element={<PositionCalculatorV2 />}
                />

                <Route path="/copy-trade" element={<CopyTrade />} />
                <Route path="/winrate" element={<Winrate />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </React.StrictMode>
    </PersistGate>
  </Provider>
);
