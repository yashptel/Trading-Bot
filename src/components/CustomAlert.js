import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Alert, IconButton } from "@material-tailwind/react";
import React from "react";

const CustomAlert = ({
  defaultState = true,
  onClose = () => {},
  timeout = 3000,
  type = "generic",
  children,
}) => {
  const [open, setOpen] = React.useState(defaultState);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
        onClose();
      }, timeout);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [open, onClose, timeout]);

  const icon = React.useMemo(() => {
    switch (type) {
      case "success":
        return (
          <CheckCircleIcon
            className="h-6 w-6 -mr-1 text-green-400"
            aria-hidden="true"
          />
        );
      case "error":
        return (
          <ExclamationCircleIcon
            className="h-6 w-6 -mr-1 text-red-800"
            aria-hidden="true"
          />
        );
      default:
        return (
          <ExclamationCircleIcon
            className="h-6 w-6 -mr-1 text-gray-800"
            aria-hidden="true"
          />
        );
    }
  }, [type]);

  return (
    <Alert
      icon={icon}
      variant="filled"
      open={open}
      onClose={() => {
        setOpen(false);
        onClose();
      }}
      action={
        <IconButton
          onClick={() => {
            setOpen(false);
            onClose();
          }}
          size="sm"
          color="white"
          className="!shadow-none p-2 w-full bg-white hover:bg-gray-300 transition-colors duration-200 ml-auto text-nowrap"
        >
          <XMarkIcon className="h-5 w-5 " aria-hidden="true" />
        </IconButton>
      }
      className="bg-white text-black shadow-md border"
      animate={{
        mount: { x: 0 },
        unmount: { x: 150 },
      }}
    >
      <div className="-mr-4">{children}</div>
    </Alert>
  );
};

export default CustomAlert;
