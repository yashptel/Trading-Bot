import React from "react";
import { Spinner } from "flowbite-react";
import { connect } from "react-redux";

const Card = (props) => {
  return (
    <div className="container flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0">
      <div className="w-full bg-white rounded-lg border shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700 relative">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8 ">
          {props.children}
        </div>
        {/* loader */}
        {props.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-[0.01] rounded-lg bg-gray-600 backdrop-blur-sm">
            <Spinner
              theme={{
                color: {
                  info: "fill-primary-500",
                },
              }}
              size="lg"
              aria-label="Default status example"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    isLoading: !!state.temporaryState.isLoading,
  };
};

export default connect(mapStateToProps)(Card);
