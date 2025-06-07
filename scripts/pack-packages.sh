#!/bin/bash
set -e

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

# Directory where all package tarballs will be stored
DIST_DIR="dist-packages"
mkdir -p $DIST_DIR

# Step 1: Run the install.sh script which builds the submodules
echo "==== Running install.sh ===="
./scripts/install.sh

# Step 2: First, find all link: references in packages/* to submods/*
echo "==== Finding submods references from packages ===="
submods_links=$(mktemp)

# Look through each package in packages directory
if [ -d "./packages" ]; then
  for pkg_dir in ./packages/*/; do
    if [ -f "${pkg_dir}package.json" ]; then
      echo "Checking for submods references in ${pkg_dir}package.json"
      
      # Extract package name
      pkg_name=$(jq -r '.name // ""' "${pkg_dir}package.json")
      if [ -z "$pkg_name" ] || [ "$pkg_name" == "null" ]; then
        echo "Warning: No package name found in ${pkg_dir}package.json"
        continue
      fi
      
      # Find all link: references to submods
      jq -r '.dependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("link:") and contains("submods")) | .key + "=" + .value' "${pkg_dir}package.json" >> "$submods_links"
      jq -r '.devDependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("link:") and contains("submods")) | .key + "=" + .value' "${pkg_dir}package.json" >> "$submods_links"
      jq -r '.peerDependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("link:") and contains("submods")) | .key + "=" + .value' "${pkg_dir}package.json" >> "$submods_links"
    fi
  done
fi

# Get unique submods references
sort -u "$submods_links" > "${submods_links}.sorted"
mv "${submods_links}.sorted" "$submods_links"

echo "Found the following submods references:"
cat "$submods_links"

# Step 3: Build and pack the submods packages
echo "==== Building and packing submods packages ===="

# Track which packages we've already processed
PROCESSED_PACKAGES=""

# Process each unique submods reference
while IFS='=' read -r pkg_name link_path; do
  # Skip if already processed
  if echo "$PROCESSED_PACKAGES" | grep -q ":$pkg_name:"; then
    echo "Package $pkg_name already processed, skipping"
    continue
  fi
  
  # Clean up the link path
  clean_path=$(echo "$link_path" | sed 's/^link://')
  
  # Handle different path formats
  if [[ "$clean_path" == /* ]]; then
    # Absolute path
    target_dir="$clean_path"
  elif [[ "$clean_path" == ../../* ]]; then
    # Path starting with ../../
    # This is a special case for paths like ../../submods/js-sdk/packages/constants
    target_dir="$ROOT_DIR/$(echo "$clean_path" | sed 's|^../../||')"
  elif [[ "$clean_path" == ../* ]]; then
    # Relative path with ../
    target_dir="$ROOT_DIR/$(echo "$clean_path" | sed 's|^../||')"
  elif [[ "$clean_path" == ./* ]]; then
    # Relative path with ./
    target_dir="$ROOT_DIR/${clean_path:2}"
  else
    # Simple relative path
    target_dir="$ROOT_DIR/$clean_path"
  fi
  
  if [ -d "$target_dir" ] && [ -f "$target_dir/package.json" ]; then
    echo "Processing submods package: $pkg_name at $target_dir"
    
    # Navigate to package directory
    cd "$target_dir"
    
    # Calculate content hash
    pkg_hash=$(find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | sort | xargs cat 2>/dev/null | sha256sum | cut -d ' ' -f 1 | cut -c 1-12)
    
    # Get version from package.json
    pkg_version=$(jq -r '.version // "1.0.0"' package.json)
    
    # Check if dist folder exists and has content
    if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
      echo "Warning: dist folder is missing or empty in $pkg_name at $target_dir"
      echo "Attempting to build package before packing..."

      # Try to build the package
      if [[ "$target_dir" == *"submods/js-sdk"* ]]; then
        yarn build 2>/dev/null || echo "Failed to build $pkg_name"
      elif [[ "$target_dir" == *"submods/upload-service"* ]]; then
        pnpm build 2>/dev/null || echo "Failed to build $pkg_name"
      else
        npm run build 2>/dev/null || echo "Failed to build $pkg_name"
      fi

      # Check again if dist folder exists after build
      if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
        echo "Warning: dist folder still missing after build attempt in $pkg_name"
      else
        echo "Successfully built dist folder for $pkg_name"
      fi
    fi

    # Pack the package with the appropriate tool and ensure dist folder is included
    echo "Packing $pkg_name (including dist folder)"
    if [[ "$target_dir" == *"submods/js-sdk"* ]]; then
      pkg_file=$(yarn pack 2>/dev/null | grep -o '[^/]*\.tgz' | tail -n 1)
    elif [[ "$target_dir" == *"submods/upload-service"* ]]; then
      pkg_file=$(pnpm pack 2>/dev/null | tail -n 1)
    else
      pkg_file=$(npm pack 2>/dev/null | tail -n 1)
    fi
    
    if [ -n "$pkg_file" ]; then
      # Move to dist packages with hash in filename
      target_file="${pkg_name/\//-}-${pkg_version}-${pkg_hash}.tgz"
      echo "Moving $pkg_file to $ROOT_DIR/$DIST_DIR/$target_file"
      mv "$pkg_file" "$ROOT_DIR/$DIST_DIR/$target_file"
      
      # Mark as processed
      PROCESSED_PACKAGES="$PROCESSED_PACKAGES:$pkg_name:"
    else
      echo "Warning: Failed to pack $pkg_name"
    fi
    
    # Return to root
    cd "$ROOT_DIR"
  else
    echo "Warning: Could not find submods package at $target_dir"
  fi
done < "$submods_links"

# Clean up
rm "$submods_links"

# Skip Step 4 (Updating package references) - we'll use fix-packages.sh for this
echo "==== Skipping package references update (will be handled by fix-packages.sh) ===="

# Step 5: Build and pack the packages/* directories
echo "==== Building and packing packages/* ===="
if [ -d "./packages" ]; then
  for pkg_dir in ./packages/*/; do
    # Skip firebase-functions package
    if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
      echo "Skipping firebase-functions package (private module)"
      continue
    fi

    if [ -f "${pkg_dir}package.json" ]; then
      # Get package name
      pkg_name=$(jq -r '.name // ""' "${pkg_dir}package.json")
      if [ -z "$pkg_name" ] || [ "$pkg_name" == "null" ]; then
        echo "Warning: No package name found in ${pkg_dir}package.json"
        continue
      fi

      echo "Building and packing $pkg_name from ${pkg_dir}"

      # Before building, temporarily replace link: references with file: references to tgz files
      echo "Temporarily updating dependencies for build..."
      temp_pkg_json=$(mktemp)

      # Process all link: references in dependencies
      jq --slurpfile map "$ROOT_DIR/$DIST_DIR/package-map.json" '
        . as $pkg |
        $map[0] as $map_obj |

        # Function to process dependencies
        def process_deps($deps):
          if $deps then
            reduce (keys_unsorted[]) as $key ($deps;
              if (.[$key] | type=="string") and
                 (((.[$key] | startswith("link:")) and (.[$key] | contains("submods"))) or
                  (.[$key] | startswith("workspace:")) or
                  (.[$key] == "catalog:")) and
                 ($key | IN($map_obj|keys[]))
              then
                # Replace with file: reference to tgz (relative path for packages)
                .[$key] = ($map_obj[$key] | sub("file:dist-packages/"; "file:../../dist-packages/"))
              else
                .
              end
            )
          else
            $deps
          end;

        # Apply to all dependency sections
        .dependencies = process_deps(.dependencies) |
        .devDependencies = process_deps(.devDependencies) |
        if has("peerDependencies") then .peerDependencies = process_deps(.peerDependencies) else . end
      ' "${pkg_dir}package.json" > "$temp_pkg_json"

      # Backup original package.json
      cp "${pkg_dir}package.json" "${pkg_dir}package.json.bak"

      # Replace with temporary version for building
      cp "$temp_pkg_json" "${pkg_dir}package.json"

      # Navigate to package directory
      cd "$pkg_dir"

      # Build if needed
      if grep -q "\"build\"" package.json; then
        echo "Building $pkg_name"
        pnpm run build 2>/dev/null || npm run build 2>/dev/null || echo "Build script failed but continuing"
      fi

      # Restore original package.json
      mv "${pkg_dir}package.json.bak" "${pkg_dir}package.json"
      
      # Calculate content hash
      pkg_hash=$(find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | sort | xargs cat 2>/dev/null | sha256sum | cut -d ' ' -f 1 | cut -c 1-12)
      
      # Get version
      pkg_version=$(jq -r '.version // "1.0.0"' package.json)
      
      # Ensure dist folder is included in the package
      echo "Packing $pkg_name (including dist folder)"
      # Create a .npmignore file to ensure dist is included
      [ -f .npmignore ] && cp .npmignore .npmignore.bak
      echo "!dist/" > .npmignore
      echo "!dist/**" >> .npmignore

      # Pack the package
      pkg_file=$(pnpm pack 2>/dev/null | tail -n 1 || npm pack 2>/dev/null | tail -n 1)

      # Restore original .npmignore if it existed
      [ -f .npmignore.bak ] && mv .npmignore.bak .npmignore || rm .npmignore
      
      if [ -n "$pkg_file" ]; then
        # Move to dist packages with hash in filename
        target_file="${pkg_name/\//-}-${pkg_version}-${pkg_hash}.tgz"
        echo "Moving $pkg_file to $ROOT_DIR/$DIST_DIR/$target_file"
        mv "$pkg_file" "$ROOT_DIR/$DIST_DIR/$target_file"
        
        # Mark as processed
        PROCESSED_PACKAGES="$PROCESSED_PACKAGES:$pkg_name:"
      else
        echo "Warning: Failed to pack $pkg_name"
      fi
      
      # Return to root
      cd "$ROOT_DIR"
    fi
  done
