import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ValeApp } from "./components/ValeApp";
import { AppContext, SettingsContext } from "./context";
import { EventBus } from "./events";
import { ValeRunner } from "./runner";
import { ValeSettings } from "./types";
import { timed } from "./utils";

export const VIEW_TYPE_VALE = "vale";

// ValeView displays the results from a Vale check.
export class ValeView extends ItemView {
  settings: ValeSettings;
  runner: ValeRunner;
  eventBus: EventBus;

  ready: boolean;
  unregisterReady: () => void;

  constructor(leaf: WorkspaceLeaf, settings: ValeSettings, runner: ValeRunner) {
    super(leaf);
    this.settings = settings;
    this.runner = runner;
    this.eventBus = new EventBus();
  }

  getViewType(): string {
    return VIEW_TYPE_VALE;
  }

  getDisplayText(): string {
    return "Vale";
  }

  getIcon(): string {
    return "check-small";
  }

  async onOpen(): Promise<void> {
    // Perform a check as soon as the view is ready.
    this.unregisterReady = this.eventBus.on("ready", () => {
      this.ready = true;
      this.runValeCheck();
    });

    return timed("ValeResultsView.onOpen()", async () => {
      ReactDOM.render(
        <AppContext.Provider value={this.app}>
          <SettingsContext.Provider value={this.settings}>
            <div className="obsidian-vale">
              <ValeApp runner={this.runner} eventBus={this.eventBus} />
            </div>
          </SettingsContext.Provider>
        </AppContext.Provider>,
        this.containerEl.children[1]
      );
    });
  }

  async onClose(): Promise<void> {
    this.ready = false;
    this.unregisterReady();

    return timed("ValeResultsView.onClose()", async () => {
      ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    });
  }

  runValeCheck(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (view && this.ready) {
      this.eventBus.dispatch("check", {
        text: view.editor.getValue(),
        format: "." + view.file.extension,
      });
    }
  }
}