import * as _ from "lodash";
import * as portfinder from "portfinder";
import * as opn from "open";
import * as clc from "cli-color";

// import * as nodeStatic from "node-static";
import { configstore } from "../configstore";
import { CueMeInError } from "../error";
import * as http from "http";
import * as express from "express";
import * as mustacheExpress from "mustache-express";
import * as path from "path";
import { APIResponse, api } from "./api";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";
import { Spinner } from "cli-spinner";
import * as jwt from "jsonwebtoken";

const logger = new AdvancedLogger(createLogger("auth"));

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

const INVALID_CREDENTIAL_ERROR = new CueMeInError(
  "Authentication Error: Your credentials are no longer valid. Please run " +
    clc.bold("cue-me-in login --reauth") +
    "\n\n" +
    "For CI servers and headless environments, generate a new token with " +
    clc.bold("cue-me-in login:ci"),
  { exit: 1 }
);

const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

// Below we get the Id Token.
// To get an access token:
// https://stackoverflow.com/questions/40838154/retrieve-google-access-token-after-authenticated-using-firebase-authentication
// though without refresh token, not sure what good this would do...
// Problem is just that Id Token is valid for like 45ish minutes...
// Now, found this:
// https://firebase.google.com/docs/reference/rest/auth/#section-refresh-token
// https://stackoverflow.com/questions/38233687/how-to-use-the-firebase-refreshtoken-to-reauthenticate
// So after calling:
// ...
// get something like this:
/*
{
"access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhjZjBjNjQyZDQwOWRlODJlY2M5MjI4ZTRiZDc5OTkzOTZiNTY3NDAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTHVjIFBlemV0IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdqZ0ZJVEVfU1lyQlRySFp2OVpvSU91andLNTFFa1VZNTVWUXJwUy13IiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Rlc3QtY3VlLW1lLWluIiwiYXVkIjoidGVzdC1jdWUtbWUtaW4iLCJhdXRoX3RpbWUiOjE1ODMyMTMyODEsInVzZXJfaWQiOiJndHNROXNpS0tCWG51d0hiYUhUTXU4ZjhZMXEyIiwic3ViIjoiZ3RzUTlzaUtLQlhudXdIYmFIVE11OGY4WTFxMiIsImlhdCI6MTU4MzY0MTIwOCwiZXhwIjoxNTgzNjQ0ODA4LCJlbWFpbCI6ImxwZXpldEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzMxNjYxMTA1OTQxMDM3NTIyOCJdLCJlbWFpbCI6WyJscGV6ZXRAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.dYSHFcagEjS66YZiHFIIupxixRRY6rwinhy03gYO5hAfisGymLmWyzkOWtw9tNZAmForlVGvElJPqXjIIcvtyfEpExW9kkCQtZuZ-zla6bdhbRbzWqlGHXsSMTiAWdmRkE3a01qNwHZm_pD8BnQ9BB27AEfrTHLRjw0DW89hC7nFcQcxz6o2n7znf_ks1kxQ2SQPxCUx-LIfnD7ESh5Vw94X5MZ_Ov1V-o8WN_CIrGAqaxrxhIHnXbOYArqQywtQld_cis6lXN1w91ZK6avcl7CrMkDxH9VF9Q4cM3NFD063NWVX7dxKbkHp5FkHb1eLl6Gel34K4HcNxe_2-TAr-w",
"expires_in": "3600",
"token_type": "Bearer",
"refresh_token": "AEu4IL3VT510O9pVYsjduR-OETk35WDlvPnChapCu7IYp8R20vF3Qed53puOtWZSeWf-GJ4j-mMgrAgZY3kMLazs220rX7ZlqYSflqo4LI4SS4mUvGjk-u5GiSyFx2KBhGTalouQCCBWH3dHZk6itgHrwXwNjEKt21Bra5ThUp_rMv1NPmzB4CldT9XAhbuBuRhH19_jGn0ON-1iMordPB3sg36DUR0x8fKcW6Q2iaTFdJiwi4y-nhfjpOPYJRBJcuEYyFDumsNz2rV6IboKMbuoKwXLQtcoumPcL-56g6V2JJh1zh5Uns6RZNm5CB4EnaSAWZF76Yd1zCqF88Oy0EmQjdwt5vfLfPeBoeyz07rRB3Zcq2ZwNlnHm4gp3emruOEgwmremL68um2fPR9WyzGl3LWmwBAc1w",
"id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhjZjBjNjQyZDQwOWRlODJlY2M5MjI4ZTRiZDc5OTkzOTZiNTY3NDAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTHVjIFBlemV0IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdqZ0ZJVEVfU1lyQlRySFp2OVpvSU91andLNTFFa1VZNTVWUXJwUy13IiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Rlc3QtY3VlLW1lLWluIiwiYXVkIjoidGVzdC1jdWUtbWUtaW4iLCJhdXRoX3RpbWUiOjE1ODMyMTMyODEsInVzZXJfaWQiOiJndHNROXNpS0tCWG51d0hiYUhUTXU4ZjhZMXEyIiwic3ViIjoiZ3RzUTlzaUtLQlhudXdIYmFIVE11OGY4WTFxMiIsImlhdCI6MTU4MzY0MTIwOCwiZXhwIjoxNTgzNjQ0ODA4LCJlbWFpbCI6ImxwZXpldEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzMxNjYxMTA1OTQxMDM3NTIyOCJdLCJlbWFpbCI6WyJscGV6ZXRAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.dYSHFcagEjS66YZiHFIIupxixRRY6rwinhy03gYO5hAfisGymLmWyzkOWtw9tNZAmForlVGvElJPqXjIIcvtyfEpExW9kkCQtZuZ-zla6bdhbRbzWqlGHXsSMTiAWdmRkE3a01qNwHZm_pD8BnQ9BB27AEfrTHLRjw0DW89hC7nFcQcxz6o2n7znf_ks1kxQ2SQPxCUx-LIfnD7ESh5Vw94X5MZ_Ov1V-o8WN_CIrGAqaxrxhIHnXbOYArqQywtQld_cis6lXN1w91ZK6avcl7CrMkDxH9VF9Q4cM3NFD063NWVX7dxKbkHp5FkHb1eLl6Gel34K4HcNxe_2-TAr-w",
"user_id": "gtsQ9siKKBXnuwHbaHTMu8f8Y1q2",
"project_id": "243909087188"
}
*/

