const withMT = require("@material-tailwind/react/utils/withMT");

/** @type {import('tailwindcss').Config} */
module.exports = withMT({
  theme: {
    extend: {},
  },
  plugins: [],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
});
