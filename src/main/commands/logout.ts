import * as _ from "lodash";
import * as clc from "cli-color";

import { Command } from "../command";
import { configstore } from "../configstore";
import * as utils from "../utils";
// const api = require("../api");
import { logout } from "../core/auth2";
// import { api } from "../core/api";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("logout"));

export default new Command("logout")
  .description("log the CLI out of CueMeIn")
  .action(function(_me: Command, options) {
    const user = configstore.get("user");
    const tokens = configstore.get("tokens");
    const currentToken = _.get(tokens, "refresh_token");
    const token = utils.getInheritedOption(options, "token") || currentToken;
    // api.setRefreshToken(token);
    // let next: Promise<any>;
    // if (token) {
    const next = logout();
    // } else {
    //  next = Promise.resolve();
    // }

    const cleanup = function(): void {
      if (token || user || tokens) {
        let msg = "Logged out";
        if (token === currentToken) {
          if (user) {
            msg += " from " + clc.bold(user.email);
          }
        } else {
          msg += ' token "' + clc.bold(token) + '"';
        }
        logger.logSuccess(msg);
      } else {
        logger.info("No need to logout, not logged in");
      }
    };

    return next.then(cleanup, function() {
      logger.logWarning("Invalid refresh token, did not need to deauthorize");
      cleanup();
    });
  });