interface Tokens {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_at?: number;
  scopes?: any;
}

interface UserTokens {
  tokens?: Tokens;
  user?: User;
  scopes?: string[];
  raw?: any;
}

type StsTokenManager = {
  apiKey: string;
  refreshToken: string;
  accessToken: string;
  expirationTime: number;
};
type ProviderData = {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  phoneNumber?: string;
  providerId: string;
};
type User = {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  isAnonymous: boolean;
  providerData: ProviderData[];
  apiKey: string;
  appName: string;
  authDomain: string;
  stsTokenManager: StsTokenManager;
  lastLoginAt: string;
  createdAt: string;
};
type UserCredential = {
  providerId: string;
  signInMethod: string;
  oauthIdToken: string;
  oauthAccessToken: string;
};
type UserProfile = {
  name: string;
  granted_scopes: string;
  id: string;
  verified_email: boolean;
  given_name: string;
  locale: string;
  family_name: string;
  email: string;
  picture: string;
};
type UserAdditionalInfo = {
  providerId: string;
  isNewUser: boolean;
  profile: UserProfile;
};
type UserType = {
  user: User;
  credential: UserCredential;
  operationType: string;
  additionalUserInfo: UserAdditionalInfo;
};

const open = function(url: string): void {
  opn(url).catch(function(err) {
    logger.debug("Unable to open URL: " + err.stack);
  });
};

const getPort = portfinder.getPortPromise;

// in-memory cache, so we have it for successive calls
let _lastTokens: Tokens;
const getOrLoadTokens = () => {
  if (_lastTokens == null) {
    _lastTokens = configstore.get("tokens");
  }
  return _lastTokens || {};
};

// refreshToken: string
const _logoutCurrentSession = function(): void {
  // const tokens = configstore.get("tokens");
  // const currentToken = _.get(tokens, "refresh_token");
  // if (refreshToken === currentToken) {
  configstore.delete("user");
  configstore.delete("tokens");
  configstore.delete("usage");
  configstore.delete("analytics-uuid");
  // }
};

