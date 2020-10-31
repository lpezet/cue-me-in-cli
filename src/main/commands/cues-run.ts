import { Command } from "../command";
import * as clc from "cli-color";
import { createLogger } from "../logger";
import { configstore } from "../configstore";
import { CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";
import { CMI, CMIClass, TransformMod, hashToHex } from "@lpezet/cue-me-in";
import { sendNotifications } from "../core/notification";

const logger = new AdvancedLogger(createLogger("cues:delete"));

type CommandOptions = {
  all?: boolean;
  cue?: string[];
};

const convenientTransform: TransformMod<any, any> = {
  transform(input: any): Promise<any> {
    // console.log("#### input type=" + typeof input);
    if (input["contentType"]) {
      switch (input.contentType) {
        case "application/json":
          return Promise.resolve(JSON.parse(input.body || "{}"));
        case "text/html":
          return Promise.resolve(input.body);
      }
    } else if (Array.isArray(input)) {
      // PsMod's PsData case
      return Promise.resolve(input[0] || {});
    }
    return Promise.reject(
      new Error(
        "HTTP Response with content-type={input.contentType} not supported."
      )
    );
  }
};

const commaSeparatedList = function(value: string): string[] {
  return value.split(",");
};

// type CueTypeMap = {
//  [key: string]: CueType;
// };

type CueStateType = {
  id: string;
  state: string;
  rawState?: string;
  updatedAt: number;
};

type CueStateMapType = {
  [key: string]: CueStateType;
};

type CueMapType = {
  [key: string]: CueType;
};

const run = function(cues: CueType[]): Promise<void> {
  const cuesStates: CueStateMapType = configstore.get("cues_states") || [];
  const cuesMap = cues.reduce(function(map: CueMapType, cue: CueType) {
    map[cue.id] = cue;
    return map;
  }, {});

  const promises: Promise<string>[] = [];
  const cueIds: string[] = [];
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
    const cue: CMIClass = CMI.builder()
      .what(c.what)
      .transform(convenientTransform)
      .how(c.how)
      .hashResult(false)
      .build();
    // Here we're expecting Promise.all() does respect the order (as specified in specs...)
    promises.push(cue.run());
    cueIds.push(c.id);
  });
  return Promise.all(promises)
    .then(results => {
      // console.log("## results=");
      // console.log(results);
      const cuesWithChanges: CueType[] = [];
      results.forEach((state: string, index: number) => {
        const stateHash: string = hashToHex(state);
        const cueId: string = cueIds[index];
        let cueState: CueStateType = cuesStates[cueId];
        if (cueState == null) {
          cueState = {
            id: cueId,
            state: stateHash,
            rawState: state,
            updatedAt: new Date().getTime()
          };
          configstore.set("cues_states." + cueId, cueState);
          logger.logSuccess(
            `State of cue #${cueId} initialized. No notifications will be sent at this point, only if further changes are detected.`
          );
        } else {
          const previousStateHash = cueState.state;
          if (previousStateHash !== stateHash) {
            console.log(
              `# State for cue #${cueId} changed! (prev=${cueState.rawState}, new=${state})`
            );
            logger.logSuccess(
              `State of cue #${cueId} changed. TODO: notifications...`
            );
            cuesWithChanges.push(cuesMap[cueId]);
          } else {
            // nop ???
          }
        }
      });
      return cuesWithChanges;
    })
    .then((cuesWithChanges: CueType[]) => {
      return sendNotifications(cuesWithChanges);
    });
};

export default new Command("cues:run")
  .description("Run all cues or specific cue")
  .option(
    "-c, --cue <ids>",
    "single id or list of ids separated by a comma. If no id specified, all non-deleted cues will be run.",
    commaSeparatedList
  )
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
