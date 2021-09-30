import { ValeCli, ValeServer } from "./api";
import { timed } from "./debug";
import { ValeManager } from "./manager";
import { ValeResponse, ValeSettings } from "./types";

// The primary responsibility of the ValeRunner is to make sure only one check
// is running at any given time.
export class ValeRunner {
  settings: ValeSettings;

  // Only exists when user is using the CLI.
  manager?: ValeManager;

  constructor(settings: ValeSettings, manager?: ValeManager) {
    this.settings = settings;
    this.manager = manager;

    console.log("new runner with config", this.manager.getConfigPath());
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

// notConcurrent ensures there's only ever one promise in-flight.
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
