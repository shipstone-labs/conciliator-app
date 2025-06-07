#!/bin/bash
set -e

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

echo "==== Starting complete package update process ===="

# Step 1: Build and pack all linked packages
echo "==== Step 1: Building and packing linked packages ===="
./scripts/pack-packages.sh

# Step 2: Convert all package references
echo "==== Step 2: Converting package references ===="
./scripts/convert-package-refs.sh

# Step 3: Run npm install to update dependencies
echo "==== Step 3: Updating node_modules ===="
pnpm install

echo "==== Package update complete! ===="
echo "Changes to commit:"
echo "1. dist-packages/ directory with all the packaged dependencies"
echo "2. Updated package.json files with references to dist-packages"