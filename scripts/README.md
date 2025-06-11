# Package Management Scripts

This directory contains scripts for managing package dependencies in the project.

## Key Scripts

### `bootstrap-packages.sh`

**First-time setup script** to solve the chicken-and-egg problem when dist-packages is empty:
1. Temporarily sets up packages with link: and workspace: references
2. Builds submodules and packages in the correct order
3. Packages everything into dist-packages/ directory
4. Restores package.json files to their original state

Use this script for the initial setup or when starting from scratch:

```bash
./scripts/bootstrap-packages.sh
```

### `pack-packages.sh`

**Main script** that does everything in one go:
1. Builds all submods packages (using install.sh)
2. Packages them as tgz files with content hashing in dist-packages/
3. Builds and packages all packages in packages/ (except firebase-functions)
4. Generates dist-packages/package-map.json with path mappings
5. Updates all package.json files to use file: references

**Usage:**
```bash
./scripts/pack-packages.sh
```

### `fix-packages.sh`

Helper script that:
1. Updates package.json files to directly use file: references to the tgz files
2. Replaces link: and workspace: references with file: references
3. Handles special cases like @ipld/dag-ucan
4. Removes any pnpm.overrides sections as they're no longer needed

Can be run separately if you only need to update package references:

```bash
./scripts/fix-packages.sh
```

### `inspect-package.sh`

Diagnostic tool that:
1. Extracts and lists the contents of a package tarball
2. Verifies the package contains a dist folder with JavaScript files
3. Checks for TypeScript definition files
4. Validates that the main entry point exists

Use this to debug package issues:

```bash
./scripts/inspect-package.sh dist-packages/lit-wrapper-1.0.0-2c3e4d7cc3f9.tgz
```

### `install.sh`

Builds the submodules:
1. Builds submods/js-sdk using yarn
2. Builds submods/upload-service using pnpm
3. Runs pnpm install in the root

## Workflow

### Initial Setup
1. Run `./scripts/bootstrap-packages.sh` to create the initial dist-packages directory
2. Run `pnpm install` to install dependencies with the packaged tgz files
3. Commit the dist-packages/ directory

### Regular Updates
1. Run `./scripts/pack-packages.sh` to update packages and references
2. Run `pnpm install` to update dependencies
3. Commit the changes to dist-packages/ and package.json files

## How It Works

This system uses direct file: references to:
1. Replace link: and workspace: references in package.json with file: references to tgz files
2. Ensure consistent builds across different environments
3. Add package hashes to tgz filenames to ensure rebuilds when content changes
4. Include dist folders in all packages through careful .npmignore management

The bootstrap script temporarily reverts to link:/workspace: references for the initial build
to solve the chicken-and-egg problem when dist-packages is empty.