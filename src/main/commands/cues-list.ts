import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
import { configstore } from "../configstore";
import { CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("cues:list"));

// const NS_UUID = "5f963e3e-b7cb-4dc1-b92e-eff9334bf884";

export default new Command("cues:list")
  .description("create cue")
  .action(function(_me: Command) {
    try {
      const cues: CueType[] = configstore.get("cues") || [];
      logger.logBullet("Cues:");
      logger.info(cues);
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
