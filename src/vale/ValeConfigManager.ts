import download from "download";
import { createReadStream, createWriteStream, unlinkSync } from "fs";
import { readdir, readFile, rm, stat, writeFile } from "fs/promises";
import { parse, stringify } from "ini";
import * as path from "path";
import { Extract } from "unzipper";
import { ValeConfig, ValeRule, ValeStyle } from "../types";

// ValeManager exposes file operations for working with the Vale configuration
// file and styles.
export class ValeConfigManager {
  private path: string;
  private configPath: string;

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

  async installStyle(style: ValeStyle): Promise<void> {
    const zipPath = path.join(
      await this.getStylesPath(),
      path.basename(style.url)
    );

    const isInstalled = await stat(
      path.join(await this.getStylesPath(), style.name)
    )
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    if (isInstalled) {
      return;
    }

    return new Promise((resolve) => {
      download(style.url, { extract: true }).pipe(
        createWriteStream(zipPath).on("close", () => {
          createReadStream(zipPath)
            .pipe(Extract({ path: path.dirname(zipPath) }))
            .on("close", () => {
              unlinkSync(zipPath);
              resolve();
            });
        })
      );
    });
  }

  async uninstallStyle(style: ValeStyle): Promise<void> {
    return rm(path.join(await this.getStylesPath(), style.name), {
      force: true,
      recursive: true,
    });
  }

  async loadConfig(): Promise<ValeConfig> {
    const content = await readFile(this.configPath, "utf-8");
    return parse(content) as ValeConfig;
  }

  async saveConfig(config: ValeConfig): Promise<void> {
    return writeFile(this.configPath, stringify(config), { encoding: "utf-8" });
  }

  async getStylesPath(): Promise<string | undefined> {
    const config = await this.loadConfig();
    const stylesPath = config.StylesPath as string;

    if (!stylesPath) {
      return undefined;
    }

    return path.join(path.dirname(this.configPath), stylesPath);
  }

  async enableStyle(name: string): Promise<void> {
    const config = await this.loadConfig();

    const basedOnStyles = config["*"].md.BasedOnStyles;
    const styles = basedOnStyles.split(",").map((style) => style.trim());
    const stylesSet = new Set(styles);
    stylesSet.add(name);
    config["*"].md.BasedOnStyles = [...stylesSet].join(", ");

    return this.saveConfig(config);
  }

  async disableStyle(name: string): Promise<void> {
    const config = await this.loadConfig();

    const basedOnStyles = config["*"].md.BasedOnStyles;
    const styles = basedOnStyles.split(",").map((style) => style.trim());
    const stylesSet = new Set(styles);
    stylesSet.delete(name);
    config["*"].md.BasedOnStyles = [...stylesSet].join(", ");

    return this.saveConfig(config);
  }

  async updateRule(style: string, rule: ValeRule): Promise<void> {
    const config = await this.loadConfig();

    if (rule.disabled) {
      config["*"].md[`${style}.${rule.name}`] = "NO";
    } else if (rule.severity !== "default") {
      config["*"].md[`${style}.${rule.name}`] = rule.severity;
    } else {
      delete config["*"].md[`${style}.${rule.name}`];
    }

    return this.saveConfig(config);
  }

  async getConfiguredRules(style: string): Promise<ValeRule[]> {
    const config = await this.loadConfig();

    const md = config["*"].md;

    const rules: Record<string, ValeRule> = {};

    Object.entries(md).map(([key, value]) => {
      const identifier: string = key;
      if (identifier.startsWith(style + ".")) {
        rules[identifier.split(".")[1]] = {
          name: identifier.split(".")[1],
          severity: value === "YES" || value === "NO" ? "default" : value,
          disabled: value === "NO",
        };
      }
    });

    return Object.values(rules);
  }

  async getRulesForStyle(style: string): Promise<string[]> {
    const paths = await readdir(path.join(await this.getStylesPath(), style));

    return paths
      .map((entry) => path.parse(entry))
      .filter((path) => path.ext === ".yml")
      .map((file) => file.name);
  }

  async getInstalled(): Promise<string[]> {
    const paths = await readdir(await this.getStylesPath());

    const installed = [...paths]
      .filter((style) => style)
      .filter(async (name) => {
        const info = await stat(path.join(await this.getStylesPath(), name));
        return info.isDirectory();
      });

    return [...installed, "Vale"];
  }

  async getEnabledStyles(): Promise<string[]> {
    const config = await this.loadConfig();

    const basedOnStyles = config["*"].md.BasedOnStyles as string;

    const styles = basedOnStyles
      .split(",")
      .map((style) => style.trim())
      .filter((style) => style);

    return [...new Set(styles)];
  }

  async getAvailableStyles(): Promise<ValeStyle[]> {
    // Snatched from https://github.com/errata-ai/styles/blob/master/library.json.
    // If the FuzzySuggestModal ever gets async support, we should make a
    // request instead.
    return Promise.resolve([
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
    ]);
  }
}
