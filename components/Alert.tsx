import * as React from "react";
import { Icon } from "./Icon";
import { ValeAlert } from "../types";

interface Props {
  alert: ValeAlert;
  onClick: (alert: ValeAlert) => void;
}

export const Alert = ({ alert, onClick }: Props) => {
  return (
    <div
      className="card alert"
      onClick={(e) => {
        if ((e.target as any).nodeName === "DIV") {
          onClick(alert);
        }
      }}
    >
      <div className="alert__header">
        <div className="alert__severity">{alert.Severity}</div>
        <div className="alert__check">{alert.Check}</div>
        <div style={{ flexGrow: 1 }} />
        <a href={alert.Link}>
          <Icon name="info" />
        </a>
      </div>
      <div className="alert__body">{alert.Message}</div>
      <div className="alert__match">{alert.Match}</div>
    </div>
  );
};
