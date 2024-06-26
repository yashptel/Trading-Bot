import { Input, Option, Select } from "@material-tailwind/react";
import React from "react";
import _ from "lodash";
import { nanoid } from "@reduxjs/toolkit";

const CustomSelect = ({
  showSearch = true,
  showLogo = true,
  selections,
  searchKey = "name",
  nameKey = "name",
  valueKey = "value",
  keyKey = "key",
  logoKey = "logo",
  label = "Select",
  defaultValue,
  onChange = (e) => e,
}) => {
  const [key] = React.useState(nanoid());
  const [filteredSelections, setFilteredSelections] =
    React.useState(selections);
  const [query, setQuery] = React.useState("");

  const [rows, setRows] = React.useState({});

  React.useEffect(() => {
    setRows((prev) => {
      const obj = {};
      _.forEach(selections, (selection) => {
        obj[selection[valueKey]] = (
          <Option
            autoFocus={false}
            key={selection[keyKey]}
            value={selection[valueKey]}
            className="flex items-center gap-2 text-nowrap"
          >
            {showLogo && (
              <img
                src={selection[logoKey]}
                alt={selection[nameKey]}
                className="h-5 w-5 rounded-full object-cover"
              />
            )}
            {selection[nameKey]}
          </Option>
        );
      });
      return obj;
    });
  }, [selections]);

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  /**
   * @param {KeyboardEvent} e
   */
  const handleOnKeyDownCapture = (e) => {
    const regex = /^[a-zA-Z0-9]$/gm;
    if (regex.test(e.key)) {
      e.stopPropagation();
    }
  };

  React.useEffect(() => {
    const queryTerm = _.toLower(query);
    const res = _.filter(selections, (selection) => {
      const term = _.toLower(selection[searchKey]);
      const match = _.includes(term, queryTerm);
      return match;
    });

    setFilteredSelections(res);
  }, [query, selections]);

  React.useEffect(() => {
    if (defaultValue) {
      onChange(defaultValue);
    }
  }, []);

  const [selected, setSelected] = React.useState(defaultValue);

  return (
    <Select
      value={rows[selected] && selected}
      key={key}
      size="lg"
      label={label}
      dismiss={false}
      onChange={(val) => {
        setSelected(val);
        setQuery("");
        onChange(val);
      }}
      selected={(element) =>
        rows[selected] &&
        React.cloneElement(rows[selected], {
          disabled: true,
          className:
            "flex items-center opacity-100 px-0 gap-2 pointer-events-none !bg-transparent",
        })
      }
      menuProps={{
        className: "min-w-fit",
      }}
    >
      {[
        showSearch ? (
          <Input
            key={`search-${key}`}
            autoFocus={false}
            label="Search"
            onChange={handleSearch}
            onKeyDownCapture={handleOnKeyDownCapture}
            value={query}
            containerProps={{
              className: "mb-4 sticky top-0 z-10 bg-white",
            }}
          />
        ) : null,
        ...filteredSelections.map(
          (selection) => rows[selection[valueKey]] || null
        ),
      ].filter((item) => item !== null)}
    </Select>
  );
};

export default CustomSelect;
