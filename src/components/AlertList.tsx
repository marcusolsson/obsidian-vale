import { MarkdownView } from "obsidian";
import * as React from "react";
import { useApp } from "../hooks";
import { ValeAlert } from "../types";
import { Alert } from "./Alert";

interface Props {
  alerts: ValeAlert[];
}

export const AlertList = ({ alerts }: Props): React.ReactElement => {
  const { workspace } = useApp();

  return (
    <>
      {alerts?.map((alert, key) => {
        return (
          <Alert
            key={key}
            alert={alert}
            onClick={(alert) => {
              const view = workspace.getActiveViewOfType(MarkdownView);

              if (view.getMode() === "source") {
                view.editor.focus();
                view.editor.setSelection(
                  {
                    line: alert.Line - 1,
                    ch: alert.Span[0] - 1,
                  },
                  {
                    line: alert.Line - 1,
                    ch: alert.Span[1],
                  }
                );
              }
            }}
          />
        );
      })}
    </>
  );
};
