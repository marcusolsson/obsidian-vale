import { ValeCli, ValeServer } from "api";
import { stat } from "fs/promises";
import { useApp, useSettings } from "hooks";
import { MarkdownView } from "obsidian";
import * as React from "react";
import { ValeAlert } from "types";
import { AlertList } from "./AlertList";
import { ErrorMessage } from "./ErrorMessage";
import { Icon } from "./Icon";
import { LoaderCube } from "./LoaderCube";

interface Props {}

export const ValeCheck = ({}: Props) => {
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

  const precheck = async () => {
    let foundVale = false;
    let foundConfig = false;

    // Check if vale exists.
    try {
      const vale = await stat(cli.valePath);
      foundVale = vale.isFile();
    } catch (e) {
      foundVale = false;
    }

    // Check if the config file exists.
    try {
      const config = await stat(cli.configPath);
      foundConfig = config.isFile();
    } catch (e) {
      foundConfig = false;
    }

    return { vale: foundVale, config: foundConfig };
  };

  const check = async () => {
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
        try {
          const cliResults = await new ValeCli({
            valePath: cli.valePath,
            configPath: cli.configPath,
          }).vale(view.editor.getValue(), "." + view.file.extension);
          setResults(Object.values(cliResults)[0]);
        } catch (err) {
          setErrorMessages(<ErrorMessage message={err.toString()} />);
        } finally {
          setLoading(false);
        }

        break;
    }
  };

  React.useEffect(() => {
    setErrorMessages(undefined);

    precheck()
      .then((res) => {
        if (res.vale && res.config) {
          check();
        } else {
          setErrorMessages(
            <>
              {!res.vale && <ErrorMessage message="Couldn't find vale." />}
              {!res.config && (
                <ErrorMessage message="Couldn't find config file." />
              )}
            </>
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
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
