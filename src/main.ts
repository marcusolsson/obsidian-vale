import { FileSystemAdapter, MarkdownView, Plugin } from "obsidian";
import * as path from "path";
import { ValeManager } from "./manager";
import { DisableStyleModal } from "./modals/disable";
import { EnableStyleModal } from "./modals/enable";
import { InstallStyleModal } from "./modals/install";
import { UninstallStyleModal } from "./modals/uninstall";
import { ValeRunner } from "./runner";
import { ValeSettingTab } from "./settings";
import { DEFAULT_SETTINGS, ValeSettings } from "./types";
import { ValeView, VIEW_TYPE_VALE } from "./view";

export default class ValePlugin extends Plugin {
  settings: ValeSettings;

  view: ValeView; // Displays the results.
  manager?: ValeManager; // Manages operations that require disk access.
  runner?: ValeRunner; // Runs the actual check.

  // onload runs when plugin becomes enabled.
  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new ValeSettingTab(this.app, this));

    this.addCommands();

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) => (this.view = new ValeView(leaf, this.settings, this.runner))
    );
  }

  // onload runs when plugin becomes disabled.
  async onunload(): Promise<void> {
    if (this.view) {
      await this.view.onClose();
    }

    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_VALE)
      .forEach((leaf) => leaf.detach());
  }

  addCommands(): void {
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

    this.addCommand({
      id: "vale-uninstall-style",
      name: "Uninstall style",
      checkCallback: (checking) => {
        if (checking) {
          return this.settings.type === "cli";
        }

        new UninstallStyleModal(this.app, this.manager).open();

        return true;
      },
    });

    this.addCommand({
      id: "vale-install-style",
      name: "Install style",
      checkCallback: (checking) => {
        if (checking) {
          return this.settings.type === "cli";
        }

        new InstallStyleModal(this.app, this.manager).open();

        return true;
      },
    });

    this.addCommand({
      id: "vale-enable-style",
      name: "Enable style",
      checkCallback: (checking) => {
        if (checking) {
          return this.settings.type === "cli";
        }

        new EnableStyleModal(this.app, this.manager).open();

        return true;
      },
    });

    this.addCommand({
      id: "vale-disable-style",
      name: "Disable style",
      checkCallback: (checking) => {
        if (checking) {
          return this.settings.type === "cli";
        }

        new DisableStyleModal(this.app, this.manager).open();

        return true;
      },
    });
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

  // initialize rebuilds the manager and runner. Should be run whenever the
  // settings change.
  initialize(): void {
    this.manager =
      this.settings.type === "cli"
        ? new ValeManager(
            this.settings.cli.valePath,
            this.normalizeConfigPath(this.settings.cli.configPath)
          )
        : undefined;

    this.runner = new ValeRunner(this.settings, this.manager);

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
}
