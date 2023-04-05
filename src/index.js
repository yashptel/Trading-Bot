import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFound from "./404";
import App from "./App";
import "./index.css";
import PositionCalculator from "./PositionCalculator";
import Winrate from "./Winrate";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/position-calculator" element={<PositionCalculator />} />
          <Route path="/winrate" element={<Winrate />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
