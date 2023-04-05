import React, { useState } from "react";
import NumberFormat from "react-number-format";

const Winrate = () => {
  // const withValueLimit = ({ value }) => {
  //   if (value === "") {
  //     setChance(0);
  //     return false;
  //   }
  //   return Number(value) <= 100;
  // };
  const [acc, setAcc] = useState(0);
  const [rr, setRr] = useState(1);
  const [chance, setChance] = useState(50);
  const [bet, setBet] = useState(0);
  const [iteration, setIteration] = useState(10);
  const [table, setTable] = useState();

  const onAccChange = ({ value }) => {
    setAcc(Number(value));
    return true;
  };

  const onRrChange = ({ value }) => {
    const val = Number(value);
    setRr(val);
    return true;
  };

  const onChanceChange = ({ value }) => {
    const val = Number(value);
    if (val <= 100) {
      setChance(val);
    }
    return val <= 100;
  };

  const onBetChange = ({ value }) => {
    const val = Number(value);
    if (val <= 100) {
      setBet(val);
    }
    return val <= 100;
  };

  const onIterationChange = ({ value }) => {
    const val = Number(value);
    setIteration(val);
    return true;
  };

  const calc = () => {
    let temp = [];
    let tempAcc = acc;
    for (let i = 0; i < iteration; i++) {
      const betAmount = (tempAcc * bet) / 100.0;
      const win = play(chance);
      const winLoss = win ? "Won" : "Lost";
      const Profit = win ? betAmount * rr : -1.0 * betAmount;

      console.log(betAmount, win, winLoss, Profit, tempAcc);
      temp.push(
        <tr key={i}>
          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
            {i + 1}.
          </td>
          {/* <td>{i + 1}</td> */}
          <td className="text-center">{betAmount.toFixed(2)}</td>
          {/* <td>{winLoss}</td> */}
          <td className="px-6 py-4  whitespace-nowrap flex justify-center">
            <span
              className={
                win
                  ? `px-2 inline-flex text-xs leading-5 font-semibold rounded-sm bg-green-100 text-green-800`
                  : `px-2 inline-flex text-xs leading-5 font-semibold rounded-sm bg-red-100 text-red-800`
              }
            >
              {winLoss}
            </span>
          </td>
          <td className="text-center">{Profit.toFixed(2)}</td>
          <td className="text-center">
            {(parseFloat(tempAcc) + parseFloat(Profit)).toFixed(2)}
          </td>
        </tr>
      );
      tempAcc = parseFloat(tempAcc) + parseFloat(Profit);
    }
    setAcc(tempAcc.toFixed(2));
    setTable(temp);
  };

  // function numberFromLocaleString(stringValue, locale) {
  //   var parts = Number(1111.11)
  //     .toLocaleString(locale)
  //     .replace(/\d+/g, "")
  //     .split("");
  //   if (stringValue === null) return null;
  //   if (parts.length === 1) {
  //     parts.unshift("");
  //   }
  //   return Number(
  //     String(stringValue)
  //       .replace(new RegExp(parts[0].replace(/\s/g, " "), "g"), "")
  //       .replace(parts[1], ".")
  //   );
  // }

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
    <div className="w-screen">
      <div className="container flex justify-center max-w-full">
        <div className="container__inp mx-2">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlhtmlFor="acc"
          >
            Account
          </label>
          {/* <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="acc"
            id="acc"
            autoComplete="off"
            value={acc.toLocaleString()}
            onChange={onAccChange}
          /> */}
          <NumberFormat
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            thousandsGroupStyle="thousand"
            value={acc}
            prefix="$"
            decimalSeparator="."
            defaultValue={0}
            isAllowed={onAccChange}
            id="acc"
            type="text"
            thousandSeparator={true}
            allowNegative={false}
            allowLeadingZeros={false}
          />
        </div>
        <div className="container__inp mx-2">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlhtmlFor="rr"
          >
            Risk To Reward Ratio
          </label>
          {/* <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="rr"
            id="rr"
            autoComplete="off"
            value={rr}
            onChange={onRrChange}
          /> */}
          <NumberFormat
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={rr}
            suffix=":1"
            decimalSeparator="."
            defaultValue={0}
            id="rr"
            type="text"
            name="rr"
            isAllowed={onRrChange}
            allowNegative={false}
          />
        </div>
        <div className="container__inp mx-2">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlhtmlFor="chance"
          >
            Win Probability
          </label>
          {/* <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="chance"
            id="chance"
            autoComplete="off"
            value={chance}
            onChange={onChanceChange}
          /> */}
          <NumberFormat
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={chance}
            suffix="%"
            decimalSeparator="."
            defaultValue={0}
            id="chance"
            type="text"
            name="chance"
            isAllowed={onChanceChange}
            allowNegative={false}
          />
        </div>
        <div className="container__inp mx-2">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlhtmlFor="bet"
          >
            Bet Amount
          </label>
          {/* <input
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="bet"
            id="bet"
            autoComplete="off"
            value={bet}
            onChange={onBetChange}
          /> */}
          <NumberFormat
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={bet}
            suffix="%"
            decimalSeparator="."
            defaultValue={0}
            id="bet"
            type="text"
            name="bet"
            isAllowed={onBetChange}
            allowNegative={false}
          />
        </div>
        <div className="container__inp mx-2">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlhtmlFor="iteration"
          >
            Iterations
          </label>
          {/* <input
            className="shadow appearance-none border rounded hover:border-gray-900  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="iteration"
            value={iteration}
            id="iteration"
            onChange={onIterationChange}
          /> */}
          <NumberFormat
            className="shadow appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={iteration}
            defaultValue={1}
            id="iteration"
            type="text"
            name="iteration"
            isAllowed={onIterationChange}
            allowNegative={false}
          />
        </div>
        <div className="container__btn flex items-end justify-center mx-3">
          <button
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded text-sm font-medium text-gray-50 bg-gray-900 hover:bg-gray-700"
            type="submit"
            onClick={calc}
          >
            Calculate
          </button>
          <button
            className="flex items-center justify-center mx-4 my-2 border border-transparent text-sm font-medium text-gray-900 hover:underline"
            type="reset"
            onClick={() => setTable()}
          >
            Reset
          </button>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="table-container mt-8">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Iteration
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Bet
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Win/Loss
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Profit
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Account
                        </th>
                      </tr>
                    </thead>
                    <tbody>{table}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Winrate;





