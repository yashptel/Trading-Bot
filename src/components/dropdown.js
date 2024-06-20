import React from "react";
import _ from "lodash";

const Dropdown = (props) => {
  if (!props.id) {
    console.error(
      "You need to provide a dropdownId prop to the Dropdown component"
    );
  }

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedOption, setSelectedOption] = React.useState(
    props.selectedOption
  );
  const [filteredOptions, setFilteredOptions] = React.useState(
    props.dropdownOptions
  );

  React.useEffect(() => {
    const term = _.replace(searchTerm, /[^a-zA-Z0-9]/g, "");

    const filtered = _.filter(props.dropdownOptions, (row) => {
      return row[props.options.searchKey]
        .toLowerCase()
        .includes(term.toLowerCase());
    });

    setFilteredOptions(filtered);
  }, [searchTerm, props.dropdownOptions]);

  React.useEffect(() => {
    props.onChange && props.onChange(selectedOption);
  }, [selectedOption]);

  React.useEffect(() => {
    const result = _.find(props.dropdownOptions, (row) => {
      return (
        row[props.options.key] === props.selectedOption?.[props.options.key]
      );
    });
    if (result) {
      setSelectedOption(result);
    }

    if (!result && props.dropdownOptions.length > 0) {
      setSelectedOption(props.dropdownOptions[0]);
    }

    props.onChange && props.onChange(selectedOption);
  }, [props.dropdownOptions]);

  return (
    <>
      <button
        id={"dropdown" + props.id}
        data-dropdown-toggle={props.id || "dropdownSearchButton"}
        data-dropdown-placement="bottom"
        className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
      >
        {selectedOption?.[props.options.displayText] || "Select an option"}
        <svg
          className="w-4 h-4 ml-2"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div
        id={props.id || "dropdownSearchButton"}
        className="z-10 hidden bg-white rounded-lg shadow w-60 dark:bg-gray-700"
      >
        {props.enableSearch ? (
          <div className="p-3">
            <label htmlFor="input-group-search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                id="input-group-search"
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Search Pair"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              ></input>
            </div>
          </div>
        ) : (
          <div className="p-2"></div>
        )}

        <ul
          className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
          aria-labelledby="dropdownSearchButton"
        >
          {_.map(filteredOptions, (row) => {
            return (
              <li
                key={row[props.options.key]}
                onClick={() => {
                  setSelectedOption(row);
                  props.onClick && props.onClick(row);
                  const el = document.getElementById("dropdown" + props.id);
                  el && el.click();
                }}
              >
                <div className="flex items-center pl-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                  <label
                    htmlFor="checkbox-item-11"
                    className="w-full py-2 ml-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                  >
                    {row[props.options.displayText]}
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default Dropdown;
