import { App } from "obsidian";
import * as React from "react";

export const AppContext = React.createContext<App | undefined>(undefined);

export const useApp = (): App | null => {
  return React.useContext(AppContext);
};
