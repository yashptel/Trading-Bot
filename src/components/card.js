import React from "react";

const Card = (props) => {
  return (
    <div className="container flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0">
      <div className="w-full bg-white rounded-lg border shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default Card;
