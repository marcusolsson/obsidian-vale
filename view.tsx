import { AppContext, SettingsContext } from "context";
import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ValeRunner } from "runner";
import { ValeSettings } from "types";
import { timed } from "utils";
import { ValeCheck } from "./components/ValeCheck";
import { EventBus } from "./events";

export const VIEW_TYPE_VALE = "vale";

export class ValeResultsView extends ItemView {
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
    this.unregisterReady = this.eventBus.on("ready", () => {
      this.ready = true;
      this.check();
    });

    return timed("ValeResultsView.onOpen()", async () => {
      ReactDOM.render(
        <AppContext.Provider value={this.app}>
          <SettingsContext.Provider value={this.settings}>
            <div className="obsidian-vale">
              <ValeCheck runner={this.runner} eventBus={this.eventBus} />
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

  check(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (view && this.ready) {
      this.eventBus.dispatch("check", {
        text: view.editor.getValue(),
        format: "." + view.file.extension,
      });
    }
  }
}
