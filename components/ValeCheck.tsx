import { Vale } from "api";
import { useApp, useSettings } from "hooks";
import { MarkdownView } from "obsidian";
import * as React from "react";
import { ValeAlert, ValeResponse } from "types";
import { AlertList } from "./AlertList";
import { LoaderCube } from "./LoaderCube";

interface Props {}

export const ValeCheck = ({}: Props) => {
  const [results, setResults] = React.useState<ValeAlert[]>([]);
  const [loading, setLoading] = React.useState(false);

  const { url } = useSettings();
  const { workspace } = useApp();

  const view = workspace.getActiveViewOfType(MarkdownView);

  if (!view) {
    return <p>Unable to run</p>;
  }

  React.useEffect(() => {
    setLoading(true);

    new Vale(url)
      .vale(view.editor.getValue(), "." + view.file.extension)
      .then((res) => {
        setResults(Object.values(res as ValeResponse)[0]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  return loading ? <LoaderCube /> : <AlertList alerts={results} />;
};
