#!/bin/bash
set -e

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

echo "====== REBUILDING ALL PACKAGES WITH CONSISTENT REFERENCES ======"

# 1. Ensure dist-packages directory exists
mkdir -p dist-packages

# 2. Create or ensure package-map.json exists
echo "{}" > dist-packages/package-map.json
echo "Reset package-map.json"

# Get commit hashes for stable versioning
MAIN_HASH=$(git rev-parse --short HEAD)
echo "Main repo commit hash: $MAIN_HASH"

JS_SDK_HASH=""
if [ -d "submods/js-sdk" ]; then
  cd "$ROOT_DIR/submods/js-sdk"
  JS_SDK_HASH=$(git rev-parse --short HEAD)
  cd "$ROOT_DIR"
  echo "js-sdk commit hash: $JS_SDK_HASH"
else
  echo "Warning: js-sdk submodule not found"
  exit 1
fi

UPLOAD_SERVICE_HASH=""
if [ -d "submods/upload-service" ]; then
  cd "$ROOT_DIR/submods/upload-service"
  UPLOAD_SERVICE_HASH=$(git rev-parse --short HEAD)
  cd "$ROOT_DIR"
  echo "upload-service commit hash: $UPLOAD_SERVICE_HASH"
else
  echo "Warning: upload-service submodule not found"
  exit 1
fi

# STEP 1: Convert all references to link: for building
echo "STEP 1: Setting up link: references for building..."

# Save the current state of dependencies for wrappers
WRAPPER_DEPS=$(jq -r '.dependencies["lilypad-wrapper"] // "workspace:*"' package.json)
LIT_WRAPPER_DEPS=$(jq -r '.dependencies["lit-wrapper"] // "workspace:*"' package.json)
WEB_STORAGE_DEPS=$(jq -r '.dependencies["web-storage-wrapper"] // "workspace:*"' package.json)

echo "Current wrapper references:"
echo "lilypad-wrapper: $WRAPPER_DEPS"
echo "lit-wrapper: $LIT_WRAPPER_DEPS"
echo "web-storage-wrapper: $WEB_STORAGE_DEPS"

# Update root package.json with link: references for submodules but keep workspace: for local packages
TEMP_ROOT=$(mktemp)
jq '.dependencies["lilypad-wrapper"] = "workspace:*" |
    .dependencies["lit-wrapper"] = "workspace:*" |
    .dependencies["web-storage-wrapper"] = "workspace:*" |
    .dependencies["@lit-protocol/access-control-conditions"] = "link:submods/js-sdk/packages/access-control-conditions" |
    .dependencies["@lit-protocol/auth-helpers"] = "link:submods/js-sdk/packages/auth-helpers" |
    .pnpm.overrides = {
      "@lit-protocol/access-control-conditions": "link:submods/js-sdk/packages/access-control-conditions",
      "@lit-protocol/auth-helpers": "link:submods/js-sdk/packages/auth-helpers",
      "@lit-protocol/constants": "link:submods/js-sdk/packages/constants",
      "@lit-protocol/contracts-sdk": "link:submods/js-sdk/packages/contracts-sdk",
      "@lit-protocol/crypto": "link:submods/js-sdk/packages/crypto",
      "@lit-protocol/lit-auth-client": "link:submods/js-sdk/packages/lit-auth-client",
      "@lit-protocol/lit-node-client": "link:submods/js-sdk/packages/lit-node-client",
      "@lit-protocol/pkp-ethers": "link:submods/js-sdk/packages/pkp-ethers",
      "@lit-protocol/types": "link:submods/js-sdk/packages/types",
      "@storacha/client": "link:submods/upload-service/packages/w3up-client"
    }' package.json > "$TEMP_ROOT"
mv "$TEMP_ROOT" package.json

# Special handling for contracts if directory doesn't exist
if [ ! -d "submods/js-sdk/packages/contracts" ]; then
    echo "Warning: contracts directory doesn't exist, using contracts-sdk instead"
    TEMP_ROOT=$(mktemp)
    jq '.pnpm.overrides["@lit-protocol/contracts"] = .pnpm.overrides["@lit-protocol/contracts-sdk"]' package.json > "$TEMP_ROOT"
    mv "$TEMP_ROOT" package.json
