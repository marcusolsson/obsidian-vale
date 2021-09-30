import { MarkdownView } from "obsidian";
import * as React from "react";
import { EventBus } from "../events";
import { useApp } from "../hooks";
import { ValeRunner } from "../runner";
import { CheckInput, ValeAlert } from "../types";
import { AlertList } from "./AlertList";
import { ErrorMessage } from "./ErrorMessage";
import { Icon } from "./Icon";

interface Props {
  runner: ValeRunner;
  eventBus: EventBus;
}

interface CheckReport {
  results: ValeAlert[];
  errors?: React.ReactNode;
}

export const ValeApp = ({ runner, eventBus }: Props): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<CheckReport>({
    results: [],
  });

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

  const check = async (
    input: CheckInput,
    checked: (cb: () => void) => void
  ) => {
    const { text, format } = input;

    checked(() => {
      setLoading(true);
      setReport({
        results: [],
        errors: undefined,
      });
    });

    return runner
      .run(text, format)
      .then((response) => {
        checked(() =>
          setReport({
            ...report,
            results: Object.values(response)[0],
          })
        );
      })
      .catch((err) => {
        if (err instanceof Error) {
          if (err.message === "net::ERR_CONNECTION_REFUSED") {
            checked(() =>
              setReport({
                ...report,
                errors: (
                  <ErrorMessage message={"Couldn't connect to Vale Server."} />
                ),
              })
            );
          }
        }
        checked(() =>
          setReport({
            ...report,
            errors: <ErrorMessage message={err.toString()} />,
          })
        );
      })
      .finally(() => {
        checked(() => {
          setLoading(false);
        });
      });
  };

  React.useEffect(() => {
    let cancel = false;

    const off = (cb: () => void) => {
      if (cancel) return;
      cb();
    };

    const unregister = eventBus.on("check", (input: CheckInput): void => {
      check(input, off);
    });

    // Signal that the view is ready to check the document.
    eventBus.dispatch("ready", true);

    return () => {
      unregister();
      cancel = true;
    };
  }, [view]);

  if (loading) {
    // return <LoaderCube />;
    return <div className="loader" />;
  }

  if (report.errors) {
    return (
      <>
        <h4>Something went wrong ...</h4>
        {report.errors}
      </>
    );
  }

  if (report.results) {
    return <AlertList alerts={report.results} />;
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