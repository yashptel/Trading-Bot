import React, { useEffect } from "react";
import { connect } from "react-redux";

import config from "../config";
import SettingsModal from "../components/settingsModal";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  IconButton,
  Spinner,
  Input,
  Tabs,
  TabsHeader,
  Tab,
  TabsBody,
  TabPanel,
  Checkbox,
} from "@material-tailwind/react";
import CustomSelect from "../components/CustomSelect";

const PositionCalculatorV2 = ({ isLoading, setIsLoading }) => {
  const [useMarketOrder, setUseMarketOrder] = React.useState(true);
  const [useMarketPrice, setUseMarketPrice] = React.useState(true);

  const [marketPrice, setMarketPrice] = React.useState(0);
  const [price, setPrice] = React.useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const randomPrice = Math.floor(Math.random() * 100000);
      setMarketPrice(randomPrice);
    }, 100);

    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (useMarketOrder || useMarketPrice) {
      setPrice(marketPrice);
    }
  }, [marketPrice, useMarketOrder, useMarketPrice]);

  return (
    <section className=" dark:bg-gray-900 lg:mt-auto">
      <Card className="w-full max-w-[28rem] shadow-lg mx-auto relative">
        <div
          className={`flex justify-center items-center rounded-xl absolute top-0 right-0 left-0 bottom-0 z-50 backdrop-blur-sm transition-all duration-300 ${
            isLoading ? "opacity-100 visible`" : "opacity-0 invisible"
          }`}
        >
          <Spinner className="h-8 w-8" />
        </div>
        <CardBody>
          <div className="flex items-center justify-between gap-2">
            <CustomSelect
              key="exchange-select"
              label="Select Exchange"
              selections={config.exchanges}
              keyKey="id"
            ></CustomSelect>

            <CustomSelect
              key="pair-select"
              label="Select Pair"
              showLogo={false}
              selections={[
                { name: "BTC/USDT", value: "BTCUSDT", id: "BTCUSDT" },
                { name: "ETH/USDT", value: "ETHUSDT", id: "ETHUSDT" },
              ]}
              keyKey="id"
            ></CustomSelect>

            <IconButton variant="outlined" className="w-24" size="md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                enable-background="new 0 0 24 24"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <g>
                  <path d="M0,0h24v24H0V0z" fill="none" />
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                </g>
              </svg>
            </IconButton>
          </div>

          <div>
            <div className="relative">
              <Input
                label="Limit Price"
                disabled={useMarketOrder}
                onChange={(e) => {
                  if (!useMarketOrder) {
                    setPrice(e.target.value);
                  }
                }}
                onFocusCapture={(e) => setUseMarketPrice(false)}
                type="text"
                containerProps={{
                  className: "mt-4",
                }}
                value={price}
              />
              <Button
                size="sm"
                color={true ? "gray" : "blue-gray"}
                disabled={useMarketOrder}
                className="!absolute right-1 top-1 rounded"
                onClick={(e) => setUseMarketPrice(true)}
              >
                Sync
              </Button>
            </div>
            <Checkbox
              checked={useMarketOrder}
              onChange={(e) => {
                setUseMarketOrder(e.target.checked);

                if (e.target.checked) {
                  setUseMarketPrice(true);
                }
              }}
              label="Use Market Order"
              containerProps={{
                className: "-ml-2 -mr-2",
              }}
            />
          </div>
          {/* <div>
            {useMarketOrder ? (
              <div className="relative">
                <Input
                  label="Last Price"
                  disabled={true}
                  type="text"
                  containerProps={{
                    className: "mt-4",
                  }}
                  value={price}
                />
                <Button
                  size="sm"
                  color={true ? "gray" : "blue-gray"}
                  disabled={!true}
                  className="!absolute right-1 top-1 rounded"
                >
                  Sync
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  label="Manual Price"
                  placeholder="Enter Manual Price"
                  type="text"
                  containerProps={{
                    className: "mt-4",
                  }}
                  onFocusCapture={(e) => setUseMarketPrice(false)}
                  onChangeCapture={(e) => setLimitPrice(e.target.value)}
                  value={limitPrice}
                />
                <Button
                  size="sm"
                  color={true ? "gray" : "blue-gray"}
                  disabled={true}
                  className="!absolute right-1 top-1 rounded"
                >
                  Sync
                </Button>
              </div>
            )}

            <Checkbox
              checked={useMarketOrder}
              onChange={(e) => {
                setUseMarketOrder(e.target.checked);

                if (e.target.checked) {
                  setUseMarketPrice(true);
                }
              }}
              size={"sm"}
              label="Use Market Order"
              containerProps={{
                className: "-ml-2 -mr-2",
              }}
            />
          </div> */}
        </CardBody>
        <CardFooter className="pt-3">
          <Button
            size="lg"
            fullWidth={true}
            onClickCapture={(e) => {
              setIsLoading(true);

              setTimeout(() => {
                setIsLoading(false);
              }, 3000);
            }}
          >
            Reserve
          </Button>
        </CardFooter>
      </Card>

      <SettingsModal />
    </section>
  );
};

const mapStateToProps = (state) => {
  return {
    isLoading: state.temporaryState.isLoading,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateStateFromLocalStorage: (payload) => {
      // dispatch({ type: "UPDATE_STATE_FROM_LOCAL_STORAGE", payload });
    },

    setIsLoading: (payload) => {
      dispatch({ type: "SET_IS_LOADING", payload });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PositionCalculatorV2);
