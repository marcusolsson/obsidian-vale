import { valeCheckEditorCallback } from "command";
import { Plugin } from "obsidian";
import { ValeOutput } from "types";
import { ValeResultsView, VIEW_TYPE_VALE } from "./view";

export default class ExamplePlugin extends Plugin {
  view: ValeResultsView;
  results: ValeOutput;

  async onload() {
    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) => (this.view = new ValeResultsView(leaf, this.results))
    );

    this.addCommand({
      id: "vale-check-document",
      name: "Check Document",
      editorCallback: valeCheckEditorCallback(
        this.app.vault,
        async (results) => {
          this.results = results;
          await this.activateView();
        }
      ),
    });
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
