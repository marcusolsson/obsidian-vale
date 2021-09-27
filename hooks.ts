import { AppContext, SettingsContext } from "context";
import { App } from "obsidian";
import * as React from "react";
import { ValeSettings } from "types";

export const useApp = (): App | undefined => {
  return React.useContext(AppContext);
};

export const useSettings = (): ValeSettings => {
  return React.useContext(SettingsContext);
};
