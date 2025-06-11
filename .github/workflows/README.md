# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of the application.

## Workflows

### `build-and-deploy.yml`

This workflow handles building the application and deploying it to Google Cloud Run:

1. **Setup Environment**:
   - Checks out code with submodules
   - Sets up Node.js and PNPM
   - Configures caching for PNPM store and dist-packages

2. **Package Caching**:
   - Caches `dist-packages` directory containing packaged dependencies
   - Updates package references with `rebuild-packages-fixed.sh`

3. **Build Process**:
   - Installs dependencies with `pnpm install`
   - Builds the application with `pnpm build`

4. **Docker Build and Push**:
   - Builds a multi-stage Docker image with Alpine Node runtime
   - Pushes to Google Container Registry (only on main branch)
   - Tags with commit SHA, branch/PR name, and short SHA

5. **Deployment**:
   - Deploys to Google Cloud Run (only on main branch)
   - Configures with appropriate settings for production

### `test.yml`

This workflow runs linting, type checking, and tests:

1. **Setup**: Installs Node.js, PNPM, and dependencies
2. **Build Wrappers**: Builds the wrapper packages
3. **Lint**: Runs Biome linter
4. **Type Check**: Ensures TypeScript correctness

## Package Caching System

The package caching system is a key optimization that:

1. Builds and packages all dependencies from submodules and local packages
2. Creates tgz files with content-based hashing to determine when rebuilds are needed
3. Updates package references to use these cached packages
4. Dramatically speeds up CI/CD by avoiding unnecessary rebuilds

### Key Scripts

- `bootstrap-packages.sh`: Initializes the system when no cached packages exist
- `pack-packages.sh`: Builds and packages dependencies with content hashing
- `fix-packages.sh`: Updates package.json files to reference cached packages
- `inspect-package.sh`: Diagnostic tool for examining packaged dependencies

## Required Secrets

To use these workflows, add the following secrets to your GitHub repository:

- `GCP_PROJECT_ID`: Google Cloud project ID
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity provider
- `GCP_SERVICE_ACCOUNT`: Google Cloud service account

## Docker Multi-Stage Build

The Dockerfile uses a multi-stage build approach:

1. **Builder Stage**:
   - Uses Alpine Node image
   - Copies necessary files for the build
   - Prepares the application for production

2. **Runner Stage**:
   - Uses smaller Alpine Node image for runtime
   - Only copies production-necessary files
   - Runs as non-root user for security
   - Configured for optimal performance