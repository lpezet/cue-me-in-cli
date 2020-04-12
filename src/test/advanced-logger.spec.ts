import { expect } from "chai";
import { configureLogger, createLogger } from "../main/logger";
import { AdvancedLogger } from "../main/advanced-logger";

describe("advanced-logger", () => {
  let logger: AdvancedLogger;

  before(() => {
    configureLogger({
      appenders: {
        console: { type: "console", layout: { type: "messagePassThrough" } }
      },
      categories: {
        default: { appenders: ["console"], level: "all" }
      }
    });
  });

  beforeEach(() => {
    logger = new AdvancedLogger(createLogger("advanced-logger"));
  });

  describe("basic", () => {
    it("debug", () => {
      expect(logger.debug("Debug message")).to.not.throw;
    });
    it("info", () => {
      expect(logger.info("Info message")).to.not.throw;
    });
    it("error", () => {
      expect(logger.error("Error message")).to.not.throw;
    });
    it("fatal", () => {
      expect(logger.fatal("Fatal message")).to.not.throw;
    });
    it("trace", () => {
      expect(logger.trace("Trace message")).to.not.throw;
    });
    it("warn", () => {
      expect(logger.warn("Warn message")).to.not.throw;
    });
    it("mark", () => {
      expect(logger.mark("Mark message")).to.not.throw;
    });
    it("log", () => {
      expect(logger.log("info", "Log info message")).to.not.throw;
    });
    it("level", () => {
      expect(logger.isDebugEnabled()).to.be.true;
      expect(logger.isErrorEnabled()).to.be.true;
      expect(logger.isFatalEnabled()).to.be.true;
      expect(logger.isInfoEnabled()).to.be.true;
      expect(logger.isTraceEnabled()).to.be.true;
      expect(logger.isWarnEnabled()).to.be.true;
    });
  });

  describe("advanced", () => {
    it("labeled bullet", () => {
      expect(logger.logLabeledBullet("Labeled Bullet", "message")).to.not.throw;
    });

    it("bullet", () => {
      expect(logger.logBullet("Bullet message")).to.not.throw;
    });

    it("labeled success", () => {
      expect(logger.logLabeledSuccess("LabeledSuccess", "message")).to.not
        .throw;
    });

    it("labeled warning", () => {
      expect(logger.logLabeledWarning("LabeledWarning", "message")).to.not
        .throw;
    });

    it("success", () => {
      expect(logger.logSuccess("Success message")).to.not.throw;
    });

    it("warning", () => {
      expect(logger.logWarning("Warning message")).to.not.throw;
    });
  });
});
