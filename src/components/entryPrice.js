import React from "react";
import CustomInput from "./CustomInput";
import CustomCheckbox from "./CustomCheckbox";

const EntryPrice = (props) => {
  return (
    <div>
      <label
        htmlFor="entryPrice"
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      ></label>

      <CustomInput
        type="text"
        name="entryPrice"
        id="entryPrice"
        placeholder="Entry price"
        value={props.value}
        onChange={props.onChange}
        required={true}
      ></CustomInput>

      <CustomCheckbox className="mt-2" id="entryPriceCheckbox">
        Last price
      </CustomCheckbox>
    </div>
  );
};

export default EntryPrice;
