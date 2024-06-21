import React from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  IconButton,
  Typography,
  Input,
  Card,
  CardHeader,
  CardBody,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  TabsHeader,
  Tabs,
} from "@material-tailwind/react";

import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

import {
  DocumentMagnifyingGlassIcon,
  FlagIcon,
} from "@heroicons/react/24/solid";

import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";
import ConfirmModal from "./ConfirmModal";
import AddEditModal from "./AddEditModal";
import { connect } from "react-redux";
import config from "../config";
import { nanoid } from "@reduxjs/toolkit";

const TABLE_ROW = [
  {
    img: "/logos/btc.png",
    digitalAsset: "BTC",
    detail: "Bitcoin",
    price: "$46,727.30",
    change: "+2.92%",
    volume: "$45.31B",
    market: "$915.61B",
    color: "green",
    trend: 4,
  },
  {
    img: "/logos/eth.png",
    digitalAsset: "ETH",
    detail: "Ethereum",
    price: "$2,609.30",
    change: "+6.80%",
    volume: "$23.42B",
    market: "$313.58B",
    color: "green",
  },
  {
    img: "/logos/usdt.png",
    digitalAsset: "USDT",
    detail: "TetherUS",
    price: "$1.00",
    change: "-0.01%",
    volume: "$94.37B",
    market: "$40,600",
    color: "red",
  },
  {
    img: "/logos/sol.png",
    digitalAsset: "SOL",
    detail: "Solana",
    price: "$1.00",
    change: "+6.35%",
    volume: "$3.48B",
    market: "$43.26B",
    color: "green",
  },
  {
    img: "/logos/xrp.png",
    digitalAsset: "XRP",
    detail: "Ripple",
    price: "$100.19",
    change: "-0.95%",
    volume: "$1.81B",
    market: "$32.45B",
    color: "red",
  },
];

const TABLE_HEAD = [
  {
    head: "Exchange",
    customeStyle: "!text-left",
  },
  {
    head: "Name",
    customeStyle: "text-left",
  },
  {
    head: "API Key",
    customeStyle: "text-left",
  },
  {
    head: "Secret Key",
    customeStyle: "text-left",
  },
  {
    head: "Passphrase",
    customeStyle: "text-left",
  },

  {
    head: "Actions",
    customeStyle: "text-left",
  },
];

