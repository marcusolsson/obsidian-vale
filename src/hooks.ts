import { App, FileSystemAdapter, Vault } from "obsidian";
import path from "path";
import * as React from "react";
import { ValeConfigManager } from "vale/ValeConfigManager";
import { AppContext, SettingsContext } from "./context";
import { ValeSettings } from "./types";

export const useApp = (): App | undefined => {
  return React.useContext(AppContext);
};

export const useSettings = (): ValeSettings => {
  return React.useContext(SettingsContext);
};

export const useConfigManager = (
  settings: ValeSettings
): ValeConfigManager | undefined => {
  const app = useApp();

  return React.useMemo(() => {
    if (settings.type === "server") {
      return undefined;
    }

    if (settings.cli.managed) {
      return newManagedConfigManager(app.vault);
    }

    return new ValeConfigManager(
      normalizePath(settings.cli.valePath, app.vault),
      normalizePath(settings.cli.configPath, app.vault)
    );
  }, [settings]);
};

const normalizePath = (resourcePath: string, vault: Vault): string => {
  if (path.isAbsolute(resourcePath)) {
    return resourcePath;
  }

  const { adapter } = vault;

  if (adapter instanceof FileSystemAdapter) {
    return adapter.getFullPath(resourcePath);
  }

  throw new Error("Unrecognized resource path");
};

const newManagedConfigManager = (vault: Vault): ValeConfigManager => {
  const dataDir = path.join(vault.configDir, "plugins/obsidian-vale/data");

  const binaryName = process.platform === "win32" ? "vale.exe" : "vale";

  return new ValeConfigManager(
    normalizePath(path.join(dataDir, "bin", binaryName), vault),
    normalizePath(path.join(dataDir, ".vale.ini"), vault)
  );
};
