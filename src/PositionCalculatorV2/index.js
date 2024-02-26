import React from "react";
import { connect } from "react-redux";
import Card from "../components/card";
import CustomInput from "../components/CustomInput";

import { Select } from "flowbite-react";
import config from "../config";
import Dropdown from "../components/dropdown";
import SettingsModal from "../components/settingsModal";

const PositionCalculatorV2 = (props) => {
  console.log("props", props);
  console.log("props", props);
  console.log("props", props.exchange);
  console.log("props", props.exchange);
  console.log("props", props.exchange);
  console.log("props", props.exchange);
  console.log("props", props.exchange);
  console.log("props", props);

  return (
    <section className=" dark:bg-gray-900 lg:mt-auto">
      <Card>
        {/* <Select
          id="countries"
          className="w-36"
          required
          onChange={(e) => {
            props.updateStateFromLocalStorage({
              temporaryState: { isLoading: true },
            });

            setTimeout(() => {
              props.updateStateFromLocalStorage({
                temporaryState: { isLoading: false },
              });
            }, 1500);
            props.updateStateFromLocalStorage({ exchange: e.target.value });
          }}
        >
          {config.exchanges.map((exchange) => {
            return (
              <option
                value={exchange.value}
                selected={exchange.value === props.exchange}
              >
                {exchange.name}
              </option>
            );
          })}
        </Select> */}

        <div div className="w-full flex justify-between">
          <Dropdown
            id="trading-pair"
            options={{
              key: "symbol",
              displayText: "displayName",
              value: "symbol",
              searchKey: "symbol",
            }}
            enableSearch={true}
            selectedOption={props.selectedPair}
            onChange={(row) => {
              props.updateStateFromLocalStorage({ selectedPair: row });
            }}
            dropdownOptions={props.temporaryState?.tradingPairs || []}
          />
          <div className="flex gap-2">
            <Dropdown
              id="trading-exchange"
              options={{
                key: "value",
                displayText: "name",
                value: "value",
                searchKey: "name",
              }}
              selectedOption={props.exchange}
              onChange={(row) => {
                props.updateStateFromLocalStorage({ exchange: row });
              }}
              dropdownOptions={config.exchanges}
            />

            <button
              data-modal-target="settings-modal"
              data-modal-toggle="settings-modal"
              type="button"
              className="text-blue-700   rounded-lg  hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium text-sm p-2.5 text-center inline-flex items-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:focus:ring-blue-800 dark:hover:bg-blue-500"
            >
              <svg
                class="w-6 h-6 text-gray-600 dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"
                />
              </svg>

              {/* <svg
                    class="w-6 h-6 text-gray-600 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                  </svg> */}

              <span className="sr-only">Icon description</span>
            </button>
          </div>
        </div>
        <h1>Position Calculator V2</h1>
        <p>Loss per trade: {props.lossPerTrade}</p>
        <p>Exchange: {props.exchange?.name}</p>
        <CustomInput
          type="text"
          name="lossPerTrade"
          id="lossPerTrade"
          placeholder="Loss per trade"
          value={props.lossPerTrade}
          onChange={(e) =>
            props.updateStateFromLocalStorage({ lossPerTrade: e.target.value })
          }
        />
      </Card>

      <SettingsModal />
    </section>
  );
};

const mapStateToProps = (state) => {
  return {
    lossPerTrade: state.lossPerTrade,
    exchange: state.exchange,
    selectedPair: state.selectedPair,
    apiCredentials: state.apiCredentials,
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PositionCalculatorV2);