fi

# Step 6: Generate a mapping file with normalized package names
echo "==== Generating package mapping file ===="

# First, create an initial mapping from package files to paths
declare -A file_map
for pkg_file in $DIST_DIR/*.tgz; do
  if [ -f "$pkg_file" ]; then
    filename=$(basename "$pkg_file")
    # Extract package name from filename (removing version and hash)
    pkg_name=$(echo "$filename" | sed -E 's/(.+)-[0-9]+\.[0-9]+\.[0-9]+-[a-f0-9]{12}\.tgz/\1/')
    
    # Convert hyphens back to slashes if they're scoped packages
    if [[ "$pkg_name" == *"-"* ]]; then
      if [[ "$pkg_name" == @* ]]; then
        first_part=$(echo "$pkg_name" | cut -d '-' -f 1)
        rest_part=$(echo "$pkg_name" | cut -d '-' -f 2-)
        pkg_name="$first_part/$rest_part"
      fi
    fi
    
    file_map["$pkg_name"]="file:$DIST_DIR/$filename"
  fi
done

# Now create a more comprehensive mapping that includes normalized package names
# and additional aliases for packages
echo "{" > $DIST_DIR/package-map.json
comma=""

# Add standard entries from file_map - use relative paths from root (file:dist-packages/...)
for pkg_name in "${!file_map[@]}"; do
  # Use root-relative path for the package map (used by root package.json)
  file_path=$(echo "${file_map[$pkg_name]}" | sed 's|file:.*dist-packages/|file:dist-packages/|')
  echo "$comma  \"$pkg_name\": \"$file_path\"" >> $DIST_DIR/package-map.json
  comma=","
done

# Handle special cases for @lit packages - add additional mappings
# Check if we have @lit-protocol packages and ensure we have both formats
for pkg_name in "${!file_map[@]}"; do
  if [[ "$pkg_name" == "@lit-protocol/"* ]]; then
    # Create equivalent @lit/protocol entry for compatibility
    alt_name=$(echo "$pkg_name" | sed 's/@lit-protocol\//@lit\/protocol-/')
    if ! [[ -v "file_map[$alt_name]" ]]; then
      # Use root-relative path for the package map
      file_path=$(echo "${file_map[$pkg_name]}" | sed 's|file:.*dist-packages/|file:dist-packages/|')
      echo "$comma  \"$alt_name\": \"$file_path\"" >> $DIST_DIR/package-map.json
      comma=","
    fi
  elif [[ "$pkg_name" == "@lit/protocol-"* ]]; then
    # Create equivalent @lit-protocol entry for compatibility
    alt_name=$(echo "$pkg_name" | sed 's/@lit\/protocol-/@lit-protocol\//')
    if ! [[ -v "file_map[$alt_name]" ]]; then
      # Use root-relative path for the package map
      file_path=$(echo "${file_map[$pkg_name]}" | sed 's|file:.*dist-packages/|file:dist-packages/|')
      echo "$comma  \"$alt_name\": \"$file_path\"" >> $DIST_DIR/package-map.json
      comma=","
    fi
  fi
done

# Handle @lit-protocol/contracts mapping to contracts-sdk if needed
if [[ -v "file_map[@lit-protocol/contracts-sdk]" ]] && ! [[ -v "file_map[@lit-protocol/contracts]" ]]; then
  # Use root-relative path for the package map
  file_path=$(echo "${file_map[@lit-protocol/contracts-sdk]}" | sed 's|file:.*dist-packages/|file:dist-packages/|')
  echo "$comma  \"@lit-protocol/contracts\": \"$file_path\"" >> $DIST_DIR/package-map.json
  comma=","
fi

echo "}" >> $DIST_DIR/package-map.json

echo "==== Package map generated ===="
cat $DIST_DIR/package-map.json

echo "==== Running fix-packages.sh to update package references ===="
"$ROOT_DIR/scripts/fix-packages.sh"

echo "==== All packages have been packed and references updated ===="
echo "You can now commit the $DIST_DIR directory to the repository"