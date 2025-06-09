#!/bin/bash
set -e

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

echo "====== REBUILDING ALL PACKAGES WITH CONSISTENT REFERENCES ======"

# 1. Clean up old .tgz files
echo "Cleaning up old .tgz files..."
if [ -d "dist-packages" ]; then
  # Remove all .tgz files but keep the directory and any .json files
  find dist-packages -name "*.tgz" -type f -delete
  echo "Removed old .tgz files from dist-packages/"
fi

# 2. Ensure dist-packages directory exists
mkdir -p dist-packages

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

# STEP 1: Set all references to link: using package-map.original.json
echo "STEP 1: Setting up link: references for building submodules..."
# Run the script to set original references
node "$ROOT_DIR/scripts/set-package-refs.js" original
pnpm install

# Special handling for contracts if directory doesn't exist
if [ ! -d "submods/js-sdk/packages/contracts" ]; then
  echo "Warning: contracts directory doesn't exist, using contracts-sdk instead"
fi

# STEP 2: Build and pack submodule packages
echo "STEP 2: Building and packing submodule packages..."

# Function to pack a package (handles symlinks properly)
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

  # Create a unique backup directory for symlinks
  local backup_dir="/tmp/package-symlink-backup-$RANDOM"
  mkdir -p "$backup_dir"

  # Find and handle symlinks
  echo "Finding and replacing symlinks..."
  find . -type l > "$backup_dir/symlink_files.txt"

  if [ -s "$backup_dir/symlink_files.txt" ]; then
    while IFS= read -r symlink; do
      # Get absolute path of the symlink target
      local symlink_target=$(readlink -f "$symlink")

      # Save symlink info for restoration (with the original target, not the resolved one)
      local original_target=$(readlink "$symlink")
      echo "$symlink:$original_target" >> "$backup_dir/symlinks.txt"

      # Remove the symlink
      rm "$symlink"

      # Check if target exists and is accessible
      if [ -e "$symlink_target" ]; then
        # Copy the target content to the original symlink location
        if [ -d "$symlink_target" ]; then
          mkdir -p "$symlink"
          cp -R "$symlink_target/." "$symlink/"
          echo "Replaced directory symlink $symlink with content from $symlink_target"
        else
          cp "$symlink_target" "$symlink"
          echo "Replaced file symlink $symlink with content from $symlink_target"
        fi
      else
        echo "Warning: Symlink target $symlink_target does not exist or is not accessible, creating empty placeholder"
        if [[ "$original_target" == */ ]]; then
          # Target was a directory
          mkdir -p "$symlink"
        else
          # Target was a file
          touch "$symlink"
        fi
      fi
    done < "$backup_dir/symlink_files.txt"
  else
    echo "No symlinks found in $pkg_dir"
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
    # Use yarn to pack and specify the output filename directly
    yarn pack --filename temp-package.tgz >/dev/null 2>&1
    pkg_file="temp-package.tgz"
    # Verify the file exists and is not a symlink
    if [ ! -f "$pkg_file" ] || [ -L "$pkg_file" ]; then
      echo "⚠️ WARNING: yarn pack did not create a valid file at $pkg_file"
      if [ -L "$pkg_file" ]; then
        # Remove the symlink and try to find the actual file
        rm -f "$pkg_file"
        # Try to find the package in the dist directory
        local dist_pkg_file=$(find ./dist -name "*.tgz" | head -1)
        if [ -n "$dist_pkg_file" ] && [ -f "$dist_pkg_file" ]; then
          # Copy the file from dist
          cp "$dist_pkg_file" "$pkg_file"
          echo "Copied package from $dist_pkg_file to $pkg_file"
        else
          echo "⚠️ ERROR: Failed to find a valid package file for $pkg_name"
          cd "$ROOT_DIR"
          return 1
        fi
      fi
    fi
  elif [ "$package_manager" == "pnpm" ]; then
    echo "Using pnpm to pack $pkg_name"
    # Use pnpm to pack and capture the output filename
    pkg_file=$(pnpm pack 2>/dev/null | tail -n 1)
    # Verify the file exists and is not a symlink
    if [ ! -f "$pkg_file" ] || [ -L "$pkg_file" ]; then
      echo "⚠️ WARNING: pnpm pack did not create a valid file at $pkg_file"
      pkg_file="$(basename $pkg_name)-$pkg_version.tgz"
      if [ ! -f "$pkg_file" ] || [ -L "$pkg_file" ]; then
        echo "⚠️ ERROR: Failed to find a valid package file for $pkg_name"
        cd "$ROOT_DIR"
        return 1
      fi
    fi
  else
    echo "Using npm to pack $pkg_name"
    # Use npm to pack and capture the output filename
    pkg_file=$(npm pack 2>/dev/null | tail -n 1)
    # Verify the file exists and is not a symlink
    if [ ! -f "$pkg_file" ] || [ -L "$pkg_file" ]; then
      echo "⚠️ WARNING: npm pack did not create a valid file at $pkg_file"
      cd "$ROOT_DIR"
      return 1
    fi
  fi

  # Verify the content of the package to make sure dist is included
  echo "Checking contents of packed package:"
  tar -tvf "$pkg_file" | grep -E 'dist/|\.d\.ts' || echo "⚠️ WARNING: Could not find dist folder or .d.ts files in the packed package!"

  # Restore original files
  mv package.json.original package.json
  [ -f .npmignore.original ] && mv .npmignore.original .npmignore || rm -f .npmignore

  # Restore symlinks
  echo "Restoring symlinks..."
  if [ -f "$backup_dir/symlinks.txt" ]; then
    while IFS=: read -r symlink symlink_target; do
      # Remove the copied content
      if [ -d "$symlink" ]; then
        rm -rf "$symlink"
      else
        rm -f "$symlink"
      fi

      # Get the directory of the symlink
      local symlink_dir=$(dirname "$symlink")

      # Make sure the parent directory exists
      mkdir -p "$symlink_dir"

      # Recreate the symlink with proper quoting
      ln -sf "$symlink_target" "$symlink"
      echo "Restored symlink $symlink pointing to $symlink_target"
    done < "$backup_dir/symlinks.txt"
  fi

  # Clean up backup directory
  rm -rf "$backup_dir"

  if [ -z "$pkg_file" ] || [ ! -f "$pkg_file" ]; then
    echo "⚠️ WARNING: Failed to pack $pkg_name"
    cd "$ROOT_DIR"
    return 1
  fi

  # Clean package name for filename
  local clean_pkg_name=$(echo "$pkg_name" | sed 's/\//-/g')
  local target_file="${clean_pkg_name}-${pkg_version}-${pkg_hash}.tgz"

  # Move to dist-packages, ensuring we're creating a real file, not a symlink
  # First, remove any existing file or symlink at the target
  if [ -e "$ROOT_DIR/dist-packages/$target_file" ]; then
    rm -f "$ROOT_DIR/dist-packages/$target_file"
  fi

  # Use cp followed by rm instead of mv to ensure we're not creating a symlink
  cp "$pkg_file" "$ROOT_DIR/dist-packages/$target_file"
  rm -f "$pkg_file"

  # Verify the file exists and is not a symlink
  if [ ! -f "$ROOT_DIR/dist-packages/$target_file" ] || [ -L "$ROOT_DIR/dist-packages/$target_file" ]; then
    echo "⚠️ ERROR: Failed to create a valid package file at $ROOT_DIR/dist-packages/$target_file"
    if [ -L "$ROOT_DIR/dist-packages/$target_file" ]; then
      echo "  Target is a symlink. Removing it and trying again..."
      rm -f "$ROOT_DIR/dist-packages/$target_file"
      # Try a different approach - create a new temporary file and then use cat to write it
      if [ -f "$pkg_file" ]; then
        cat "$pkg_file" > "$ROOT_DIR/dist-packages/$target_file"
        rm -f "$pkg_file"
      else
        echo "  Original package file no longer exists!"
        cd "$ROOT_DIR"
        return 1
      fi
    fi
  fi

  echo "✓ Created package: $ROOT_DIR/dist-packages/$target_file"

  # Update package-map.file.json (ensuring we don't create symlinks)
  local temp_map=$(mktemp)

  # Create or update the JSON content
  if [ -f "$ROOT_DIR/dist-packages/package-map.file.json" ] && [ ! -L "$ROOT_DIR/dist-packages/package-map.file.json" ]; then
    # If it's a real file, use jq to update it
    jq --arg pkg "$pkg_name" --arg file "file:./dist-packages/$target_file" '.[$pkg] = $file' "$ROOT_DIR/dist-packages/package-map.file.json" > "$temp_map"
  else
    # If it doesn't exist or is a symlink, start fresh
    if [ -L "$ROOT_DIR/dist-packages/package-map.file.json" ]; then
      rm -f "$ROOT_DIR/dist-packages/package-map.file.json"
    fi
    echo "{\"$pkg_name\": \"file:./dist-packages/$target_file\"}" > "$temp_map"
  fi

  # Use cp instead of mv to avoid creating symlinks
  cp "$temp_map" "$ROOT_DIR/dist-packages/package-map.file.json"
  rm -f "$temp_map"

  # Verify the file is not a symlink
  if [ -L "$ROOT_DIR/dist-packages/package-map.file.json" ]; then
    echo "⚠️ ERROR: package-map.file.json is still a symlink. Creating it directly..."
    rm -f "$ROOT_DIR/dist-packages/package-map.file.json"
    echo "{\"$pkg_name\": \"file:./dist-packages/$target_file\"}" > "$ROOT_DIR/dist-packages/package-map.file.json"
  fi

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
  OVERRIDE_DEPS=$(jq -r '.overrides | keys[] | select(startswith("@lit-protocol/"))' "package.json")
  for dep in $OVERRIDE_DEPS; do
    # Check if already in array
    if [[ ! " ${REQUIRED_PACKAGES[@]} " =~ " ${dep} " ]]; then
      REQUIRED_PACKAGES+=("$dep")
      echo "Required by overrides: $dep"
    fi
  done
  
  # Pack only the required lit packages
  for pkg_name in "${REQUIRED_PACKAGES[@]}"; do    
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

