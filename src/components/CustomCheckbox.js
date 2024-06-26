import React from "react";
import { Checkbox, Label } from "flowbite-react";

const CustomCheckbox = (props) => {
  return (
    <div className={"flex items-center gap-2 " + (props.className || "")}>
      <Checkbox
        theme={{
          root: {
            color: {
              default: "primary-500",
            },
          },
        }}
        id={props.id}
      />
      <Label htmlFor={props.id} className="flex">
        {props.children}
      </Label>
    </div>
  );
};

export default CustomCheckbox;
