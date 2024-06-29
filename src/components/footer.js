import React from "react";

const Footer = () => {
  return (
    <>
      <footer className="mt-auto bg-white  dark:bg-gray-900 m-4">
        <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
          <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
          <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
            Made with ♥ by{" "}
            <a
              href="https://squiwo.com/"
              className="hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Squiwo
            </a>
            . All Rights Reserved.
          </span>
        </div>
      </footer>
    </>
  );
};

export default Footer;
