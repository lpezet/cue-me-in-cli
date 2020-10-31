import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
import { configstore } from "../configstore";
import { CueStateMapType, CueStateType, CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("cues:list"));

// const NS_UUID = "5f963e3e-b7cb-4dc1-b92e-eff9334bf884";

type CommandOptions = {
  state?: boolean;
};

type CueWithStateType = CueType & { state: CueStateType };

export default new Command("cues:sync")
  .description("Sync up cues with cloud")
  // .option("-s, --state", "display state of cues")
  .action(function(_me: Command, options: CommandOptions) {
    try {
      // TODO: must check first if user is logged in. If not, print message to login and quit.
      // TODO: might have to merge between cloud and local.
      // TODO: in case of conflict, maybe tell user to resolve conflict by passing option to command.
      // TODO: something like: --use-local or --use-remote

      const cues: CueType[] = configstore.get("cues") || [];
      let results: any;
      if (options.state) {
        const cuesStates: CueStateMapType = configstore.get("cues_states");
        const cuesWithState: CueWithStateType[] = [];
        cues.forEach((c: CueType) => {
          const cws: CueWithStateType = {
            ...c,
            state: cuesStates[c.id]
          };
          cuesWithState.push(cws);
        });
        results = cuesWithState;
      } else {
        results = cues;
      }
      logger.logBullet("Cues:");
      logger.info(results);
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
