# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of the application.

## Workflows

### `build-and-deploy.yml`

This workflow handles building and deploying the application:

1. **Dependency Container Build**:
   - Calculates a hash based on dependency files
   - Builds the dependency container (using `Dockerfile.dependencies`)
   - Pushes the container to GitHub Container Registry with a tag based on the dependency hash
   - Caches the result to speed up future builds

2. **Application Container Build**:
   - Builds the main application container (using `Dockerfile`)
   - Uses the dependency container as a base
   - Pushes the container to GitHub Container Registry with tags for:
     - Commit SHA (for specific deployments)
     - Branch/PR cache tag (for faster future builds)

3. **Deployment**:
   - For `main` and `legacy` branches: deploys to production/staging
   - For pull requests: deploys to preview environments
   - Updates PR with deployment status

### `test.yml`

This workflow runs linting, type checking, and tests:

1. **Setup**: Installs Node.js, PNPM, and dependencies
2. **Build Wrappers**: Builds the wrapper packages
3. **Lint**: Runs Biome linter
4. **Type Check**: Ensures TypeScript correctness

## Required Secrets

To use these workflows, add the following secrets to your GitHub repository:

- `PREVIEW_DOMAIN`: Domain for PR preview deployments (optional)

## Deployment Configuration

The deployment steps are placeholders. Update them with your actual deployment commands based on your hosting platform.

## Caching Strategy

The workflows use GitHub's cache to optimize build times:

- Dependency cache based on pnpm-lock.yaml
- Docker layer caching for faster container builds
- Branch/PR-specific cache tags for application containers