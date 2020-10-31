import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
import { CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";
import { sendNotifications } from "../core/notification";

const logger = new AdvancedLogger(createLogger("tests:notification"));

export default new Command("tests:notification")
  .description("test notifications")
  .action(function(_me: Command) {
    try {
      const cues: CueType[] = [
        {
          id: "some-cue-id",
          createdAt: new Date().getTime(),
          deleted: false,
          how: "somehow",
          what: "somewhat"
        }
      ];

      return sendNotifications(cues);
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
