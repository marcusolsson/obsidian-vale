import { Setting } from "obsidian";
import * as React from "react";
import { ValeRule, ValeRuleSeverity } from "../types";

interface Props {
  value: ValeRule;
  onChange: (rule: ValeRule) => void;
}

export const RuleSetting = ({
  value: rule,
  onChange,
}: Props): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement>();

  const [internal, setInternal] = React.useState(rule);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.empty();
      new Setting(ref.current)
        .setName(internal.name)
        .addDropdown((dropdown) =>
          dropdown
            .addOptions({
              default: "Default",
              suggestion: "Suggestion",
              warning: "Warning",
              error: "Error",
            })
            .setDisabled(!!internal?.disabled)
            .setValue(internal?.severity || "default")
            .onChange(async (value) => {
              setInternal({
                ...internal,
                severity: value as ValeRuleSeverity,
              });
              onChange({
                ...internal,
                severity: value as ValeRuleSeverity,
              });
            })
        )
        .addToggle((toggle) =>
          toggle.setValue(!internal?.disabled).onChange(async (value) => {
            setInternal({
              ...internal,
              severity: "default",
              disabled: !value,
            });
            onChange({
              ...internal,
              severity: "default",
              disabled: !value,
            });
          })
        );
    }
  }, [internal]);

  return <div ref={ref} />;
};
