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
  Select,
  Option,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Chip,
} from "@material-tailwind/react";
import CustomSelect from "../components/CustomSelect";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "usehooks-ts";
import getTradeInstance from "../trade";

const PositionCalculatorV2 = ({
  isLoading,
  setIsLoading,
  setCurrentSettingsModal,

  exchangeId,
  setExchangeId,

  tradingPair,
  setTradingPair,
}) => {
  const [useMarketOrder, setUseMarketOrder] = React.useState(true);
  const [useMarketPrice, setUseMarketPrice] = React.useState(true);

  const [marketPrice, setMarketPrice] = React.useState(0);
  const [price, setPrice] = React.useState(0);

  const [value, copy] = useCopyToClipboard();
  const [copied, setCopied] = React.useState(false);

  const [tradingPairs, setTradingPairs] = React.useState([]);

  const data = [
    {
      label: "Manual TP",
      value: "manual",
    },
    {
      label: "Based on RR",
      value: "rr",
    },
  ];

  useEffect(() => {
    let cancelled = false;
    const client = getTradeInstance(exchangeId);
    if (!client) return;

    client.getAllTradingPairs().then((res) => {
      if (cancelled) return;
      setTradingPairs(res);
    });

    return () => {
      cancelled = true;
    };
  }, [exchangeId]);

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
    <section className=" dark:bg-gray-900 lg:mt-auto ">
      <Card className="w-full max-w-[26rem] shadow-lg mx-auto relative">
        <div
          className={`flex justify-center items-center rounded-xl absolute top-0 right-0 left-0 bottom-0 z-50 backdrop-blur-sm transition-all duration-300 ${
            isLoading ? "opacity-100 visible`" : "opacity-0 invisible"
          }`}
        >
          <Spinner className="h-8 w-8" />
        </div>
        <CardBody className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between gap-2 mb-8 md:mb-10">
            <CustomSelect
              defaultValue={exchangeId}
              onChange={(val) => setExchangeId(val)}
              showSearch={false}
              key="exchange-select"
              label="Select Exchange"
              selections={config.exchanges}
              keyKey="id"
              valueKey="id"
            ></CustomSelect>

            <CustomSelect
              showSearch={true}
              defaultValue={tradingPair}
              onChange={(val) => setTradingPair(val)}
              key="pair-select"
              label="Select Pair"
              showLogo={false}
              selections={tradingPairs}
              nameKey="displayName"
              searchKey="searchName"
              valueKey="searchName"
              keyKey="originalSymbol"
            ></CustomSelect>

            <IconButton
              variant="outlined"
              className="w-28"
              size="md"
              onClickCapture={(e) => {
                setCurrentSettingsModal(true);
              }}
            >
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

          <div className="!-mb-1 md:!-mb-1">
            <div className="relative">
              <Input
                size="lg"
                label="Limit Price"
                disabled={useMarketOrder}
                onChange={(e) => {
                  if (!useMarketOrder) {
                    setPrice(e.target.value);
                  }
                }}
                onFocusCapture={(e) => setUseMarketPrice(false)}
                type="text"
                value={price}
              />
              <Button
                size="md"
                color={true ? "gray" : "blue-gray"}
                disabled={useMarketOrder}
                className="!absolute right-1 top-1 rounded h-9 flex items-center"
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

          <div className="flex flex-grow gap-2">
            <Input size="lg" label="Limit Price" type="text" />
            <div className="w-full">
              <Input size="lg" label="Limit Price" type="text" />

              <Tabs value="manual">
                <TabsHeader className="text-nowrap h-8 text-sm flex mt-4">
                  {data.map(({ label, value }) => (
                    <Tab key={value} value={value} className="text-xs">
                      {label}
                    </Tab>
                  ))}
                </TabsHeader>
              </Tabs>
            </div>
          </div>

          <div>
            <Input
              size="lg"
              label="Limit Price"
              onFocusCapture={(e) => setUseMarketPrice(false)}
              type="text"
            />
            <div className="flex gap-2 mt-2">
              {[1, 3, 5, 6, 8, 9].map((i) => {
                return (
                  <Chip
                    variant="outlined"
                    value={`$${i}`}
                    size="sm"
                    className="h-5 py-0 font-normal text-[0.8rem] border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 ease-in-out cursor-pointer active:bg-gray-200 dark:checked:bg-gray-700"
                  />
                );
              })}
            </div>
          </div>

          <div className="relative flex w-full">
            <Input
              size="lg"
              label="Limit Price"
              onFocusCapture={(e) => setUseMarketPrice(false)}
              type="text"
              containerProps={{
                className: "",
              }}
            />

            <IconButton
              size="md"
              className="!absolute right-1 top-1 rounded h-9 flex items-center"
              onMouseLeave={() =>
                setTimeout(() => copied && setCopied(false), 1000)
              }
              onClick={() => {
                copy("npm i @material-tailwind/react");
                setCopied(true);
              }}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-white" />
              ) : (
                <DocumentDuplicateIcon className="h-4 w-4 text-white" />
              )}
            </IconButton>
          </div>
        </CardBody>
        <CardFooter className="pt-3 ">
          <div className="flex gap-4">
            <Button
              size="lg"
              color="green"
              fullWidth={true}
              onClickCapture={(e) => {
                setIsLoading(true);

                setTimeout(() => {
                  setIsLoading(false);
                }, 3000);
              }}
            >
              Long
            </Button>

            <Button
              size="lg"
              color="red"
              fullWidth={true}
              onClickCapture={(e) => {
                setIsLoading(true);

                setTimeout(() => {
                  setIsLoading(false);
                }, 3000);
              }}
            >
              Short
            </Button>
          </div>
        </CardFooter>
      </Card>

      <SettingsModal />
    </section>
  );
};

const mapStateToProps = (state) => {
  return {
    isLoading: state.temporaryState.isLoading,
    exchangeId: state.currentSettings.exchangeId,
    tradingPair: state.currentSettings.tradingPair,
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

    setCurrentSettingsModal: (payload) => {
      dispatch({ type: "SET_CURRENT_SETTINGS_MODAL", payload });
    },

    setExchangeId: (payload) => {
      dispatch({ type: "SET_EXCHANGE_ID", payload });
    },

    setTradingPair: (payload) => {
      dispatch({ type: "SET_TRADING_PAIR", payload });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PositionCalculatorV2);
