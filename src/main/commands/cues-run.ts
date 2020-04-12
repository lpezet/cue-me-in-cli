import { Command } from "../command";
import * as clc from "cli-color";
import { createLogger } from "../logger";
import { configstore } from "../configstore";
import { CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";
import { CMI } from "cue-me-in";

const logger = new AdvancedLogger(createLogger("cues:delete"));

type CommandOptions = {
  all?: boolean;
  cue?: string[];
};

const commaSeparatedList = function(value: string): string[] {
  return value.split(",");
};

const run = function(cues: CueType[]): Promise<void> {
  cues.forEach(c => {
    if (c.what == null && c.how == null) {
      logger.logWarning(
        `No ${clc.bold("what")} nor ${clc.bold("how")} for cue #${
          c.id
        }. Skipping.`
      );
      return;
    }
    if (c.deleted) {
      logger.logBullet(`Not running cue #${c.id} (deleted).`);
      return;
    }
    console.log("# Here we'd be running:");
    console.log(c);
  });
  return Promise.resolve();
};

export default new Command("cues:run")
  .description("Run all cues or specific cue")
  .option(
    "-c, --cue <ids>",
    "single id or list of ids separated by a comma.",
    commaSeparatedList
  )
  .option("-a, --all", "delete all cues.")
  .action(function(_me: Command, options: CommandOptions) {
    try {
      const cues: CueType[] = configstore.get("cues") || [];
      if (options.cue != null) {
        const filteredCues = cues.filter(c => options.cue?.includes(c.id));
        return run(filteredCues);
      } else {
        return run(cues);
      }
    } catch (err) {
      logger.error(err);
      console.log(err);
      return Promise.reject(err);
    }
  });
