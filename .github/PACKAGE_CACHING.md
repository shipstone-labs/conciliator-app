# Package Caching System

This project uses a custom package caching system to optimize builds, especially in CI/CD environments. This approach significantly improves build times by avoiding rebuilding unchanged packages.

## Overview

The system works by:

1. Building and packaging dependencies from submodules and local packages as tgz files
2. Using content-based hashing to determine when packages need rebuilding
3. Updating package.json references to use these cached packages
4. Caching the packaged dependencies in GitHub Actions

## Key Components

### Scripts

- **`bootstrap-packages.sh`**: Initializes the system when `dist-packages` is empty
  - Temporarily sets up packages with `link:` and `workspace:` references
  - Builds everything once
  - Creates initial tgz files
  - Restores original package.json files

- **`pack-packages.sh`**: Builds and packages dependencies with content hashing
  - Identifies dependencies in submodules
  - Calculates content hashes to detect changes
  - Creates tgz files with versioned names
  - Generates a package mapping file

- **`fix-packages.sh`**: Updates package.json files to use cached packages
  - Replaces `link:` and `workspace:` references with `file:` references
  - Updates both dependencies and overrides sections
  - Handles special cases for certain packages

- **`inspect-package.sh`**: Diagnostic tool for examining package content
  - Extracts and analyzes package contents
  - Verifies presence of dist folders and JavaScript files
  - Helps debug packaging issues

### File Structure

- **`dist-packages/`**: Directory containing all packaged dependencies
  - `*.tgz`: Packaged dependencies with content hashes in filenames
  - `package-map.json`: Mapping between package names and tgz files

## How It Works

### Content Hashing

Each package's content is hashed to determine if it needs rebuilding:

```bash
# Calculate content hash (excluding node_modules and dist)
pkg_hash=$(find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | sort | xargs cat 2>/dev/null | sha256sum | cut -d ' ' -f 1 | cut -c 1-12)
```

The hash is included in the filename, e.g., `@lit-protocol-crypto-7.1.1-649046efad57.tgz`.

### Package References

Package references are updated to point to cached packages:

- Original: `"@lit-protocol/crypto": "link:submods/js-sdk/packages/crypto"`
- Updated: `"@lit-protocol/crypto": "file:dist-packages/@lit-protocol-crypto-7.1.1-649046efad57.tgz"`

### Bootstrapping

When the cache is empty (e.g., first run in CI), the bootstrap script:

1. Temporarily updates package.json files to use direct references
2. Builds all dependencies
3. Packages them as tgz files
4. Restores the original package.json files
5. Updates references to use the newly created packages

## GitHub Actions Integration

The GitHub Actions workflow:

1. Checks for an existing `dist-packages` cache
2. If missing, runs the bootstrap script
3. Updates package references to use cached packages
4. Installs dependencies and builds the application
5. Caches the `dist-packages` directory for future runs

## Benefits

This approach:

1. **Speeds up builds**: Only rebuilds packages when source code changes
2. **Reduces dependencies**: Eliminates need to run full builds in CI
3. **Improves reliability**: Makes builds more deterministic and repeatable
4. **Optimizes Docker builds**: Allows for smaller, faster Docker images
5. **Works with multiple package managers**: Supports npm, yarn, and pnpm

## Common Issues and Solutions

### Missing dist Folders

If packages are missing dist folders:
- Check if `.npmignore` files are excluding dist directories
- Ensure build steps are running correctly
- Use the inspect-package.sh script to diagnose issues

### Bootstrap Failures

If the bootstrap process fails:
- Check if submodule dependencies are correctly installed
- Ensure build scripts exist and work correctly
- Look for circular dependencies that might cause problems

### Outdated Packages

When packages need to be updated:
- Update the source code in submodules
- Run `pack-packages.sh` to create new packages with updated hashes
- Run `fix-packages.sh` to update references