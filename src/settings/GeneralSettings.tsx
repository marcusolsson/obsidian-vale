import { Setting } from "obsidian";
import React from "react";
import { ValeSettings } from "../types";

interface Props {
  settings: ValeSettings;
  onSettingsChange: (settings: ValeSettings) => void;
}

export const GeneralSettings = ({
  settings,
  onSettingsChange,
}: Props): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    (async () => {
      if (ref.current) {
        ref.current.empty();

        new Setting(ref.current)
          .setName("Use Vale Server")
          .setDesc("If disabled, you need to have the Vale CLI installed.")
          .addToggle((toggle) =>
            toggle
              .setValue(settings.type === "server")
              .onChange(async (value) => {
                onSettingsChange({
                  ...settings,
                  type: value ? "server" : "cli",
                });
              })
          );

        new Setting(ref.current)
          .setName("Server: URL")
          .setDesc("URL to your running Vale Server instance.")
          .addText((text) =>
            text
              .setPlaceholder("http://localhost:7777")
              .setValue(settings.server.url)
              .onChange(async (value) => {
                onSettingsChange({
                  ...settings,
                  server: {
                    ...settings.server,
                    url: value,
                  },
                });
              })
          );

        new Setting(ref.current)
          .setName("CLI: Path")
          .setDesc("Absolute path to the Vale binary.")
          .addText((text) => {
            const component = text
              .setPlaceholder("/usr/local/bin/vale")
              .setValue(settings.cli.valePath);

            component.inputEl.onblur = async (value) => {
              onSettingsChange({
                ...settings,
                cli: {
                  ...settings.cli,
                  valePath: (value.currentTarget as any).value,
                },
              });
            };

            return component;
          });

        new Setting(ref.current)
          .setName("CLI: Config")
          .setDesc("Absolute path to a Vale config file.")
          .addText((text) => {
            const component = text
              .setPlaceholder(".obsidian/plugins/obsidian-vale/data/.vale.ini")
              .setValue(settings.cli.configPath);

            component.inputEl.onblur = async (value) => {
              onSettingsChange({
                ...settings,
                cli: {
                  ...settings.cli,
                  configPath: (value.currentTarget as any).value,
                },
              });
            };

            return component;
          });
      }
    })();
  }, []);
  return <div ref={ref} />;
};
