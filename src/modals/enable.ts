import { App, FuzzySuggestModal, Notice } from "obsidian";
import { ValeManager } from "../manager";
import { ValeStyle } from "../types";

export class EnableStyleModal extends FuzzySuggestModal<ValeStyle> {
  manager: ValeManager;

  constructor(app: App, manager: ValeManager) {
    super(app);
    this.manager = manager;
  }

  getItems(): ValeStyle[] {
    return this.manager.getInstalled().map((name) => ({ name }));
  }

  getItemText(style: ValeStyle): string {
    return style.name;
  }

  onChooseItem(style: ValeStyle): void {
    this.manager.enableStyle(style.name).then(() => {
      new Notice(`Enabled ${style.name}`);
    });
  }
}
