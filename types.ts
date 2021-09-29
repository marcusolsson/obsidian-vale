export interface ValeSettings {
  type: string;
  server: {
    url: string;
  };
  cli: {
    valePath: string;
    configPath: string;
  };
}

export const DEFAULT_SETTINGS: ValeSettings = {
  type: "server",
  server: {
    url: "http://localhost:7777",
  },
  cli: {
    valePath: "/usr/local/bin/vale",
    configPath: ".obsidian/plugins/obsidian-vale/data/.vale.ini",
  },
};

export interface ValeResponse {
  [key: string]: ValeAlert[];
}
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

export interface ValeStyle {
  name: string;
  description?: string;
  homepage?: string;
  url?: string;
}
