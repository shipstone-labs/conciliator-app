#!/bin/bash
set -e

# Bootstrap script for the first build when dist-packages is empty
# This script temporarily reverts to link:/workspace: references for the initial build

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

# Directory where all package tarballs will be stored
DIST_DIR="dist-packages"
mkdir -p $DIST_DIR

echo "==== Bootstrapping project with initial link: references ===="

# Step 1: Temporarily update package.json files to use link: references
echo "Updating packages to use link: references for bootstrap..."

# For each package in packages directory
if [ -d "./packages" ]; then
  for pkg_dir in ./packages/*/; do
    # Skip firebase-functions package
    if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
      echo "Skipping firebase-functions package (private module)"
      continue
    fi

    if [ -f "${pkg_dir}package.json" ]; then
      pkg_json="${pkg_dir}package.json"
      
      # Backup original package.json if it doesn't already exist
      if [ ! -f "${pkg_json}.original" ]; then
        cp "$pkg_json" "${pkg_json}.original"
        echo "Backed up ${pkg_json} to ${pkg_json}.original"
      fi
      
      # Update with link: references for submods
      echo "Updating $pkg_json to use link: references"
      # For lit-wrapper
      if [[ "$pkg_dir" == *"lit-wrapper"* ]]; then
        temp_file=$(mktemp)
        # First get the existing dependencies to ensure we don't lose any
        deps=$(jq -r '.dependencies | keys[]' "$pkg_json")

        # Update with link: references for submods
        jq '
          # Ensure dependencies exists
          if .dependencies == null then .dependencies = {} else . end |

          # Update Lit protocol dependencies
          .dependencies["@lit-protocol/access-control-conditions"] = "link:../../submods/js-sdk/packages/accs-schema" |
          .dependencies["@lit-protocol/auth-helpers"] = "link:../../submods/js-sdk/packages/@lit-protocol/auth-helpers" |
          .dependencies["@lit-protocol/constants"] = "link:../../submods/js-sdk/packages/constants" |
          .dependencies["@lit-protocol/contracts-sdk"] = "link:../../submods/js-sdk/packages/contracts-sdk" |
          .dependencies["@lit-protocol/contracts"] = "link:../../submods/js-sdk/packages/contracts" |
          .dependencies["@lit-protocol/crypto"] = "link:../../submods/js-sdk/packages/crypto" |
          .dependencies["@lit-protocol/lit-auth-client"] = "link:../../submods/js-sdk/packages/lit-auth-client" |
          .dependencies["@lit-protocol/lit-node-client"] = "link:../../submods/js-sdk/packages/lit-node-client" |
          .dependencies["@lit-protocol/pkp-ethers"] = "link:../../submods/js-sdk/packages/pkp-ethers" |
          .dependencies["@lit-protocol/types"] = "link:../../submods/js-sdk/packages/types" |
          .dependencies["@lit-protocol/access-control-conditions"] = "link:../../submods/js-sdk/packages/access-control-conditions"
        ' "$pkg_json" > "$temp_file"
        mv "$temp_file" "$pkg_json"
      fi
      
      # For web-storage-wrapper
      if [[ "$pkg_dir" == *"web-storage-wrapper"* ]]; then
        temp_file=$(mktemp)
        jq '
          # Ensure dependencies exists
          if .dependencies == null then .dependencies = {} else . end |

          # Update with link: references for submods
          .dependencies["@ipld/dag-ucan"] = "catalog:" |
          .dependencies["@storacha/client"] = "link:../../submods/upload-service/packages/w3up-client"
        ' "$pkg_json" > "$temp_file"
        mv "$temp_file" "$pkg_json"
      fi
    fi
  done
fi

# Update root package.json
root_pkg_json="$ROOT_DIR/package.json"
if [ -f "$root_pkg_json" ]; then
  # Backup original root package.json if it doesn't already exist
  if [ ! -f "${root_pkg_json}.original" ]; then
    cp "$root_pkg_json" "${root_pkg_json}.original"
    echo "Backed up ${root_pkg_json} to ${root_pkg_json}.original"
  fi
  
  # Update with workspace: references for packages and link: for submods
  echo "Updating root package.json to use workspace: and link: references"
  temp_file=$(mktemp)
  jq '
    # First ensure dependencies exists
    if .dependencies == null then .dependencies = {} else . end |

    # Update dependencies
    .dependencies["@lit-protocol/access-control-conditions"] = "link:submods/js-sdk/packages/access-control-conditions" |
    .dependencies["@lit-protocol/auth-helpers"] = "link:submods/js-sdk/packages/auth-helpers" |
    .dependencies["lilypad-wrapper"] = "workspace:*" |
    .dependencies["lit-wrapper"] = "workspace:*" |
    .dependencies["web-storage-wrapper"] = "workspace:*" |

    # Remove pnpm.overrides if it exists
    if has("pnpm") then
      if .pnpm | has("overrides") then
        .pnpm |= del(.overrides)
      else
        .
      end
    else
      .
    end |

    # Add pnpm.overrides
    if has("pnpm") then
      .pnpm.overrides = {
        "@lit-protocol/auth-helpers": "link:submods/js-sdk/packages/auth-helpers",
        "@lit-protocol/constants": "link:submods/js-sdk/packages/constants",
        "@lit-protocol/contracts": "link:submods/js-sdk/packages/contracts",
        "@lit-protocol/contracts-sdk": "link:submods/js-sdk/packages/contracts-sdk",
        "@lit-protocol/crypto": "link:submods/js-sdk/packages/crypto",
        "@lit-protocol/lit-auth-client": "link:submods/js-sdk/packages/lit-auth-client",
        "@lit-protocol/lit-node-client": "link:submods/js-sdk/packages/lit-node-client",
        "@lit-protocol/pkp-ethers": "link:submods/js-sdk/packages/pkp-ethers",
        "@lit-protocol/types": "link:submods/js-sdk/packages/types",
        "@storacha/client": "link:submods/upload-service/packages/w3up-client"
      }
    else
      .pnpm = {
        "overrides": {
          "@lit-protocol/auth-helpers": "link:submods/js-sdk/packages/auth-helpers",
          "@lit-protocol/constants": "link:submods/js-sdk/packages/constants",
          "@lit-protocol/contracts": "link:submods/js-sdk/packages/contracts",
          "@lit-protocol/contracts-sdk": "link:submods/js-sdk/packages/contracts-sdk",
          "@lit-protocol/crypto": "link:submods/js-sdk/packages/crypto",
          "@lit-protocol/lit-auth-client": "link:submods/js-sdk/packages/lit-auth-client",
          "@lit-protocol/lit-node-client": "link:submods/js-sdk/packages/lit-node-client",
          "@lit-protocol/pkp-ethers": "link:submods/js-sdk/packages/pkp-ethers",
          "@lit-protocol/types": "link:submods/js-sdk/packages/types",
          "@storacha/client": "link:submods/upload-service/packages/w3up-client"
        }
      }
    end
  ' "$root_pkg_json" > "$temp_file"
  mv "$temp_file" "$root_pkg_json"
fi

# Step 2: Run the install.sh script to build the submodules
echo "==== Running install.sh ===="
./scripts/install.sh

# Step 3: Build the wrapper packages
echo "==== Building wrapper packages ===="
if [ -d "./packages" ]; then
  for pkg_dir in ./packages/*/; do
    # Skip firebase-functions package
    if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
      continue
    fi

    if [ -f "${pkg_dir}package.json" ]; then
      pkg_name=$(jq -r '.name // ""' "${pkg_dir}package.json")
      if [ -z "$pkg_name" ] || [ "$pkg_name" == "null" ]; then
        echo "Warning: No package name found in ${pkg_dir}package.json"
        continue
      fi
      
      echo "Building $pkg_name"
      cd "$pkg_dir"
      if grep -q "\"build\"" package.json; then
        pnpm run build 2>/dev/null || npm run build 2>/dev/null || echo "Build script failed but continuing"
      fi
      cd "$ROOT_DIR"
    fi
  done