fi

# Update all wrapper packages with link: references
for pkg_dir in ./packages/*/; do
  # Skip firebase-functions
  if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
    echo "Skipping firebase-functions package (private)"
    continue
  fi
  
  if [ -f "${pkg_dir}package.json" ]; then
    echo "Updating ${pkg_dir}package.json with link: references"
    pkg_temp=$(mktemp)
    
    # Convert file:dist-packages/ references to link: references
    jq 'if .dependencies then 
          .dependencies |= with_entries(
            if (.key | startswith("@lit-protocol/")) and (.value | type == "string") and (.value | contains("file:")) then 
              .value = "link:../../submods/js-sdk/packages/" + (.key | sub("^@lit-protocol/"; ""))
            else . end
          ) 
        else . end' "${pkg_dir}package.json" > "$pkg_temp"
    
    mv "$pkg_temp" "${pkg_dir}package.json"
  fi
done

# STEP 2: Build and pack submodule packages
echo "STEP 2: Building and packing submodule packages..."

# Function to pack a package
pack_package() {
  local pkg_dir=$1
  local pkg_name=$2
  local pkg_version=$3
  local pkg_hash=$4
  local package_manager=$5

  echo "Packing $pkg_name from $pkg_dir"

  cd "$pkg_dir"

  # Verify dist folder exists
  if [ -d "dist" ]; then
    echo "✓ dist folder exists at $(pwd)/dist"
    echo "Contents of dist folder:"
    ls -la dist
  else
    echo "⚠️ WARNING: dist folder missing at $(pwd)"
  fi

  # Save original package.json and .npmignore
  cp package.json package.json.original
  [ -f .npmignore ] && cp .npmignore .npmignore.original

  # Ensure package.json includes dist in the files array
  jq '.files = if .files then (.files + ["dist", "dist/**", "**/*.d.ts"] | unique) else ["dist", "dist/**", "**/*.d.ts"] end' package.json > package.json.temp
  mv package.json.temp package.json

  # Create or update .npmignore to explicitly include dist
  # Save existing content if file exists
  if [ -f .npmignore ]; then
    cat .npmignore > .npmignore.content
    # Make sure dist exclusion isn't present
    grep -v "dist" .npmignore.content > .npmignore
  fi
  # Add explicit inclusions for dist
  echo "!dist/" >> .npmignore
  echo "!dist/**" >> .npmignore
  echo "!**/*.d.ts" >> .npmignore

  # Pack the package
  local pkg_file
  if [ "$package_manager" == "yarn" ]; then
    echo "Using yarn to pack $pkg_name"
    pkg_file=$(yarn pack --filename temp-package.tgz 2>/dev/null)
    pkg_file="temp-package.tgz"
  elif [ "$package_manager" == "pnpm" ]; then
    echo "Using pnpm to pack $pkg_name"
    pkg_file=$(pnpm pack 2>/dev/null | tail -n 1)
  else
    echo "Using npm to pack $pkg_name"
    pkg_file=$(npm pack 2>/dev/null | tail -n 1)
  fi

  # Verify the content of the package to make sure dist is included
  echo "Checking contents of packed package:"
  tar -tvf "$pkg_file" | grep -E 'dist/|\.d\.ts' || echo "⚠️ WARNING: Could not find dist folder or .d.ts files in the packed package!"

  # Restore original files
  mv package.json.original package.json
  [ -f .npmignore.original ] && mv .npmignore.original .npmignore || rm -f .npmignore

  if [ -z "$pkg_file" ] || [ ! -f "$pkg_file" ]; then
    echo "⚠️ WARNING: Failed to pack $pkg_name"
    cd "$ROOT_DIR"
    return 1
  fi

  # Clean package name for filename
  local clean_pkg_name=$(echo "$pkg_name" | sed 's/\//-/g')
  local target_file="${clean_pkg_name}-${pkg_version}-${pkg_hash}.tgz"

  # Move to dist-packages
  mv "$pkg_file" "$ROOT_DIR/dist-packages/$target_file"
  echo "✓ Created package: $ROOT_DIR/dist-packages/$target_file"

  # Update package-map.json
  local temp_map=$(mktemp)
  jq --arg pkg "$pkg_name" --arg file "file:dist-packages/$target_file" '.[$pkg] = $file' "$ROOT_DIR/dist-packages/package-map.json" > "$temp_map"
  mv "$temp_map" "$ROOT_DIR/dist-packages/package-map.json"

  cd "$ROOT_DIR"
  return 0
}

