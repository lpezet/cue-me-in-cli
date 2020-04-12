/* eslint-disable @typescript-eslint/camelcase */

import * as _ from "lodash";
import * as clc from "cli-color";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as http from "http";
import * as opn from "open";
import * as path from "path";
import * as portfinder from "portfinder";
import * as url from "url";
import {
  CodeVerifierAndChallenge,
  createCodeVerifierAndChallenge
} from "../utils";

import { APIResponse, api } from "./api";
import { configstore } from "../configstore";
import { CueMeInError } from "../error";
import { createLogger } from "../logger";
import { prompt } from "../prompt";
import { Scopes } from "./scopes";

const logger = createLogger("auth");

// portfinder.basePort = 9005;

const open = function(url: string): void {
  opn(url).catch(function(err) {
    logger.debug("Unable to open URL: " + err.stack);
  });
};

const INVALID_CREDENTIAL_ERROR = new CueMeInError(
  "Authentication Error: Your credentials are no longer valid. Please run " +
    clc.bold("cue-me-in login --reauth") +
    "\n\n" +
    "For CI servers and headless environments, generate a new token with " +
    clc.bold("cue-me-in login:ci"),
  { exit: 1 }
);

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
const SCOPES = [
  Scopes.EMAIL,
  Scopes.OPENID
  // Scopes.CLOUD_PROJECTS_READONLY,
  // Scopes.FIREBASE_PLATFORM,
  // Scopes.CLOUD_PLATFORM
];

const _nonce = _.random(1, 2 << 29).toString();
const _getPort = portfinder.getPortPromise;

interface Token {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_at?: number;
  scopes?: any;
}

interface UserTokens {
  tokens: Token;
  user: any;
  scopes: string[];
}

// in-memory cache, so we have it for successive calls
let lastAccessToken: Token;

// in-memory cache, so we have it for successive calls
let codeVerifierAndChallenge: CodeVerifierAndChallenge | null;

const resetCodeVerifierAndChallenge = function(): void {
  console.log("...now resetting code verifier and challenge.");
  codeVerifierAndChallenge = null;
};

const _getCallbackUrl = function(port?: number): string {
  if (_.isUndefined(port)) {
    return "urn:ietf:wg:oauth:2.0:oob";
  }
  return "http://localhost:" + port;
};

const _getLoginUrl = function(callbackUrl: string): string {
  // console.log("# _getLoginUrl: code_challenge:" + (codeVerifierAndChallenge?.codeChallenge || ""));

  return (
    api.authOrigin +
    "/o/oauth2/auth?" +
    _.map(
      {
        client_id: api.clientId,
        scope: SCOPES.join(" "),
        response_type: "code",
        state: _nonce,
        // code_challenge: codeVerifierAndChallenge?.codeChallenge || "",
        // code_challenge_method: "S256",
        redirect_uri: callbackUrl
      },
      function(v, k) {
        return k + "=" + encodeURIComponent(v);
      }
    ).join("&")
  );
};

const _getTokensFromAuthorizationCode = function(
  code: string,
  callbackUrl: string
): Promise<Token> {
  // console.log("# _getTokensFromAuthorizationCode: code_verfier:" + (codeVerifierAndChallenge?.codeVerifier || ""));

  return api
    .request("POST", "/o/oauth2/token", {
      origin: api.authOrigin,
      form: {
        code: code,
        client_id: api.clientId,
        client_secret: api.clientSecret,
        redirect_uri: callbackUrl,
        // code_verfier: codeVerifierAndChallenge?.codeVerifier,
        grant_type: "authorization_code"
      }
    })
    .then(
      function(res: any) {
        if (
          !_.has(res, "body.access_token") &&
          !_.has(res, "body.refresh_token")
        ) {
          logger.debug("Token Fetch Error:", res.statusCode, res.body);
          throw INVALID_CREDENTIAL_ERROR;
        }
        logger.debug("Token Fetch response body:", res.body);
        const lastAccessToken: Token = _.assign(
          {
            // eslint-disable-next-line @typescript-eslint/camelcase
            expires_at: Date.now() + res.body.expires_in * 1000
          },
          res.body
        );
        return lastAccessToken;
      },
      function(err: Error) {
        logger.debug("Token Fetch Error:", err.stack);
        throw INVALID_CREDENTIAL_ERROR;
      }
    );
};

