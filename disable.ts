import { ValeManager } from "manager";
import { App, FuzzySuggestModal, Notice } from "obsidian";
import { ValeStyle } from "types";

export class DisableStyleModal extends FuzzySuggestModal<ValeStyle> {
  manager: ValeManager;

  constructor(app: App, manager: ValeManager) {
    super(app);
    this.manager = manager;
  }

  getItems(): ValeStyle[] {
    return this.manager.getEnabled().map((name) => ({ name }));
  }

  getItemText(style: ValeStyle): string {
    return style.name;
  }

  onChooseItem(style: ValeStyle, evt: MouseEvent | KeyboardEvent) {
    this.manager.disableStyle(style.name).then(() => {
      new Notice(`Disabled ${style.name}`);
    });
  }
}