# Build js-sdk
if [ -d "submods/js-sdk" ]; then
  cd "$ROOT_DIR/submods/js-sdk"
  echo "Building js-sdk..."
  yarn install
  yarn build
  cd "$ROOT_DIR"
  
  # First identify which lit packages are needed
  echo "Identifying required lit packages..."
  REQUIRED_PACKAGES=()
  
  # Check packages in lit-wrapper
  if [ -f "packages/lit-wrapper/package.json" ]; then
    LIT_DEPS=$(jq -r '.dependencies | keys[] | select(startswith("@lit-protocol/"))' "packages/lit-wrapper/package.json")
    for dep in $LIT_DEPS; do
      REQUIRED_PACKAGES+=("$dep")
      echo "Required by lit-wrapper: $dep"
    done
  fi
  
  # Check packages in pnpm.overrides
  OVERRIDE_DEPS=$(jq -r '.pnpm.overrides | keys[] | select(startswith("@lit-protocol/"))' "package.json")
  for dep in $OVERRIDE_DEPS; do
    # Check if already in array
    if [[ ! " ${REQUIRED_PACKAGES[@]} " =~ " ${dep} " ]]; then
      REQUIRED_PACKAGES+=("$dep")
      echo "Required by overrides: $dep"
    fi
  done
  
  # Make sure contracts and contracts-sdk are included
  if [[ ! " ${REQUIRED_PACKAGES[@]} " =~ " @lit-protocol/contracts " ]]; then
    REQUIRED_PACKAGES+=("@lit-protocol/contracts")
    echo "Adding required package: @lit-protocol/contracts"
  fi
  
  if [[ ! " ${REQUIRED_PACKAGES[@]} " =~ " @lit-protocol/contracts-sdk " ]]; then
    REQUIRED_PACKAGES+=("@lit-protocol/contracts-sdk")
    echo "Adding required package: @lit-protocol/contracts-sdk"
  fi
  
  # Special handling for contracts package if it doesn't exist
  if [ ! -d "submods/js-sdk/packages/contracts" ] && [[ " ${REQUIRED_PACKAGES[@]} " =~ " @lit-protocol/contracts " ]]; then
    echo "Warning: Directory submods/js-sdk/packages/contracts does not exist."
    echo "Creating a special package for @lit-protocol/contracts..."
    
    # Use contracts-sdk as a base for contracts
    if [ -d "submods/js-sdk/packages/contracts-sdk" ]; then
      # Create contracts package from contracts-sdk
      cd "submods/js-sdk/packages/contracts-sdk"
      pkg_version=$(jq -r '.version // "1.0.0"' package.json)

      # Verify dist folder exists
      if [ -d "dist" ]; then
        echo "✓ dist folder exists at $(pwd)/dist"
        echo "Contents of dist folder:"
        ls -la dist
      else
        echo "⚠️ WARNING: dist folder missing at $(pwd)"
      fi

      # Save original package.json and .npmignore
      cp package.json package.json.original
      [ -f .npmignore ] && cp .npmignore .npmignore.original

      # Ensure package.json includes dist in the files array
      jq '.files = if .files then (.files + ["dist", "dist/**", "**/*.d.ts"] | unique) else ["dist", "dist/**", "**/*.d.ts"] end' package.json > package.json.temp
      mv package.json.temp package.json

      # Create or update .npmignore to explicitly include dist
      # Save existing content if file exists
      if [ -f .npmignore ]; then
        cat .npmignore > .npmignore.content
        # Make sure dist exclusion isn't present
        grep -v "dist" .npmignore.content > .npmignore
      fi
      # Add explicit inclusions for dist
      echo "!dist/" >> .npmignore
      echo "!dist/**" >> .npmignore
      echo "!**/*.d.ts" >> .npmignore

      # Pack the package
      echo "Using yarn to pack @lit-protocol/contracts (from contracts-sdk)"
      yarn pack --filename temp-package.tgz 2>/dev/null
      pkg_file="temp-package.tgz"

      # Verify the content of the package to make sure dist is included
      echo "Checking contents of packed contracts package:"
      tar -tvf "$pkg_file" | grep -E 'dist/|\.d\.ts' || echo "⚠️ WARNING: Could not find dist folder or .d.ts files in the packed package!"

      # Restore original files
      mv package.json.original package.json
      [ -f .npmignore.original ] && mv .npmignore.original .npmignore || rm -f .npmignore
      
      if [ -n "$pkg_file" ]; then
        # Create the contracts package
        target_file="@lit-protocol-contracts-${pkg_version}-${JS_SDK_HASH}.tgz"
        mv "$pkg_file" "$ROOT_DIR/dist-packages/$target_file"
        echo "Created special package: $ROOT_DIR/dist-packages/$target_file"
        
        # Update package-map.json
        temp_map=$(mktemp)
        jq --arg pkg "@lit-protocol/contracts" --arg file "file:dist-packages/$target_file" '.[$pkg] = $file' "$ROOT_DIR/dist-packages/package-map.json" > "$temp_map"
        mv "$temp_map" "$ROOT_DIR/dist-packages/package-map.json"
        
        # Also add the compatibility mapping
        temp_map=$(mktemp)
        jq --arg pkg "@lit/protocol-contracts" --arg file "file:dist-packages/$target_file" '.[$pkg] = $file' "$ROOT_DIR/dist-packages/package-map.json" > "$temp_map"
        mv "$temp_map" "$ROOT_DIR/dist-packages/package-map.json"
      else
        echo "Warning: Failed to create special package for @lit-protocol/contracts"
      fi
      
      cd "$ROOT_DIR"
    fi
  fi

  # Pack only the required lit packages
  for pkg_name in "${REQUIRED_PACKAGES[@]}"; do
    # Skip contracts if we already handled it specially
    if [ "$pkg_name" == "@lit-protocol/contracts" ] && [ ! -d "submods/js-sdk/packages/contracts" ]; then
      echo "Skipping @lit-protocol/contracts (already handled specially)"
      continue
    fi
    
    # Extract package name without @lit-protocol/
    pkg_short_name=$(echo "$pkg_name" | sed 's/@lit-protocol\///')
    pkg_dir="submods/js-sdk/packages/$pkg_short_name"
    
    if [ -d "$pkg_dir" ] && [ -f "$pkg_dir/package.json" ]; then
      pkg_version=$(jq -r '.version // "1.0.0"' "$pkg_dir/package.json")
      echo "Packing required package: $pkg_name ($pkg_version)"
      pack_package "$pkg_dir" "$pkg_name" "$pkg_version" "$JS_SDK_HASH" "yarn"
    else
      echo "Warning: Could not find package directory for $pkg_name at $pkg_dir"
    fi
  done
