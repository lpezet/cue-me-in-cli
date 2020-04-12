import { configstore } from "../configstore";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";
import * as clc from "cli-color";

const logger = new AdvancedLogger(createLogger("login"));

interface LoginOptions {
  reauth: boolean;
}

export function login(options: LoginOptions): Promise<any> {
  const user = configstore.get("user");
  const tokens = configstore.get("tokens");

  if (user && tokens && !options.reauth) {
    logger.logLabeledWarning("Already logged in", clc.bold(user.email));
    return Promise.resolve(user);
  }
  return Promise.reject(new Error());
  // utils.logBullet(
  //  "Firebase optionally collects CLI usage and error reporting information to help improve our products. Data is collected in accordance with Google's privacy policy (https://policies.google.com/privacy) and is not used to identify you.\n"
  // );
}