const _respondWithFile = function(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  statusCode: number,
  filename: string
): Promise<void> {
  return new Promise(function(resolve, reject) {
    fs.readFile(path.join(__dirname, filename), function(err, response) {
      if (err) {
        return reject(err);
      }
      res.writeHead(statusCode, {
        "Content-Length": response.length,
        "Content-Type": "text/html"
      });
      res.end(response);
      req.socket.destroy();
      return resolve();
    });
  });
};

const _loginWithoutLocalhost = function(): Promise<UserTokens> {
  const callbackUrl: string = _getCallbackUrl();
  const authUrl: string = _getLoginUrl(callbackUrl);

  // logger.info();
  logger.info("Visit this URL on any device to log in:");
  logger.info(clc.bold.underline(authUrl));
  // logger.info();

  open(authUrl);

  return prompt({}, [
    {
      type: "input",
      name: "code",
      message: "Paste authorization code here:"
    }
  ])
    .then(function(answers) {
      return _getTokensFromAuthorizationCode(answers.code, callbackUrl);
    })
    .then(function(tokens: Token) {
      return {
        user: jwt.decode(tokens.id_token || ""),
        tokens: tokens,
        scopes: SCOPES
      };
    });
};

const _loginWithLocalhost = function(port: number): Promise<UserTokens> {
  return new Promise(function(resolve, reject) {
    const callbackUrl = _getCallbackUrl(port);
    const authUrl = _getLoginUrl(callbackUrl);

    const server = http.createServer(function(
      req: http.IncomingMessage,
      res: http.ServerResponse
    ): void {
      let tokens: Token;
      const query: { [key: string]: string | string[] } = _.get(
        url.parse(req.url || "", true),
        "query",
        {}
      );
      if (logger.isDebugEnabled()) logger.debug("### Got request!", req);
      if (query.state === _nonce && _.isString(query.code)) {
        // return
        if (logger.isDebugEnabled()) logger.debug("Request: ", req);

        _getTokensFromAuthorizationCode(query.code, callbackUrl)
          .then(function(result: Token) {
            tokens = result;
            return _respondWithFile(
              req,
              res,
              200,
              "../templates/loginSuccess.html"
            );
          })
          .then(function() {
            server.close();
            return resolve({
              user: jwt.decode(tokens.id_token || ""),
              tokens: tokens,
              scopes: SCOPES
            });
          })
          .catch(function(err: Error) {
            logger.error(
              "Unexpected error getting token from authorization code.",
              err
            );
            return _respondWithFile(
              req,
              res,
              400,
              "../templates/loginFailure.html"
            );
          });
      } else {
        logger.error("Invalid or missing authorization code.", query);
        _respondWithFile(req, res, 400, "../templates/loginFailure.html");
      }
    });

    server.listen(port, function() {
      // logger.info();
      logger.info("Visit this URL on this device to log in:");
      logger.info(clc.bold.underline(authUrl));
      // logger.info();
      logger.info("Waiting for authentication...");

      open(authUrl);
    });

    server.on("error", function() {
      _loginWithoutLocalhost().then(resolve, reject);
    });
  });
};

const login = function(localhost = true): Promise<UserTokens> {
  codeVerifierAndChallenge = createCodeVerifierAndChallenge();
  console.log("# Codes:");
  console.log(codeVerifierAndChallenge);
  if (localhost) {
    return _getPort()
      .then(_loginWithLocalhost, _loginWithoutLocalhost)
      .finally(resetCodeVerifierAndChallenge);
  }
  return _loginWithoutLocalhost().finally(resetCodeVerifierAndChallenge);
};

