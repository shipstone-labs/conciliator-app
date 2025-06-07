#!/bin/bash
set -e

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

# Directory where all package tarballs are stored
DIST_DIR="dist-packages"

# 1. Verify that all required package tarballs exist
echo "==== Verifying package tarballs ===="
if [ ! -d "$DIST_DIR" ] || [ ! -f "$DIST_DIR/package-map.json" ]; then
  echo "Error: $DIST_DIR/package-map.json not found."
  echo "Run ./scripts/pack-packages.sh locally and commit the results first."
  exit 1
fi

# 2. Update package references to use the tarball files
echo "==== Updating package references ===="
./scripts/update-package-refs.sh

# 3. Install dependencies
echo "==== Installing dependencies ===="
pnpm install

echo "==== CI preparation complete ===="
echo "Ready to build and deploy"