fi

# Build upload-service
if [ -d "submods/upload-service" ]; then
  cd "$ROOT_DIR/submods/upload-service"
  echo "Building upload-service..."
  pnpm install
  pnpm nx run-many -t build
  cd "$ROOT_DIR"
  
  # Pack w3up-client package
  w3up_client_dir="submods/upload-service/packages/w3up-client"
  if [ -d "$w3up_client_dir" ] && [ -f "$w3up_client_dir/package.json" ]; then
    pkg_name=$(jq -r '.name // ""' "$w3up_client_dir/package.json")
    pkg_version=$(jq -r '.version // "1.0.0"' "$w3up_client_dir/package.json")
    
    if [ -n "$pkg_name" ] && [ "$pkg_name" != "null" ]; then
      pack_package "$w3up_client_dir" "$pkg_name" "$pkg_version" "$UPLOAD_SERVICE_HASH" "pnpm"
    fi
  fi
fi

# Add compatibility mappings for lit packages
echo "Adding compatibility mappings for lit packages..."
TEMP_MAP=$(mktemp)
jq '
  . as $map |
  reduce (keys_unsorted[]) as $key (. ;
    if ($key | startswith("@lit-protocol/")) then
      # Create an equivalent @lit/protocol entry
      .["@lit/protocol-" + ($key | sub("@lit-protocol/"; ""))] = $map[$key]
    else
      .
    end
  )
