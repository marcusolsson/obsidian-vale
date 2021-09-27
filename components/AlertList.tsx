import { useApp } from "hooks";
import { MarkdownView } from "obsidian";
import * as React from "react";
import { ValeAlert } from "types";
import { Alert } from "./Alert";

interface Props {
  alerts: ValeAlert[];
}

export const AlertList = ({ alerts }: Props) => {
  const { workspace } = useApp();

  return (
    <>
      {alerts.map((alert, key) => {
        return (
          <Alert
            key={key}
            alert={alert}
            onClick={(alert) => {
              const view = workspace.getActiveViewOfType(MarkdownView);

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
            }}
          />
        );
      })}
    </>
  );
};
