import React from "react";
import { connect } from "react-redux";
import Card from "../components/card";
import CustomInput from "../components/CustomInput";

import { Select } from "flowbite-react";
import config from "../config";

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
        <h1>Position Calculator V2</h1>
        <p>Loss per trade: {props.lossPerTrade}</p>
        <p>Exchange: {props.exchange}</p>

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

        <Select
          id="countries"
          className="w-36"
          required
          onChange={(e) =>
            props.updateStateFromLocalStorage({ exchange: e.target.value })
          }
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
        </Select>
      </Card>
    </section>
  );
};

const mapStateToProps = (state) => {
  return {
    lossPerTrade: state.lossPerTrade,
    exchange: state.exchange,
    selectedPair: state.selectedPair,
    apiCredentials: state.apiCredentials,
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
