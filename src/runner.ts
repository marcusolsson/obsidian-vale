import { ValeCli, ValeServer } from "./api";
import { ValeManager } from "./manager";
import { ValeResponse, ValeSettings } from "./types";
import { timed } from "./utils";

export class ValeRunner {
  settings: ValeSettings;
  manager?: ValeManager;

  constructor(settings: ValeSettings, manager?: ValeManager) {
    this.settings = settings;
    this.manager = manager;
  }

  run = notConcurrent(
    async (text: string, format: string): Promise<ValeResponse> => {
      return timed("ValeRunner.run()", async () => {
        if (this.settings.type === "server") {
          return new ValeServer(this.settings.server.url).vale(text, format);
        } else if (this.settings.type === "cli") {
          const [valeExists, configExists] = await Promise.all([
            this.manager.pathExists(),
            this.manager.configPathExists(),
          ]);

          if (valeExists && configExists) {
            return new ValeCli(this.manager).vale(text, format);
          }

          if (!valeExists) {
            throw new Error("Couldn't find vale");
          }
          if (!configExists) {
            throw new Error("Couldn't find config file");
          }
        } else {
          throw new Error("Unknown runner");
        }
      });
    }
  );
}

const notConcurrent = (
  proc: (text: string, format: string) => PromiseLike<ValeResponse>
) => {
  let inFlight: Promise<ValeResponse> | false = false;

  return (text: string, format: string) => {
    if (!inFlight) {
      inFlight = (async () => {
        try {
          return await proc(text, format);
        } finally {
          inFlight = false;
        }
      })();
    }
    return inFlight;
  };
};
