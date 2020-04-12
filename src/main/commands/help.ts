import { Command } from "../command";
import * as clc from "cli-color";
import { createLogger } from "../logger";

const logger = createLogger("help");

export default new Command("help [command]")
  .description("display help information")
  // .action(function(command: string) {
  //  console.log("### help command for command: " + command);
  // });
  .action(function(me: Command, commandName: string) {
    try {
      // eslint-disable-next-line no-invalid-this
      // console.log("this = " + this);
      if (!me.client) throw new Error("Command not registered with client.");
      const cmd = me.client.getCliCommand(commandName);
      if (cmd) {
        cmd.outputHelp();
      } else if (commandName) {
        // logger.warn("");
        // utils.logWarning(
        logger.warn(
          clc.bold(commandName) +
            " is not a valid command. See below for valid commands"
          // "warn"
          // logger
        );
        me.client.cli.outputHelp();
      } else {
        me.client.cli.outputHelp();
        // logger.info("");
        logger.info(
          "  To get help with a specific command, type",
          clc.bold("cue-me-in help [command_name]")
        );
        // logger.info("");
      }
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
    return Promise.resolve();
  });
