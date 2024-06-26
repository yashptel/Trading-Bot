import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  Button,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Card,
  Typography,
  IconButton,
} from "@material-tailwind/react";

const TestModal = ({ open, handleOpen }) => {
  const [activeTab, setActiveTab] = useState("api-credentials");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [credentials, setCredentials] = useState([
    { id: 1, name: "Exchange 1", apiKey: "key1", apiSecret: "secret1" },
    { id: 2, name: "Exchange 2", apiKey: "key2", apiSecret: "secret2" },
  ]);

  const handleEdit = (id) => {
    setEditModalOpen(true);
    // Logic to populate edit form
  };

  const handleDelete = (id) => {
    setDeleteModalOpen(true);
    // Logic to set item for deletion
  };

  const handleAdd = () => {
    setEditModalOpen(true);
    // Logic to prepare for adding new credentials
  };

  return (
    <>
      <Dialog open={open} handler={handleOpen}>
        <DialogHeader className="flex justify-between">
          <Typography variant="h5">Settings</Typography>
          <IconButton variant="text" onClick={handleOpen}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </IconButton>
        </DialogHeader>
        <DialogBody className="flex">
          <Tabs value={activeTab} orientation="vertical">
            <TabsHeader>
              <Tab value="api-credentials">API Credentials</Tab>
            </TabsHeader>
            <TabsBody>
              <TabPanel value="api-credentials" className="py-0">
                <Card className="h-full w-full overflow-scroll">
                  <table className="w-full min-w-max table-auto text-left">
                    <thead>
                      <tr>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal leading-none opacity-70"
                          >
                            Sr. No.
                          </Typography>
                        </th>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal leading-none opacity-70"
                          >
                            Name
                          </Typography>
                        </th>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal leading-none opacity-70"
                          >
                            Exchange API Key
                          </Typography>
                        </th>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal leading-none opacity-70"
                          >
                            API Secret
                          </Typography>
                        </th>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal leading-none opacity-70"
                          >
                            Actions
                          </Typography>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {credentials.map((cred, index) => (
                        <tr key={cred.id}>
                          <td className="p-4">
                            <Typography variant="small" color="blue-gray">
                              {index + 1}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography variant="small" color="blue-gray">
                              {cred.name}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography variant="small" color="blue-gray">
                              {cred.apiKey}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography variant="small" color="blue-gray">
                              {cred.apiSecret}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <IconButton
                              variant="text"
                              color="blue-gray"
                              onClick={() => handleEdit(cred.id)}
                            >
                              <i className="fas fa-pencil-alt" />
                            </IconButton>
                            <IconButton
                              variant="text"
                              color="red"
                              onClick={() => handleDelete(cred.id)}
                            >
                              <i className="fas fa-trash" />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button onClick={handleAdd} className="mt-4">
                    Add New Credentials
                  </Button>
                </Card>
              </TabPanel>
            </TabsBody>
          </Tabs>
        </DialogBody>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} handler={() => setEditModalOpen(false)}>
        <DialogHeader>Edit API Credentials</DialogHeader>
        <DialogBody>
          {/* Add form fields for editing API credentials */}
        </DialogBody>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} handler={() => setDeleteModalOpen(false)}>
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody>
          Are you sure you want to delete these credentials?
        </DialogBody>
      </Dialog>
    </>
  );
};

export default TestModal;
