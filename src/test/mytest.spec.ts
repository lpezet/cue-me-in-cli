import { expect } from "chai";
import * as clc from "cli-color";
import { configureLogger, createLogger } from "../main/logger";
import { AdvancedLogger } from "../main/advanced-logger";

describe("MyTest", () => {
  it("logger", () => {
    const logger = createLogger("mytest");
    configureLogger({
      appenders: {
        console: { type: "console", layout: { type: "messagePassThrough" } }
      },
      categories: {
        default: { appenders: ["console"], level: "debug" }
      }
    });
    logger.info("This is a test %s", "awesome!");
    logger.info(clc.cyan.bold("i "), "Colorful message");
    expect(true).to.be.true;
  });
  it("advanced logger", () => {
    const logger = createLogger("mytest");
    const advLogger = new AdvancedLogger(logger);

    configureLogger({
      appenders: {
        console: { type: "console", layout: { type: "messagePassThrough" } }
      },
      categories: {
        default: { appenders: ["console"], level: "debug" }
      }
    });
    advLogger.logLabeledBullet("Labeled Bullet", "message");
    advLogger.logBullet("Bullet message");
    advLogger.logLabeledSuccess("LabeledSuccess", "message");
    advLogger.logLabeledWarning("LabeledWarning", "message");
    advLogger.logSuccess("Success message");
    advLogger.logWarning("Warning message");
    expect(true).to.be.true;
  });
});
