import ValePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class ValeSettingTab extends PluginSettingTab {
  plugin: ValePlugin;

  constructor(app: App, plugin: ValePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

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
  }
}
