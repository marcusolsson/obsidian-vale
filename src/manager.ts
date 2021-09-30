import download from "download";
import {
  createReadStream,
  createWriteStream,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { rm, stat } from "fs/promises";
import { parse, stringify } from "ini";
import * as path from "path";
import { Extract } from "unzipper";
import { ValeStyle } from "./types";

export class ValeManager {
  path: string;
  configPath: string;

  constructor(path: string, configPath: string) {
    this.path = path;
    this.configPath = configPath;
  }

  getPath(): string {
    return this.path;
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getStylesPath(): string | undefined {
    const config = parse(readFileSync(this.configPath, "utf-8"));
    const stylesPath = config.StylesPath as string;

    if (!stylesPath) {
      return undefined;
    }

    return path.join(path.dirname(this.configPath), stylesPath);
  }

  async pathExists(): Promise<boolean> {
    return stat(this.path)
      .then((stat) => stat.isFile())
      .catch(() => false);
  }

  async configPathExists(): Promise<boolean> {
    return stat(this.configPath)
      .then((stat) => stat.isFile())
      .catch(() => false);
  }

  installStyle(style: ValeStyle): Promise<void> {
    const localPath = path.join(this.getStylesPath(), path.basename(style.url));

    return new Promise((resolve) => {
      download(style.url, { extract: true }).pipe(
        createWriteStream(localPath).on("close", () => {
          createReadStream(localPath)
            .pipe(Extract({ path: path.dirname(localPath) }))
            .on("close", () => {
              unlinkSync(localPath);
              resolve();
            });
        })
      );
    });
  }

  uninstallStyle(style: ValeStyle): Promise<void> {
    const stylePath = path.join(this.getStylesPath(), style.name);
    return rm(stylePath, { recursive: true });
  }

  enableStyle(name: string): Promise<void> {
    const config = parse(readFileSync(this.configPath, "utf-8"));

    return new Promise((resolve) => {
      const basedOnStyles = config["*"]["md"].BasedOnStyles as string;
      const styles = basedOnStyles.split(",").map((style) => style.trim());
      const stylesSet = new Set(styles);
      stylesSet.add(name);
      config["*"]["md"].BasedOnStyles = [...stylesSet].join(", ");

      writeFileSync(this.configPath, stringify(config), { encoding: "utf-8" });

      resolve();
    });
  }

  disableStyle(name: string): Promise<void> {
    const config = parse(readFileSync(this.configPath, "utf-8"));

    return new Promise((resolve) => {
      const basedOnStyles = config["*"]["md"].BasedOnStyles as string;
      const styles = basedOnStyles.split(",").map((style) => style.trim());
      const stylesSet = new Set(styles);
      stylesSet.delete(name);
      config["*"]["md"].BasedOnStyles = [...stylesSet].join(", ");

      writeFileSync(this.configPath, stringify(config), { encoding: "utf-8" });

      resolve();
    });
  }

  getEnabled(): string[] {
    const config = parse(readFileSync(this.configPath, "utf-8"));
    const basedOnStyles = config["*"]["md"].BasedOnStyles as string;

    const styles = basedOnStyles
      .split(",")
      .map((style) => style.trim())
      .filter((style) => style);

    const stylesSet = new Set(styles);

    return [...stylesSet];
  }

  getInstalled(): string[] {
    const installed = [...readdirSync(this.getStylesPath())]
      .filter((style) => style)
      .filter((name) =>
        statSync(path.join(this.getStylesPath(), name)).isDirectory()
      );

    return [...installed, "Vale"];
  }

  getStyles(): ValeStyle[] {
    // Snatched from https://github.com/errata-ai/styles/blob/master/library.json.
    // If the FuzzySuggestModal ever gets async support, we should make a
    // request instead.
    return [
      {
        name: "Google",
        description:
          "A Vale-compatible implementation of the Google Developer Documentation Style Guide.",
        homepage: "https://github.com/errata-ai/Google",
        url: "https://github.com/errata-ai/Google/releases/latest/download/Google.zip",
      },
      {
        name: "Joblint",
        description:
          "Test tech job posts for issues with sexism, culture, expectations, and recruiter fails.",
        homepage: "https://github.com/errata-ai/Joblint",
        url: "https://github.com/errata-ai/Joblint/releases/latest/download/Joblint.zip",
      },
      {
        name: "Microsoft",
        description:
          "A Vale-compatible implementation of the Microsoft Writing Style Guide.",
        homepage: "https://github.com/errata-ai/Microsoft",
        url: "https://github.com/errata-ai/Microsoft/releases/latest/download/Microsoft.zip",
      },
      {
        name: "proselint",
        description:
          "proselint places the world’s greatest writers and editors by your side, where they whisper suggestions on how to improve your prose.",
        homepage: "https://github.com/errata-ai/proselint",
        url: "https://github.com/errata-ai/proselint/releases/latest/download/proselint.zip",
      },
      {
        name: "write-good",
        description:
          "Naive linter for English prose for developers who can't write good and wanna learn to do other stuff good too.",
        homepage: "https://github.com/errata-ai/write-good",
        url: "https://github.com/errata-ai/write-good/releases/latest/download/write-good.zip",
      },
      {
        name: "alex",
        description: "Catch insensitive, inconsiderate writing.",
        homepage: "https://github.com/errata-ai/alex",
        url: "https://github.com/errata-ai/alex/releases/latest/download/alex.zip",
      },
    ];
  }
}
