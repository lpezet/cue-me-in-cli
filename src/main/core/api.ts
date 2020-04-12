import * as _ from "lodash";
import * as querystring from "querystring";
import * as request from "request";
import * as url from "url";

import { CueMeInError } from "../error";
import { createLogger } from "../logger";
import { responseToError } from "./response-to-error";
import { Scopes } from "./scopes";
import * as utils from "../utils";
import { Url } from "url";

const logger = createLogger("api");

const CLI_VERSION = require("../../../package.json").version;

let accessToken: string;
let refreshToken: string;
let commandScopes: string[];

export interface LogOptions {
  skipQueryParams?: boolean;
  skipRequestBody?: boolean;
  skipResponseBody?: boolean;
}

type RequestCoreUriUrlOptions = request.CoreOptions | request.RequiredUriUrl;

export interface RequestOptions extends request.CoreOptions {
  retryCodes?: number[];
  origin?: string;
  data?: {};
  url?: string | Url;
  uri?: string | Url;
  resolveOnHTTPError?: boolean;
  query?: {};
  files?: any;
  logOptions?: LogOptions;
}

export interface APIResponse {
  status: number;
  response: request.Response;
  body: any;
}

const _request = function(
  options: RequestOptions,
  pLogOptions?: LogOptions
): Promise<APIResponse> {
  const logOptions = pLogOptions || ({} as LogOptions);
  let qsLog = "";
  let bodyLog = "<request body omitted>";

  if (options.qs && !logOptions.skipQueryParams) {
    qsLog = JSON.stringify(options.qs);
  }

  if (!logOptions.skipRequestBody) {
    bodyLog = options.body || options.form || "";
  }

  logger.debug(
    ">>> HTTP REQUEST",
    options.method,
    options.url,
    qsLog,
    "\n",
    bodyLog
  );

  options.headers = options.headers || {};
  options.headers["connection"] = "keep-alive";

  return new Promise(function(resolve, reject) {
    if (!options.url) {
      reject(new Error("Must specify url in request options."));
      return;
    }
    const opts: RequestCoreUriUrlOptions = { url: options.url };
    _.assign(opts, options);
    const req = request(opts, function(
      err: any,
      response: request.Response,
      body: any
    ) {
      if (err) {
        return reject(
          new CueMeInError("Server Error. " + err.message, {
            original: err,
            exit: 2
          })
        );
      }

      logger.debug("<<< HTTP RESPONSE", response.statusCode, response.headers);

      if (response.statusCode >= 400 && !logOptions.skipResponseBody) {
        logger.debug("<<< HTTP RESPONSE BODY", response.body);
        if (!options.resolveOnHTTPError) {
          return reject(responseToError(response, body)); // , options
        }
      }

      return resolve({
        status: response.statusCode,
        response: response,
        body: body
      });
    });

    if (_.size(options.files) > 0) {
      const form = req.form();
      _.forEach(options.files, function(details, param) {
        form.append(param, details.stream, {
          knownLength: details.knownLength,
          filename: details.filename,
          contentType: details.contentType
        });
      });
    }
  });
};

const _appendQueryData = function(path: string, data: {}): string {
  if (data && _.size(data) > 0) {
    path += _.includes(path, "?") ? "&" : "?";
    path += querystring.stringify(data);
  }
  return path;
};

