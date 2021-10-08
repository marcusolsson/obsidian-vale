import { AppContext } from "context";
import { App, PluginSettingTab } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import ValePlugin from "../main";
import { SettingsRouter } from "./SettingsRouter";

export class ValeSettingTab extends PluginSettingTab {
  private plugin: ValePlugin;

  constructor(app: App, plugin: ValePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    ReactDOM.render(
      <AppContext.Provider value={this.app}>
        <SettingsRouter plugin={this.plugin} />
      </AppContext.Provider>,
      this.containerEl
    );
  }

  hide(): void {
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