' dist-packages/package-map.json > "$TEMP_MAP"
mv "$TEMP_MAP" dist-packages/package-map.json

# STEP 3: Update all wrapper package.json files with consistent file: references
echo "STEP 3: Updating wrapper package.json files with consistent file: references..."

# Update all wrapper package.json files
for pkg_dir in ./packages/*/; do
  # Skip firebase-functions
  if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
    continue
  fi
  
  if [ -f "${pkg_dir}package.json" ]; then
    echo "Updating ${pkg_dir}package.json with file: references"
    pkg_temp=$(mktemp)
    
    # Get all lit-protocol dependencies
    lit_deps=$(jq -r '.dependencies | keys[] | select(startswith("@lit-protocol/"))' "${pkg_dir}package.json")
    
    # For each dependency, update with the correct file: reference
    for dep in $lit_deps; do
      # Convert package name to filename format
      clean_name=$(echo "$dep" | sed 's/^@lit-protocol\///' | sed 's/\//-/g')
      file_ref="file:../../dist-packages/@lit-protocol-${clean_name}-7.1.1-${JS_SDK_HASH}.tgz"
      
      # Update the dependency
      jq --arg dep "$dep" --arg ref "$file_ref" '.dependencies[$dep] = $ref' "${pkg_dir}package.json" > "$pkg_temp"
      mv "$pkg_temp" "${pkg_dir}package.json"
    done
  fi
done

# STEP 4: Install dependencies and build wrappers
echo "STEP 4: Installing dependencies and building wrappers..."
pnpm install
pnpm build:wrappers

# STEP 5: Pack wrapper packages
echo "STEP 5: Packing wrapper packages..."
for pkg_dir in ./packages/*/; do
  # Skip firebase-functions
  if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
    continue
  fi
  
  if [ -f "${pkg_dir}package.json" ]; then
    pkg_name=$(jq -r '.name // ""' "${pkg_dir}package.json")
    pkg_version=$(jq -r '.version // "1.0.0"' "${pkg_dir}package.json")
    
    if [ -n "$pkg_name" ] && [ "$pkg_name" != "null" ]; then
      pack_package "$pkg_dir" "$pkg_name" "$pkg_version" "$MAIN_HASH" "pnpm"
    fi
  fi
done

# STEP 6: Update root package.json with file: references to all packages
echo "STEP 6: Updating root package.json with file: references..."
TEMP_ROOT=$(mktemp)
jq --slurpfile map dist-packages/package-map.json '
  . as $root |
  $map[0] as $map_obj |

  # Important: For checked-in state, keep workspace:* for local packages
  # but keep file: references in overrides

  # Remove any direct @lit-protocol dependencies
  .dependencies = (.dependencies | del(.["@lit-protocol/access-control-conditions"]) | del(.["@lit-protocol/auth-helpers"])) |

  # Update pnpm.overrides to use the packaged versions
  .pnpm.overrides = $map_obj
' package.json > "$TEMP_ROOT"
mv "$TEMP_ROOT" package.json

# STEP 7: Run final pnpm install to apply all changes
echo "STEP 7: Running final pnpm install to apply all changes..."
pnpm install

echo "====== PACKAGE REBUILD COMPLETE ======"
echo "All packages have been rebuilt with consistent file: references."