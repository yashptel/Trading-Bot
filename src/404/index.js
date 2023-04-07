import React from "react";
import { Helmet } from "react-helmet";
import { COMPANY_NAME } from "../constants";
import "./styles.css";

function NotFound() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen  md:mb-8 flex-col text-center 2xl:text-left 2xl:flex-row">
      <Helmet
        title={`404 - Page not found | ${COMPANY_NAME}`}
        meta={[
          { name: "description", content: "Page not found" },
          { name: "keywords", content: "404, page, not found" },
        ]}
      />
      <section className="bg-white dark:bg-gray-900">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-sm">
            <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
              404
            </h1>
            <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
              Something&apos;s wrong
            </p>
            <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
              Don&apos;t worry. Early man took hundreds of thousands of years to
              figure out what to do here. But you don&apos;t need to ;)
            </p>
            <p className="mb-8 text-lg font-light text-gray-500 dark:text-gray-400">
              You&apos;ll find lots to explore on the home page.{" "}
            </p>
            <a
              href="/"
              className="py-3 px-10 lg:px-8 xl:px-10 inline-flex items-center justify-center text-center text-black text-base border border-black rounded-md hover:bg-black hover:border-black hover:text-white transition"
            >
              Take me Home
            </a>
          </div>
        </div>
      </section>

      <div className="sketch pb-[15px] hide-narrow-screen scale-50 md:scale-75 lg:scale-100">
        <div className="custom-container">
          <div className="ground" />
          <div className="wheel">
            <span className="wheel-3d" />
            <span className="wheel-patch" />
            <span className="wheel-patch" />
            <span className="wheel-patch" />
            <span className="wheel-patch" />
            <span className="wheel-patch" />
          </div>
          <div className="caveman">
            <div className="leg">
              <div className="foot">
                <div className="fingers" />
              </div>
            </div>
            <div className="leg">
              <div className="foot">
                <div className="fingers" />
              </div>
            </div>
            <div className="hand--right" />
            <div className="body">
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
              <span className="wear-tear" />
            </div>
            <div className="head">
              <div className="eyes-container">
                <span className="eye" />
                <span className="eye" />
              </div>
              <div className="ear">
                <span className="ear-canal" />
              </div>
              <div className="nose" />
              <div className="mouth">
                <div className="teeth" />
                <div className="teeth" />
                <div className="tongue" />
              </div>
            </div>
            <div className="hand" />
            <span className="fist" />

            <div className="branch">
              <span className="hole" />
              <span className="hole" />
              <span className="hole" />
              <span className="hole" />
              <span className="hole" />
              <span className="hole" />
              <div className="twig">
                <span className="leaf" />
                <span className="leaf" />
              </div>
            </div>
            <div className="hand--left" />
            <div className="hand--right-partTwo">
              <div className="fist" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
