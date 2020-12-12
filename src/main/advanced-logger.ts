import { Logger } from "./logger";
import * as clc from "cli-color";
// import { timeStamp } from "console";

const IS_WINDOWS = process.platform === "win32";
const SUCCESS_CHAR = IS_WINDOWS ? "+" : "✔";
const WARNING_CHAR = IS_WINDOWS ? "!" : "⚠";
// const ERROR_CHAR = IS_WINDOWS ? "x" : "☢";

type LogLevels =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"
  | "mark";

/**
 * @param logger
 */
export class AdvancedLogger implements Logger {
  logger: Logger;
  readonly category: string;
  constructor(logger: Logger) {
    // super();
    // super(logger.category);
    this.logger = logger;
    this.category = logger.category;
  }

  /**
   * Log an info statement with a green checkmark at the start of the line.
   *
   * @param message Message
   * @param type Type
   */
  logSuccess(message: string, type: LogLevels = "info"): void {
    this.logger.log(type, clc.green.bold(`${SUCCESS_CHAR} `), message);
  }

  /**
   * Log an info statement with a green checkmark at the start of the line.
   *
   * @param label Label
   * @param message Message
   * @param type Type (optional)
   */
  logLabeledSuccess(
    label: string,
    message: string,
    type: LogLevels = "info"
  ): void {
    this.logger.log(
      type,
      clc.green.bold(`${SUCCESS_CHAR}  ${label}:`),
      message
    );
  }

  /**
   * Log an info statement with a gray bullet at the start of the line.
   *
   * @param message Message
   * @param type Type (optional)
   */
  logBullet(message: string, type: LogLevels = "info"): void {
    this.logger.log(type, clc.cyan.bold("i "), message);
  }

  /**
   * Log an info statement with a gray bullet at the start of the line.
   *
   * @param label Label
   * @param message Message
   * @param type Type (optional)
   */
  logLabeledBullet(
    label: string,
    message: string,
    type: LogLevels = "info"
  ): void {
    this.logger.log(type, clc.cyan.bold(`i  ${label}:`), message);
  }

  /**
   * Log an info statement with a gray bullet at the start of the line.
   *
   * @param message Message
   * @param type Type
   */
  logWarning(message: string, type: LogLevels = "warn"): void {
    this.logger.log(type, clc.yellow.bold(`${WARNING_CHAR} `), message);
  }

  /**
   * Log an info statement with a gray bullet at the start of the line.
   *
   * @param label Label
   * @param message Message
   * @param type Type
   */
  logLabeledWarning(
    label: string,
    message: string,
    type: LogLevels = "warn"
  ): void {
    this.log(type, clc.yellow.bold(`${WARNING_CHAR}  ${label}:`), message);
  }

  new(dispatch: Function, name: string): Logger {
    return this.logger.new(dispatch, name);
  }

  get level(): string {
    return this.logger.level;
  }
  log(...args: any[]): void {
    this.logger.log(...args);
  }

  isLevelEnabled(level?: string): boolean {
    return this.isLevelEnabled(level);
  }

  isTraceEnabled(): boolean {
    return this.logger.isTraceEnabled();
  }
  isDebugEnabled(): boolean {
    return this.logger.isDebugEnabled();
  }
  isInfoEnabled(): boolean {
    return this.logger.isInfoEnabled();
  }
  isWarnEnabled(): boolean {
    return this.logger.isWarnEnabled();
  }
  isErrorEnabled(): boolean {
    return this.logger.isErrorEnabled();
  }
  isFatalEnabled(): boolean {
    return this.logger.isFatalEnabled();
  }

  _log(level: string, data: any): void {
    this.logger._log(level, data);
  }

  addContext(key: string, value: any): void {
    this.logger.addContext(key, value);
  }

  removeContext(key: string): void {
    this.logger.removeContext(key);
  }

  clearContext(): void {
    this.clearContext();
  }

  setParseCallStackFunction(parseFunction: Function): void {
    this.logger.setParseCallStackFunction(parseFunction);
  }

  trace(message: any, ...args: any[]): void {
    this.logger.trace(message, ...args);
  }

  debug(message: any, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }
  info(message: any, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  warn(message: any, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  error(message: any, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  fatal(message: any, ...args: any[]): void {
    this.logger.fatal(message, ...args);
  }

  mark(message: any, ...args: any[]): void {
    this.logger.mark(message, ...args);
  }
}