export function Settings({
  isLoading,
  isSettingsModalOpen,
  setCurrentSettingsModal,
  apiCredentials,
  deleteApiCredentials,
}) {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [addEditModalOpen, setaddEditModalOpen] = React.useState(false);

  const [modals, setModals] = React.useState([]);

  return (
    <>
      <Dialog
        className="p-4 min-w-[95%]"
        size=""
        open={isSettingsModalOpen}
        handler={() => {}}
      >
        <DialogHeader className="justify-between">
          <Typography variant="h3" color="blue-gray">
            Settings
          </Typography>
          <IconButton
            color="gray"
            size="sm"
            variant="text"
            onClick={() => setCurrentSettingsModal(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </IconButton>
        </DialogHeader>
        <DialogBody className="overflow-y-auto">
          <section className=" flex gap-2">
            <List>
              <ListItem>
                <ListItemPrefix>
                  <PresentationChartBarIcon className="h-5 w-5" />
                </ListItemPrefix>
                Dashboard
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <ShoppingBagIcon className="h-5 w-5" />
                </ListItemPrefix>
                E-Commerce
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <InboxIcon className="h-5 w-5" />
                </ListItemPrefix>
                Inbox
                <ListItemSuffix>
                  <Chip
                    value="14"
                    size="sm"
                    variant="ghost"
                    color="blue-gray"
                    className="rounded-full"
                  />
                </ListItemSuffix>
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <UserCircleIcon className="h-5 w-5" />
                </ListItemPrefix>
                Profile
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <Cog6ToothIcon className="h-5 w-5" />
                </ListItemPrefix>
                Settings
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <PowerIcon className="h-5 w-5" />
                </ListItemPrefix>
                Log Out
              </ListItem>
            </List>
            <Card className="h-full min-w-fit w-full">
              <CardHeader
                floated={false}
                shadow={false}
                className="rounded-none"
              >
                <div className="mb-8 flex items-center justify-between gap-8">
                  <div>
                    <Typography variant="h5" color="blue-gray">
                      API Credentials List
                    </Typography>
                    <Typography color="gray" className="mt-1 font-normal">
                      List of all API credentials
                    </Typography>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex items-center gap-1"
                      size="sm"
                      onClick={() => setaddEditModalOpen(true)}
                    >
                      <PlusCircleIcon strokeWidth={2} className="h-4 w-4" /> Add
                      New API Key
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="min-h-96 py-2">
                <table className="w-full min-w-max table-auto">
                  <thead>
                    <tr>
                      {TABLE_HEAD.map(({ head, customeStyle }) => (
                        <th
                          key={head}
                          className={`border-b border-gray-300 !p-4 pb-8 ${customeStyle}`}
                        >
                          <Typography
                            color="blue-gray"
                            variant="small"
                            className="!font-bold"
                          >
                            {head}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apiCredentials.map(
                      (
                        {
                          id,
                          exchangeId,
                          name,
                          apiKey = "something",
                          secretKey,
                          passphrase,
                        },
                        index
                      ) => {
                        const exchange = config.exchanges.find(
                          (item) => item.id === exchangeId
                        );

                        const isLast = index === TABLE_ROW.length - 1;
                        const classes =
                          (isLast ? "!p-4 " : "!p-4 border-b border-gray-300") +
                          " max-w-[160px]";
                        return (
                          <tr key={id}>
                            <td className={classes}>
                              <div className="flex items-center gap-2 text-left">
                                <img
                                  src={exchange?.logo}
                                  alt={exchange?.name}
                                  className="rounded-md h-4 w-4"
                                />
                                <Typography
                                  variant="small"
                                  className="!font-normal text-gray-600"
                                >
                                  {name}
                                </Typography>
                                <div></div>
                              </div>
                            </td>
                            <td className={classes}>
                              <Typography
                                variant="small"
                                className="!font-normal text-gray-600 text-left overflow-hidden text-ellipsis text-nowrap"
                              >
                                {name}
                              </Typography>
                            </td>
                            <td className={classes}>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="!font-normal text-gray-600 text-left overflow-hidden text-ellipsis text-nowrap"
                              >
                                {apiKey}
                              </Typography>
                            </td>
                            <td className={classes}>
                              <Typography
                                variant="small"
                                className="!font-normal text-gray-600 text-left overflow-hidden text-ellipsis text-nowrap"
                              >
                                {secretKey}
                              </Typography>
                            </td>
                            <td className={classes}>
                              <Typography
                                variant="small"
                                className="!font-normal text-gray-600 text-left overflow-hidden text-ellipsis text-nowrap"
                              >
                                {passphrase}
                              </Typography>
                            </td>

                            <td className={classes}>
                              <div className="flex justify-start gap-2">
                                <IconButton variant="text" size="sm">
                                  <PencilSquareIcon className="h-5 w-5 text-gray-900" />
                                </IconButton>
                                <IconButton
                                  variant="text"
                                  size="sm"
                                  onClick={(e) => {
                                    setModals((prev) => {
                                      const modalId = nanoid();

                                      const removeModal = () => {
                                        setTimeout(() => {
                                          setModals((prev) => {
                                            return prev.filter(
                                              (item) => item.id !== modalId
                                            );
                                          });
                                        }, 300);
                                      };

                                      return [
                                        ...prev,
                                        {
                                          id: modalId,
                                          html: (
                                            <ConfirmModal
                                              key={modalId}
                                              title={"Delete Item"}
                                              handleCancel={() => {
                                                removeModal();
                                              }}
                                              handleConfirm={() => {
                                                deleteApiCredentials(id);
                                                removeModal();
                                              }}
                                            >
                                              <Typography variant="paragraph">
                                                Are you sure you want to delete
                                                this item?
                                              </Typography>
                                            </ConfirmModal>
                                          ),
                                        },
                                      ];
                                    });
                                  }}
                                >
                                  <TrashIcon className="h-5 w-5 text-red-900" />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </section>
        </DialogBody>
      </Dialog>

      {/* <ConfirmModal
        title={"Delete Item"}
        handleCancel={() => setDeleteModalOpen(false)}
        handleConfirm={() => setDeleteModalOpen(false)}
      >
        <Typography variant="paragraph">
          Are you sure you want to delete this item?
        </Typography>
      </ConfirmModal> */}

      {modals.map(({ id, html }) => html)}

      <AddEditModal
        open={addEditModalOpen}
        handleCancel={() => setaddEditModalOpen(false)}
        handleConfirm={() => setaddEditModalOpen(false)}
      />
    </>
  );
}

const mapStateToProps = (state) => {
  return {
    isLoading: state.temporaryState.isLoading,
    isSettingsModalOpen: state.temporaryState.isSettingsModalOpen,
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

    deleteApiCredentials: (payload) => {
      dispatch({ type: "DELETE_API_CREDENTIALS", payload });
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
