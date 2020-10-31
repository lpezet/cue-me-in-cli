// import * as request from "request";

import { CueType } from "../commands/cues";
// import { api } from "./api";
// import { CueMeInError } from "../error";
// import { configstore } from "../configstore";
// import { User } from "./auth2";
// import { responseToError } from "./response-to-error";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";
import { APIResponse, api } from "./api";

/*
if (process.env.NODE_ENV !== "production") {
  console.log(
    "############### SETTING UP EMULATOR FOR functions ##################"
  );
  functions().useFunctionsEmulator("http://localhost:5001");
}
*/

// TODO:
// Can't have user send push notification on its own...silly me.
// So we need (must?) create a cloud function that will do it:
// 1. function will access an access_token and validate it (https://github.com/firebase/functions-samples/blob/master/authorized-https-endpoint/functions/index.js)
// 2. After verifying token, it will get the "uid" from it and load the tokens (like here)
// 3. For each token, it will send a notification (see https://www.skcript.com/svr/using-firebase-cloud-functions/)

// Other resources:
// https://cloud.google.com/nodejs/getting-started/authenticate-users
// https://github.com/firebase/functions-samples/tree/master/authorized-https-endpoint
const logger = new AdvancedLogger(createLogger("notification"));
/*
json looks something like this:
{
  "name": "projects/cue-me-in/databases/(default)/documents/users/KxMGwgwBtEgzOBfmHYMg3nrBfWB2",
  "fields": {
    "tokens": {
      "mapValue": {
        "fields": {
          "aaabbbcccddd": {
            "booleanValue": true
          }
        }
      }
    }
  },
  "createTime": "2020-04-15T03:23:45.848116Z",
  "updateTime": "2020-04-15T03:23:46.049256Z"
}
*/
const sendNotifications = (cues: CueType[]): Promise<void> => {
  if (cues == null || cues.length == 0) {
    logger.warn(
      "rying to send notifications without any cue information. Skipping."
    );
    return Promise.resolve();
  }
  return api
    .request("POST", "/api/notifications", {
      origin: api.firebaseFunctionsOrigin,
      json: true,
      data: cues,
      auth: {},
      logOptions: {
        skipQueryParams: false,
        skipRequestBody: false,
        skipResponseBody: false
      }
    })
    .then(
      (response: APIResponse) => {
        console.log("Got response!" + response);
      },
      (err: Error) => {
        console.log("Error testing notifications.", err);
      }
    )
    .catch((err: Error) => {
      console.log("Unexpected error testing notifications.", err);
    });
};

export { sendNotifications };
