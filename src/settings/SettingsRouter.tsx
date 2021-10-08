import { useConfigManager } from "hooks";
import ValePlugin from "main";
import React from "react";
import { ValeSettings } from "../types";
import { GeneralSettings } from "./GeneralSettings";
import { RuleSettings } from "./RuleSettings";
import { StyleSettings } from "./StyleSettings";

interface Props {
  plugin: ValePlugin;
}

export const SettingsRouter = ({ plugin }: Props): React.ReactElement => {
  const [settings, setSettings] = React.useState<ValeSettings>(plugin.settings);
  const [style, setStyle] = React.useState<string>();
  const [page, setPage] = React.useState<string>("General");
  const [validConfigPath, setValidConfigPath] = React.useState(false);

  const configManager = useConfigManager(settings);

  const onSettingsChange = async (settings: ValeSettings) => {
    // Write new changes to disk.
    plugin.settings = settings;
    await plugin.saveSettings();

    setSettings(settings);
  };

  React.useEffect(() => {
    if (settings.type === "cli") {
      configManager.configPathExists().then((res) => setValidConfigPath(res));
    } else {
      setValidConfigPath(false);
    }
  }, [settings]);

  switch (page) {
    case "General":
      return (
        <>
          <GeneralSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
          {validConfigPath && (
            <StyleSettings
              settings={settings}
              navigate={(page, context) => {
                setStyle(context);
                setPage(page);
              }}
            />
          )}
        </>
      );
    case "Rules":
      return (
        <RuleSettings
          settings={settings}
          style={style}
          navigate={(page, context) => {
            setStyle(context);
            setPage(page);
          }}
        />
      );
    default:
      return <div></div>;
  }
};
