import * as React from "react";

interface Props {
  message: string;
  details?: string;
}

export const ErrorMessage = ({
  message,
  details,
}: Props): React.ReactElement => {
  return (
    <div className={"error"}>
      <div>{message}</div>
      {details && (
        <details>
          <summary>See details</summary>
          {details && <code>{details}</code>}
        </details>
      )}
    </div>
  );
};
