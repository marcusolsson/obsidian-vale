import { AppContext, SettingsContext } from "context";
import { ValeManager } from "manager";
import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ValeSettings } from "types";
import { ValeCheck } from "./components/ValeCheck";

export const VIEW_TYPE_VALE = "vale";

export class ValeResultsView extends ItemView {
  settings: ValeSettings;
  manager?: ValeManager;

  constructor(
    leaf: WorkspaceLeaf,
    settings: ValeSettings,
    manager?: ValeManager
  ) {
    super(leaf);
    this.settings = settings;
    this.manager = manager;
  }

  getViewType() {
    return VIEW_TYPE_VALE;
  }

  getDisplayText() {
    return "Vale";
  }

  getIcon() {
    return "check-small";
  }

  async onOpen() {
    ReactDOM.render(
      <AppContext.Provider value={this.app}>
        <SettingsContext.Provider value={this.settings}>
          <div className="obsidian-vale">
            <ValeCheck manager={this.manager} />
          </div>
        </SettingsContext.Provider>
      </AppContext.Provider>,
      this.containerEl.children[1]
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
