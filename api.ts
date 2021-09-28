import { spawn } from "child_process";
import { request } from "obsidian";
import { ValeResponse } from "types";

export class ValeServer {
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

interface ValeCliConfig {
  valePath: string;
  configPath: string;
}

export class ValeCli {
  config: ValeCliConfig;

  constructor(config: ValeCliConfig) {
    this.config = config;
  }

  async vale(text: string, format: string): Promise<ValeResponse> {
    const child = spawn(this.config.valePath, [
      "--config",
      this.config.configPath,
      "--ext",
      format,
      "--output",
      "JSON",
    ]);

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        stdout += data;
      });

      child.stderr.on("data", (data) => {
        stderr += data;
      });
    }

    return new Promise((resolve, reject) => {
      child.on("error", (err) => reject);

      child.on("close", (code) => {
        if (code === 0) {
          // Vale exited without alerts.
          resolve({});
        } else if (code === 1) {
          // Vale returned alerts.
          resolve(JSON.parse(stdout));
        } else {
          // Vale exited unexpectedly.
          reject(new Error(`child exited with code ${code}`));
        }
      });

      child.stdin.write(text);
      child.stdin.end();
    });
  }
}
