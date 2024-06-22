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

  return (
    <Select
      value={defaultValue}
      key={key}
      size="lg"
      label={label}
      dismiss={false}
      onChange={onChange}
      selected={(element) =>
        element &&
        React.cloneElement(element, {
          disabled: true,
          className:
            "flex items-center opacity-100 px-0 gap-2 pointer-events-none",
        })
      }
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
              className: "mb-4",
            }}
          />
        ) : null,
        ...filteredSelections.map((s) => (
          <Option
            onKeyDownCapture={handleOnKeyDownCapture}
            autoFocus={false}
            key={s[keyKey]}
            value={s[valueKey]}
            className="flex items-center gap-2"
          >
            {showLogo && (
              <img
                src={s[logoKey]}
                alt={s[nameKey]}
                className="h-5 w-5 rounded-full object-cover"
              />
            )}
            {s[nameKey]}
          </Option>
        )),
      ].filter((item) => item !== null)}
    </Select>
  );
};

export default CustomSelect;
