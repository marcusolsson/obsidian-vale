import * as React from "react";
import { ValeAlert } from "../types";
import { Icon } from "./Icon";

interface Props {
  alert: ValeAlert;
  onClick: (alert: ValeAlert) => void;
}

export const Alert = ({ alert, onClick }: Props): React.ReactElement => {
  const cb: React.MouseEventHandler<HTMLDivElement> = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    // Ignore click when clicking the link.
    if (e.currentTarget.nodeName === "DIV") {
      onClick(alert);
    }
  };
  return (
    <div className="alert" onClick={cb}>
      <div className="alert__header">
        <div className="alert__severity">{alert.Severity}</div>
        <div className="alert__check">{alert.Check}</div>
        {alert.Link && (
          <>
            <div style={{ flexGrow: 1 }} />
            <a href={alert.Link} className="alert__link">
              <Icon name="info" />
            </a>
          </>
        )}
      </div>
      <div className="alert__message">{alert.Message}</div>
      <div className="alert__match">{alert.Match}</div>
    </div>
  );
};
