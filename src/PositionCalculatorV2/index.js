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
import {
  ArrowDownCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  CheckIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import getTradeInstance from "../trade";
import Settings from "../components/Settings";
import { nanoid } from "@reduxjs/toolkit";
import {
  calcLoss,
  calcPositionSize,
  calcRiskReward,
  calcTakeProfit,
  inputHandlerNumber,
  roundToSamePrecision,
  roundToSamePrecisionWithCallback,
} from "../Utils";
import _ from "lodash";
import CustomAlert from "../components/CustomAlert";
import { useSearchParams } from "react-router-dom";

const FEE_PRECISION = 0.01;

const formatFeeValue = (value) => {
  const feeValue = _.toNumber(value);
  if (_.isNaN(feeValue)) {
    return "0";
  }

  return _.round(feeValue, 2).toFixed(2);
};

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

  lossPerTradeSuggestions,
  addLossPerTradeInput,
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

  const [actualLoss, setActualLoss] = React.useState(0);
  const [actualProfit, setActualProfit] = React.useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [recoverFees, setRecoverFees] = React.useState(false);
  const [autoRecoverableFees, setAutoRecoverableFees] = React.useState(0);
  const [autoRecoverableFeesLoading, setAutoRecoverableFeesLoading] =
    React.useState(false);
  const [autoRecoverableFeesError, setAutoRecoverableFeesError] =
    React.useState("");
  const [manualFeeEntries, setManualFeeEntries] = React.useState([]);
  const [fetchedFeeEntries, setFetchedFeeEntries] = React.useState([]);
  const [newFeeInput, setNewFeeInput] = React.useState("");
  const [feeListOpen, setFeeListOpen] = React.useState(true);
  const isAsterDex = exchangeId === "asterdex";

  const resetFeeEntries = React.useCallback(() => {
    setManualFeeEntries(fetchedFeeEntries.map((e) => ({ ...e, id: nanoid() })));
  }, [fetchedFeeEntries]);

  const addFeeEntry = React.useCallback(() => {
    const value = _.toNumber(newFeeInput);
    if (_.isNaN(value) || newFeeInput === "") return;
    setManualFeeEntries((prev) => [...prev, { id: nanoid(), value }]);
    setNewFeeInput("");
  }, [newFeeInput]);

  const removeFeeEntry = React.useCallback((id) => {
    setManualFeeEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateFeeEntry = React.useCallback((id, raw) => {
    setManualFeeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, value: raw } : e))
    );
  }, []);

  const manualRecoverableFees = React.useMemo(() => {
    if (manualFeeEntries.length === 0) return null;
    const rr = _.toNumber(riskRewardRatio);
    return manualFeeEntries.reduce((total, entry, i) => {
      const fee = _.toNumber(entry.value) || 0;
      const prevFee = i === 0 ? 0 : (_.toNumber(manualFeeEntries[i - 1].value) || 0);
      return total + fee + (i === 0 ? 0 : prevFee / rr);
    }, 0);
  }, [manualFeeEntries, riskRewardRatio]);

  const effectiveRecoverableFees =
    manualRecoverableFees ?? _.toNumber(autoRecoverableFees);

  const appliedRecoverableFees =
    isAsterDex && recoverFees ? effectiveRecoverableFees : 0;

  const effectiveLossPerTrade = React.useMemo(() => {
    const baseLossPerTrade = _.toNumber(lossPerTrade);
    const rewardRatio = _.toNumber(riskRewardRatio);
    const recoverableFees = _.toNumber(appliedRecoverableFees);

    if (
      !isAsterDex ||
      !recoverFees ||
      _.isNaN(baseLossPerTrade) ||
      _.isNaN(rewardRatio) ||
      rewardRatio <= 0 ||
      recoverableFees <= 0
    ) {
      return baseLossPerTrade;
    }

    return baseLossPerTrade + recoverableFees / rewardRatio;
  }, [
    appliedRecoverableFees,
    isAsterDex,
    lossPerTrade,
    recoverFees,
    riskRewardRatio,
  ]);

  useEffect(() => {
    setSearchParams({ exchangeId, tradingPair });
  }, [exchangeId, tradingPair]);

  useEffect(() => {
    const loss = calcLoss(
      _.toNumber(price),
      _.toNumber(stopLoss),
      _.toNumber(positionSize)
    );

    const tickSize = _.get(tradingPairObj, "tickSize", "0.0001");

    const isInvalid =
      (_.toNumber(price) < _.toNumber(stopLoss) &&
        _.toNumber(price) < _.toNumber(takeProfit)) ||
      (_.toNumber(price) > _.toNumber(stopLoss) &&
        _.toNumber(price) > _.toNumber(takeProfit));

    roundToSamePrecisionWithCallback(
      isInvalid ? loss : -loss,
      tickSize,
      setActualLoss
    );
    roundToSamePrecisionWithCallback(
      loss * _.toNumber(riskRewardRatio),
      tickSize,
      setActualProfit
    );
  }, [positionSize, price, stopLoss, riskRewardRatio]);

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

      await client.takeTrade({
        ...args,
        addToast,
      });
    },

    [apiCredentials, exchangeId]
  );

  useEffect(() => {
    let cancelled = false;

    if (!isAsterDex) {
      setAutoRecoverableFees(0);
      setAutoRecoverableFeesError("");
      setAutoRecoverableFeesLoading(false);
      return;
    }

    const apiCredential = _.find(apiCredentials, { exchangeId });
    if (
      !apiCredential?.apiKey ||
      !apiCredential?.secretKey ||
      !tradingPairObj?.originalSymbol
    ) {
      setAutoRecoverableFees(0);
      setAutoRecoverableFeesError("");
      setAutoRecoverableFeesLoading(false);
      return;
    }

    const client = getTradeInstance(exchangeId, {
      apiKey: apiCredential.apiKey,
      secret: apiCredential.secretKey,
      passphrase: apiCredential.passphrase,
    });

    if (!client?.getRecoverableStopFees) {
      setAutoRecoverableFees(0);
      setAutoRecoverableFeesError("Auto fee lookup is unavailable.");
      setAutoRecoverableFeesLoading(false);
      return;
    }

    setAutoRecoverableFeesLoading(true);
    setAutoRecoverableFeesError("");

    client
      .getRecoverableStopFees(tradingPairObj.originalSymbol)
      .then((result) => {
        if (cancelled) return;
        setAutoRecoverableFees(_.toNumber(_.get(result, "totalFees", 0)));
        const stopLossTrades = _.get(result, "stopLossTrades", []);
        if (stopLossTrades.length > 0) {
          const entries = [...stopLossTrades].reverse().map((trade) => ({
            id: nanoid(),
            value: trade.fee,
          }));
          setFetchedFeeEntries(entries);
          setManualFeeEntries((prev) => (prev.length === 0 ? entries : prev));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setAutoRecoverableFees(0);
        setAutoRecoverableFeesError(
          _.get(
            error,
            "response.data.msg",
            "Failed to load recoverable fees."
          )
        );
      })
      .finally(() => {
        if (cancelled) return;
        setAutoRecoverableFeesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiCredentials, exchangeId, isAsterDex, tradingPairObj?.originalSymbol]);

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
    if (!useMarketPrice) return;

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
  }, [exchangeId, tradingPairObj, visibilityChange, useMarketPrice]);

  useEffect(() => {
    if (useMarketOrder || useMarketPrice) {
      setPrice(marketPrice);
    }
  }, [marketPrice, useMarketOrder, useMarketPrice]);

  useEffect(() => {
    const [positionSz, positionAmt] = calcPositionSize(
      _.toNumber(price),
      _.toNumber(effectiveLossPerTrade),
      _.toNumber(stopLoss)
    );
    if (_.isNaN(positionSz)) return;

    const quantityStep = _.get(tradingPairObj, "quantityStep", 0.0001);
    const tickSize = _.get(tradingPairObj, "tickSize", 0.0001);

    roundToSamePrecisionWithCallback(positionSz, quantityStep, setPositionSize);

    roundToSamePrecisionWithCallback(positionAmt, tickSize, setPositionAmount);
  }, [effectiveLossPerTrade, price, stopLoss, tradingPairObj]);

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

  const roundTakeProfit = (value) => {
    const tickSize = _.get(tradingPairObj, "tickSize", "0.0001");
    return roundToSamePrecision(value, tickSize);
  };

  return (
    <section className=" dark:bg-gray-900 mt-auto mx-4">
      <Card className="w-full max-w-[25rem] shadow-lg mx-auto relative">
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
              defaultValue={searchParams.get("exchangeId") || exchangeId}
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
              defaultValue={searchParams.get("tradingPair") || tradingPair}
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
              variant="text"
              className="min-w-11 max-w-full max-h-full w-11 h-11"
              color="blue-gray"
              size="lg"
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
              <Cog6ToothIcon className="h-6 w-6 text-black" />
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
                variant="text"
                color="blue-gray"
                disabled={useMarketPrice}
                className="!absolute right-1 top-1 rounded h-9 flex items-center px-3"
                onClick={(e) => setUseMarketPrice(true)}
              >
                <ArrowDownCircleIcon className="h-5 w-5 text-black" />
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
                      onClick={(e) => {
                        copyToClipboard(takeProfit);
                        addToast({
                          type: "success",
                          message: "Copied to clipboard",
                        });
                      }}
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

          <div className="relative">
            <Input
              type="tel"
              size="lg"
              label="Loss Per Trade"
              value={lossPerTrade}
              onChange={(e) => {
                const callbackFn = (val) => {
                  roundToSamePrecisionWithCallback(val, 0.01, setLossPerTrade);
                };
                inputHandlerNumber(e.target.value, callbackFn);
              }}
              onBlur={(e) => {
                if (lossPerTrade > 0) addLossPerTradeInput(lossPerTrade);
              }}
              autocomplete="false"
              data-lpignore="true"
              data-form-type="other"
            />

            <Chip
              value={`≈ ${actualLoss}/${actualProfit}`}
              variant="ghost"
              size="sm"
              className="!absolute right-2 top-[0.63rem] font-light text-gray-700 rounded flex items-center"
            />
            <div className="flex gap-2 mt-2">
              {_.uniqBy(
                [
                  ..._.slice(lossPerTradeSuggestions, 0, 4),
                  ..._.slice(
                    _.sortBy(lossPerTradeSuggestions, "updatedAt").reverse(),
                    0,
                    4
                  ),
                ],
                "id"
              )
                .slice(0, 6)
                .sort((a, b) => a.value - b.value)
                .map(({ value, id }) => {
                  return (
                    <Chip
                      variant="outlined"
                      value={`$${value}`}
                      size="sm"
                      key={id}
                      onClick={(e) => {
                        inputHandlerNumber(value, setLossPerTrade);
                        if (value > 0) addLossPerTradeInput(value);
                      }}
                      className="h-5 py-0 font-normal text-[0.8rem] border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 ease-in-out cursor-pointer active:bg-gray-200 dark:checked:bg-gray-700"
                    />
                  );
                })}
            </div>

            {isAsterDex ? (
              <div className="mt-3 space-y-2 rounded-lg border border-blue-gray-50 bg-blue-gray-50/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Checkbox
                    checked={recoverFees}
                    onChange={(e) => setRecoverFees(e.target.checked)}
                    label="Recover stop fees at TP"
                    containerProps={{
                      className: "-ml-2 -mr-2",
                    }}
                  />

                  <IconButton
                    size="sm"
                    variant="text"
                    color="blue-gray"
                    className="rounded"
                    disabled={autoRecoverableFeesLoading || fetchedFeeEntries.length === 0}
                    onClick={resetFeeEntries}
                    title="Reset to exchange fees"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </IconButton>
                </div>

                {/* Fee accordion */}
                <div className="mt-1 rounded-md border border-blue-gray-100 overflow-hidden">
                  {/* Summary / toggle bar */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-600 hover:bg-blue-gray-50/60 transition-colors"
                    onClick={() => setFeeListOpen((o) => !o)}
                  >
                    <span>
                      {manualFeeEntries.length > 0
                        ? `${manualFeeEntries.length} fee${manualFeeEntries.length !== 1 ? "s" : ""} · Total: $${formatFeeValue(manualRecoverableFees)}`
                        : "No fees added"}
                    </span>
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${
                        feeListOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Collapsible body */}
                  <div
                    className={`transition-all duration-200 overflow-hidden ${
                      feeListOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {/* Scrollable fee entries */}
                    <div className="max-h-48 overflow-y-auto px-2 pt-1 space-y-1.5">
                      {/* Fee entries */}
                      {manualFeeEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <Input
                              type="tel"
                              size="md"
                              label="Fee"
                              value={entry.value}
                              onChange={(e) => {
                                inputHandlerNumber(e.target.value, (val) =>
                                  updateFeeEntry(entry.id, val)
                                );
                              }}
                              autocomplete="false"
                              data-lpignore="true"
                              data-form-type="other"
                            />
                          </div>
                          <IconButton
                            size="sm"
                            variant="text"
                            color="red"
                            className="rounded flex-shrink-0"
                            onClick={() => removeFeeEntry(entry.id)}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      ))}
                    </div>

                    {/* Add fee row – outside scroll area so it stays pinned */}
                    <div className="px-2 pb-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Input
                            type="tel"
                            size="md"
                            label="Add fee"
                            value={newFeeInput}
                            onChange={(e) => {
                              inputHandlerNumber(e.target.value, setNewFeeInput);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addFeeEntry();
                            }}
                            autocomplete="false"
                            data-lpignore="true"
                            data-form-type="other"
                          />
                        </div>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="blue-gray"
                          className="rounded flex-shrink-0"
                          onClick={addFeeEntry}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>

                {autoRecoverableFeesError ? (
                  <p className="text-xs text-red-500">
                    {autoRecoverableFeesError}
                  </p>
                ) : null}
              </div>
            ) : null}
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
              className="!absolute right-12 top-[0.63rem] font-light text-gray-700 rounded flex items-center"
            />

            <IconButton
              size="md"
              variant="text"
              color="blue-gray"
              className="!absolute right-1 top-1 rounded h-9 flex items-center"
              onClick={() => {
                copyToClipboard(positionSize);
                setCopied(true);
              }}
            >
              {copied ? (
                <CheckIcon className="h-5 w-5 text-black" />
              ) : (
                <DocumentDuplicateIcon className="h-5 w-5 text-black" />
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
                  takeProfitTrigger: roundTakeProfit(takeProfit * (1 - 0.001)),
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
                  takeProfitTrigger: roundTakeProfit(takeProfit * (1 + 0.001)),
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
    lossPerTradeSuggestions: state.lossPerTradeInputs,
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

    addLossPerTradeInput: (payload) => {
      dispatch({ type: "ADD_LOSS_PER_TRADE_INPUT", payload });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PositionCalculatorV2);
