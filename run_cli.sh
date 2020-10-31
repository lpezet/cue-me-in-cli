#!/bin/bash

ENV=()
ENV+=(CUEMEIN_FUNCTIONS_ORIG="http://localhost:5001/cue-me-in/us-central1")
cd lib
env "${ENV[@]}" node ./src/bin/cue-me-in.js $@
cd -