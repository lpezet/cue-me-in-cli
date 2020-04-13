import { Command } from "../command";
// import * as clc from "cli-color";
import { createLogger } from "../logger";
// import { configstore } from "../configstore";
// import { CueType } from "./cues";
import { AdvancedLogger } from "../advanced-logger";
import { CronTab, load as cronTabLoad } from "crontab";
import * as path from "path";

const logger = new AdvancedLogger(createLogger("cron:install"));

const CMD_UUID = "c38283f0-63ee-47df-8996-7a2fb8db593d";

export const Uninstall = new Command("cron:uninstall")
  .description("uninstall cron")
  .action(function(_me: Command) {
    return new Promise((resolve, reject) => {
      try {
        cronTabLoad((err: Error, crontab: CronTab) => {
          if (err) {
            console.log("#cron-instal: error!!!");
            console.log(err);
            return reject(err);
          }

          crontab.remove({ comment: CMD_UUID });
          // save
          crontab.save(err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (err) {
        logger.error(err);
        console.log(err);
        reject(err);
      }
    });
  });

export const Install = new Command("cron:install")
  .description("install cron")
  .action(function(_me: Command) {
    return new Promise((resolve, reject) => {
      try {
        cronTabLoad((err: Error, crontab: CronTab) => {
          if (err) {
            console.log("#cron-instal: error!!!");
            console.log(err);
            return reject(err);
          }

          crontab.remove({ comment: CMD_UUID });

          const nodePath = process.execPath
            .split("/")
            .slice(0, -1)
            .join("/");
          const exportCommand = "export PATH=" + nodePath + ":$PATH";
          /*
          const foreverCommand = require("path").join(
            __dirname,
            "node_modules",
            "forever",
            "bin",
            "forever"
          );
          const sysCommand =
            exportCommand + " && " + foreverCommand + " start " + __filename;
            
          console.log("uuid=" + uuid);
          console.log("nodePah=" + nodePath);
          console.log("exportCommand=" + exportCommand);
          console.log("foreverCommand=" + foreverCommand);
          console.log("sysCommand=" + sysCommand);
          console.log("__dirname=" + __dirname);
            */
          const binCommand = path.resolve(
            __dirname,
            "../../../../lib/src/bin/cue-me-in.js cues:run"
          );
          console.log("# bin command:");
          console.log(binCommand);
          const sysCommand = exportCommand + " && " + binCommand;
          console.log("sysCommand=" + sysCommand);
          crontab.create(sysCommand, "*/5 * * * *", CMD_UUID);
          // console.log(crontab.jobs());

          // save
          crontab.save(err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (err) {
        logger.error(err);
        console.log(err);
        reject(err);
      }
    });
  });
