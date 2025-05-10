#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/submods/js-sdk"
yarn install
yarn build
cd "$DIR/submods/upload-service"
pnpm install
pnpm nx run-many -t build
cd "$DIR"
pnpm install
pnpm build
