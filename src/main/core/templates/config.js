/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
var config = {
  apiKey: "AIzaSyB8OVCjMYelcfFBrLjSwEQak9qDcqyXsLw",
  authDomain: "cue-me-in.firebaseapp.com",
  databaseURL: "https://cue-me-in.firebaseio.com",
  projectId: "cue-me-in",
  storageBucket: "cue-me-in.appspot.com",
  messagingSenderId: "349143115304",
  appId: "1:349143115304:web:d2472d9d005b8b7f4a771d",
  measurementId: "G-HQ3L6DQNED"
};

firebase.initializeApp(config);

// Google OAuth Client ID, needed to support One-tap sign-up.
// Set to null if One-tap sign-up is not supported.
var CLIENT_ID = null; //'YOUR_OAUTH_CLIENT_ID';
