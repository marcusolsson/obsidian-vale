import { ValeCli, ValeServer } from "api";
import { useApp, useSettings } from "hooks";
import { ValeManager } from "manager";
import { MarkdownView } from "obsidian";
import * as React from "react";
import { ValeAlert } from "types";
import { AlertList } from "./AlertList";
import { ErrorMessage } from "./ErrorMessage";
import { Icon } from "./Icon";
import { LoaderCube } from "./LoaderCube";

interface Props {
  manager?: ValeManager;
}

export const ValeCheck = ({ manager }: Props) => {
  const [results, setResults] = React.useState<ValeAlert[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessages, setErrorMessages] = React.useState<React.ReactNode>();

  const { type, server, cli } = useSettings();
  const { workspace } = useApp();

  const view = workspace.getActiveViewOfType(MarkdownView);

  if (!view) {
    return (
      <div>
        <h4>Nothing to check</h4>
        <p>
          Run the <strong>Vale: Check document</strong> command to check your
          document.
        </p>
      </div>
    );
  }

  const check = async () => {
    setErrorMessages(undefined);

    switch (type) {
      case "server":
        try {
          const serverResults = await new ValeServer(server.url).vale(
            view.editor.getValue(),
            "." + view.file.extension
          );

          setResults(Object.values(serverResults)[0]);
        } catch (err) {
          if (
            err instanceof Error &&
            err.message === "net::ERR_CONNECTION_REFUSED"
          ) {
            setErrorMessages(
              <ErrorMessage message={"Couldn't connect to Vale Server."} />
            );
          } else {
            setErrorMessages(<ErrorMessage message={err.toString()} />);
          }
        } finally {
          setLoading(false);
        }

        break;
      case "cli":
        const valeExists = manager.pathExists();
        const configExists = manager.configPathExists();

        if (valeExists && configExists) {
          try {
            const cliResults = await new ValeCli(manager).vale(
              view.editor.getValue(),
              "." + view.file.extension
            );
            setResults(Object.values(cliResults)[0]);
          } catch (err) {
            setErrorMessages(<ErrorMessage message={err.toString()} />);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
          setErrorMessages(
            <>
              {!valeExists && <ErrorMessage message="Couldn't find vale." />}
              {!configExists && (
                <ErrorMessage message="Couldn't find config file." />
              )}
            </>
          );
        }

        break;
    }
  };

  React.useEffect(() => {
    check();
  }, [type, server, cli, setResults]);

  if (loading) {
    return <LoaderCube />;
  }

  if (errorMessages) {
    return (
      <>
        <h4>Something went wrong ...</h4>
        {errorMessages}
      </>
    );
  }

  if (results) {
    return <AlertList alerts={results} />;
  }

  return (
    <div className="success">
      <Icon className="success-icon" name="check-in-circle" size={72} />
      <div className="success-text">{randomEncouragement()}</div>
    </div>
  );
};

const randomEncouragement = () => {
  const phrases = ["Nice! 👌", "You're awesome! 💪", "You did it! 🙌"];
  return phrases[Math.floor(Math.random() * phrases.length)];
};
