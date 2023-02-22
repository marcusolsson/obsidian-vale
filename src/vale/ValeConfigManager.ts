import * as compressing from "compressing";
import download from "download";
import * as fs from "fs";
import { parse, stringify } from "ini";
import * as path from "path";
import { Extract } from "unzipper";
import { DEFAULT_VALE_INI, ValeConfig, ValeRule, ValeStyle } from "../types";

// ValeManager exposes file operations for working with the Vale configuration
// file and styles.
export class ValeConfigManager {
  private valePath: string;
  private configPath: string;

  constructor(valePath: string, configPath: string) {
    this.valePath = valePath;
    this.configPath = configPath;
  }

  getValePath(): string {
    return this.valePath;
  }

  getConfigPath(): string {
    return this.configPath;
  }

  async valePathExists(): Promise<boolean> {
    return fs.promises
      .stat(this.valePath)
      .then((stat) => stat.isFile())
      .catch(() => false);
  }

  async configPathExists(): Promise<boolean> {
    return fs.promises
      .stat(this.configPath)
      .then((stat) => stat.isFile())
      .catch(() => false);
  }

  async installStyle(style: ValeStyle): Promise<void> {
    const stylesPath = await this.getStylesPath();

    const zipPath = path.join(stylesPath, path.basename(style.url));

    const isInstalled = await fs.promises
      .stat(path.join(stylesPath, style.name))
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    if (isInstalled) {
      return;
    }

    return new Promise((resolve) => {
      download(style.url, { extract: true }).pipe(
        fs.createWriteStream(zipPath).on("close", () => {
          fs.createReadStream(zipPath)
            .pipe(Extract({ path: path.dirname(zipPath) }))
            .on("close", () => {
              fs.unlinkSync(zipPath);
              resolve();
            });
        })
      );
    });
  }

  async uninstallStyle(style: ValeStyle): Promise<void> {
    return fs.promises.rm(path.join(await this.getStylesPath(), style.name), {
      force: true,
      recursive: true,
    });
  }

  async loadConfig(): Promise<ValeConfig> {
    return parse(
      await fs.promises.readFile(this.configPath, "utf-8")
    ) as ValeConfig;
  }

  async saveConfig(config: ValeConfig): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.configPath), { recursive: true });
    return fs.promises.writeFile(this.configPath, stringify(config), {
      encoding: "utf-8",
    });
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
    const paths = await fs.promises.readdir(
      path.join(await this.getStylesPath(), style)
    );

    return paths
      .map((entry) => path.parse(entry))
      .filter((path) => path.ext === ".yml")
      .map((file) => file.name);
  }

  async getInstalled(): Promise<string[]> {
    const paths = await fs.promises.readdir(await this.getStylesPath());

    const installed = [...paths]
      .filter((style) => style)
      .filter(async (name) => {
        const info = await fs.promises.stat(
          path.join(await this.getStylesPath(), name)
        );
        return info.isDirectory();
      });

    return [...installed, "Vale"];
  }

  async getEnabledStyles(): Promise<string[]> {
    const config = await this.loadConfig();

    const styles = config["*"].md.BasedOnStyles.split(",")
      .map((style) => style.trim())
      .filter((style) => style);

    return [...new Set(styles)];
  }

  async installVale(): Promise<string> {
    const releaseUrl = (platform: string) => {
      switch (platform) {
        case "linux":
          return "https://github.com/errata-ai/vale/releases/download/v2.13.0/vale_2.13.0_Linux_64-bit.tar.gz";
        case "darwin":
          return "https://github.com/errata-ai/vale/releases/download/v2.13.0/vale_2.13.0_macOS_64-bit.tar.gz";
        case "win32":
          return "https://github.com/errata-ai/vale/releases/download/v2.13.0/vale_2.13.0_Windows_64-bit.zip";
        default:
          throw new Error("Unsupported platform");
      }
    };

    const url = releaseUrl(process.platform);

    const zipPath = path.join(
      path.dirname(this.getConfigPath()),
      path.basename(url)
    );

    const destinationPath = path.join(path.dirname(zipPath), "bin");

    try {
      const input = await download(url);
      if (process.platform === "win32") {
        await compressing.zip.uncompress(input, destinationPath);
      } else {
        await compressing.tgz.uncompress(input, destinationPath);
      }
    } catch (e) {
      console.error(e);
    }

    return path.join(
      destinationPath,
      "vale" + process.platform === "win32" ? ".exe" : ""
    );
  }

  // initializeDataPath creates a directory inside the plugin directory for
  // storing default Vale configuration.
  async initializeDataPath(): Promise<void> {
    if (!(await this.configPathExists())) {
      await this.saveConfig(DEFAULT_VALE_INI);
    }

    await fs.promises.mkdir(await this.getStylesPath(), {
      recursive: true,
    });
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
        name: "RedHat",
        description:
          "A Vale-compatible implementation of the Red Hat supplementary style guide for product documentation.",
        homepage: "https://redhat-documentation.github.io/vale-at-red-hat/docs/main/user-guide/redhat-style-for-vale/",
        url: "https://github.com/redhat-documentation/vale-at-red-hat/releases/latest/download/RedHat.zip",
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
      {
        name: "Readability",
        description:
          "Vale-compatible implementations of many popular readability metrics.",
        homepage: "https://github.com/errata-ai/Readability",
        url: "https://github.com/errata-ai/Readability/releases/latest/download/Readability.zip",
      },
      {
        name: "Openly",
        description:
          "A Vale linter style that attempts to emulate some features of the commercial, and closed source.",
        homepage: "https://github.com/testthedocs/Openly",
        url: "https://github.com/testthedocs/Openly/releases/latest/download/Openly.zip",
      },
    ]);
  }
}
