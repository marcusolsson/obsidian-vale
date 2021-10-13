import { useConfigManager } from "hooks";
import { Setting } from "obsidian";
import * as React from "react";
import { LoaderCube } from "../components/LoaderCube";
import { ValeSettings } from "../types";

interface Props {
  settings: ValeSettings;
  onSettingsChange: (settings: ValeSettings) => void;
}

export const GeneralSettings = ({
  settings,
  onSettingsChange,
}: Props): React.ReactElement => {
  const [onboarding, setOnboarding] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>();
  const configManager = useConfigManager(settings);

  // Check whether the user have configured a path to a valid config file.
  React.useEffect(() => {
    if (settings.type === "cli") {
      configManager.valePathExists().then((exists) => setOnboarding(!exists));
    }
  }, [settings, configManager]);

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

        if (settings.type === "server") {
          new Setting(ref.current)
            .setName("Server URL")
            .setDesc("Address to a running Vale Server instance.")
            .addText((text) => {
              const component = text
                .setValue(settings.server.url)
                .setPlaceholder("http://localhost:7777");

              component.inputEl.onblur = async (value) => {
                onSettingsChange({
                  ...settings,
                  server: {
                    ...settings.server,
                    url: (value.currentTarget as any).value,
                  },
                });
              };

              return component;
            });
        } else {
          new Setting(ref.current)
            .setName("Use managed Vale CLI")
            .setDesc(
              "Install Vale to your vault. Disable if you want to use an existing Vale configuration."
            )
            .addToggle((toggle) =>
              toggle.setValue(settings.cli.managed).onChange((managed) => {
                onSettingsChange({
                  ...settings,
                  cli: { ...settings.cli, managed },
                });
              })
            );

          if (!settings.cli.managed) {
            new Setting(ref.current)
              .setName("Vale path")
              .setDesc("Absolute path to the Vale binary.")
              .addText((text) => {
                const component = text.setValue(settings.cli.valePath);

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
              .setName("Config path")
              .setDesc("Absolute path to a Vale config file.")
              .addText((text) => {
                const component = text.setValue(settings.cli.configPath);

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
        }
      }
    })();
  }, [settings]);

  return (
    <>
      {onboarding && (
        <Onboarding settings={settings} onSettingsChange={onSettingsChange} />
      )}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <small>
          {"If you found this plugin useful, you can "}
          <a href="https://www.buymeacoffee.com/marcusolsson">
            buy me a coffee
          </a>
          {" to support its continued development."}
        </small>
      </div>
      <div ref={ref} />
    </>
  );
};

interface OnboardingProps {
  settings: ValeSettings;
  onSettingsChange: (settings: ValeSettings) => void;
}

export const Onboarding = ({
  settings,
  onSettingsChange,
}: OnboardingProps): React.ReactElement => {
  const configManager = useConfigManager(settings);
  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <h2>{"Get started with Vale"}</h2>
      <p>
        This plugin is a graphical interface for{" "}
        <a href="https://docs.errata.ai">Vale</a>. To use this plugin, you first
        need to set up Vale.
      </p>
      <p>
        <strong>{"If this is your first time using Vale"}</strong>, you can use{" "}
        <em>managed mode</em> to install the Vale CLI to your vault, for minimal
        configuration.
      </p>
      {settings.cli.managed ? (
        <DownloadButton
          onInstall={async () => {
            await configManager.initializeDataPath();
            await configManager.installVale();
          }}
          onInstalled={() => onSettingsChange({ ...settings })}
        />
      ) : (
        <button
          onClick={() =>
            onSettingsChange({
              ...settings,
              cli: {
                ...settings.cli,
                managed: true,
              },
            })
          }
        >
          Enable managed mode
        </button>
      )}
      <p>
        <strong>{"If you're already using Vale"}</strong>
        {
          ", you can configure the URL to a running Vale Server, or disable managed Vale CLI to configure the paths to an existing Vale CLI installation."
        }
      </p>
    </div>
  );
};

interface DownloadButtonProps {
  onInstall: () => Promise<void>;
  onInstalled: () => void;
}

export const DownloadButton = ({
  onInstall,
  onInstalled,
}: DownloadButtonProps): React.ReactElement => {
  const [downloading, setDownloading] = React.useState(false);

  return downloading ? (
    <LoaderCube />
  ) : (
    <button
      style={{ marginBottom: "1rem" }}
      className="mod-cta"
      onClick={async () => {
        setDownloading(true);

        try {
          await onInstall();
        } finally {
          setDownloading(false);
          onInstalled();
        }
      }}
    >
      Install Vale to vault
    </button>
  );
};
