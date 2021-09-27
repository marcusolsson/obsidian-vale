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
      .setName("URL")
      .setDesc("URL to the Vale Server")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:7777")
          .setValue(this.plugin.settings.url)
          .onChange(async (value) => {
            this.plugin.settings.url = value;
            await this.plugin.saveData(this.plugin.settings);
          })
      );
  }
}
