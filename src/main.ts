import { FileSystemAdapter, MarkdownView, Plugin, Vault } from "obsidian";
import * as path from "path";
import { DisableStyleModal } from "./disable";
import { EnableStyleModal } from "./enable";
import { InstallStyleModal } from "./install";
import { ValeManager } from "./manager";
import { ValeRunner } from "./runner";
import { ValeSettingTab } from "./settings";
import { DEFAULT_SETTINGS, ValeSettings } from "./types";
import { UninstallStyleModal } from "./uninstall";
import { ValeView, VIEW_TYPE_VALE } from "./view";

export default class ValePlugin extends Plugin {
  settings: ValeSettings;
  view: ValeView;
  manager?: ValeManager;
  runner?: ValeRunner;

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
    this.manager = newValeManager(this.settings, this.app.vault);
    this.runner = new ValeRunner(this.settings, this.manager);
  }
}

const newValeManager = (
  settings: ValeSettings,
  vault: Vault
): ValeManager | undefined => {
  if (settings.type === "cli") {
    if (path.isAbsolute(settings.cli.configPath)) {
      return new ValeManager(settings.cli.valePath, settings.cli.configPath);
    } else {
      const { adapter } = vault;

      if (adapter instanceof FileSystemAdapter) {
        return new ValeManager(
          settings.cli.valePath,
          adapter.getFullPath(settings.cli.configPath)
        );
      }
    }
  }
  return undefined;
};
