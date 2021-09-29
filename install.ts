import { ValeManager } from "manager";
import { App, FuzzySuggestModal, Notice } from "obsidian";
import { ValeStyle } from "types";

export class InstallStyleModal extends FuzzySuggestModal<ValeStyle> {
  manager: ValeManager;

  constructor(app: App, manager: ValeManager) {
    super(app);
    this.manager = manager;
  }

  getItems(): ValeStyle[] {
    return this.manager.getStyles();
  }

  getItemText(style: ValeStyle): string {
    return style.name;
  }

  onChooseItem(style: ValeStyle): void {
    this.manager.installStyle(style).then(() => {
      new Notice(`Installed ${style.name}`);
    });
  }
}
