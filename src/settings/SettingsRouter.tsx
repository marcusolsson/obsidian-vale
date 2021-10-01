import ValePlugin from "main";
import React from "react";
import { ValeSettings } from "../types";
import { ValeConfigManager } from "../vale/ValeConfigManager";
import { GeneralSettings } from "./GeneralSettings";
import { RuleSettings } from "./RuleSettings";
import { StyleSettings } from "./StyleSettings";

interface Props {
  settings: ValeSettings;
  onSettingsChange: (settings: ValeSettings) => void;
  plugin: ValePlugin;
}

export const SettingsRouter = ({
  settings,
  onSettingsChange,
  plugin,
}: Props): React.ReactElement => {
  const [style, setStyle] = React.useState<string>();
  const [page, setPage] = React.useState<string>("General");

  const newConfigManager = (settings: ValeSettings) =>
    new ValeConfigManager(
      settings.cli.valePath,
      plugin.normalizeConfigPath(settings.cli.configPath)
    );

  const [configManager, setConfigManager] = React.useState(
    newConfigManager(settings)
  );

  const onChange = (settings: ValeSettings) => {
    onSettingsChange(settings);
    setConfigManager(newConfigManager(settings));
  };

  switch (page) {
    case "General":
      return (
        <>
          <GeneralSettings
            settings={settings}
            onSettingsChange={(s) => onChange(s)}
          />
          <StyleSettings
            configManager={configManager}
            navigate={(page, context) => {
              setStyle(context);
              setPage(page);
            }}
          />
        </>
      );
    case "Rules":
      return (
        <RuleSettings
          style={style}
          configManager={configManager}
          navigate={(page, context) => {
            setStyle(context);
            setPage(page);
          }}
        />
      );
  }

  return <div></div>;
};
