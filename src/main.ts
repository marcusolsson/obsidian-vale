import CodeMirror from "codemirror";
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

  // We need to keep the association between marker and alert, in the case
  // where the user edits the text and the spans no longer match.
  private markers: Map<CodeMirror.TextMarker, ValeAlert> = new Map<
    CodeMirror.TextMarker,
    ValeAlert
  >();

  private eventBus: EventBus = new EventBus();
  private unregisterAlerts: () => void;

  // onload runs when plugin becomes enabled.
  async onload(): Promise<void> {
    await this.loadSettings();

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
        // display a progress bar while the check runs.
        this.activateView();

        return true;
      },
    });

    this.onResult = this.onResult.bind(this);
    this.onMarkerClick = this.onMarkerClick.bind(this);
    this.onAlertClick = this.onAlertClick.bind(this);

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) =>
        (this.view = new ValeView(
          leaf,
          this.settings,
          this.runner,
          this.eventBus,
          this.onAlertClick
        ))
    );

    this.registerDomEvent(document, "pointerup", this.onMarkerClick);

    this.unregisterAlerts = this.eventBus.on("alerts", this.onResult);
  }

  // onunload runs when plugin becomes disabled.
  async onunload(): Promise<void> {
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
    this.initializeValeRunner();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.initializeValeRunner();
  }

  // initializeValeRunner rebuilds the config manager and runner. Should be run
  // whenever the settings change.
  initializeValeRunner(): void {
    this.configManager = undefined;
    if (this.settings.type === "cli") {
      if (this.settings.cli.managed) {
        this.configManager = this.newManagedConfigManager();
      } else {
        this.configManager = new ValeConfigManager(
          this.settings.cli.valePath,
          this.normalizeConfigPath(this.settings.cli.configPath)
        );
      }
    }

    this.runner = new ValeRunner(this.settings, this.configManager);

    // Detach any leaves that use the old runner.
    this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE).forEach((leaf) => {
      leaf.detach();
    });
  }

  newManagedConfigManager(): ValeConfigManager {
    const dataDir = path.join(
      this.app.vault.configDir,
      "plugins/obsidian-vale/data"
    );

    const binaryName = process.platform === "win32" ? "vale.exe" : "vale";

    return new ValeConfigManager(
      this.normalizeConfigPath(path.join(dataDir, "bin", binaryName)),
      this.normalizeConfigPath(path.join(dataDir, ".vale.ini"))
    );
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

    throw new Error("Unsupported platform");
  }

  // onResult creates markers for every alert after each new check.
  onResult(alerts: ValeAlert[]): void {
    this.withCodeMirrorEditor((editor) => {
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
    });
  }

  // onAlertClick highlights an alert in the editor when the user clicks one of
  // the cards in the results view.
  onAlertClick(alert: ValeAlert): void {
    this.withCodeMirrorEditor((editor, view) => {
      if (view.getMode() === "source") {
        const range: CodeMirror.MarkerRange = {
          from: { line: alert.Line - 1, ch: alert.Span[0] - 1 },
          to: { line: alert.Line - 1, ch: alert.Span[1] },
        };

        this.highlightRange(range);

        editor.scrollIntoView(
          range.from,
          editor.getScrollInfo().clientHeight / 2
        );

        this.eventBus.dispatch("select-alert", alert);
      }
    });
  }

  // onMarkerClick determines whether the user clicks on an existing marker in
  // the editor and highlights the corresponding alert in the results view.
  onMarkerClick(e: PointerEvent): void {
    this.withCodeMirrorEditor((editor) => {
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

      if (!editor.getWrapperElement().contains(e.target as ChildNode)) {
        return;
      }

      const lineCh = editor.coordsChar({ left: e.clientX, top: e.clientY });
      const markers = editor.findMarksAt(lineCh);

      if (markers.length === 0) {
        return;
      }

      const marker = markers[0];

      const range = marker.find() as CodeMirror.MarkerRange;

      this.highlightRange(range);

      editor.setCursor(range.to);

      this.eventBus.dispatch("select-alert", this.markers.get(marker));
    });
  }

  // highlightRange creates a highlight marker after clearing any previous
  // highlight markers.
  highlightRange(range: CodeMirror.MarkerRange): void {
    this.withCodeMirrorEditor((editor) => {
      editor
        .getAllMarks()
        .filter((mark) => mark.className.contains("vale-underline-highlight"))
        .forEach((mark) => mark.clear());

      editor.markText(range.from, range.to, {
        className: "vale-underline-highlight",
      });
    });
  }

  // withCodeMirrorEditor is a convenience function for making sure that a
  // function runs with a valid view and editor.
  withCodeMirrorEditor(
    callback: (editor: CodeMirror.Editor, view?: MarkdownView) => void
  ): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      return;
    }

    callback(view.sourceMode.cmEditor, view);
  }
}
