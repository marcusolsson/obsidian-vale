import { Icon } from "components/Icon";
import { useConfigManager } from "hooks";
import React from "react";
import { ValeRule, ValeSettings } from "types";
import { RuleSettingList } from "../components/RuleSettingList";

interface Props {
  settings: ValeSettings;
  style: string;
  navigate: (page: string, context: any) => void;
}

export const RuleSettings = ({
  settings,
  style,
  navigate,
}: Props): React.ReactElement => {
  const configManager = useConfigManager(settings);

  const [state, setState] = React.useState<ValeRule[]>([]);

  React.useEffect(() => {
    (async () => {
      const styleRules = await configManager.getRulesForStyle(style);
      const configuredRules = await configManager.getConfiguredRules(style);

      const rules = styleRules.map<ValeRule>((rule) => {
        const configured = configuredRules.find((r) => r.name === rule);
        if (configured) {
          return configured;
        }
        return {
          name: rule,
          disabled: false,
          severity: "default",
        };
      });

      setState(rules);
    })();
  }, [style]);

  return (
    <>
      <div className={"settings-page-header"}>
        <Icon
          className="setting-editor-extra-setting-button clickable-icon"
          name="left-arrow-with-tail"
          size={24}
          onClick={() => {
            navigate("General", "");
          }}
        />
        <span>Back to Vale settings</span>
      </div>
      <RuleSettingList
        rules={state}
        onChange={async (rule) => {
          await configManager.updateRule(style, rule);
        }}
      />
    </>
  );
};
