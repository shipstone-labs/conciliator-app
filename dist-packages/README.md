# Package Tarballs

This directory contains pre-built npm package tarballs for all local packages and dependencies.

## How it Works

1. All packages from:
   - `./submods/js-sdk/`
   - `./submods/upload-service/`
   - `./packages/`
   
   are built and packed using their respective build systems (yarn, pnpm, npm).

2. The resulting `.tgz` files are moved here with a standardized naming format:
   `package-name-version-contenthash.tgz`

3. The content hash is calculated from the source files (excluding node_modules and dist directories).

4. A `package-map.json` file is generated mapping package names to their tarball locations.

5. All `package.json` files in the repository are updated to reference these local tarballs
   instead of using `link:` references.

## Benefits

- **Builds work offline**: No need to rebuild dependencies during CI/CD
- **Consistent builds**: Same package versions used everywhere
- **Docker compatibility**: Dockerfiles can use these packages directly
- **No complex caching**: No need for GitHub Actions caching system
- **Development simplicity**: Developers don't need to build submodules

## Updating Packages

When you make changes to a package, run the `scripts/pack-packages.sh` script to:

1. Rebuild all packages
2. Generate new tarballs with updated content hashes
3. Update all package references

Then commit the updated tarballs and package.json files.