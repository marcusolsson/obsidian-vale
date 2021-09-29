import { DisableStyleModal } from "disable";
import { EnableStyleModal } from "enable";
import { InstallStyleModal } from "install";
import { ValeManager } from "manager";
import { FileSystemAdapter, MarkdownView, Plugin } from "obsidian";
import * as path from "path";
import { ValeRunner } from "runner";
import { ValeSettingTab } from "settings";
import { DEFAULT_SETTINGS, ValeResponse, ValeSettings } from "types";
import { UninstallStyleModal } from "uninstall";
import { ValeResultsView, VIEW_TYPE_VALE } from "./view";

export default class ValePlugin extends Plugin {
  settings: ValeSettings;
  view: ValeResultsView;
  manager?: ValeManager;
  runner?: ValeRunner;

  results: ValeResponse;

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

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) =>
        (this.view = new ValeResultsView(leaf, this.settings, this.runner))
    );
  }

  async onunload(): Promise<void> {
    if (this.view) {
      await this.view.onClose();
    }

    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_VALE)
      .forEach((leaf) => leaf.detach());
  }

  async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE);

    if (leaves.length === 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE_VALE,
        active: true,
      });
    }

    this.view.check();

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE)[0]
    );
  }

  async saveSettings(): Promise<void> {
    this.saveData(this.settings);
    this.updateManager();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
    this.updateManager();
  }

  updateManager(): void {
    this.manager = undefined;

    if (this.settings.type === "cli") {
      if (path.isAbsolute(this.settings.cli.configPath)) {
        this.manager = new ValeManager(
          this.settings.cli.valePath,
          this.settings.cli.configPath
        );
      } else {
        const { adapter } = this.app.vault;

        if (adapter instanceof FileSystemAdapter) {
          this.manager = new ValeManager(
            this.settings.cli.valePath,
            adapter.getFullPath(this.settings.cli.configPath)
          );
        }
      }
    }

    this.runner = new ValeRunner(this.settings, this.manager);
  }
}
