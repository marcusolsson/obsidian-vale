import { Plugin } from "obsidian";
import { ValeSettingTab } from "settings";
import { DEFAULT_SETTINGS, ValeResponse, ValeSettings } from "types";
import { ValeResultsView, VIEW_TYPE_VALE } from "./view";

export default class ValePlugin extends Plugin {
  settings: ValeSettings;
  view: ValeResultsView;

  results: ValeResponse;

  async onload() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());

    this.addSettingTab(new ValeSettingTab(this.app, this));

    this.addCommand({
      id: "vale-check-document",
      name: "Check document",
      callback: () => {
        this.activateView();
      },
    });

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) => (this.view = new ValeResultsView(leaf, this.settings))
    );
  }

  async onunload() {
    if (this.view) {
      await this.view.onClose();
    }

    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_VALE)
      .forEach((leaf) => leaf.detach());
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_VALE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_VALE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE)[0]
    );
  }
}
