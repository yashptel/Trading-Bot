import React from "react";

import { Button, Dropdown, Label, Select } from "flowbite-react";

import { connect } from "react-redux";
import config from "../config";
import { store } from "../store";
import { hideInformation } from "../Utils";
import _ from "lodash";

const sideBar = [
  {
    name: "Profile",
    icon: (
      <svg
        class="w-4 h-4 me-2 text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
      </svg>
    ),
  },
  {
    name: "Dashboard",
    icon: (
      <svg
        class="w-4 h-4 me-2 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 18 18"
      >
        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
      </svg>
    ),
  },
  {
    name: "Settings",
    icon: (
      <svg
        class="w-4 h-4 me-2 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
      </svg>
    ),
  },
];

const initialForm = {
  exchange: config.exchanges[0].value,
  accountName: "",
  apiKey: "",
  secret: "",
  passphrase: "",
};

const SettingsModal = (props) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [addNewAPIKey, setAddNewAPIKey] = React.useState(false);
  const [form, setForm] = React.useState({
    ...initialForm,
  });

  return (
    <div
      id="settings-modal"
      tabindex="-1"
      aria-hidden="true"
      class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-modal md:h-full"
    >
      <div class="relative p-4 w-full max-w-fit h-full md:h-auto">
        <div class="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
          <div class="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h3>
            <button
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-toggle="settings-modal"
            >
              <svg
                aria-hidden="true"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>

          <form action="#">
            <div class="mb-4 ">
              <div class="md:flex">
                <ul class="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0">
                  {/* <li>
                    <a
                      href="#"
                      class="inline-flex items-center px-4 py-3 text-white bg-blue-700 rounded-lg active w-full dark:bg-blue-600"
                      aria-current="page"
                    >
                      <svg
                        class="w-4 h-4 me-2 text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                      </svg>
                      Profile
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="inline-flex items-center px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <svg
                        class="w-4 h-4 me-2 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 18 18"
                      >
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
                      </svg>
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="inline-flex items-center px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <svg
                        class="w-4 h-4 me-2 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                      </svg>
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="inline-flex items-center px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <svg
                        class="w-4 h-4 me-2 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M7.824 5.937a1 1 0 0 0 .726-.312 2.042 2.042 0 0 1 2.835-.065 1 1 0 0 0 1.388-1.441 3.994 3.994 0 0 0-5.674.13 1 1 0 0 0 .725 1.688Z" />
                        <path d="M17 7A7 7 0 1 0 3 7a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1V7a5 5 0 1 1 10 0v7.083A2.92 2.92 0 0 1 12.083 17H12a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1a1.993 1.993 0 0 0 1.722-1h.361a4.92 4.92 0 0 0 4.824-4H17a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3Z" />
                      </svg>
                      Contact
                    </a>
                  </li>
                  <li>
                    <a class="inline-flex items-center px-4 py-3 text-gray-400 rounded-lg cursor-not-allowed bg-gray-50 w-full dark:bg-gray-800 dark:text-gray-500">
                      <svg
                        class="w-4 h-4 me-2 text-gray-400 dark:text-gray-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                      </svg>
                      Disabled
                    </a>
                  </li> */}

                  {sideBar.map((item, idx) => (
                    <li>
                      <a
                        href="/"
                        id={`tab-${idx}`}
                        className={
                          activeTab === idx
                            ? "inline-flex items-center px-4 py-3 text-white bg-blue-700 rounded-lg active w-full dark:bg-blue-600 sidebar-tab sidebar-tab-active"
                            : "inline-flex items-center px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white sidebar-tab"
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab(idx);

                          const sidebarTabs =
                            document.querySelectorAll(".sidebar-tab");

                          sidebarTabs.forEach((tab, i) => {
                            tab
                              .querySelector("svg")
                              .classList.remove("text-white");

                            if (i === idx) {
                              tab
                                .querySelector("svg")
                                .classList.add("text-white");
                            }
                          });
                        }}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>

                <div class="relative p-6 overflow-x-auto shadow-md sm:rounded-lg">
                  {addNewAPIKey && (
                    <form class="p-4 md:p-5 ">
                      <div class="flex gap-4 mb-4 flex-col max-w-md sm:w-screen">
                        <div class="w-full">
                          <div className="mb-2 block">
                            <Label
                              htmlFor="exchanges"
                              value="Select exchange"
                            />
                          </div>
                          <Select
                            id="exchanges"
                            required
                            onChange={(e) => {
                              setForm({ ...form, exchange: e.target.value });
                            }}
                            // onSelect={(e) => {
                            //   setForm({ ...form, exchange: e.target.value });
                            // }}
                          >
                            {config.exchanges.map((exchange) => (
                              <option value={exchange.value}>
                                {exchange.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div class="col-span-full">
                          <label
                            for="account-name"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Account Name
                          </label>
                          <input
                            type="text"
                            name="account-name"
                            id="account-name"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Type product name"
                            required=""
                            onChange={(e) => {
                              setForm({ ...form, accountName: e.target.value });
                            }}
                            value={form.accountName}
                          ></input>
                        </div>
                        <div class="col-span-full">
                          <label
                            for="api-key"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            API Key
                          </label>
                          <input
                            type="text"
                            name="api-key"
                            id="api-key"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Key"
                            required=""
                            onChange={(e) => {
                              setForm({ ...form, apiKey: e.target.value });
                            }}
                            value={form.apiKey}
                          ></input>
                        </div>
                        <div class="col-span-full">
                          <label
                            for="api-secret"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            API Secret
                          </label>
                          <input
                            type="text"
                            name="api-secret"
                            id="api-secret"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Secret"
                            required=""
                            onChange={(e) => {
                              setForm({ ...form, secret: e.target.value });
                            }}
                            value={form.secret}
                          ></input>
                        </div>
                        <div class="col-span-full">
                          <label
                            for="api-passphrase"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            API Passphrase
                          </label>
                          <input
                            type="text"
                            name="api-passphrase"
                            id="api-passphrase"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Passphrase"
                            required=""
                            onChange={(e) => {
                              setForm({
                                ...form,
                                passphrase: e.target.value,
                              });
                            }}
                            value={form.passphrase}
                          ></input>
                        </div>
                      </div>
                      <div className="flex">
                        <button
                          type="submit"
                          class="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          onClick={(e) => {
                            e.preventDefault();

                            store.dispatch({
                              type: "ADD_API_CREDENTIALS",
                              data: form,
                            });

                            store.dispatch({
                              type: "ADD_TOAST",
                              payload: {
                                type: "success",
                                message: "API Key added",
                              },
                            });

                            setForm({ ...initialForm });

                            setAddNewAPIKey(false);
                          }}
                        >
                          <svg
                            class="me-1 -ms-1 w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                              clip-rule="evenodd"
                            ></path>
                          </svg>
                          Add API Key
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setAddNewAPIKey(false);
                          }}
                          class="text-gray-900 inline-flex items-center  focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {!addNewAPIKey && (
                    <>
                      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th scope="col" class="px-6 py-3">
                              Exchange
                            </th>
                            <th scope="col" class="px-6 py-3">
                              Name
                            </th>
                            <th scope="col" class="px-6 py-3">
                              Key
                            </th>
                            <th scope="col" class="px-6 py-3">
                              Secret
                            </th>
                            <th scope="col" class="px-6 py-3">
                              Passphrase
                            </th>
                            {/* <th scope="col" class="px-6 py-3">
                          <span class="sr-only"></span>
                        </th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {props.apiCredentials.map((item) => (
                            <tr
                              key={item.id}
                              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              <th
                                scope="row"
                                class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                {_.find(
                                  config.exchanges,
                                  (exchange) => exchange.id === item.exchangeId
                                ).name || "N/A"}
                              </th>
                              <td class="px-6 py-4">
                                {item.name || item.accountName}
                              </td>
                              <td class="px-6 py-4">
                                {hideInformation(item.apiKey)}
                              </td>
                              <td class="px-6 py-4">
                                {hideInformation(item.secret)}
                              </td>
                              <td class="px-6 py-4">
                                {item.passphrase
                                  ? hideInformation(item.secret)
                                  : "-"}
                              </td>

                              <td class="px-6 py-4 text-right">
                                <a
                                  href="/"
                                  id={item.id}
                                  class="font-medium text-red-600 dark:text-red-500 hover:underline ms-3"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const id = e.target.id;
                                    // removeAPICredentials(id);
                                    store.dispatch({
                                      type: "REMOVE_API_CREDENTIALS",
                                      id,
                                    });

                                    store.dispatch({
                                      type: "ADD_TOAST",
                                      payload: {
                                        type: "success",
                                        message: "API Key removed",
                                      },
                                    });
                                  }}
                                >
                                  Remove
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end mt-4">
                        {/* <button
                          type="button"
                          class="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 me-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setAddNewAPIKey(true);
                          }}
                        >
                          Add New API Key
                        </button> */}
                        <Button
                          color="blue"
                          onClick={(e) => {
                            e.preventDefault();
                            setAddNewAPIKey(true);
                          }}
                        >
                          Add New API Key
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                data-modal-toggle="settings-modal"
                onClick={(e) => {
                  e.preventDefault();
                }}
                class="text-gray-900 inline-flex items-center  focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="text-white inline-flex items-center bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    apiCredentials: state.apiCredentials,
    temporaryState: {
      isSettingsOpen: state.temporaryState.isSettingsOpen,
    },
  };
};

// const mapDispatchToProps = (dispatch) => {
//   return {
//     addAPICredentials: (credentials) =>
//       dispatch(addAPICredentials(credentials)),
//     removeAPICredentials: (id) => dispatch(removeAPICredentials(id)),
//   };
// };

export default connect(mapStateToProps)(SettingsModal);
