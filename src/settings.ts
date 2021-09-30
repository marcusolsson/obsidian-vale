import { ValeManager } from "manager";
import { App, PluginSettingTab, Setting } from "obsidian";
import ValePlugin from "./main";

export class ValeSettingTab extends PluginSettingTab {
  private plugin: ValePlugin;

  constructor(app: App, plugin: ValePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Use CLI")
      .setDesc("Use Vale's CLI instead of Vale Server.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.type === "cli")
          .onChange(async (value) => {
            this.plugin.settings.type = value ? "cli" : "server";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Server: URL")
      .setDesc("URL to your running Vale Server instance.")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:7777")
          .setValue(this.plugin.settings.server.url)
          .onChange(async (value) => {
            this.plugin.settings.server.url = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("CLI: Path")
      .setDesc("Absolute path to the Vale binary.")
      .addText((text) =>
        text
          .setPlaceholder("/usr/local/bin/vale")
          .setValue(this.plugin.settings.cli.valePath)
          .onChange(async (value) => {
            this.plugin.settings.cli.valePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("CLI: Config")
      .setDesc("Absolute path to a Vale config file.")
      .addText((text) =>
        text
          .setPlaceholder("/Users/marcus/Desktop/.vale.ini")
          .setValue(this.plugin.settings.cli.configPath)
          .onChange(async (value) => {
            this.plugin.settings.cli.configPath = value;
            await this.plugin.saveSettings();
          })
      );

    // const details = containerEl.createEl("details");
    // const summary = details.createEl("summary", { text: "Rules" });

    // new Setting(details)
    //   .setName("CLI: Config")
    //   .setDesc("Absolute path to a Vale config file.")
    //   .addText((text) =>
    //     text
    //       .setPlaceholder("/Users/marcus/Desktop/.vale.ini")
    //       .setValue(this.plugin.settings.cli.configPath)
    //       .onChange(async (value) => {
    //         this.plugin.settings.cli.configPath = value;
    //         await this.plugin.saveSettings();
    //       })
    //   );

    const manager = new ValeManager(
      this.plugin.settings.cli.valePath,
      this.plugin.normalizeConfigPath(this.plugin.settings.cli.configPath)
    );

    new Setting(containerEl)
      .setHeading()
      .setName("Styles")
      .setDesc(
        "A collection of officially supported styles for Vale and Vale Server."
      );

    const allStyles = manager.getStyles();
    const enabledStyles = manager.getEnabled();

    new Setting(containerEl)
      .setName("Vale")
      .setDesc("Default style for spelling.")
      .addToggle((toggle) =>
        toggle
          .setValue(enabledStyles.contains("Vale"))
          .onChange(async (value) => {
            if (value) {
              await manager.enableStyle("Vale");
            } else {
              await manager.disableStyle("Vale");
            }
          })
      );

    allStyles.forEach((style) => {
      new Setting(containerEl)
        .setName(style.name)
        .setDesc(style.description)
        .addToggle((toggle) =>
          toggle
            .setValue(enabledStyles.contains(style.name))
            .onChange(async (value) => {
              if (value) {
                await manager.installStyle(style);
                await manager.enableStyle(style.name);
              } else {
                await manager.disableStyle(style.name);
                await manager.uninstallStyle(style);
              }
            })
        );
    });
  }
}
