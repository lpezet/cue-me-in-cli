import * as program from "commander";
import { CLIClient } from "./cliclient";
import { Command } from "./command";
import { CueMeInError } from "./error";
// import * as pkg from "../../package.json";
import { loadAll } from "./commands";

import { createLogger } from "./logger";
const LOGGER = createLogger("main");

const client: CLIClient = {
  cli: program,
  commands: {},
  errorOut: function(error: Error): void {
    let fbError: CueMeInError;
    if (error instanceof CueMeInError) {
      fbError = error;
    } else {
      fbError = new CueMeInError("An unexpected error has occurred.", {
        original: error,
        exit: 2
      });
    }

    LOGGER.error(fbError);
    process.exitCode = fbError.exit || 2;
    setTimeout(() => {
      process.exit();
    }, 250);
  },
  getCliCommand: function(name: string): program.Command | null {
    for (let i = 0; i < this.cli.commands.length; i++) {
      if (this.cli.commands[i]._name === name) {
        return this.cli.commands[i];
      }
    }
    return null;
  },
  getCommand: function(name: string): Command | null {
    return this.commands[name];
  }
};

export class Main {
  // constructor() {}
  init(): Promise<void> {
    // program.version(pkg.version).description("For manual, use man cue-me-in");
    // .option(
    //  "-l, --log-level [level]",
    //  "Specify log level: emerg (0), alert (1), crit (2), error (3), warning (4), notice (5), info (6), debug (7)"
    // );
    return loadAll(client);
  }
  run(args: string[]): program.Command {
    // const opts: program.ParseOptions = new program.ParseOptions();
    // console.log("# args = " + args);
    return program.parse(args);
  }
}
