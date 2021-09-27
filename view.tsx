import { AppContext } from "app";
import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ValeOutput } from "types";
import { AlertList } from "./components/AlertList";

export const VIEW_TYPE_VALE = "vale-alerts";

export class ValeResultsView extends ItemView {
  results: ValeOutput;

  constructor(leaf: WorkspaceLeaf, results: ValeOutput) {
    super(leaf);
    this.results = results;
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
        <AlertList alerts={Object.values(this.results)[0]} />
      </AppContext.Provider>,
      this.containerEl.children[1]
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
