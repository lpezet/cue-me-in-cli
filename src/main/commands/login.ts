import { Command } from "../command";
import { configstore } from "../configstore";
import * as clc from "cli-color";
import * as utils from "../utils";
import { prompt } from "../prompt";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("login"));

// import { login } from "../core/auth";
import { login } from "../core/auth2";

export default new Command("login")
  .description("log the CLI into CueMeIn")
  .option(
    "--no-localhost",
    "copy and paste a code instead of starting a local server for authentication"
  )
  .option("--reauth", "force reauthentication even if already logged in")
  .action(function(_me: Command, options) {
    if (options.nonInteractive) {
      return utils.reject(
        "Cannot run login in non-interactive mode. See " +
          clc.bold("login:ci") +
          " to generate a token for use in non-interactive environments.",
        { exit: 1 }
      );
    }
    try {
      const user = configstore.get("user");
      const tokens = configstore.get("tokens");

      if (user && tokens && !options.reauth) {
        logger.logSuccess("Already logged in as " + clc.bold(user.email));
        return Promise.resolve(user);
      }
    } catch (err) {
      console.log(err);
    }

    // utils.logBullet(
    logger.logBullet(
      "CueMeIn optionally collects CLI usage and error reporting information to help improve our products. Data is collected in accordance with CueMeIn's privacy policy (https://www.cue-me-in.com/privacy) and is not used to identify you.\n"
    );
    return prompt(options, [
      {
        type: "confirm",
        name: "collectUsage",
        message:
          "Allow CueMeIn to collect CLI usage and error reporting information?"
      }
    ])
      .then(function() {
        configstore.set("usage", options.collectUsage);
        if (options.collectUsage) {
          // utils.logBullet(
          logger.info(
            "To change your data collection preference at any time, run `cue-me-in logout` and log in again."
          );
        }
        return login(options.localhost);
      })
      .then(function(result: any) {
        configstore.set("user", result.user);
        configstore.set("tokens", result.tokens);
        // store login scopes in case mandatory scopes grow over time
        configstore.set("loginScopes", result.scopes);
        // remove old session token, if it exists
        configstore.delete("session");

        // logger.info();
        // utils.logSuccess(
        logger.logSuccess(
          "Success! Logged in as " + clc.bold(result.user.email)
        );
      });
  });
