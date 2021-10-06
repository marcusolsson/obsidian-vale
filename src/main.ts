import { EventBus } from "EventBus";
import { FileSystemAdapter, MarkdownView, Plugin } from "obsidian";
import * as path from "path";
import { ValeSettingTab } from "./settings/ValeSettingTab";
import { DEFAULT_SETTINGS, ValeAlert, ValeSettings } from "./types";
import { ValeConfigManager } from "./vale/ValeConfigManager";
import { ValeRunner } from "./vale/ValeRunner";
import { ValeView, VIEW_TYPE_VALE } from "./ValeView";

export default class ValePlugin extends Plugin {
  public settings: ValeSettings;

  private view: ValeView; // Displays the results.
  private configManager?: ValeConfigManager; // Manages operations that require disk access.
  private runner?: ValeRunner; // Runs the actual check.
  private eventBus: EventBus = new EventBus();

  private unregisterAlerts: () => void;
  private markers: Map<CodeMirror.TextMarker, ValeAlert>;

  // onload runs when plugin becomes enabled.
  async onload(): Promise<void> {
    await this.loadSettings();

    this.markers = new Map<CodeMirror.TextMarker, ValeAlert>();

    this.unregisterAlerts = this.eventBus.on(
      "alerts",
      (alerts: ValeAlert[]) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const editor = view.sourceMode.cmEditor;

        // Clear marks from previous check.
        editor.getAllMarks().forEach((mark) => mark.clear());

        alerts.forEach((alert: ValeAlert) => {
          const marker = editor.markText(
            { line: alert.Line - 1, ch: alert.Span[0] - 1 },
            { line: alert.Line - 1, ch: alert.Span[1] },
            {
              className: `vale-underline vale-${alert.Severity}`,
              clearOnEnter: false,
            }
          );

          this.markers.set(marker, alert);
        });
      }
    );

    this.addSettingTab(new ValeSettingTab(this.app, this));

    this.addCommand({
      id: "vale-check-document",
      name: "Check document",
      checkCallback: (checking) => {
        if (checking) {
          return !!this.app.workspace.getActiveViewOfType(MarkdownView);
        }

        // The Check document command doesn't actually perform the check. Since
        // a check may take some time to complete, the command only activates
        // the view and then asks the view to run the check. This lets us
        // display a progress bar, for example.
        this.activateView();

        return true;
      },
    });

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) =>
        (this.view = new ValeView(
          leaf,
          this.settings,
          this.runner,
          this.eventBus,
          (alert) => this.onAlertClick(alert)
        ))
    );

    this.registerDomEvent(document, "pointerup", (e) => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);

      if (!view) {
        return;
      }

      const editor = view.sourceMode.cmEditor;

      if (
        e.target instanceof HTMLElement &&
        !e.target.hasClass("vale-underline")
      ) {
        editor
          .getAllMarks()
          .filter((mark) => mark.className.contains("vale-underline-highlight"))
          .forEach((mark) => mark.clear());

        this.eventBus.dispatch("deselect-alert", {});
        return;
      }

      // return if element is not in the editor
      if (!editor.getWrapperElement().contains(e.target as ChildNode)) {
        return;
      }

      const lineCh = editor.coordsChar({ left: e.clientX, top: e.clientY });
      const markers = editor.findMarksAt(lineCh);

      if (markers.length === 0) {
        return;
      }

      const marker = markers[0];

      const { from, to } = marker.find() as CodeMirror.MarkerRange;

      editor
        .getAllMarks()
        .filter((mark) => mark.className.contains("vale-underline-highlight"))
        .forEach((mark) => mark.clear());

      editor.markText(from, to, {
        className: "vale-underline-highlight",
        clearOnEnter: false,
      });

      editor.setCursor(to);

      this.eventBus.dispatch("select-alert", this.markers.get(marker));
    });
  }

  // onload runs when plugin becomes disabled.
  async onunload(): Promise<void> {
    if (this.view) {
      await this.view.onClose();
    }

    // Remove all open Vale leaves.
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_VALE)
      .forEach((leaf) => leaf.detach());

    // Remove all marks from the previous check.
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.getAllMarks()
        .filter((mark) => mark.className.contains("vale-underline"))
        .forEach((mark) => mark.clear());
    });

    this.unregisterAlerts();
  }

  // activateView triggers a check and reveals the Vale view, if isn't already
  // visible.
  async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE);

    if (leaves.length === 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE_VALE,
        active: true,
      });
    }

    // Request the view to run the actual check.
    this.view.runValeCheck();

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE)[0]
    );
  }

  async saveSettings(): Promise<void> {
    this.saveData(this.settings);
    this.initialize();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
    this.initialize();
  }

  // initialize rebuilds the config manager and runner. Should be run whenever the
  // settings change.
  initialize(): void {
    this.configManager =
      this.settings.type === "cli"
        ? new ValeConfigManager(
            this.settings.cli.valePath,
            this.normalizeConfigPath(this.settings.cli.configPath)
          )
        : undefined;

    this.runner = new ValeRunner(this.settings, this.configManager);

    // Detach any leaves that use the old runner.
    this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).forEach((leaf) => {
      leaf.detach();
    });
  }

  // If config path is relative, then convert it to an absolute path.
  // Otherwise, return it as is.
  normalizeConfigPath(configPath: string): string {
    if (path.isAbsolute(configPath)) {
      return configPath;
    }

    const { adapter } = this.app.vault;

    if (adapter instanceof FileSystemAdapter) {
      return adapter.getFullPath(configPath);
    }

    throw new Error("Unrecognized config path");
  }

  onAlertClick(alert: ValeAlert): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view.sourceMode.cmEditor;

    if (view.getMode() === "source") {
      // Clear previously highlighted alert.
      editor
        .getAllMarks()
        .filter((mark) => mark.className.contains("vale-underline-highlight"))
        .forEach((mark) => mark.clear());

      editor.markText(
        {
          line: alert.Line - 1,
          ch: alert.Span[0] - 1,
        },
        {
          line: alert.Line - 1,
          ch: alert.Span[1],
        },
        {
          className: "vale-underline-highlight",
        }
      );

      editor.scrollIntoView(
        {
          line: alert.Line - 1,
          ch: alert.Span[0] - 1,
        },
        editor.getScrollInfo().clientHeight / 2
      );

      this.eventBus.dispatch("select-alert", alert);
    }
  }
}