export const api = {
  // "In this context, the client secret is obviously not treated as a secret"
  // https://developers.google.com/identity/protocols/OAuth2InstalledApp
  clientId: utils.envOverride(
    "FIREBASE_CLIENT_ID",
    "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com"
  ),
  clientSecret: utils.envOverride(
    "FIREBASE_CLIENT_SECRET",
    "j9iVZfS8kkCEFUPaAeJV0sAi"
  ),
  cloudbillingOrigin: utils.envOverride(
    "FIREBASE_CLOUDBILLING_URL",
    "https://cloudbilling.googleapis.com"
  ),
  cloudloggingOrigin: utils.envOverride(
    "FIREBASE_CLOUDLOGGING_URL",
    "https://logging.googleapis.com"
  ),
  adminOrigin: utils.envOverride(
    "FIREBASE_ADMIN_URL",
    "https://admin.firebase.com"
  ),
  appDistributionOrigin: utils.envOverride(
    "FIREBASE_APP_DISTRIBUTION_URL",
    "https://firebaseappdistribution.googleapis.com"
  ),
  appDistributionUploadOrigin: utils.envOverride(
    "FIREBASE_APP_DISTRIBUTION_UPLOAD_URL",
    "https://appdistribution-uploads.crashlytics.com"
  ),
  appengineOrigin: utils.envOverride(
    "FIREBASE_APPENGINE_URL",
    "https://appengine.googleapis.com"
  ),
  authOrigin: utils.envOverride(
    "FIREBASE_AUTH_URL",
    "https://accounts.google.com"
  ),
  consoleOrigin: utils.envOverride(
    "FIREBASE_CONSOLE_URL",
    "https://console.firebase.google.com"
  ),
  deployOrigin: utils.envOverride(
    "FIREBASE_DEPLOY_URL",
    utils.envOverride("FIREBASE_UPLOAD_URL", "https://deploy.firebase.com")
  ),
  firebaseApiOrigin: utils.envOverride(
    "FIREBASE_API_URL",
    "https://firebase.googleapis.com"
  ),
  firebaseExtensionsRegistryOrigin: utils.envOverride(
    "FIREBASE_EXT_REGISTRY_ORIGIN",
    "https://extensions-registry.firebaseapp.com"
  ),
  firedataOrigin: utils.envOverride(
    "FIREBASE_FIREDATA_URL",
    "https://mobilesdk-pa.googleapis.com"
  ),
  firestoreOrigin: utils.envOverride(
    "FIRESTORE_URL",
    "https://firestore.googleapis.com"
  ),
  functionsOrigin: utils.envOverride(
    "FIREBASE_FUNCTIONS_URL",
    "https://cloudfunctions.googleapis.com"
  ),
  cloudschedulerOrigin: utils.envOverride(
    "FIREBASE_CLOUDSCHEDULER_URL",
    "https://cloudscheduler.googleapis.com"
  ),
  pubsubOrigin: utils.envOverride(
    "FIREBASE_PUBSUB_URL",
    "https://pubsub.googleapis.com"
  ),
  googleOrigin: utils.envOverride(
    "FIREBASE_TOKEN_URL",
    utils.envOverride("FIREBASE_GOOGLE_URL", "https://www.googleapis.com")
  ),
  hostingOrigin: utils.envOverride(
    "FIREBASE_HOSTING_URL",
    "https://firebaseapp.com"
  ),
  iamOrigin: utils.envOverride(
    "FIREBASE_IAM_URL",
    "https://iam.googleapis.com"
  ),
  extensionsOrigin: utils.envOverride(
    "FIREBASE_EXT_URL",
    "https://firebaseextensions.googleapis.com"
  ),
  realtimeOrigin: utils.envOverride(
    "FIREBASE_REALTIME_URL",
    "https://firebaseio.com"
  ),
  rtdbMetadataOrigin: utils.envOverride(
    "FIREBASE_RTDB_METADATA_URL",
    "https://metadata-dot-firebase-prod.appspot.com"
  ),
  resourceManagerOrigin: utils.envOverride(
    "FIREBASE_RESOURCEMANAGER_URL",
    "https://cloudresourcemanager.googleapis.com"
  ),
  rulesOrigin: utils.envOverride(
    "FIREBASE_RULES_URL",
    "https://firebaserules.googleapis.com"
  ),
  runtimeconfigOrigin: utils.envOverride(
    "FIREBASE_RUNTIMECONFIG_URL",
    "https://runtimeconfig.googleapis.com"
  ),
  storageOrigin: utils.envOverride(
    "FIREBASE_STORAGE_URL",
    "https://storage.googleapis.com"
  ),
  firebaseStorageOrigin: utils.envOverride(
    "FIREBASE_FIREBASESTORAGE_URL",
    "https://firebasestorage.googleapis.com"
  ),
  hostingApiOrigin: utils.envOverride(
    "FIREBASE_HOSTING_API_URL",
    "https://firebasehosting.googleapis.com"
  ),
  cloudRunApiOrigin: utils.envOverride(
    "CLOUD_RUN_API_URL",
    "https://run.googleapis.com"
  ),
  serviceUsageOrigin: utils.envOverride(
    "FIREBASE_SERVICE_USAGE_URL",
    "https://serviceusage.googleapis.com"
  ),

  setRefreshToken: function(token: string): void {
    refreshToken = token;
  },
  setAccessToken: function(token: string): void {
    accessToken = token;
  },
  getScopes: function(): string[] {
    return commandScopes;
  },
  setScopes: function(s: string[]): void {
    commandScopes = _.uniq(
      _.flatten(
        [
          Scopes.EMAIL,
          Scopes.OPENID,
          Scopes.CLOUD_PROJECTS_READONLY,
          Scopes.FIREBASE_PLATFORM
        ].concat(s || [])
      )
    );
    logger.debug("> command requires scopes:", JSON.stringify(commandScopes));
  },
  getAccessToken: function() {
    return accessToken
      ? // eslint-disable-next-line @typescript-eslint/camelcase
        Promise.resolve({ access_token: accessToken })
      : require("./auth").getAccessToken(refreshToken, commandScopes);
  },
  addRequestHeaders: function(reqOptions: RequestOptions) {
    // Runtime fetch of Auth singleton to prevent circular module dependencies
    _.set(reqOptions, ["headers", "User-Agent"], "FirebaseCLI/" + CLI_VERSION);
    _.set(
      reqOptions,
      ["headers", "X-Client-Version"],
      "FirebaseCLI/" + CLI_VERSION
    );
    return (
      api
        .getAccessToken()
        // eslint-disable-next-line camelcase
        .then(function(result: { access_token: string }) {
          _.set(
            reqOptions,
            "headers.authorization",
            "Bearer " + result.access_token
          );
          return reqOptions;
        })
    );
  },
  request: function(
    method: string,
    resource: string,
    pOptions?: RequestOptions
  ): Promise<APIResponse> {
    let options = pOptions || {};
    options = _.extend(
      {
        data: {},
        origin: api.adminOrigin, // default to hitting the admin backend
        resolveOnHTTPError: false, // by default, status codes >= 400 leads to reject
        json: true
      },
      options
    );

    const validMethods = ["GET", "PUT", "POST", "DELETE", "PATCH"];

    if (!validMethods.includes(method)) {
      method = "GET";
    }

    const reqOptions: RequestOptions = {
      method: method
    };

    if (options.query) {
      resource = _appendQueryData(resource, options.query);
    }

    if (method === "GET") {
      resource = _appendQueryData(resource, options.data || {});
    } else {
      if (_.size(options.data) > 0) {
        reqOptions.body = options.data;
      } else if (_.size(options.form) > 0) {
        reqOptions.form = options.form;
      }
    }

    reqOptions.url = options.origin + resource;
    reqOptions.files = options.files;
    reqOptions.resolveOnHTTPError = options.resolveOnHTTPError;
    reqOptions.json = options.json;
    reqOptions.qs = options.qs;
    reqOptions.headers = options.headers;
    reqOptions.timeout = options.timeout;

    let requestFunction = function() {
      return _request(reqOptions, options.logOptions);
    };

    let secureRequest = true;
    if (options.origin) {
      // Only 'https' requests are secure. Protocol includes the final ':'
      // https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol
      const originUrl = url.parse(options.origin);
      secureRequest = originUrl.protocol === "https:";
    }

    if (options.auth === true) {
      if (secureRequest) {
        requestFunction = function() {
          return api
            .addRequestHeaders(reqOptions)
            .then(function(reqOptionsWithToken: RequestOptions) {
              return _request(reqOptionsWithToken, options.logOptions);
            });
        };
      } else {
        logger.debug(
          `Ignoring options.auth for insecure origin: ${options.origin}`
        );
      }
    }

    return requestFunction().catch(function(err) {
      if (
        options.retryCodes &&
        _.includes(
          options.retryCodes,
          _.get(err, "context.response.statusCode")
        )
      ) {
        return new Promise(function(resolve) {
          setTimeout(resolve, 1000);
        }).then(requestFunction);
      }
      return Promise.reject(err);
    });
  },

  /**
   * Deprecated. Call `listFirebaseProjects()` from `./management/project.ts` instead
   * TODO: remove this function
   * @return Promise<string>
   */
  getProjects: function(): Promise<string> {
    logger.debug(
      `[WARNING] ${
        new Error("getProjects() is deprecated - update the implementation")
          .stack
      }`
    );
    return api
      .request("GET", "/v1/projects" /* {
        auth: true
      }*/)
      .then(function(res: APIResponse): Promise<any> {
        if (res.body && res.body.projects) {
          return Promise.resolve(res.body.projects);
        }

        return Promise.reject(
          new CueMeInError(
            "Server Error: Unexpected Response. Please try again",
            {
              context: res,
              exit: 2
            }
          )
        );
      });
  }
};