const _haveValidAccessToken = function(
  refreshToken: string,
  authScopes: string[]
): boolean {
  if (_.isEmpty(lastAccessToken)) {
    const tokens: Token = configstore.get("tokens");
    if (refreshToken === _.get(tokens, "refresh_token")) {
      lastAccessToken = tokens;
    }
  }
  const lastRt: string = lastAccessToken.refresh_token || "";
  const lastEa: number = lastAccessToken.expires_at || 0;
  const lastScopes: string[] = lastAccessToken.scopes || [];
  return (
    _.has(lastAccessToken, "access_token") &&
    lastRt === refreshToken &&
    _.isEqual(authScopes.sort(), (lastScopes || []).sort()) &&
    lastEa > Date.now() + FIFTEEN_MINUTES_IN_MS
  );
};

const _logoutCurrentSession = function(refreshToken: string): void {
  const tokens = configstore.get("tokens");
  const currentToken = _.get(tokens, "refresh_token");
  if (refreshToken === currentToken) {
    configstore.delete("user");
    configstore.delete("tokens");
    configstore.delete("usage");
    configstore.delete("analytics-uuid");
  }
};

const _refreshAccessToken = function(
  refreshToken: string,
  authScopes: string[]
): Promise<Token> {
  logger.debug(
    "> refreshing access token with scopes:",
    JSON.stringify(authScopes)
  );
  return api
    .request("POST", "/oauth2/v3/token", {
      origin: api.googleOrigin,
      form: {
        refresh_token: refreshToken,
        client_id: api.clientId,
        client_secret: api.clientSecret,
        grant_type: "refresh_token",
        scope: (authScopes || []).join(" ")
      },
      logOptions: {
        skipRequestBody: true,
        skipQueryParams: true,
        skipResponseBody: true
      }
    })
    .then(
      function(res: APIResponse) {
        if (res.status === 401 || res.status === 400) {
          return Promise.resolve({ access_token: refreshToken });
        }

        if (!_.isString(res.body.access_token)) {
          throw INVALID_CREDENTIAL_ERROR;
        }
        lastAccessToken = _.assign(
          {
            expires_at: Date.now() + res.body.expires_in * 1000,
            refresh_token: refreshToken,
            scopes: authScopes
          },
          res.body
        );

        const currentRefreshToken = _.get(
          configstore.get("tokens"),
          "refresh_token"
        );
        if (refreshToken === currentRefreshToken) {
          configstore.set("tokens", lastAccessToken);
        }

        return Promise.resolve(lastAccessToken);
      },
      function(err) {
        if (_.get(err, "context.body.error") === "invalid_scope") {
          throw new CueMeInError(
            "This command requires new authorization scopes not granted to your current session. Please run " +
              clc.bold("cue-me-in login --reauth") +
              "\n\n" +
              "For CI servers and headless environments, generate a new token with " +
              clc.bold("cue-me-in login:ci"),
            { exit: 1 }
          );
        }

        throw INVALID_CREDENTIAL_ERROR;
      }
    );
};

const getAccessToken = function(
  refreshToken: string,
  authScopes: string[]
): Promise<Token> {
  if (_haveValidAccessToken(refreshToken, authScopes)) {
    return Promise.resolve(lastAccessToken);
  }

  return _refreshAccessToken(refreshToken, authScopes);
};

const logout = function(refreshToken: string) {
  if (lastAccessToken && lastAccessToken.refresh_token === refreshToken) {
    lastAccessToken = {} as Token;
  }
  _logoutCurrentSession(refreshToken);
  return api
    .request("GET", "/o/oauth2/revoke", {
      origin: api.authOrigin,
      data: {
        token: refreshToken
      }
    })
    .catch(function(err: Error) {
      throw new CueMeInError("Authentication Error.", {
        original: err,
        exit: 1
      });
    });
};

export { login, getAccessToken, logout };
