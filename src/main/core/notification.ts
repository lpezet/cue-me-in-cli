import * as request from "request";

import { CueType } from "../commands/cues";
import { api } from "./api";
import { CueMeInError } from "../error";
import { configstore } from "../configstore";
import { User } from "./auth2";
import { responseToError } from "./response-to-error";
import { createLogger } from "../logger";
import { AdvancedLogger } from "../advanced-logger";

const logger = new AdvancedLogger(createLogger("notification"));

const sendNotifications = (cues: CueType[]): Promise<void> => {
  console.log("# About to send notifications for cues: " + cues);
  const user: User = configstore.get("user");
  const doc = `users/${user.uid}`;
  const url = `${api.firestoreOrigin}/projects/${api.projectId}/databases/(default)/documents/${doc}?key=${api.clientId}`;
  return new Promise((resolve, reject) => {
    api.addRequestHeaders({}).then(reqOptionsWithToken => {
      request.get(
        { ...reqOptionsWithToken, url },
        // (error: any, response: request.Response, body: any) => {
        (err: Error, res: request.Response, body: any) => {
          if (err) {
            reject(
              new CueMeInError("Unexpected error getting device tokens", {
                exit: 2,
                original: err
              })
            );
          } else if (res.statusCode >= 400) {
            reject(responseToError(res, body));
          } else {
            // TODO: parse response to use tokens for push notification
            logger.logSuccess("Sending notification.");
            console.log("# body=" + body);
            // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send
            // https://firebase.google.com/docs/cloud-messaging/js/first-message#http_post_request
            resolve();
          }
        }
      );
    });
  });
};

export { sendNotifications };
