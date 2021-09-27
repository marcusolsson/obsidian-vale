import { Editor, MarkdownView, Vault } from "obsidian";
import { ValeOutput } from "types";

export const valeCheckEditorCallback =
  (vault: Vault, onResults: (results: ValeOutput) => void) =>
  async (editor: Editor, view: MarkdownView) => {
    const text = editor.getValue();
    const format = "." + view.file.extension;
    const foo = `text=${encodeURIComponent(text)}&format=${encodeURIComponent(
      format
    )}`;

    const res = await window.fetch("http://localhost:7777/vale", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: foo,
    });

    onResults((await res.json()) as ValeOutput);
  };
