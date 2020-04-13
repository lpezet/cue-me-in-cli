// import previews from "../previews";
// import Command from "../command";
import { CLIClient } from "../cliclient";
import { createLogger } from "../logger";
import { Command } from "../command";

import { default as HelpCmd } from "./help";
import { default as LoginCmd } from "./login";
import { default as LogoutCmd } from "./logout";
import { default as CuesCreateCmd } from "./cues-create";
import { default as CuesDeleteCmd } from "./cues-delete";
import { default as CuesListCmd } from "./cues-list";
import { default as CuesRunCmd } from "./cues-run";
import {
  Install as CronInstallCmd,
  Uninstall as CronUninstallCmd
} from "./cron";

const logger = createLogger("commands");
// import { any } from "async";
// const previews = require("../previews"); //eslint-disable-line

const doImport = function(name: string): Promise<any> {
  return import("./" + name);
};

class CommandWithDefault extends Command {
  default?: Command;
}

const register = (client: CLIClient) => {
  return (cmd: CommandWithDefault): (() => Promise<any>) => {
    return (): Promise<any> => {
      if (cmd.default) cmd = cmd.default;
      if (logger.isDebugEnabled()) {
        logger.debug(`# commands: command [${cmd.name}] imported...`);
      }
      cmd.register(client);
      if (logger.isDebugEnabled()) {
        logger.debug(`# commands: command [${cmd.name}] registered...`);
      }
      return Promise.resolve(cmd.runner());
    };
  };
};

/**
 * @param client
 * @return Promise<any>
 */
export async function loadAll(client: CLIClient): Promise<any> {
  const reg = register(client);
  return Promise.resolve()
    .then(reg(HelpCmd))
    .then(reg(LoginCmd))
    .then(reg(LogoutCmd))
    .then(reg(CuesCreateCmd))
    .then(reg(CuesDeleteCmd))
    .then(reg(CuesListCmd))
    .then(reg(CuesRunCmd))
    .then(reg(CronInstallCmd))
    .then(reg(CronUninstallCmd));
}

/**
 * So far, this is not working...
 *
 * @param client CLIClient
 * @return Promise<any>
 */
export async function loadAllDynamic(client: CLIClient): Promise<any> {
  return doImport("help")
    .then(register(client), err => {
      logger.error("Error loading command [help].", err);
    })
    .catch(err => {
      logger.error("Unexpected error loading command [help].", err);
    });
  // return client;
}
