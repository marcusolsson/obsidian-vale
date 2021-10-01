import { App, PluginSettingTab } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ValeSettings } from "types";
import { ValeConfigManager } from "vale/ValeConfigManager";
import ValePlugin from "../main";
import { SettingsRouter } from "./SettingsRouter";

export class ValeSettingTab extends PluginSettingTab {
  private plugin: ValePlugin;
  private configManager: ValeConfigManager;
  private onSettingsChange: (settings: ValeSettings) => Promise<void>;

  constructor(app: App, plugin: ValePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    ReactDOM.render(
      <SettingsRouter
        settings={this.plugin.settings}
        onSettingsChange={async (settings: ValeSettings) => {
          this.plugin.settings = settings;
          await this.plugin.saveSettings();
        }}
        plugin={this.plugin}
      />,
      this.containerEl
    );
  }

  hide(): void {
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
