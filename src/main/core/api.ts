import * as _ from "lodash";
import * as querystring from "querystring";
import * as request from "request";
import * as url from "url";

import { CueMeInError } from "../error";
import { createLogger } from "../logger";
import { responseToError } from "./response-to-error";
import { Scopes } from "./scopes";
// import * as utils from "../utils";
import { Url } from "url";
import { Tokens, getAccessToken as auth2GetAccessToken } from "./auth2";
import { envOverride } from "../utils";

const logger = createLogger("api");

const CLI_VERSION = require("../../../package.json").version;

let accessToken: string;
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
  jwtPublicKeysGoogleApisUrl: envOverride(
    "CUEMEIN_GOOGLEAPIS_PUBKEYS_URL",
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  ),
  firebaseFunctionsOrigin: envOverride(
    "CUEMEIN_FUNCTIONS_ORIG",
    "https://us-central-1-cue-me-in.cloudfunctions.net"
  ),
  // ,
  // firestoreOrigin: "https://firestore.googleapis.com/v1beta1",
  secureTokenGoogleApisOrigin: envOverride(
    "CUEMEIN_GOOGLEAPIS_ORIG",
    "https://securetoken.googleapis.com"
  ),
  webApiKey: envOverride(
    "CUEMEIN_WEB_API_KEY",
    "AIzaSyB8OVCjMYelcfFBrLjSwEQak9qDcqyXsLw"
  ),
  projectId: envOverride("CUEMEIN_PROJECT_ID", "cue-me-in"),
  clientId: envOverride(
    "CUEMEIN_CLIENT_ID",
    "413727118845-f8dp1btfkm8fudgdbcnecgcc4qldm269.apps.googleusercontent.com"
  ),
  // "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
  // setRefreshToken: function(token: string): void {
  //  refreshToken = token;
  // },
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
      : auth2GetAccessToken(commandScopes).then((tokens: Tokens) => {
          if (tokens.access_token == null) {
            return Promise.reject(new Error("Couldn't get access token."));
          }
          // ????
          // this.setAccessToken(tokens.access_token);
          return Promise.resolve({ access_token: tokens.access_token || "" });
        });
  },
  addRequestHeaders: function(
    reqOptions: RequestOptions
  ): Promise<RequestOptions> {
    // Runtime fetch of Auth singleton to prevent circular module dependencies
    _.set(reqOptions, ["headers", "User-Agent"], "CueMeInCLI/" + CLI_VERSION);
    _.set(
      reqOptions,
      ["headers", "X-Client-Version"],
      "CueMeInCLI/" + CLI_VERSION
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
        // origin: api.adminOrigin, // default to hitting the admin backend
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
    secureRequest = true; // TODO: only dev and locally

    if (options.auth) {
      // === true) {
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
  }
};
