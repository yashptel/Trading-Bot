import React, { useEffect } from "react";
import { connect } from "react-redux";

import config from "../config";
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

import getTradeInstance from "../trade";
import Settings from "../components/Settings";
import { nanoid } from "@reduxjs/toolkit";
import {
  calcPositionSize,
  calcRiskReward,
  calcTakeProfit,
  inputHandlerNumber,
  roundToSamePrecisionWithCallback,
} from "../Utils";
import _ from "lodash";
import CustomAlert from "../components/CustomAlert";

const PositionCalculatorV2 = ({
  isLoading,
  setIsLoading,
  setCurrentSettingsModal,

  exchangeId,
  setExchangeId,

  tradingPair,
  setTradingPair,

  addDynamicElement,
  removeDynamicElement,

  apiCredentials,
  visibilityChange,
}) => {
  const [useMarketOrder, setUseMarketOrder] = React.useState(true);
  const [useMarketPrice, setUseMarketPrice] = React.useState(true);

  const [marketPrice, setMarketPrice] = React.useState(0);
  const [price, setPrice] = React.useState(0);
  const [stopLoss, setStopLoss] = React.useState(0);
  const [takeProfit, setTakeProfit] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState("manual");
  const [lossPerTrade, setLossPerTrade] = React.useState(0);
  const [riskRewardRatio, setRiskRewardRatio] = React.useState(0);

  const [positionSize, setPositionSize] = React.useState(0);
  const [positionAmount, setPositionAmount] = React.useState(0);

  const [copied, setCopied] = React.useState(false);

  const [tradingPairs, setTradingPairs] = React.useState([]);

  const [tradingPairObj, setTradingPairObj] = React.useState();

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

  async function copyToClipboard(textToCopy) {
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // Use the 'out of viewport hidden text area' trick
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;

      // Move textarea out of the viewport so it's not visible
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";

      document.body.prepend(textArea);
      textArea.select();

      try {
        document.execCommand("copy");
      } catch (error) {
        console.error(error);
      } finally {
        textArea.remove();
      }
    }
  }

  // const addToast = ({ type = "generic", message = "" }) => {
  //   const modalId = nanoid();

  //   const removeModal = () => {
  //     setTimeout(() => {
  //       removeDynamicElement(modalId);
  //     }, 300);
  //   };

  //   addDynamicElement({
  //     id: modalId,
  //     type: "toast",
  //     component: (
  //       <CustomAlert onClose={removeModal} type={type}>
  //         {message}
  //       </CustomAlert>
  //     ),
  //   });
  // };

  const addToast = React.useCallback(({ type = "generic", message = "" }) => {
    const modalId = nanoid();

    const removeModal = () => {
      setTimeout(() => {
        removeDynamicElement(modalId);
      }, 300);
    };

    addDynamicElement({
      id: modalId,
      type: "toast",
      component: (
        <CustomAlert key={modalId} onClose={removeModal} type={type}>
          {message}
        </CustomAlert>
      ),
    });
  }, []);

  const takeTrade = React.useCallback(
    async (args) => {
      const apiCredential = _.find(apiCredentials, { exchangeId });
      if (!apiCredential) {
        addToast({
          type: "error",
          message: "Failed to take trade. API Credential not found",
        });
        return;
      }

      const client = getTradeInstance(exchangeId, {
        apiKey: apiCredential.apiKey,
        secret: apiCredential.secretKey,
        passphrase: apiCredential.passphrase,
      });
      if (!client) {
        addToast({
          type: "error",
          message: "Failed to take trade. Client not supported",
        });
        return;
      }

      const { success, message } = await client.takeTrade(args);

      const modalId = nanoid();

      const removeModal = () => {
        setTimeout(() => {
          removeDynamicElement(modalId);
        }, 300);
      };

      addDynamicElement({
        id: modalId,
        type: "toast",
        component: (
          <CustomAlert
            onClose={removeModal}
            type={success ? "success" : "error"}
          >
            {message}
          </CustomAlert>
        ),
      });
    },

    [apiCredentials, exchangeId]
  );

  useEffect(() => {
    let cancelled = false;
    if (!copied) {
      return;
    }
    setTimeout(() => {
      if (cancelled) return;
      setCopied(false);
    }, 3000);

    return () => {
      cancelled = true;
    };
  }, [copied]);

  useEffect(() => {
    const pair = _.find(tradingPairs, { searchName: tradingPair });
    setTradingPairObj(pair);
  }, [tradingPair, tradingPairs]);

  useEffect(() => {
    let cancelled = false;
    const client = getTradeInstance(exchangeId);
    if (!client) {
      return setTradingPairs([]);
    }

    client.getAllTradingPairs().then((res) => {
      if (cancelled) return;
      setTradingPairs(res);
    });

    return () => {
      cancelled = true;
    };
  }, [exchangeId]);

  useEffect(() => {
    let cancelled = false;

    const client = getTradeInstance(exchangeId);
    if (!client) return;
    if (!tradingPairObj) return;

    const onClose = client.getLastPrice(
      tradingPairObj.originalSymbol,
      (price) => {
        if (cancelled) return;
        setMarketPrice(price);
      }
    );

    return () => {
      cancelled = true;
      onClose();
    };
  }, [exchangeId, tradingPairObj, visibilityChange]);

  useEffect(() => {
    if (useMarketOrder || useMarketPrice) {
      setPrice(marketPrice);
    }
  }, [marketPrice, useMarketOrder, useMarketPrice]);

  useEffect(() => {
    const [positionSz, positionAmt] = calcPositionSize(
      _.toNumber(price),
      _.toNumber(lossPerTrade),
      _.toNumber(stopLoss)
    );
    if (_.isNaN(positionSz)) return;

    const quantityStep = _.get(tradingPairObj, "quantityStep", 0.0001);
    const tickSize = _.get(tradingPairObj, "tickSize", 0.0001);

    roundToSamePrecisionWithCallback(positionSz, quantityStep, setPositionSize);

    roundToSamePrecisionWithCallback(positionAmt, tickSize, setPositionAmount);
  }, [price, stopLoss, lossPerTrade, tradingPairObj]);

  useEffect(() => {
    if (activeTab === "manual") {
      const riskReward = calcRiskReward(
        _.toNumber(price),
        _.toNumber(stopLoss),
        _.toNumber(takeProfit)
      );
      roundToSamePrecisionWithCallback(riskReward, 0.01, setRiskRewardRatio);
    }

    if (activeTab === "rr") {
      const takeProfit = calcTakeProfit(
        _.toNumber(price),
        _.toNumber(stopLoss),
        _.toNumber(riskRewardRatio)
      );
      const tickSize = _.get(tradingPairObj, "tickSize", 0.0001);
      roundToSamePrecisionWithCallback(takeProfit, tickSize, setTakeProfit);
    }
  }, [price, stopLoss, takeProfit, riskRewardRatio, activeTab]);

  return (
    <section className=" dark:bg-gray-900 mt-auto mx-2">
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
                const modalId = nanoid();

                const removeModal = () => {
                  setTimeout(() => {
                    removeDynamicElement(modalId);
                  }, 300);
                };

                addDynamicElement({
                  id: modalId,
                  component: (
                    <Settings
                      key={modalId}
                      handleCancel={() => {
                        removeModal();
                      }}
                    />
                  ),
                });
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
                type="tel"
                size="lg"
                label="Limit Price"
                disabled={useMarketOrder}
                onChange={(e) => {
                  if (!useMarketOrder) {
                    const callbackFn = (val) => {
                      const tickSize = _.get(
                        tradingPairObj,
                        "tickSize",
                        0.0001
                      );
                      roundToSamePrecisionWithCallback(val, tickSize, setPrice);
                    };
                    inputHandlerNumber(e.target.value, callbackFn);
                  }
                }}
                onFocusCapture={(e) => setUseMarketPrice(false)}
                value={price}
                autocomplete="false"
                data-lpignore="true"
                data-form-type="other"
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
            <Input
              type="tel"
              size="lg"
              label="Stop Loss"
              value={stopLoss}
              onChange={(e) => {
                const callbackFn = (val) => {
                  const tickSize = _.get(tradingPairObj, "tickSize", 0.0001);
                  roundToSamePrecisionWithCallback(val, tickSize, setStopLoss);
                };
                inputHandlerNumber(e.target.value, callbackFn);
              }}
              autocomplete="false"
              data-lpignore="true"
              data-form-type="other"
            />
            <div className="w-full">
              <Tabs value={activeTab} className="overflow-visible">
                <TabsBody className="overflow-visible">
                  <TabPanel value="manual" className="p-0">
                    <Input
                      type="tel"
                      size="lg"
                      label="Take Profit"
                      value={takeProfit}
                      onChange={(e) => {
                        const callbackFn = (val) => {
                          const tickSize = _.get(
                            tradingPairObj,
                            "tickSize",
                            0.0001
                          );
                          roundToSamePrecisionWithCallback(
                            val,
                            tickSize,
                            setTakeProfit
                          );
                        };

                        inputHandlerNumber(e.target.value, callbackFn);
                      }}
                      autocomplete="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />

                    <Chip
                      value={`≈ ${riskRewardRatio}:1`}
                      variant="ghost"
                      size="sm"
                      className="!absolute right-2 top-[0.63rem] font-light text-gray-700 rounded flex items-center"
                    />
                  </TabPanel>
                  <TabPanel value="rr" className="p-0">
                    <Input
                      type="tel"
                      size="lg"
                      label="Risk Reward Ratio"
                      value={riskRewardRatio}
                      onChange={(e) => {
                        inputHandlerNumber(e.target.value, setRiskRewardRatio, {
                          allowNegative: true,
                        });
                      }}
                      autocomplete="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />

                    <Chip
                      value={`≈ $${takeProfit}`}
                      variant="ghost"
                      size="sm"
                      className="!absolute right-2 top-[0.63rem] font-light text-gray-700 rounded flex items-center"
                    />
                  </TabPanel>
                </TabsBody>

                <TabsHeader className="text-nowrap h-8 text-sm flex mt-4">
                  {data.map(({ label, value }) => (
                    <Tab
                      key={value}
                      value={value}
                      className="text-xs"
                      onClick={(e) => {
                        setActiveTab(value);
                      }}
                    >
                      {label}
                    </Tab>
                  ))}
                </TabsHeader>
              </Tabs>
            </div>
          </div>

          <div>
            <Input
              type="tel"
              size="lg"
              label="Loss Per Trade"
              value={lossPerTrade}
              onChange={(e) => {
                inputHandlerNumber(e.target.value, setLossPerTrade);
              }}
              autocomplete="false"
              data-lpignore="true"
              data-form-type="other"
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
              type="tel"
              size="lg"
              value={positionSize}
              label="Position Size"
              autocomplete="false"
              data-lpignore="true"
              data-form-type="other"
            />

            <Chip
              value={`≈ $${positionAmount}`}
              variant="ghost"
              size="sm"
              className="!absolute right-14 top-[0.63rem] font-light text-gray-700 rounded flex items-center"
            />

            <IconButton
              size="md"
              className="!absolute right-1 top-1 rounded h-9 flex items-center"
              onClick={() => {
                copyToClipboard(positionSize);
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
                takeTrade({
                  originalSymbol: tradingPairObj?.originalSymbol,
                  side: "BUY",
                  price,
                  stopLoss,
                  takeProfit,
                  quantity: positionSize,
                  type: useMarketOrder ? "MARKET" : "LIMIT",
                });
              }}
            >
              Long
            </Button>

            <Button
              size="lg"
              color="red"
              fullWidth={true}
              onClickCapture={(e) => {
                takeTrade({
                  originalSymbol: tradingPairObj.originalSymbol,
                  side: "SELL",
                  price,
                  stopLoss,
                  takeProfit,
                  quantity: positionSize,
                  type: useMarketOrder ? "MARKET" : "LIMIT",
                });
              }}
            >
              Short
            </Button>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
};

const mapStateToProps = (state) => {
  return {
    isLoading: state.temporaryState.isLoading,
    exchangeId: state.currentSettings.exchangeId,
    tradingPair: state.currentSettings.tradingPair,
    visibilityChange: state.temporaryState.visibilityChange,
    apiCredentials: state.apiCredentials,
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
    addDynamicElement: (payload) => {
      dispatch({ type: "ADD_DYNAMIC_ELEMENT", payload });
    },

    removeDynamicElement: (payload) => {
      dispatch({ type: "REMOVE_DYNAMIC_ELEMENT", payload });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PositionCalculatorV2);