const createCallbackServer = (port: number): Promise<UserType | null> => {
  return new Promise(function(resolve, reject) {
    const server = http
      .createServer(function(
        req: http.IncomingMessage,
        res: http.ServerResponse
      ): void {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Request-Method", "*");
        res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
        res.setHeader("Access-Control-Allow-Headers", "*");
        if (req.method === "OPTIONS") {
          res.writeHead(200);
          res.end();
          return;
        }

        const { method, url } = req;
        if (logger.isDebugEnabled()) {
          logger.debug("Callback server received request: %s %s", method, url);
        }
        const body: any[] = [];
        req
          .on("error", err => {
            console.error(err);
            reject(err);
          })
          .on("data", chunk => {
            body.push(chunk);
          })
          .on("end", () => {
            let userInfo: UserType | null = null;
            let spinner: Spinner;
            const payload = Buffer.concat(body).toString();
            if (url === "/login") {
              if (logger.isDebugEnabled()) {
                logger.debug("Received login request. Payload:\n%s", payload);
              }
              userInfo = JSON.parse(payload);
              spinner = new Spinner();
              spinner.setSpinnerString(17);
              spinner.start();
            } else if (url === "/logout") {
              if (logger.isDebugEnabled()) {
                logger.debug("Received logout request.");
              }
            }
            res.statusCode = 200;
            // const responseBody = { headers, method, url, body };
            res.write("Ok");
            res.end();
            logger.logBullet("Finalyzing login...please wait...");
            server.close((err?: Error) => {
              if (err) {
                logger.logBullet("Error finalyzing login. " + err, "error");
              }
              if (spinner != null) spinner.stop(true);
              resolve(userInfo);
            });
          });
      })
      .listen(port);
  });
};

const createLoginServer = (
  port: number,
  callbackServerPort: number
): http.Server => {
  const app = express();
  // app.use(bodyParser.urlencoded({ extend: true }));
  app.engine("html", mustacheExpress()); // require("ejs").renderFile);
  app.set("view engine", "html");
  app.set("views", path.join(__dirname, "./templates"));

  app.get("/login.html", function(_req, res) {
    res.render("login.html", { callbackServerPort: callbackServerPort });
  });
  app.use(express.static(path.join(__dirname, "./templates")));
  return http.createServer(app).listen(port, () => {
    open(`http://localhost:${port}/login.html`);
  });
};

const get2Ports = function(): Promise<number[]> {
  const ports: number[] = [];
  return getPort()
    .then((port: number) => {
      ports.push(port);
      return getPort({ startPort: port + 1, port: port + 1 });
    })
    .then((port: number) => {
      ports.push(port);
      return ports;
    });
};

const login = function(): Promise<UserTokens> {
  // if (localhost) {
  return new Promise(function(resolve, reject) {
    get2Ports().then(
      (ports: number[]) => {
        if (logger.isDebugEnabled()) {
          logger.debug("ports for authentication: {}", ports);
        }
        const loginServer = createLoginServer(ports[0], ports[1]);
        return createCallbackServer(ports[1]).then(
          (userInfo: UserType | null) => {
            loginServer.close(() => {
              const tokens: Tokens = {
                access_token: userInfo?.user.stsTokenManager.accessToken,
                expires_at: userInfo?.user.stsTokenManager.expirationTime,
                id_token: userInfo?.credential.oauthIdToken,
                refresh_token: userInfo?.user.stsTokenManager.refreshToken,
                scopes: userInfo?.additionalUserInfo.profile.granted_scopes.split(
                  " "
                )
              };
              const userTokens: UserTokens = {
                scopes:
                  userInfo?.additionalUserInfo.profile.granted_scopes.split(
                    " "
                  ) || [],
                tokens: tokens,
                user: userInfo?.user,
                raw: userInfo
              };
              resolve(userTokens);
            });
          }
        );
      },
      (err: Error) => {
        reject(err);
      }
    );
  });
  // .finally(resetCodeVerifierAndChallenge);
  // }
  // return _loginWithoutLocalhost().finally(resetCodeVerifierAndChallenge);
};

