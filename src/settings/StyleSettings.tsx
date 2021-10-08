import { useConfigManager } from "hooks";
import { Setting } from "obsidian";
import React from "react";
import { ValeSettings, ValeStyle } from "../types";

interface Props {
  settings: ValeSettings;
  navigate: (page: string, context: any) => void;
}

export const StyleSettings = ({
  settings,
  navigate,
}: Props): React.ReactElement => {
  const [installedStyles, setInstalledStyles] = React.useState<ValeStyle[]>([]);
  const [enabledStyles, setEnabledStyles] = React.useState<string[]>([]);
  const ref = React.useRef<HTMLDivElement>();

  const configManager = useConfigManager(settings);

  React.useEffect(() => {
    (async () => {
      try {
        if (configManager && (await configManager.configPathExists())) {
          setInstalledStyles(await configManager.getAvailableStyles());
          setEnabledStyles(await configManager.getEnabledStyles());
        }
      } catch (err) {
        console.error(err);
        return;
      }
    })();
  }, [configManager]);

  if (ref.current) {
    ref.current.empty();

    new Setting(ref.current)
      .setHeading()
      .setName("Styles for Vale CLI")
      .setDesc("A collection of officially supported styles.");

    new Setting(ref.current)
      .setName("Vale")
      .setDesc("Default style for spelling.")
      .addExtraButton((button) =>
        button
          .setDisabled(true)
          .setIcon("gear")
          .setTooltip(
            "Rule management for the Vale style is coming in a future release."
          )
          .onClick(() => {
            // navigate("Rules", "Vale");
          })
      )
      .addToggle((toggle) =>
        toggle
          .setValue(enabledStyles.contains("Vale"))
          .onChange(async (value) => {
            if (value) {
              await configManager.enableStyle("Vale");

              const newstyles = new Set(enabledStyles);
              newstyles.add("Vale");
              setEnabledStyles([...newstyles]);
            } else {
              await configManager.disableStyle("Vale");

              const newstyles = new Set(enabledStyles);
              newstyles.delete("Vale");
              setEnabledStyles([...newstyles]);
            }
            setInstalledStyles(installedStyles);
          })
      );

    installedStyles.forEach((style) => {
      const setting = new Setting(ref.current)
        .setName(style.name)
        .setDesc(style.description);

      if (enabledStyles.contains(style.name)) {
        setting.addExtraButton((button) =>
          button.setIcon("gear").onClick(() => {
            navigate("Rules", style.name);
          })
        );
      }

      setting.addToggle((toggle) =>
        toggle
          .setValue(enabledStyles.contains(style.name))
          .onChange(async (enabled) => {
            if (enabled) {
              await configManager.installStyle(style);
              await configManager.enableStyle(style.name);

              const newstyles = new Set(enabledStyles);
              newstyles.add(style.name);
              setEnabledStyles([...newstyles]);
            } else {
              await configManager.disableStyle(style.name);
              await configManager.uninstallStyle(style);

              const newstyles = new Set(enabledStyles);
              newstyles.delete(style.name);
              setEnabledStyles([...newstyles]);
            }
          })
      );
    });
  }

  return <div ref={ref} />;
};
