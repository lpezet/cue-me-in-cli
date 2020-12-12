import { Command } from "../command";
// import * as clc from "cli-color";
// import { configstore } from "../configstore";
// import { CueType } from "./cues";
import { APIResponse, api } from "../core/api";

import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("cues:delete"));

type CommandOptions = {
  all?: boolean;
  cue?: string;
};

/*
const _oldCmd = new Command("cues:delete")
  .description("delete cue(s)")
  .option("-c, --cue <id>", "delete cue with given id.")
  .option("-a, --all", "delete all cues.")
  .action(function(_me: Command, options: CommandOptions) {
    try {
      if (options.all == null && options.cue == null) {
        logger.logWarning(
          "must specify either cue id (-c, --cue <id>) or all (-a, --all) to delete cues."
        );
        return Promise.resolve();
      }

      if (options.all) {
        configstore.set("cues", []);
        logger.logSuccess("All cues deleted!");
      } else if (options.cue != null) {
        const cues: CueType[] = configstore.get("cues") || [];
        const newCues = cues.filter(c => c.id !== options.cue);
        configstore.set("cues", newCues);
        logger.logSuccess(`Cue #${options.cue} deleted!`);
      }
      // eslint-disable-next-line no-invalid-this
      // console.log("this = " + this);
      // if (!me.client) throw new Error("Command not registered with client.");
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
*/

const deleteAllCues = function(): Promise<boolean> {
  return api
    .request("DELETE", "/api/cues", {
      origin: api.firebaseFunctionsOrigin,
      json: true,
      auth: {},
      logOptions: {
        skipQueryParams: false,
        skipRequestBody: false,
        skipResponseBody: false
      }
    })
    .then(
      (response: APIResponse) => {
        console.log("Got response!");
        console.dir(response);
        return true;
      },
      (err: Error) => {
        logger.error("Error deleting all cues.", err);
        return Promise.reject(err);
      }
    )
    .catch((err: Error) => {
      logger.error("(2) Unexpected error deleting all cues.", err);
      return Promise.reject(err);
    });
};
const deleteSingleCue = function(cueId: string): Promise<boolean> {
  return api
    .request("DELETE", "/api/cues/" + cueId, {
      origin: api.firebaseFunctionsOrigin,
      json: true,
      auth: {},
      logOptions: {
        skipQueryParams: false,
        skipRequestBody: false,
        skipResponseBody: false
      }
    })
    .then(
      (response: APIResponse) => {
        console.log("Got response!");
        console.dir(response);
        return true;
      },
      (err: Error) => {
        logger.error("Error deleting cue [%s].", cueId, err);
        return Promise.reject(err);
      }
    )
    .catch((err: Error) => {
      logger.error("(2) Unexpected error deleting cue [%s].", cueId, err);
      return Promise.reject(err);
    });
};

export default new Command("cues:delete")
  .description("delete cue(s)")
  .option("-c, --cue <id>", "delete cue with given id.")
  .option("-a, --all", "delete all cues.")
  .action(function(_me: Command, options: CommandOptions) {
    try {
      if (options.all == null && options.cue == null) {
        logger.logWarning(
          "must specify either cue id (-c, --cue <id>) or all (-a, --all) to delete cues."
        );
        return Promise.resolve();
      }

      if (options.all) {
        return deleteAllCues().then(() => {
          logger.logSuccess("All cues deleted!");
        });
      } else if (options.cue != null) {
        return deleteSingleCue(options.cue).then(() => {
          logger.logSuccess(`Cue #${options.cue} deleted!`);
        });
      }
      // eslint-disable-next-line no-invalid-this
      // console.log("this = " + this);
      // if (!me.client) throw new Error("Command not registered with client.");
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
