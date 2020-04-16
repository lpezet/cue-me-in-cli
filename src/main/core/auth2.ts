import * as portfinder from "portfinder";
import * as opn from "open";
// import * as nodeStatic from "node-static";
import { configstore } from "../configstore";
import { createLogger } from "../logger";
import * as http from "http";
import * as express from "express";
import * as mustacheExpress from "mustache-express";
import * as path from "path";

const logger = createLogger("auth");
// const fileServer = new nodeStatic.Server("./templates");

// TODO:
// Use Express:
// https://expressjs.com/en/4x/api.html#app.listen
// Reason: so we can add variables maybe, like: {{ port }}
/*
var express = require('express')
var https = require('https')
var http = require('http')
var app = express()

http.createServer(app).listen(80)
https.createServer(options, app).listen(443)






var bodyParser = require('body-parser');
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({extend:true}));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

app.get('/', function(req, res){
    res.render('index.html',{email:data.email,password:data.password});
});
*/

// const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

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
  tokens: Tokens;
  user: any;
  scopes: string[];
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

/*
TODO


// in-memory cache, so we have it for successive calls
let lastTokens: Tokens;


const getTokens = function(
  refreshToken: string,
  authScopes: string[]
): Promise<Tokens> {
  if (_haveValidAccessToken(refreshToken, authScopes)) {
    return Promise.resolve(lastTokens);
  }

  return _refreshAccessToken(refreshToken, authScopes);
};

const _haveValidAccessToken = function(
  refreshToken: string,
  authScopes: string[]
): boolean {
  if (_.isEmpty(lastTokens)) {
    const tokens: Tokens = configstore.get("tokens");
    if (refreshToken === _.get(tokens, "refresh_token")) {
      lastTokens = tokens;
    }
  }
  const lastRt: string = lastTokens.refresh_token || "";
  const lastEa: number = lastTokens.expires_at || 0;
  const lastScopes: string[] = lastTokens.scopes || [];
  return (
    _.has(lastTokens, "access_token") &&
    lastRt === refreshToken &&
    _.isEqual(authScopes.sort(), (lastScopes || []).sort()) &&
    lastEa > Date.now() + FIFTEEN_MINUTES_IN_MS
  );
};



const _refreshAccessToken = function(
  refreshToken: string,
  authScopes: string[]
): Promise<Tokens> {
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
*/
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
        console.log("## Request url: " + url);
        console.log("## Request method: " + method);

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
            const payload = Buffer.concat(body).toString();
            let userInfo: UserType | null = null;
            if (url === "/login") {
              console.log("## Logging in. Should have some token info!");
              console.log("## IdToken??", payload);
              userInfo = JSON.parse(payload);
            } else if (url === "/logout") {
              console.log("## Logging out!!!");
            }
            res.statusCode = 200;
            // const responseBody = { headers, method, url, body };
            res.write("Ok");
            res.end();

            server.close(() => resolve(userInfo));
          });
      })
      .listen(port);
  });
};

const createLoginServer = (port: number, callbackServerPort: number) => {
  const app = express();
  // app.use(bodyParser.urlencoded({ extend: true }));
  app.engine("html", mustacheExpress()); // require("ejs").renderFile);
  app.set("view engine", "html");
  app.set("views", path.join(__dirname, "./templates"));

  app.get("/login.html", function(_req, res) {
    console.log("## Rendering login.html!!!!");
    res.render("login.html", { callbackServerPort: callbackServerPort });
  });
  app.use(express.static(path.join(__dirname, "./templates")));
  return http.createServer(app).listen(port, () => {
    open(`http://localhost:${port}/login.html`);
  });
};
/*
const createLoginServer = (port: number): http.Server => {
  return http
    .createServer(function(request, response) {
      request
        .addListener("end", function() {
          //
          // Serve files!
          //
          console.log("Login Server...");
          // console.dir(request);
          fileServer.serve(request, response);
        })
        .resume();
    })
    .listen(port, () => {
      open(`http://localhost:${port}/login.html`);
    });
};
*/

const createLogoutServer = (port: number, callbackServerPort: number) => {
  const app = express();
  // app.use(bodyParser.urlencoded({ extend: true }));
  app.engine("html", mustacheExpress()); // require("ejs").renderFile);
  app.set("view engine", "html");
  app.set("views", path.join(__dirname, "./templates"));

  app.get("/logout.html", function(_req, res) {
    console.log("## Rendering logout.html!!!!");
    res.render("login.html", { callbackServerPort: callbackServerPort });
  });
  app.use(express.static(path.join(__dirname, "./templates")));
  return http.createServer(app).listen(port, () => {
    open(`http://localhost:${port}/logout.html`);
  });
};
/*
const createLogoutServer = (port: number): http.Server => {
  return http
    .createServer(function(request, response) {
      request
        .addListener("end", function() {
          //
          // Serve files!
          //
          console.log("Logout Server...");
          // console.dir(request);
          fileServer.serve(request, response);
        })
        .resume();
    })
    .listen(port, () => {
      open(`http://localhost:${port}/logout.html`);
    });
};
*/
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

const login = function(_localhost = true): Promise<UserTokens> {
  // if (localhost) {
  return new Promise(function(resolve, reject) {
    get2Ports().then(
      (ports: number[]) => {
        console.log("Ports = " + ports);
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
                user: userInfo?.user
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
  return get2Ports().then((ports: number[]) => {
    const logoutServer = createLogoutServer(ports[0], ports[1]);
    return createCallbackServer(ports[1]).then(() => {
      logoutServer.close();
    });
  });
};

export { login, logout };
