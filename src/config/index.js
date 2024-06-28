import binance_logo from "../assets/images/Binance.svg";
import bybit_logo from "../assets/images/Bybit.svg";
import okx_logo from "../assets/images/OKX.svg";
import mexc_logo from "../assets/images/Mexc.svg";
import woox_logo from "../assets/images/WooX.svg";
import gate_logo from "../assets/images/Gate.io.svg";

export default {
  proxyServer: "https://trade-proxy.vercel.app/v2/proxy",
  // "http://localhost:8000/v2/proxy",
  exchanges: [
    {
      id: "E0GKF97sIEnbz0i1GeFx2",
      name: "Binance",
      value: "binance",
      url: "https://www.binance.com/",
      logo: binance_logo,
      isEnabled: true,
    },
    {
      id: "6Y6brH-PFp8gWe5eLEVEL",
      name: "Bybit",
      value: "bybit",
      url: "https://www.bybit.com/",
      logo: bybit_logo,
      isEnabled: true,
    },
    {
      id: "ya6ETx1_ZyHZ4gT3dgm-v",
      name: "OKX",
      value: "okx",
      url: "https://www.okx.com/",
      logo: okx_logo,
    },
    {
      id: "lSd7NssEYffk-Ah8-e0wJ",
      name: "Mexc",
      value: "mexc",
      url: "https://www.mexc.com/",
      logo: mexc_logo,
      isEnabled: true,
    },
    {
      id: "2zpbkrNf42r8jCZ9iFa8R",
      name: "WooX",
      value: "woox",
      url: "https://www.woo.network/",
      logo: woox_logo,
    },
    {
      id: "_yLRqoBdKYPh1rUR-HNmL",
      name: "Gate.io",
      value: "gate",
      url: "https://www.gate.io/",
      logo: gate_logo,
    },
  ].filter((exchange) => exchange.isEnabled),
};
