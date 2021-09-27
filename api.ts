import { request } from "obsidian";
import { ValeResponse } from "types";

export class Vale {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  async vale(text: string, format: string): Promise<ValeResponse> {
    const formData = `text=${encodeURIComponent(
      text
    )}&format=${encodeURIComponent(format)}`;

    const res = await request({
      url: this.url + "/vale",
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      body: formData,
    });

    return JSON.parse(res);
  }
}
