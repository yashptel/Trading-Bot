import { Input, Option, Select } from "@material-tailwind/react";
import React from "react";
import _ from "lodash";
import { nanoid } from "@reduxjs/toolkit";

const CustomSelectTest = ({
  showSearch = true,
  showLogo = true,
  selections,
  searchKey = "name",
  nameKey = "name",
  valueKey = "value",
  keyKey = "key",
  logoKey = "logo",
  label = "Select",
  key = nanoid(),
}) => {
  let [key2, setKey] = React.useState(key + "-" + nanoid());
  const [query, setQuery] = React.useState("");
  const [filteredSelections, setFilteredSelections] =
    React.useState(selections);

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
      const term = _.toLower(selection.name);
      const match = _.includes(term, queryTerm);
      return match;
    });

    setFilteredSelections(res);
  }, [query, selections]);

  return (
    <Select
      key={key2}
      size="lg"
      label="Select Exchange root"
      onChange={(e) => {
        return e;
      }}
      dismiss={false}
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
        <Input
          key="search-input"
          autoFocus={true}
          label="Search"
          onChange={handleSearch}
          onKeyDownCapture={handleOnKeyDownCapture}
          value={query}
          containerProps={{
            className: "mb-4",
          }}
        />,
        ...filteredSelections.map((s) => (
          <Option
            onKeyDownCapture={handleOnKeyDownCapture}
            autoFocus={false}
            key={s.id}
            value={s.name}
            className="flex items-center gap-2"
          >
            {showLogo && (
              <img
                src={s.logo}
                alt={s.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            )}
            {s.name}
          </Option>
        )),
      ]}
    </Select>
  );
};

export default CustomSelectTest;
