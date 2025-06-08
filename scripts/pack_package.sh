#!/bin/bash

# Usage: ./pack_package.sh [package_name]
# Example: ./pack_package.sh access-control-conditions

set -e

if [ -z "$1" ]; then
  echo "Usage: ./pack_package.sh [package_name]"
  echo "Example: ./pack_package.sh access-control-conditions"
  exit 1
fi

PACKAGE_NAME=$1
PACKAGE_PATH="packages/$PACKAGE_NAME"
BACKUP_DIR="/tmp/lit-symlink-backup-$RANDOM"

# Check if package exists
if [ ! -d "$PACKAGE_PATH" ]; then
  echo "Package $PACKAGE_NAME does not exist in $PACKAGE_PATH"
  exit 1
fi

echo "Packing package $PACKAGE_NAME..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Find all symlinks in the package directory
echo "Finding and replacing symlinks..."
SYMLINKS=$(find "$PACKAGE_PATH" -type l)

for SYMLINK in $SYMLINKS; do
  SYMLINK_TARGET=$(readlink "$SYMLINK")
  SYMLINK_NAME=$(basename "$SYMLINK")
  SYMLINK_DIR=$(dirname "$SYMLINK")
  
  # Save symlink info for restoration
  echo "$SYMLINK:$SYMLINK_TARGET" >> "$BACKUP_DIR/symlinks.txt"
  
  # Remove the symlink
  rm "$SYMLINK"
  
  # Copy the target content to the original symlink location
  if [[ -d "$SYMLINK_TARGET" ]]; then
    cp -R "$SYMLINK_TARGET" "$SYMLINK_DIR/$SYMLINK_NAME"
  else
    cp "$SYMLINK_TARGET" "$SYMLINK_DIR/$SYMLINK_NAME"
  fi
  
  echo "Replaced symlink $SYMLINK pointing to $SYMLINK_TARGET with actual content"
done

# Run yarn pack
echo "Running yarn pack..."
cd "$PACKAGE_PATH"
yarn pack
cd ../../

# Restore symlinks
echo "Restoring symlinks..."
if [ -f "$BACKUP_DIR/symlinks.txt" ]; then
  while IFS=: read -r SYMLINK SYMLINK_TARGET; do
    # Remove the copied content
    if [ -d "$SYMLINK" ]; then
      rm -rf "$SYMLINK"
    else
      rm -f "$SYMLINK"
    fi
    
    # Recreate the symlink
    ln -s "$SYMLINK_TARGET" "$SYMLINK"
    echo "Restored symlink $SYMLINK pointing to $SYMLINK_TARGET"
  done < "$BACKUP_DIR/symlinks.txt"
fi

# Clean up
rm -rf $BACKUP_DIR

echo "Done! Package has been created with actual files instead of symlinks."