#!/bin/bash
set -e

# This script updates package.json files to use pnpm overrides for tgz files

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

# Directory where package tarballs are stored
DIST_DIR="dist-packages"

# Read the package-map.json
if [ ! -f "$DIST_DIR/package-map.json" ]; then
  echo "Error: package-map.json not found in $DIST_DIR"
  exit 1
fi

# Update packages/* to use pnpm.overrides
echo "==== Updating package references in packages/* ===="
if [ -d "./packages" ]; then
  for pkg_dir in ./packages/*/; do
    # Skip firebase-functions package
    if [[ "$pkg_dir" == *"firebase-functions"* ]]; then
      echo "Skipping firebase-functions package (private module)"
      continue
    fi

    if [ -f "${pkg_dir}package.json" ]; then
      pkg_json="${pkg_dir}package.json"
      echo "Updating references in $pkg_json"
      
      # Create a temporary file
      temp_file=$(mktemp)
      
      # Extract submods dependencies
      submods_deps=$(jq -r '.dependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("link:") and contains("submods")) | .key' "$pkg_json")
      submods_dev_deps=$(jq -r '.devDependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("link:") and contains("submods")) | .key' "$pkg_json")
      
      # Create overrides object
      overrides="{}"
      for dep in $submods_deps; do
        # Get the tgz path from package-map.json
        tgz_path=$(jq -r --arg dep "$dep" '.[$dep] // ""' "$DIST_DIR/package-map.json")
        if [ -n "$tgz_path" ] && [ "$tgz_path" != "null" ]; then
          # Convert to relative path for packages
          rel_path=$(echo "$tgz_path" | sed 's|file:dist-packages/|file:../../dist-packages/|')
          # Add to overrides
          overrides=$(echo "$overrides" | jq --arg dep "$dep" --arg path "$rel_path" '. + {($dep): $path}')
        fi
      done
      
      for dep in $submods_dev_deps; do
        # Get the tgz path from package-map.json
        tgz_path=$(jq -r --arg dep "$dep" '.[$dep] // ""' "$DIST_DIR/package-map.json")
        if [ -n "$tgz_path" ] && [ "$tgz_path" != "null" ]; then
          # Convert to relative path for packages
          rel_path=$(echo "$tgz_path" | sed 's|file:dist-packages/|file:../../dist-packages/|')
          # Add to overrides
          overrides=$(echo "$overrides" | jq --arg dep "$dep" --arg path "$rel_path" '. + {($dep): $path}')
        fi
      done
      
      # Handle workspace: references
      workspace_deps=$(jq -r '.dependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("workspace:")) | .key' "$pkg_json")
      
      for dep in $workspace_deps; do
        # Get the tgz path from package-map.json
        tgz_path=$(jq -r --arg dep "$dep" '.[$dep] // ""' "$DIST_DIR/package-map.json")
        if [ -n "$tgz_path" ] && [ "$tgz_path" != "null" ]; then
          # Convert to relative path for packages
          rel_path=$(echo "$tgz_path" | sed 's|file:dist-packages/|file:../../dist-packages/|')
          # Add to overrides
          overrides=$(echo "$overrides" | jq --arg dep "$dep" --arg path "$rel_path" '. + {($dep): $path}')
        fi
      done
      
      # Handle catalog: references (special case for dag-ucan)
      catalog_deps=$(jq -r '.dependencies // {} | to_entries[] | select(.value | type=="string") | select(.value == "catalog:") | .key' "$pkg_json")
      
      for dep in $catalog_deps; do
        if [ "$dep" == "@ipld/dag-ucan" ]; then
          # Skip @ipld/dag-ucan and leave it as a regular npm dependency
          continue
        fi
        
        # Get the tgz path from package-map.json
        tgz_path=$(jq -r --arg dep "$dep" '.[$dep] // ""' "$DIST_DIR/package-map.json")
        if [ -n "$tgz_path" ] && [ "$tgz_path" != "null" ]; then
          # Convert to relative path for packages
          rel_path=$(echo "$tgz_path" | sed 's|file:dist-packages/|file:../../dist-packages/|')
          # Add to overrides
          overrides=$(echo "$overrides" | jq --arg dep "$dep" --arg path "$rel_path" '. + {($dep): $path}')
        fi
      done
      
      # Update the package.json with direct file: references instead of overrides
      if [ "$(echo "$overrides" | jq 'length')" -gt 0 ]; then
        # Direct replacement of link: and workspace: references with file: references
        jq --argjson overrides "$overrides" '
          # Function to process each dependency section
          def process_deps($deps):
            if $deps then
              reduce (keys_unsorted[]) as $key ($deps;
                if (.[$key] | type=="string") and
                   (((.[$key] | startswith("link:")) and (.[$key] | contains("submods"))) or
                    (.[$key] | startswith("workspace:")) or
                    (.[$key] == "catalog:")) and
                    ($key | IN($overrides|keys[]))
                then
                  .[$key] = $overrides[$key]
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
          if has("peerDependencies") then .peerDependencies = process_deps(.peerDependencies) else . end |

          # Remove pnpm.overrides if it exists since we're using direct references
          if has("pnpm") and .pnpm | has("overrides") then
            .pnpm |= del(.overrides)
          else
            .
          end
        ' "$pkg_json" > "$temp_file"
        
        # Replace the original file
        mv "$temp_file" "$pkg_json"
        echo "Added overrides for $(echo "$overrides" | jq 'length') packages in $pkg_json"
      else
        echo "No overrides needed for $pkg_json"
      fi
    fi
  done
fi

# Update root package.json
echo "==== Updating root package.json ===="
root_pkg_json="$ROOT_DIR/package.json"

if [ -f "$root_pkg_json" ]; then
  temp_file=$(mktemp)
  
  # Extract workspace and link dependencies
  workspace_deps=$(jq -r '.dependencies // {} | to_entries[] | select(.value | type=="string") | select(.value | startswith("workspace:") or startswith("link:")) | .key' "$root_pkg_json")
  
  # Create overrides object
  overrides="{}"
  for dep in $workspace_deps; do
    # Get the tgz path from package-map.json
    tgz_path=$(jq -r --arg dep "$dep" '.[$dep] // ""' "$DIST_DIR/package-map.json")
    if [ -n "$tgz_path" ] && [ "$tgz_path" != "null" ]; then
      # Add to overrides
      overrides=$(echo "$overrides" | jq --arg dep "$dep" --arg path "$tgz_path" '. + {($dep): $path}')
    fi
  done
  
  # Add submods packages
  submods_pkgs=$(jq -r 'keys[]' "$DIST_DIR/package-map.json")
  for pkg in $submods_pkgs; do
    if [[ "$pkg" == "@lit-protocol/"* ]] || [[ "$pkg" == "@storacha/"* ]]; then
      # Get the tgz path from package-map.json
      tgz_path=$(jq -r --arg pkg "$pkg" '.[$pkg]' "$DIST_DIR/package-map.json")
      # Add to overrides
      overrides=$(echo "$overrides" | jq --arg pkg "$pkg" --arg path "$tgz_path" '. + {($pkg): $path}')
    fi
  done
  
  # Update the package.json with direct file: references instead of overrides
  if [ "$(echo "$overrides" | jq 'length')" -gt 0 ]; then
    # Update dependencies to use tgz files directly
    jq --argjson overrides "$overrides" '
      # Function to process each dependency section
      def process_deps($deps):
        if $deps then
          reduce (keys_unsorted[]) as $key ($deps;
            if (.[$key] | type=="string") and
               (((.[$key] | startswith("link:")) and (.[$key] | contains("submods"))) or
                (.[$key] | startswith("workspace:")) or
                (.[$key] == "catalog:")) and
                ($key | IN($overrides|keys[]))
            then
              .[$key] = $overrides[$key]
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
      if has("peerDependencies") then .peerDependencies = process_deps(.peerDependencies) else . end |

      # Remove pnpm.overrides if it exists since we're using direct references
      if has("pnpm") and .pnpm | has("overrides") then
        .pnpm |= del(.overrides)
      else
        .
      end
    ' "$root_pkg_json" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$root_pkg_json"
    echo "Added overrides for $(echo "$overrides" | jq 'length') packages in root package.json"
  else
    echo "No overrides needed for root package.json"
  fi
fi

echo "==== All package.json files have been updated with overrides ===="
echo "You can now commit the changes to your repository"