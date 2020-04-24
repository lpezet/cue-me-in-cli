import * as request from "request";

import { CueType } from "../commands/cues";
import { api } from "./api";
import { CueMeInError } from "../error";
import { configstore } from "../configstore";
import { User } from "./auth2";
import { responseToError } from "./response-to-error";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";

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
const parseTokens = (json: any): string[] => {
  try {
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
    if (
      !json["fields"] ||
      !json["fields"]["tokens"] ||
      !json["fields"]["tokens"]["mapValue"] ||
      !json["fields"]["tokens"]["mapValue"]["fields"]
    ) {
      logger.warn("Unexpected payload from Firestore response:\n%s", json);
      return [];
    }
    const jsonTokens = json["fields"]["tokens"]["mapValue"]["fields"];
    const tokens = [];
    for (let k in jsonTokens) {
      if (jsonTokens.hasOwnProperty(k)) {
        tokens.push(k);
      }
    }
    return tokens;
  } catch (e) {
    logger.error("Unexpected error parsing device tokens.", e);
    return [];
  }
};

const collectTokens = (): Promise<string[]> => {
  const user: User = configstore.get("user");
  const doc = `users/${user.uid}`;
  const url = `${api.firestoreOrigin}/projects/${api.projectId}/databases/(default)/documents/${doc}?key=${api.clientId}`;
  return new Promise((resolve, reject) => {
    api.addRequestHeaders({}).then((reqOptionsWithToken) => {
      request.get(
        { ...reqOptionsWithToken, url },
        // (error: any, response: request.Response, body: any) => {
        (err: Error, res: request.Response, body: any) => {
          if (err) {
            reject(err);
          } else if (res.statusCode >= 400) {
            reject(responseToError(res, body));
          } else {
            // TODO: parse response to use tokens for push notification
            logger.logSuccess("Sending notification.");
            console.log("# body=" + body);
            const tokens = parseTokens(body);
            // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send
            // https://firebase.google.com/docs/cloud-messaging/js/first-message#http_post_request
            resolve(tokens);
          }
        }
      );
    });
  });
};

const sendNotifications = (cues: CueType[]): Promise<void> => {
  console.log("# About to send notifications for cues: " + cues);
  return collectTokens()
    .then(
      (tokens: string[]): Promise<any> => {
        console.log("# got tokens!");
        console.log(tokens);
        if (tokens.length == 0) {
          logger.logWarning("No devices registered. No notifications sent.");
          return Promise.resolve();
        }

        const reqOptions = {
          headers: {
            "content-type": "application/json",
          },
          json: true,
        };
        const url = `${api.firebaseCloudMessagingOrigin}/projects/${api.projectId}/messages:send`;
        return api.addRequestHeaders(reqOptions).then((reqOptionsWithToken) => {
          const promises: Promise<any>[] = [];
          tokens.forEach((t) => {
            const form = {
              message: {
                notification: {
                  title: "FCM Message",
                  body: "This is a message from FCM",
                },
                webpush: {
                  headers: {
                    Urgency: "high",
                  },
                  notification: {
                    body: "This is a message from FCM to web",
                    requireInteraction: "true",
                    badge: "/badge-icon.png",
                  },
                },
              },
              token: t,
            };
            const promise = new Promise((resolve, reject) => {
              request.post(
                { ...reqOptionsWithToken, url, form },
                (err: Error, res: request.Response, body: any) => {
                  if (err) {
                    reject(err);
                  } else if (res.statusCode >= 400) {
                    reject(responseToError(res, body));
                  } else {
                    // TODO: parse response to use tokens for push notification
                    logger.logSuccess("Notification sent.");
                    console.log("# body=" + body);
                    resolve();
                  }
                }
              );
            });
            promises.push(promise);
          });
          return Promise.all(promises);
        });

        // https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send
      },
      (err: Error) => {
        console.log("Error!");
        console.log(err);
        return Promise.reject(
          new CueMeInError("Error getting device tokens", {
            exit: 2,
            original: err,
          })
        );
      }
    )
    .catch((err: Error) => {
      console.log("Unexpected error!");
      console.log(err);
      return Promise.reject(
        new CueMeInError("Unexpected error getting device tokens", {
          exit: 2,
          original: err,
        })
      );
    });
};

export { sendNotifications };
