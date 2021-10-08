export interface ValeSettings {
  type: string;
  server: {
    url: string;
  };
  cli: {
    managed: boolean;
    valePath?: string;
    configPath?: string;
  };
}

export const DEFAULT_SETTINGS: ValeSettings = {
  type: "cli",
  server: {
    url: "http://localhost:7777",
  },
  cli: {
    managed: true,
    valePath: "",
    configPath: "",
  },
};

export interface ValeResponse {
  [key: string]: ValeAlert[];
}

// Mirror the Vale JSON output format.
export interface ValeAlert {
  Action: {
    Name: string;
    Params: string[];
  };
  Check: string;
  Description: string;
  Line: number;
  Link: string;
  Message: string;
  Severity: string;
  Span: number[];
  Match: string;
}

// Schema from https://github.com/errata-ai/styles/blob/master/library.json
export interface ValeStyle {
  name: string;
  description?: string;
  homepage?: string;
  url?: string;
}

export interface CheckInput {
  text: string;
  format: string;
}

export type ValeRuleSeverity = "default" | "suggestion" | "warning" | "error";

export interface ValeRule {
  name: string;
  severity: ValeRuleSeverity;
  disabled: boolean;
}

export interface ValeConfig {
  StylesPath?: string;
  "*": {
    md: {
      BasedOnStyles?: string;

      // Rules
      [key: string]: string;
    };
  };
}

export const DEFAULT_VALE_INI: ValeConfig = {
  StylesPath: "styles",
  "*": {
    md: {
      BasedOnStyles: "Vale",
    },
  },
};
