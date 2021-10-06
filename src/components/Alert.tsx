import * as React from "react";
import { ValeAlert } from "../types";
import { Icon } from "./Icon";

interface Props {
  alert: ValeAlert;
  onClick: (alert: ValeAlert) => void;
  highlight: boolean;
}

export const Alert = ({
  alert,
  onClick,
  highlight,
}: Props): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement>();

  if (ref.current && highlight) {
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      ref={ref}
      className={`alert${highlight ? " alert--highlighted" : ""}`}
      onClick={(e) => {
        // Ignore click when clicking the link.
        if (e.currentTarget.nodeName === "DIV") {
          onClick(alert);
        }
      }}
    >
      <div className="alert__header">
        <div
          className={`alert__severity alert__severity-text--${alert.Severity}`}
        >
          {alert.Severity}
        </div>
        <div className={`alert__check`}>{alert.Check}</div>
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