// TODO: gotta close server after logout...
const logout = function(): Promise<void> {
  _logoutCurrentSession();
  return Promise.resolve();
  /*
  return get2Ports().then((ports: number[]) => {
    const logoutServer = createLogoutServer(ports[0], ports[1]);
    return createCallbackServer(ports[1]).then(() => {
      logoutServer.close();
    });
  });
  */
};
const validateIdToken = function(token: string): Promise<Boolean> {
  if (_.isEmpty(token)) return Promise.reject(new Error("Must pass a token."));
  const pubSite = new URL(api.jwtPublicKeysGoogleApisUrl);
  return api
    .request("GET", pubSite.pathname, {
      origin: "https://" + pubSite.hostname,
      json: true,
      logOptions: {
        skipRequestBody: false,
        skipQueryParams: false,
        skipResponseBody: false
      }
    })
    .then((response: APIResponse) => {
      const kidToPubKeys = response.body;
      console.log("## kidToPubKeys:");
      console.log(kidToPubKeys);
      const getKey: jwt.GetPublicKeyOrSecret = (
        header: jwt.JwtHeader,
        callback: jwt.SigningKeyCallback
      ) => {
        callback(null, kidToPubKeys[header.kid || ""]);
      };
      return new Promise(function(resolve) {
        jwt.verify(token, getKey, (_err, decoded) => {
          console.log("Decoded: ");
          console.log(decoded);
          resolve(true);
        });
      });
    });
};
const hasValidAccessToken = function(authScopes?: string[]): boolean {
  if (_.isEmpty(_lastTokens)) {
    const tokens: Tokens = configstore.get("tokens");
    // Luke: Why?
    // if (refreshToken === _.get(tokens, "refresh_token")) {
    _lastTokens = tokens;
    // }
  }
  // const lastRt: string = lastTokens.refresh_token || "";
  const lastEa: number = _lastTokens.expires_at || 0;
  const lastScopes: string[] = _lastTokens.scopes || [];
  return (
    _.has(_lastTokens, "access_token") &&
    // lastRt === refreshToken &&
    (authScopes == null ||
      _.isEqual(authScopes.sort(), (lastScopes || []).sort())) &&
    lastEa > Date.now() + FIFTEEN_MINUTES_IN_MS
  );
};

const refreshAccessToken = function(
  refreshToken?: string,
  authScopes?: string[]
): Promise<Tokens> {
  // return Promise.reject(new Error("Not yet supported!"));
  /*
  https://developers.google.com/identity/toolkit/securetoken

  POST /v1/token HTTP/1.1
Host: securetoken.googleapis.com
Content-Type: application/x-www-form-urlencoded
 
refresh_token=refresh_token&grant_type=refresh_token
  */
  refreshToken = refreshToken || getOrLoadTokens().refresh_token || "";
  authScopes = authScopes || DEFAULT_SCOPES;
  return api
    .request("POST", "/v1/token", {
      query: {
        key: api.webApiKey
      },
      origin: api.secureTokenGoogleApisOrigin,
      json: true,
      form: {
        refresh_token: refreshToken,
        // client_id: api.clientId,
        // client_secret: api.clientSecret,
        grant_type: "refresh_token"
        // scope: (authScopes || []).join(" ")
      },
      logOptions: {
        skipRequestBody: false,
        skipQueryParams: false,
        skipResponseBody: false
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
        _lastTokens = _.assign(
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
          if (logger.isDebugEnabled()) {
            logger.debug("Got new tokens. Resetting tokens from store...");
          }
          configstore.set("tokens", _lastTokens);
        } else {
          logger.warn(
            "New refresh token not matching stored refresh token. NOT resetting tokens from store."
          );
        }

        return Promise.resolve(_lastTokens);
      },
      function(err) {
        logger.error("Unexpected error refreshing tokens.", err);
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

const getAccessToken = function(authScopes?: string[]): Promise<Tokens> {
  const refreshToken = getOrLoadTokens().refresh_token || "";
  if (hasValidAccessToken(authScopes)) {
    return Promise.resolve(_lastTokens);
  }
  authScopes = authScopes || DEFAULT_SCOPES;
  return refreshAccessToken(refreshToken, authScopes);
};

export {
  login,
  logout,
  getAccessToken,
  hasValidAccessToken,
  refreshAccessToken,
  validateIdToken,
  User,
  UserTokens,
  UserType,
  UserProfile,
  UserCredential,
  UserAdditionalInfo,
  StsTokenManager,
  ProviderData,
  Tokens
};
