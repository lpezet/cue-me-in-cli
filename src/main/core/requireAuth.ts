import * as clc from "cli-color";

import autoAuth from "google-auto-auth";

import { api } from "./api";
import { configstore } from "../configstore";
import { CueMeInError } from "../error";
import { createLogger } from "../logger";
// import { c } from "tar";
import * as utils from "../utils";
// import { Scopes } from "./scopes";

const logger = createLogger("requireAuth");

const AUTH_ERROR = new CueMeInError(
  "Command requires authentication, please run " + clc.bold("cue-me-in login")
);

/**
 * @param _options Options
 * @param authScopes authScopes
 * @return Promise<void>
 */
function _autoAuth(_options: any, authScopes: string[]): Promise<void> {
  return new Promise(function(resolve, reject) {
    logger.debug("> attempting to authenticate via app default credentials");
    autoAuth({ scopes: authScopes }).getToken(function(err: Error, token) {
      if (err) {
        logger.debug("! auto-auth error:", err.message);
        logger.debug(
          "> no credentials could be found or automatically retrieved"
        );
        return reject(AUTH_ERROR);
      }

      logger.debug(token);
      logger.debug("> retrieved access token via default credentials");
      api.setAccessToken(token);
      resolve();
    });
  });
}

module.exports = function(options: any) {
  // api.setScopes([Scopes.CLOUD_PLATFORM, Scopes.FIREBASE_PLATFORM]);
  options.authScopes = api.getScopes();

  const tokens = configstore.get("tokens");
  const user = configstore.get("user");

  let tokenOpt = utils.getInheritedOption(options, "token");
  if (tokenOpt) {
    logger.debug("> authorizing via --token option");
  } else if (process.env.FIREBASE_TOKEN) {
    logger.debug("> authorizing via FIREBASE_TOKEN environment variable");
  } else if (user) {
    logger.debug("> authorizing via signed-in user");
  } else {
    return _autoAuth(options, options.authScopes);
  }

  tokenOpt = tokenOpt || process.env.FIREBASE_TOKEN;

  if (tokenOpt) {
    api.setRefreshToken(tokenOpt);
    return Promise.resolve();
  }

  if (!user || !tokens) {
    return new Promise(function(_resolve, reject) {
      if (configstore.get("session")) {
        return reject(
          new CueMeInError(
            "This version of CueMeIn CLI requires reauthentication.\n\nPlease run " +
              clc.bold("cue-me-in login") +
              " to regain access."
          )
        );
      }
      return reject(AUTH_ERROR);
    });
  }

  options.user = user;
  options.tokens = tokens;
  api.setRefreshToken(tokens.refresh_token);
  return Promise.resolve();
};