# STEP 3: Update references to file: paths for built submodules
echo "STEP 3: Setting up file: references for building wrappers..."
# Run the script to set file references
node "$ROOT_DIR/scripts/set-package-refs.js" skip-wrappers
pnpm install

# STEP 4: Build wrappers
echo "STEP 4: Building wrappers..."
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
      echo "Packing wrapper package: $pkg_name"
            
      # Create manually with npm pack
      cd "$pkg_dir"
      echo "Creating package with npm pack..."
      # Clean any existing packages
      rm -f *.tgz
      # Create package
      npm_pkg_file=$(npm pack 2>/dev/null | tail -n 1)
      
      if [ -n "$npm_pkg_file" ] && [ -f "$npm_pkg_file" ]; then
        target_file="$pkg_name-$pkg_version-$MAIN_HASH.tgz"
        
        # Remove any existing target file
        if [ -f "$ROOT_DIR/dist-packages/$target_file" ]; then
          rm -f "$ROOT_DIR/dist-packages/$target_file"
        fi
        
        # Copy file to dist-packages
        cp "$npm_pkg_file" "$ROOT_DIR/dist-packages/$target_file"
        rm -f "$npm_pkg_file"
        
        echo "✓ Created package: $ROOT_DIR/dist-packages/$target_file"
        
        # Update package-map.file.json
        cd "$ROOT_DIR"
        if [ -f "$ROOT_DIR/dist-packages/package-map.file.json" ]; then
          # Create a temporary file for the update
          temp_map=$(mktemp)
          jq --arg pkg "$pkg_name" --arg file "file:./dist-packages/$target_file" '.[$pkg] = $file' "$ROOT_DIR/dist-packages/package-map.file.json" > "$temp_map"
          cp "$temp_map" "$ROOT_DIR/dist-packages/package-map.file.json"
          rm -f "$temp_map"
        else
          # Create a new file if it doesn't exist
          echo "{\"$pkg_name\": \"file:./dist-packages/$target_file\"}" > "$ROOT_DIR/dist-packages/package-map.file.json"
        fi
      else
        echo "⚠️ ERROR: Failed to pack $pkg_name using npm pack"
        cd "$ROOT_DIR"
      fi
    fi
  fi
done

# STEP 6: Update all references to file: for final package.json
echo "STEP 6: Setting up final file: references..."
# Run the script to set file references with updated package-map.file.json
node "$ROOT_DIR/scripts/set-package-refs.js" file

# STEP 7: Run final pnpm install to apply all changes
echo "STEP 7: Running final pnpm install to apply all changes..."
pnpm install

echo "====== PACKAGE REBUILD COMPLETE ======"
echo "All packages have been rebuilt with consistent file: references."