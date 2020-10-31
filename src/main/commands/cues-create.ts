import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
import { configstore } from "../configstore";
import { CueType } from "./cues";
import { v4 as uuidv4 } from "uuid";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("cues:create"));

// const NS_UUID = "5f963e3e-b7cb-4dc1-b92e-eff9334bf884";

type CommandOptions = {
  what: string;
  how: string;
  name?: string;
};

export default new Command("cues:create")
  .description("create cue")
  .option("-n, --name <name>", "friendly name for this cue")
  .requiredOption("-w, --what <what>", "what to monitor")
  .requiredOption("-h, --how <how>", "how to monitor changes")
  .action(function(_me: Command, options: CommandOptions) {
    try {
      const cues: CueType[] = configstore.get("cues") || [];
      const cue: CueType = {
        id: uuidv4(),
        what: options.what,
        how: options.how,
        name: options.name,
        deleted: false,
        createdAt: new Date().getTime()
      };
      cues.push(cue);
      configstore.set("cues", cues);
      logger.logSuccess("Cue created!");
      // eslint-disable-next-line no-invalid-this
      // console.log("this = " + this);
      // if (!me.client) throw new Error("Command not registered with client.");
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
