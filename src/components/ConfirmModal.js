import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Typography,
} from "@material-tailwind/react";
import React from "react";

const ConfirmModal = ({
  defaultState = true,
  handleCancel,
  handleConfirm,
  children,
  title,
  color = "red",
}) => {
  const [open, setOpen] = React.useState(defaultState);

  return (
    <Dialog
      size="xs"
      open={open}
      handler={() => {
        setOpen(false);
        handleCancel();
      }}
    >
      <DialogHeader>
        <Typography variant="h5">{title}</Typography>
      </DialogHeader>
      <DialogBody>{children}</DialogBody>
      <DialogFooter className="flex gap-1">
        <Button
          variant="text"
          color=""
          onClick={() => {
            setOpen(false);
            handleCancel();
          }}
        >
          <span>Cancel</span>
        </Button>
        <Button
          color={color}
          onClick={() => {
            setOpen(false);
            handleConfirm();
          }}
        >
          <span>Confirm</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmModal;
