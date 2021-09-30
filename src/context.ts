import { App } from "obsidian";
import * as React from "react";
import { DEFAULT_SETTINGS, ValeSettings } from "./types";

export const AppContext = React.createContext<App>(undefined);

export const SettingsContext =
  React.createContext<ValeSettings>(DEFAULT_SETTINGS);
