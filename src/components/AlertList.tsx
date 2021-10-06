import * as React from "react";
import { ValeAlert } from "../types";
import { Alert } from "./Alert";

interface Props {
  alerts: ValeAlert[];
  highlight?: ValeAlert;
  onClick: (alert: ValeAlert) => void;
}

export const AlertList = ({
  alerts,
  highlight,
  onClick,
}: Props): React.ReactElement => {
  return (
    <>
      {alerts?.map((alert, key) => {
        return (
          <Alert
            key={key}
            alert={alert}
            onClick={onClick}
            highlight={highlight === alert}
          />
        );
      })}
    </>
  );
};
