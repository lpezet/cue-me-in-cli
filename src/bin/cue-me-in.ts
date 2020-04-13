#!/usr/bin/env node

import * as _ from "lodash";
import * as clc from "cli-color";
import * as path from "path";
import { configstore } from "../main/configstore";
import { configureLogger } from "../main/logger";
import * as program from "commander";

// const logger = createLogger("cli");

const args = process.argv.slice(2);

const logFilename = path.join(
  path.resolve(__dirname, "../../"),
  "cue-me-in.log"
);
// const logFilename = path.join("/var/log/", "/cue-me-in.log");
const debugging = _.includes(args, "--debug");
const logLevel = process.env.DEBUG || debugging ? "debug" : "info";

configureLogger({
  appenders: {
    file: {
      type: "file",
      filename: logFilename,
      maxLogSize: 20971520,
      backups: 3
    },
    console: { type: "console", layout: { type: "messagePassThrough" } }
  },
  categories: { default: { appenders: ["file", "console"], level: logLevel } }
});

// #region Semver
// Make check for Node 6, which is no longer supported by the CLI.
import * as semver from "semver";
import * as pkg from "../../package.json";
const nodeVersion = process.version;
if (!semver.satisfies(nodeVersion, pkg.engines.node)) {
  console.error(
    "CueMeIn CLI v" +
      pkg.version +
      " is incompatible with Node.js " +
      nodeVersion +
      " Please upgrade Node.js to version " +
      pkg.engines.node
  );
  process.exit(1);
}
// #endregion

// #region Notifier
import { UpdateNotifier } from "update-notifier";
const updateNotifier = new UpdateNotifier({ pkg: pkg });
updateNotifier.notify({ defer: true, isGlobal: true });
// #endregion

// #region Check latest API version from server
// require("../fetchMOTD").default();
// #endregion

process.on("uncaughtException", function(err) {
  // console.log("######### uncaught ");
  // console.log(err);
  // (err);
  console.error("Unexpected error", err);
});
// #endregion

// #region CLI/Main
// const Fs = require("fs");
// const { yamlParse } = require("yaml-cfn");
import { Main } from "../main";
const main = new Main();

// const settings = {};
// var oSettingsFile = path.resolve(process.cwd(), "settings.yml");
// if (Fs.existsSync(oSettingsFile)) {
//  oSettings = yamlParse(Fs.readFileSync(oSettingsFile, { encoding: "utf8" }));
// }
let cmd: program.Command;
main.init().then(() => {
  cmd = main.run(process.argv);
});
// const cmd: Command = main.run(process.argv);
// #endregion

// #region On Exit and On Uncaught
process.on("exit", function(code) {
  code = process.exitCode || code;
  // if (!debugging && code < 2 && fsutils.fileExistsSync(logFilename)) {
  //  fs.unlinkSync(logFilename);
  // }

  if (code > 0 && process.stdout.isTTY) {
    const lastError = configstore.get("lastError") || 0;
    const timestamp = Date.now();
    if (lastError > timestamp - 120000) {
      let help;
      if (code === 1 && cmd) {
        const commandName = _.get(_.last(cmd.args), "_name", "[command]");
        help =
          "Having trouble? Try " +
          clc.bold("cue-me-in " + commandName + " --help");
      } else {
        help =
          "Having trouble? Try again or contact support with contents of cue-me-in-debug.log";
      }

      if (cmd) {
        console.log();
        console.log(help);
      }
    }
    configstore.set("lastError", timestamp);
  } else {
    configstore.delete("lastError");
  }
});
// require("exit-code");
