import { AppContext, SettingsContext } from "context";
import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ValeSettings } from "types";
import { ValeCheck } from "./components/ValeCheck";

export const VIEW_TYPE_VALE = "vale";

export class ValeResultsView extends ItemView {
  settings: ValeSettings;

  constructor(leaf: WorkspaceLeaf, settings: ValeSettings) {
    super(leaf);
    this.settings = settings;
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
          <ValeCheck />
        </SettingsContext.Provider>
      </AppContext.Provider>,
      this.containerEl.children[1]
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
