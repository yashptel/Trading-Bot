import React from "react";
import {
  Button,
  Dialog,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Checkbox,
  IconButton,
} from "@material-tailwind/react";
import config from "../config";
import CustomSelect from "./CustomSelect";
import { connect } from "react-redux";
import _ from "lodash";

const AddEditModal = ({
  defaultState = true,
  handleCancel,
  handleConfirm,
  apiCredentials,
  addApiCredentials,
  updateApiCredentials,
  id,
}) => {
  const [open, setOpen] = React.useState(defaultState);
  const [form, setForm] = React.useState(
    _.find(apiCredentials, { id }) || {
      exchangeId: "",
      name: "",
      apiKey: "",
      secretKey: "",
      passphrase: "",
    }
  );

  return (
    <>
      <Dialog
        size="xs"
        open={open}
        handler={() => {
          setOpen(false);
          handleCancel();
        }}
        className="bg-transparent shadow-none"
      >
        <Card className="mx-auto w-full max-w-[24rem]">
          <CardHeader
            className="flex justify-between rounded-none gap-4 p-2"
            floated={false}
            shadow={false}
          >
            <div>
              <Typography variant="h5" color="blue-gray">
                Add New Credentials
              </Typography>
              <Typography
                className="mb-3 font-normal"
                variant="paragraph"
                color="gray"
              >
                Please enter your credentials to connect to your exchange.
              </Typography>
            </div>

            <IconButton
              color="gray"
              size="sm"
              variant="text"
              onClick={() => {
                setOpen(false);
                handleCancel();
              }}
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
          </CardHeader>

          <CardBody className="flex flex-col gap-4">
            <CustomSelect
              defaultValue={form.exchangeId || config.exchanges[0].id}
              valueKey="id"
              showSearch={false}
              key="exchange-select"
              label="Select Exchange"
              selections={config.exchanges}
              onChange={(val) => {
                setForm({ ...form, exchangeId: val });
                return val;
              }}
              keyKey="id"
            ></CustomSelect>

            <Input
              size="lg"
              label="Name"
              type="text"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              value={form.name}
            />
            <Input
              size="lg"
              label="API Key"
              type="text"
              placeholder="xqAysd38EPaQd5eXzEmk"
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              value={form.apiKey}
            />
            <Input
              size="lg"
              label="API Secret"
              type="password"
              placeholder="**********"
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
              value={form.secretKey}
            />
            <Input
              size="lg"
              label="API Passphrase"
              type="password"
              placeholder="**********"
              onChange={(e) => setForm({ ...form, passphrase: e.target.value })}
              value={form.passphrase}
            />
          </CardBody>
          <CardFooter className="pt-0 flex justify-end gap-2">
            <Button
              variant="text"
              onClick={() => {
                setOpen(false);
                handleCancel();
              }}
            >
              Reset
            </Button>
            <Button
              variant="gradient"
              onClick={(e) => {
                if (id) {
                  updateApiCredentials({ ...form, id });
                } else {
                  addApiCredentials(form);
                }
                setOpen(false);
                handleCancel();
              }}
            >
              Save
            </Button>
          </CardFooter>
        </Card>
      </Dialog>
    </>
  );
};

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

    addApiCredentials: (data) => {
      dispatch({ type: "ADD_API_CREDENTIALS", data });
    },

    updateApiCredentials: (data) => {
      dispatch({ type: "UPDATE_API_CREDENTIALS", data });
    },

    deleteApiCredentials: (id) => {
      dispatch({ type: "DELETE_API_CREDENTIALS", id });
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AddEditModal);