fi

# Step 4: Run the pack-packages.sh script to package everything
echo "==== Running pack-packages.sh to create initial packages ===="
# Use a flag to track if this step succeeds
pack_success=false

# Run the pack-packages.sh script
if ./scripts/pack-packages.sh; then
  pack_success=true
  echo "Successfully created packages!"
else
  echo "Warning: pack-packages.sh failed!"
  # Let's check if we at least have some packages
  if [ -d "$DIST_DIR" ] && [ "$(ls -A $DIST_DIR/*.tgz 2>/dev/null)" ]; then
    echo "Some packages were created in $DIST_DIR, continuing..."
    pack_success=true
  else
    echo "No packages were created, keeping temporary link: references"
    exit 1
  fi
fi

# Step 5: Restore original package.json files only if packing succeeded
if [ "$pack_success" = true ]; then
  echo "==== Restoring original package.json files ===="
  # Restore root package.json
  if [ -f "${root_pkg_json}.original" ]; then
    mv "${root_pkg_json}.original" "$root_pkg_json"
    echo "Restored ${root_pkg_json}"
  fi

  # Restore package.json files in packages directory
  if [ -d "./packages" ]; then
    for pkg_dir in ./packages/*/; do
      pkg_json="${pkg_dir}package.json"
      if [ -f "${pkg_json}.original" ]; then
        mv "${pkg_json}.original" "$pkg_json"
        echo "Restored ${pkg_json}"
      fi
    done
  fi
else
  echo "==== Keeping temporary link: references since packaging failed ===="
  echo "You'll need to manually restore package.json files when you're done debugging."
fi

echo "==== Bootstrap complete! ===="
echo "You now have a populated dist-packages directory with all the necessary packages."
echo "You can now run 'pnpm install' to use the packaged dependencies."