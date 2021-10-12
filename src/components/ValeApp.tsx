import * as React from "react";
import { EventBus } from "../EventBus";
import { CheckInput, ValeAlert } from "../types";
import { ValeRunner } from "../vale/ValeRunner";
import { AlertList } from "./AlertList";
import { ErrorMessage } from "./ErrorMessage";
import { Icon } from "./Icon";
import { LoaderCube } from "./LoaderCube";

interface Props {
  runner: ValeRunner;
  eventBus: EventBus;
  onAlertClick: (alert: ValeAlert) => void;
}

interface CheckReport {
  results: ValeAlert[];
  errors?: React.ReactNode;
}

export const ValeApp = ({
  runner,
  eventBus,
  onAlertClick,
}: Props): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [highlightAlert, setHighlightAlert] = React.useState<ValeAlert>();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const [report, setReport] = React.useState<CheckReport>();

  const check = async (
    input: CheckInput,
    checked: (cb: () => void) => void
  ) => {
    const { text, format } = input;

    checked(() => {
      setShowOnboarding(false);
      setLoading(true);
      setReport(undefined);
    });

    return runner
      .run(text, format)
      .then((response) => {
        checked(() => {
          const results = Object.values(response)[0] ?? [];
          setReport({ ...report, results: results });
          eventBus.dispatch("alerts", results);
        });
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
          } else if (
            err.message === "Couldn't find vale" ||
            err.message === "Couldn't find config"
          ) {
            setShowOnboarding(true);
          } else {
            checked(() =>
              setReport({
                ...report,
                errors: <ErrorMessage message={err.toString()} />,
              })
            );
          }
        } else {
          checked(() =>
            setReport({
              ...report,
              errors: <ErrorMessage message={err.toString()} />,
            })
          );
        }
      })
      .finally(() => {
        checked(() => {
          setLoading(false);
        });
      });
  };

  // Highlight the alert whenever the users selects a text marker.
  React.useEffect(() => {
    const unr = eventBus.on("select-alert", (alert: ValeAlert) => {
      setHighlightAlert(alert);
    });

    const unr2 = eventBus.on("deselect-alert", () => {
      setHighlightAlert(undefined);
    });

    return () => {
      unr();
      unr2();
    };
  }, [report]);

  // Run the actual check.
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
  }, [eventBus]);

  if (loading) {
    return <LoaderCube />;
  }

  if (!report) {
    return <div></div>;
  }

  if (report.errors) {
    return (
      <>
        <h4>Something went wrong ...</h4>
        {report.errors}
      </>
    );
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  if (report.results.length) {
    return (
      <AlertList
        alerts={report.results}
        highlight={highlightAlert}
        onClick={onAlertClick}
      />
    );
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

const Onboarding = () => {
  return (
    <div className="card">
      <h2 style={{ textAlign: "center" }}>Configure Vale</h2>
      <p>
        This plugin is a graphical interface for{" "}
        <a href="https://docs.errata.ai/">Vale</a>.
      </p>
      <p>
        To check your document, you first need to configure where to find Vale.
      </p>
      <ol>
        <li>
          {"Go to "}
          <strong>Preferences</strong>
          {" -> "}
          <strong>Plugin options</strong>
          {" -> "}
          <strong>Vale</strong>
          {" to configure Vale."}
        </li>
        <li>
          {"Run the "}
          <strong>Check document</strong>
          {" command again when you're done."}
        </li>
      </ol>
    </div>
  );
};
