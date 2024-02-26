import Exchange from "./exchange";

class Bybit extends Exchange {
  constructor() {
    super("Bybit");
  }

  buy() {
    console.log("buy on Bybit");
  }

  sell() {
    console.log("sell on Bybit");
  }
}

export default Bybit;
