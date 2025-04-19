#!/usr/bin/env zsh

cp .runtimeconfig.json packages/firebase-functions/lib/.runtimeconfig.json
pnpm dotenv run -- firebase emulators:start --only functions

