import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Outlet } from "react-router-dom";
import "./App.css";
import { COMPANY_NAME } from "./constants";

import { initFlowbite } from "flowbite";
import Footer from "./components/footer";
import { Alert, Button } from "@material-tailwind/react";
import Settings from "./components/Settings";

const App = () => {
  useEffect(() => {
    initFlowbite();
  }, []);

  const [open, setOpen] = React.useState(true);

  return (
    <div className="min-h-full flex flex-col">
      <Helmet
        title={`Software Development Agency, Product Enginnering & Solutions Company | ${COMPANY_NAME}`}
        meta={[
          {
            name: "description",
            content:
              "Software Development Agency, Product Enginnering & Solutions Company. We are a team of developers who love to create beautiful and functional websites.",
          },
          { name: "keywords", content: "home, page" },
        ]}
      />

      <Outlet />

      <Footer />

      <Settings />

      <div className="fixed bottom-6 right-4 w-80 space-y-4">
        <Alert
          className=""
          animate={{
            mount: { x: 0 },
            unmount: { x: 100 },
          }}
        >
          A dismissible alert with custom animation.
        </Alert>
        <Alert
          className=""
          open={open}
          onClose={() => setOpen(false)}
          animate={{
            mount: { y: 0 },
            unmount: { y: 100 },
          }}
        >
          A dismissible alert with custom animation.
        </Alert>
        <Alert
          className=""
          open={false}
          onClose={() => setOpen(false)}
          animate={{
            mount: { y: 0 },
            unmount: { y: 100 },
          }}
        >
          A dismissible alert with custom animation.
        </Alert>
      </div>
    </div>
  );
};

export default App;
