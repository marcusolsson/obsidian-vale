import { Setting } from "obsidian";
import React from "react";
import { ValeStyle } from "../types";
import { ValeConfigManager } from "../vale/ValeConfigManager";

interface Props {
  configManager: ValeConfigManager;
  navigate: (page: string, context: any) => void;
}

export const StyleSettings = ({
  configManager,
  navigate,
}: Props): React.ReactElement => {
  const [installedStyles, setInstalledStyles] = React.useState<ValeStyle[]>([]);
  const [enabledStyles, setEnabledStyles] = React.useState<string[]>([]);
  const [error, setError] = React.useState(false);

  const ref = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    (async () => {
      setError(false);

      try {
        setInstalledStyles(await configManager.getAvailableStyles());
        setEnabledStyles(await configManager.getEnabledStyles());
      } catch (err) {
        setError(true);
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

  return error ? (
    <small className="mod-warning">{"Couldn't find any styles."}</small>
  ) : (
    <div ref={ref} />
  );
};
