# Package Caching System

This project uses GitHub Actions to cache and reuse built packages from forks and local packages.

## How It Works

1. **Hash Calculation**: For each package in the `packages/` directory and relevant submodules, we calculate a content hash based on all source files.

2. **Smart Build Detection**: The system checks which submodule packages need to be rebuilt, skipping the lengthy build process (up to 50 minutes) when no changes are detected.

3. **Build & Cache**: Packages are built and cached as `.tgz` files with their content hash in the filename.

4. **URL Generation**: GitHub generates URLs to these cached packages that can be used in `package.json` files.

5. **Dependency Update**: `link:` references in `package.json` files are automatically updated to point to the cached package URLs.

## End-to-End Workflow

### `cache-packages.yml`

This single consolidated workflow handles the entire process from building packages to updating references to triggering builds. It runs when:
- Changes are pushed to `packages/` or `submods/` directories
- On pull requests affecting packages
- Manually triggered via workflow_dispatch

The workflow consists of two sequential jobs:

**Job 1: Build and Cache**
1. Calculates content hashes for each package
2. Checks if builds already exist in the cache
3. Analyzes which submodules need rebuilding:
   - Only rebuilds js-sdk if packages from that directory need updating
   - Only rebuilds upload-service if packages from that directory need updating
   - This can save up to 50 minutes of build time when no changes are detected
4. Builds and packs only the necessary packages
5. Uploads the built packages as artifacts
6. Generates a JSON mapping of package names to their artifact URLs

**Job 2: Update Dependencies and Trigger Builds**
1. Downloads both the package URL mapping and the actual package files from the first job
2. Updates all `package.json` files in the repository, replacing `link:` references with file paths to the downloaded artifacts
3. Runs installation to update the dependency tree
4. Handles changes differently based on context:
   - **For Pull Requests**: Creates a separate "build PR" that targets the original PR branch, with detailed instructions for next steps
   - **For Direct Pushes**: Commits and pushes changes directly to the branch, then automatically triggers the build-and-deploy workflow

### Complete Flow for Pull Requests:

1. You create a PR with changes to packages
2. The workflow automatically:
   - Builds and caches affected packages
   - Creates a separate "build PR" targeting your feature branch
3. You review and merge the build PR into your feature branch
4. You manually trigger the build-and-deploy workflow on your feature branch
5. After verifying the build works with cached packages, you merge your feature PR

### Complete Flow for Direct Pushes:

1. You push changes to a main branch that affect packages
2. The workflow automatically:
   - Builds and caches affected packages
   - Updates package references in the repo
   - Commits and pushes the updates
   - Triggers the build-and-deploy workflow with the updated references

This end-to-end automation ensures that:
- Packages are only rebuilt when necessary
- Package references are always up-to-date
- Builds use cached packages whenever possible
- Changes are tested properly before being merged

## Performance Benefits

- **Build Time Reduction**: By selectively building only changed packages and avoiding unnecessary submodule builds, CI time can be reduced from 50+ minutes to just a few minutes in most cases.
- **Dependency Stability**: Cached packages ensure consistent builds across branches and pull requests.
- **Developer Productivity**: Less time waiting for CI builds means faster feedback cycles.

## Manual Usage

To manually trigger the caching process:
1. Go to the "Actions" tab in GitHub
2. Select "Cache Package Builds" workflow
3. Click "Run workflow" and select the branch

## Local Development

For local development, continue using `link:` references in your `package.json` files. The GitHub Actions workflow will automatically update these to point to cached versions when building in CI.

When pulling changes that might include updated package references, run your package manager's install command to update dependencies.

## Alternative: Google Cloud Storage

If you prefer using Google Cloud Storage instead:

1. Create a bucket to store your package artifacts
2. Modify the `cache-packages.yml` workflow to upload to GCS instead of GitHub artifacts
3. Update the URL generation to use GCS URLs
4. Ensure proper authentication is configured for GitHub Actions to access GCS

Using GCS may be beneficial for:
- Long-term storage beyond GitHub's retention period
- Sharing artifacts across repositories
- Handling very large packages

However, GitHub Artifacts is generally simpler to set up and maintain for most projects.