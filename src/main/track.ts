import * as ua from "universal-analytics";

import * as _ from "lodash";
import { configstore } from "./configstore";
import * as pkg from "../../package.json";
import * as uuid from "uuid";
import { createLogger } from "./logger";
const logger = createLogger("track");

let anonId = configstore.get("analytics-uuid");
if (!anonId) {
  anonId = uuid.v4();
  configstore.set("analytics-uuid", anonId);
}

const visitor = ua(
  process.env.FIREBASE_ANALYTICS_UA || "UA-29174744-3",
  anonId,
  {
    strictCidFormat: false,
    https: true
  }
);

visitor.set("cd1", process.platform); // Platform
visitor.set("cd2", process.version); // NodeVersion
visitor.set("cd3", process.env.FIREPIT_VERSION || "none"); // FirepitVersion

/**
 * @param action Action
 * @param label Label
 * @param duration Duration
 * @return Promise<void>
 */
export function track(
  action: string,
  label: string,
  duration = 0
): Promise<void> {
  return new Promise(function(resolve) {
    if (!_.isString(action) || !_.isString(label)) {
      logger.debug("track received non-string arguments:", action, label);
      resolve();
    }
    duration = duration || 0;

    if (configstore.get("tokens") && configstore.get("usage")) {
      visitor
        .event("CueMeIn CLI " + pkg.version, action, label, duration)
        .send(function() {
          // we could handle errors here, but we won't
          resolve();
        });
    } else {
      resolve();
    }
  });
}
