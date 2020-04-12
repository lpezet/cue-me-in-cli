import * as _ from "lodash";
import * as clc from "cli-color";
import { Readable } from "stream";
import { statSync } from "fs";
import * as crypto from "crypto";

// import { configstore } from "./configstore";
import { CueMeInError } from "./error";
import { createLogger } from "./logger";

const IS_WINDOWS = process.platform === "win32";
const LOGGER = createLogger("utils");

export const envOverrides: string[] = [];

/**
 * Create a CueMeIn Console URL for the specified path and project.
 *
 * @param project Project
 * @param path Path
 * @return url
 */
/*
export function consoleUrl(project: string, path: string): string {
  const api = require("./api");
  return `${api.consoleOrigin}/project/${project}${path}`;
}
*/
/**
 * Trace up the ancestry of objects that have a `parent` key, finding the
 * first instance of the provided key.
 *
 * @param options Options
 * @param key Key
 * @return any
 */
export function getInheritedOption(options: any, key: string): any {
  let target = options;
  while (target) {
    if (_.has(target, key)) {
      return target[key];
    }
    target = target.parent;
  }
}

/**
 * Override a value with supplied environment variable if present. A function
 * that returns the environment variable in an acceptable format can be
 * proivded. If it throws an error, the default value will be used.
 *
 * @param envname Environment variable name
 * @param value Value
 * @param coerce Coerce
 * @return string
 */
export function envOverride(
  envname: string,
  value: string,
  coerce?: (value: string, defaultValue: string) => any
): string {
  const currentEnvValue = process.env[envname];
  if (currentEnvValue && currentEnvValue.length) {
    envOverrides.push(envname);
    if (coerce) {
      try {
        return coerce(currentEnvValue, value);
      } catch (e) {
        return value;
      }
    }
    return currentEnvValue;
  }
  return value;
}

/**
 * Add a subdomain to the specified HTTP origin.
 * (e.g. https://example.com -> https://sub.example.com)
 *
 * @param origin Origin
 * @param subdomain Subdomain
 * @return string
 */
export function addSubdomain(origin: string, subdomain: string): string {
  return origin.replace("//", `//${subdomain}.`);
}

/**
 * Return a promise that rejects with a CueMeInError.
 *
 * @param message Message
 * @param options Options
 * @return Promise<Error>
 */
export function reject(message: string, options?: any): Promise<Error> {
  return Promise.reject(new CueMeInError(message, options));
}

/**
 * Print out an explanatory message if a TTY is detected for how to manage STDIN
 */
export function explainStdin(): void {
  if (IS_WINDOWS) {
    throw new CueMeInError("STDIN input is not available on Windows.", {
      exit: 1
    });
  }
  if (process.stdin.isTTY) {
    LOGGER.info(
      clc.bold("Note:"),
      "Reading STDIN. Type JSON data and then press Ctrl-D"
    );
  }
}

/**
 * Convert text input to a Readable stream.
 *
 * @param text Text
 * @return Readable | undefined
 */
export function stringToStream(text: string): Readable | undefined {
  if (!text) {
    return undefined;
  }
  const s = new Readable();
  s.push(text);
  s.push(null);
  return s;
}

/**
 * Creates API endpoint string, e.g. /v1/projects/pid/cloudfunctions
 *
 * @param parts Parts
 * @return string
 */
export function endpoint(parts: string[]): string {
  return `/${_.join(parts, "/")}`;
}

/**
 * Gets the event provider name for a Cloud Function from the trigger's
 * eventType string.
 *
 * @param eventType EventType
 * @return string
 */
export function getFunctionsEventProvider(eventType: string): string {
  // Legacy event types:
  const parts = eventType.split("/");
  if (parts.length > 1) {
    const provider = _.last(parts[1].split("."));
    return _.capitalize(provider);
  }
  // New event types:
  if (/google.pubsub/.exec(eventType)) {
    return "PubSub";
  } else if (/google.storage/.exec(eventType)) {
    return "Storage";
  } else if (/google.analytics/.exec(eventType)) {
    return "Analytics";
  } else if (/google.CueMeIn.database/.exec(eventType)) {
    return "Database";
  } else if (/google.CueMeIn.auth/.exec(eventType)) {
    return "Auth";
  } else if (/google.CueMeIn.crashlytics/.exec(eventType)) {
    return "Crashlytics";
  } else if (/google.firestore/.exec(eventType)) {
    return "Firestore";
  }
  return _.capitalize(eventType.split(".")[1]);
}

export interface SettledPromiseResolved<T> {
  state: "fulfilled";
  value: T;
}

export interface SettledPromiseRejected {
  state: "rejected";
  reason: Error;
}

export type SettledPromise<T> =
  | SettledPromiseResolved<T>
  | SettledPromiseRejected;

/**
 * Returns a single Promise that is resolved when all the given promises have
 * either resolved or rejected.
 *
 * @param promises Promises
 * @return Promise<SettledPromise[]>
 */
export function promiseAllSettled(
  promises: Array<Promise<any>>
): Promise<SettledPromise<any>[]> {
  const wrappedPromises = _.map(promises, async (p: any) => {
    try {
      const val = await Promise.resolve(p);
      return { state: "fulfilled", value: val } as SettledPromiseResolved<any>;
    } catch (err) {
      return { state: "rejected", reason: err } as SettledPromiseRejected;
    }
  });
  return Promise.all(wrappedPromises);
}

/**
 * Runs a given function (that returns a Promise) repeatedly while the given
 * sync check returns false. Resolves with the value that passed the check.
 *
 * @param action Action function returning Promise<T>
 * @param check Check
 * @param interval Interval
 * @return Promise<T>
 */
export async function promiseWhile<T>(
  action: () => Promise<T>,
  check: (value: T) => boolean,
  interval = 2500
): Promise<T> {
  return new Promise<T>((resolve, promiseReject) => {
    const run = async (): Promise<any> => {
      try {
        const res = await action();
        if (check(res)) {
          return resolve(res);
        }
        setTimeout(run, interval);
      } catch (err) {
        return promiseReject(err);
      }
    };
    run();
  });
}

/**
 * Resolves all Promises at every key in the given object. If a value is not a
 * Promise, it is returned as-is.
 *
 * @param obj Obj
 * @return Promise<any>
 */
export async function promiseProps(obj: any): Promise<any> {
  const resultObj: any = {};
  const promises = _.keys(obj).map(async (key: string) => {
    const r = await Promise.resolve(obj[key]);
    resultObj[key] = r;
  });
  return Promise.all(promises).then(() => resultObj);
}

/**
 * @param path Path
 * @return boolean
 */
export function fileExistsSync(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch (e) {
    return false;
  }
}

/**
 * @param path Path
 * @return boolean
 */
export function dirExistsSync(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch (e) {
    return false;
  }
}

export type CodeVerifierAndChallenge = {
  codeVerifier: string;
  codeChallenge: string;
};
/**
 * @return codeVerifier and codeChallenge
 */
export function createCodeVerifierAndChallenge(): CodeVerifierAndChallenge {
  const codeVerifier = crypto
    .randomBytes(64)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest()
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return { codeVerifier, codeChallenge };
}
