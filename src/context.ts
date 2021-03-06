import { App } from "obsidian";
import * as React from "react";
import { ValeSettings } from "./types";

export const AppContext = React.createContext<App>(undefined);

export const SettingsContext = React.createContext<ValeSettings>(undefined);
