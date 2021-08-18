import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [acc, setAcc] = useState(0);
  const [rr, setRr] = useState(1);
  const [chance, setChance] = useState(50);
  const [bet, setBet] = useState(0);
  const [iteration, setIteration] = useState(10);
  const [table, setTable] = useState();

  const onAccChange = (e) => {
    if (isNaN(e.target.value)) return;
    setAcc(e.target.value);
  };

  const onRrChange = (e) => {
    console.log("works works");
    if (isNaN(e.target.value) || Number(e.target.value) < 0) return;
    setRr(e.target.value);
  };

  const onChanceChange = (e) => {
    if (
      isNaN(e.target.value) ||
      !(0 <= Number(e.target.value) && Number(e.target.value) <= 100)
    )
      return;
    setChance(e.target.value);
  };

  const onBetChange = (e) => {
    if (
      isNaN(e.target.value) ||
      !(0 <= Number(e.target.value) && Number(e.target.value) <= 100)
    )
      return;
    setBet(e.target.value);
  };

  const onIterationChange = (e) => {
    if (isNaN(e.target.value)) return;
    setIteration(Math.floor(Number(e.target.value)));
  };

  const calc = () => {
    let temp = [];
    for (let i = 0; i < iteration; i++) {
      const betAmount = (acc * bet) / 100.0;
      const win = play(chance);
      const winLoss = win ? "Won" : "Lost";
      const Profit = win ? betAmount * rr : -1.0 * betAmount;

      console.log(betAmount, win, winLoss, Profit, acc);
      temp.push(
        <tr key={i}>
          <td>{i + 1}</td>
          <td>{betAmount}</td>
          <td>{winLoss}</td>
          <td>{Profit}</td>
          <td>{parseFloat(acc) + parseFloat(Profit)}</td>
        </tr>
      );
      setAcc(parseFloat(acc) + parseFloat(Profit));
    }
    setTable(temp);
  };

  // <th>Iteration</th>
  // <th>Bet</th>
  // <th>Win/Loss</th>
  // <th>Profit</th>
  // <th>Account</th>
  const play = (odds) => {
    const num = Math.random() * 101;
    return num <= odds;
  };

  return (
    <div>
      <div className="container">
        <div className="container__inp">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="acc"
          >
            Account
          </label>
          <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="acc"
            id="acc"
            value={acc}
            onChange={onAccChange}
          />
        </div>
        <div className="container__inp">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="rr"
          >
            Risk To Reward Ratio
          </label>
          <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="rr"
            id="rr"
            value={rr}
            onChange={onRrChange}
          />
        </div>
        <div className="container__inp">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="chance"
          >
            Win Probability
          </label>
          <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="chance"
            id="chance"
            value={chance}
            onChange={onChanceChange}
          />
        </div>
        <div className="container__inp">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="bet"
          >
            Bet Amount
          </label>
          <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="bet"
            id="bet"
            value={bet}
            onChange={onBetChange}
          />
        </div>
        <div className="container__inp">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="iteration"
          >
            Iterations
          </label>
          <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="iteration"
            value={iteration}
            id="iteration"
            onChange={onIterationChange}
          />
        </div>
      </div>
      <button
        className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-2 md:text-lg md:px-6"
        type="submit"
        onClick={calc}
      >
        Calculate
      </button>
      <button
        className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-2 md:text-lg md:px-6"
        type="reset"
      >
        Reset
      </button>
      <div className="table-container">
        <table>
          <tbody>
            <tr>
              <th>Iteration</th>
              <th>Bet</th>
              <th>Win/Loss</th>
              <th>Profit</th>
              <th>Account</th>
            </tr>
            {table}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
