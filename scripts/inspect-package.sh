#!/bin/bash
set -e

# This script extracts and lists the contents of a package tarball to verify its contents

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-tgz-file>"
  exit 1
fi

PACKAGE_FILE="$1"

if [ ! -f "$PACKAGE_FILE" ]; then
  echo "Error: File $PACKAGE_FILE does not exist"
  exit 1
fi

# Create a temporary directory
TMP_DIR=$(mktemp -d)

echo "Extracting $PACKAGE_FILE to $TMP_DIR..."

# Extract the tarball
tar -xzf "$PACKAGE_FILE" -C "$TMP_DIR"

echo "Contents of package:"
find "$TMP_DIR" -type f | sort

# Check if dist folder exists
if [ -d "$TMP_DIR/package/dist" ]; then
  echo -e "\n✓ Package contains a dist/ folder"
  echo "Contents of dist folder:"
  find "$TMP_DIR/package/dist" -type f | sort

  # Check if dist folder has JavaScript files
  js_files=$(find "$TMP_DIR/package/dist" -name "*.js" | wc -l)
  if [ "$js_files" -gt 0 ]; then
    echo -e "\n✓ Dist folder contains JavaScript files"
  else
    echo -e "\n✗ Warning: Dist folder doesn't contain any JavaScript files!"
  fi

  # Check for type definitions
  d_ts_files=$(find "$TMP_DIR/package/dist" -name "*.d.ts" | wc -l)
  if [ "$d_ts_files" -gt 0 ]; then
    echo -e "✓ Package contains TypeScript definitions"
  else
    echo -e "ℹ️ Note: Package doesn't contain TypeScript definitions"
  fi
else
  echo -e "\n✗ Warning: Package does not contain a dist/ folder!"
fi

# Check package.json main field
if [ -f "$TMP_DIR/package/package.json" ]; then
  main_field=$(jq -r '.main // ""' "$TMP_DIR/package/package.json")
  if [ -n "$main_field" ] && [ "$main_field" != "null" ]; then
    main_file="$TMP_DIR/package/$main_field"
    if [ -f "$main_file" ]; then
      echo -e "✓ The main entry point ($main_field) exists"
    else
      echo -e "✗ Warning: Main entry point ($main_field) does not exist in the package!"
    fi
  else
    echo -e "✗ Warning: Package doesn't have a main field in package.json!"
  fi
fi

# Clean up
echo -e "\nCleaning up temporary directory..."
rm -rf "$TMP_DIR"