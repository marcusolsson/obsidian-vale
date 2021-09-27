export interface ValeSettings {
  url: string;
}

export const DEFAULT_SETTINGS: ValeSettings = {
  url: "http://localhost:7777",
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
