import React from "react";
import PropTypes from "prop-types";

function CustomInput(props) {
  return (
    <input
      type={props.type || "text"}
      name={props.name}
      id={props.id}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
      placeholder={props.placeholder}
      onChange={props.onChange}
      value={props.value}
      required={props.required}
    ></input>
  );
}

export default CustomInput;
