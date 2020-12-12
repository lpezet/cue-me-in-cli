import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
// import { configstore } from "../configstore";
// import { CueType } from "./cues";
// import { v4 as uuidv4 } from "uuid";
import { APIResponse, api } from "../core/api";

import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("cues:create"));

// const NS_UUID = "5f963e3e-b7cb-4dc1-b92e-eff9334bf884";

type CommandOptions = {
  // what: string;
  // how: string;
  title: string;
  description?: string;
};

/*
const _oldCmd = new Command("cues:create")
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
*/

export default new Command("cues:create")
  .description("create cue")
  .requiredOption("-t, --title <title>", "friendly name for this new cue")
  .option("-d, --description <description>", "description of this new cue")
  // .requiredOption("-w, --what <what>", "what to monitor")
  // .requiredOption("-h, --how <how>", "how to monitor changes")
  .action(function(_me: Command, options: CommandOptions) {
    logger.info("Getting cues...");
    try {
      return api
        .request("POST", "/api/cues", {
          origin: api.firebaseFunctionsOrigin,
          json: true,
          data: { name: options.title, description: options.description },
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
          },
          (err: Error) => {
            logger.error("Error creating cue.", err);
          }
        )
        .catch((err: Error) => {
          logger.error("(2) Unexpected error creating cue.", err);
        });
    } catch (e) {
      logger.error("(1) Unexpected error creating cue.", e);
      return Promise.reject(e);
    }
  });
