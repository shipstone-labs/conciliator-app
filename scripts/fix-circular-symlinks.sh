#!/bin/bash
set -e

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
cd "$ROOT_DIR"

echo "Fixing circular symlinks in dist-packages..."

# Find all lit-protocol packages in submods directory
for pkg_dir in ./submods/js-sdk/packages/*; do
  pkg_name=$(basename "$pkg_dir")
  pkg_tgz="${pkg_dir}/lit-protocol-${pkg_name}-7.1.1.tgz"
  
  # Check if the package tgz exists
  if [ -f "$pkg_tgz" ]; then
    target="./dist-packages/@lit-protocol-${pkg_name}-7.1.1-f7cb21dad.tgz"
    
    # Check if the target exists and is a symlink
    if [ -L "$target" ]; then
      # Remove the symlink
      rm -f "$target"
      echo "Removed circular symlink: $target"
      
      # Copy the actual file
      cp "$pkg_tgz" "$target"
      echo "Created real file: $target"
    fi
  fi
done

# Special check for contracts package since it might come from contracts-sdk
if [ ! -f "./submods/js-sdk/packages/contracts/lit-protocol-contracts-7.1.1.tgz" ] && 
   [ -f "./submods/js-sdk/packages/contracts-sdk/lit-protocol-contracts-sdk-7.1.1.tgz" ] && 
   [ -L "./dist-packages/@lit-protocol-contracts-7.1.1-f7cb21dad.tgz" ]; then
  
  # Remove the symlink
  rm -f "./dist-packages/@lit-protocol-contracts-7.1.1-f7cb21dad.tgz"
  echo "Removed circular symlink: ./dist-packages/@lit-protocol-contracts-7.1.1-f7cb21dad.tgz"
  
  # Copy from contracts-sdk
  cp "./submods/js-sdk/packages/contracts-sdk/lit-protocol-contracts-sdk-7.1.1.tgz" "./dist-packages/@lit-protocol-contracts-7.1.1-f7cb21dad.tgz"
  echo "Created real file: ./dist-packages/@lit-protocol-contracts-7.1.1-f7cb21dad.tgz"
fi

# Check for lit-node-client-nodejs package
if [ -f "./submods/js-sdk/packages/lit-node-client-nodejs/lit-protocol-lit-node-client-nodejs-7.1.1.tgz" ] && 
   [ -L "./dist-packages/@lit-protocol-lit-node-client-nodejs-7.1.1-f7cb21dad.tgz" ]; then
  
  # Remove the symlink
  rm -f "./dist-packages/@lit-protocol-lit-node-client-nodejs-7.1.1-f7cb21dad.tgz"
  echo "Removed circular symlink: ./dist-packages/@lit-protocol-lit-node-client-nodejs-7.1.1-f7cb21dad.tgz"
  
  # Copy the actual file
  cp "./submods/js-sdk/packages/lit-node-client-nodejs/lit-protocol-lit-node-client-nodejs-7.1.1.tgz" "./dist-packages/@lit-protocol-lit-node-client-nodejs-7.1.1-f7cb21dad.tgz"
  echo "Created real file: ./dist-packages/@lit-protocol-lit-node-client-nodejs-7.1.1-f7cb21dad.tgz"
fi

# Check if the package-map.file.json is a symlink
if [ -L "./dist-packages/package-map.file.json" ]; then
  rm -f "./dist-packages/package-map.file.json"
  echo "Removed circular symlink: ./dist-packages/package-map.file.json"
fi

# Make sure package-map.file.json exists and has correct content
if [ ! -f "./dist-packages/package-map.file.json" ]; then
  echo '{
  "lilypad-wrapper": "file:./dist-packages/lilypad-wrapper-1.0.0-6a8a361.tgz",
  "lit-wrapper": "file:./dist-packages/lit-wrapper-1.0.0-09981ed.tgz",
  "web-storage-wrapper": "file:./dist-packages/web-storage-wrapper-1.0.0-09981ed.tgz",
  "@lit-protocol/access-control-conditions": "file:./dist-packages/@lit-protocol-access-control-conditions-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/auth-helpers": "file:./dist-packages/@lit-protocol-auth-helpers-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/constants": "file:./dist-packages/@lit-protocol-constants-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/contracts-sdk": "file:./dist-packages/@lit-protocol-contracts-sdk-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/crypto": "file:./dist-packages/@lit-protocol-crypto-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/lit-auth-client": "file:./dist-packages/@lit-protocol-lit-auth-client-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/lit-node-client": "file:./dist-packages/@lit-protocol-lit-node-client-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/lit-node-client-nodejs": "file:./dist-packages/@lit-protocol-lit-node-client-nodejs-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/pkp-ethers": "file:./dist-packages/@lit-protocol-pkp-ethers-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/types": "file:./dist-packages/@lit-protocol-types-7.1.1-f7cb21dad.tgz",
  "@lit-protocol/contracts": "file:./dist-packages/@lit-protocol-contracts-7.1.1-f7cb21dad.tgz",
  "@storacha/client": "file:./dist-packages/@storacha-client-1.2.8-09f9d108.tgz"
}' > "./dist-packages/package-map.file.json"
  echo "Created package-map.file.json with correct content"
fi

echo "Fixed circular symlinks in dist-packages"
echo "Run 'pnpm install' to apply the changes"