export interface ValeOutput {
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
