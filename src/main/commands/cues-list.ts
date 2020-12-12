import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
// import { configstore } from "../configstore";
// import { CueStateMapType, CueStateType, CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";
import { APIResponse, api } from "../core/api";

const logger = new AdvancedLogger(createLogger("cues:list"));

// const NS_UUID = "5f963e3e-b7cb-4dc1-b92e-eff9334bf884";

type CommandOptions = {
  state?: boolean;
};

// type CueWithStateType = CueType & { state: CueStateType };

export default new Command("cues:list")
  .description("list cues")
  .option("-s, --state", "display state of cues")
  .action(function(_me: Command, _options: CommandOptions) {
    logger.info("Getting cues...");
    try {
      return api
        .request("GET", "/api/cues", {
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
          },
          (err: Error) => {
            logger.error("Error listing cues.", err);
          }
        )
        .catch((err: Error) => {
          logger.error("(2) Unexpected error listing cues.", err);
        });
    } catch (e) {
      logger.error("(1) Unexpected error listing cues.", e);
      return Promise.reject(e);
    }
  });
