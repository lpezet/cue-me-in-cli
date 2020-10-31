import { Command } from "../command";
import { configstore } from "../configstore";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";
import { Tokens, hasValidAccessToken, refreshAccessToken, validateIdToken } from "../core/auth2";
import TimeAgo from "javascript-time-ago";
import * as en from "javascript-time-ago/locale/en";

// Add locale-specific relative date/time formatting rules.
TimeAgo.addLocale(en);

const logger = new AdvancedLogger(createLogger("status"));
const timeAgo = new TimeAgo("en-US");

export default new Command("status")
  .description("current status of CueMeIn")
  .action(function() {
    try {
      const user = configstore.get("user");
      const tokens: Tokens = configstore.get("tokens") || {};
      const validAccessoken = hasValidAccessToken();
      logger.logBullet("User stored locally? " + (user != null));
      logger.logBullet("Valid tokens? " + validAccessoken);
      if (tokens && tokens.expires_at) {
        const expiresAt = new Date(tokens.expires_at);
        const timeDiff = expiresAt.getTime() - new Date().getTime();
        if (timeDiff < 0) {
          // already expired
          logger.logBullet("Tokens expired " + timeAgo.format(expiresAt));
        } else {
          logger.logBullet(
            "Tokens expires in " + timeAgo.format(expiresAt, "time")
          );
        }
      }
      if (user && validAccessoken) {
        logger.logLabeledSuccess("Login", "Nice! you're in!");
        return validateIdToken(tokens.id_token || "");
      } else {
        logger.logLabeledWarning(
          "Login",
          "You'll need to login in order to receive notifications."
        );
        logger.logLabeledWarning("Login", "Trying to refresh tokens...");
        return refreshAccessToken(tokens.refresh_token, tokens.scopes).then(
          (ts: Tokens) => {
            logger.info("Got new tokens: ");
            logger.info(ts);
          }
        );
      }
    } catch (err) {
      logger.error("Unexpected error checking current login status.", err);
      console.log(err);
    }
    return Promise.resolve();
  });
