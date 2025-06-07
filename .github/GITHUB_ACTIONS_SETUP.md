# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for this project, including required secrets and configuration steps.

## Repository Settings

1. Go to your repository's settings on GitHub
2. Navigate to "Settings > Actions > General"
3. Under "Workflow permissions":
   - Enable "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

## Required Secrets

Add the following secrets to your repository (Settings > Secrets and variables > Actions):

- `PREVIEW_DOMAIN`: Domain for PR preview deployments (optional)

## Environment Variables

For production deployments, you may need to add environment variables such as:

- `STYTCH_APP_ID`
- `STYTCH_APP_SECRET`
- `STYTCH_ENV`
- `NEXT_PUBLIC_STYTCH_PROJECT_ENV`
- `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN`
- `NEXT_PUBLIC_STYTCH_APP_ID`
- `NEXT_PUBLIC_LIT_RELAY_API_KEY`
- `NEXT_PUBLIC_LIT_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_LIT_ADDRESS`
- `NEXT_PUBLIC_FIREBASE_CONFIG`

## GitHub Container Registry Setup

1. Enable GitHub Container Registry:
   - Go to your user or organization settings
   - Navigate to "Packages"
   - Make sure GitHub Container Registry is enabled

2. Configure repository access:
   - Go to your repository settings
   - Navigate to "Actions > General"
   - Under "Workflow permissions", select "Read and write permissions"

## Cloud Deployment Setup

Replace the deployment steps in the workflows with your actual deployment commands. For example:

### For Google Cloud Run:

```yaml
- name: Setup Google Cloud SDK
  uses: google-github-actions/setup-gcloud@v1
  with:
    project_id: ${{ secrets.GCP_PROJECT_ID }}
    service_account_key: ${{ secrets.GCP_SA_KEY }}

- name: Deploy to Cloud Run
  run: |
    gcloud run deploy conciliator \
      --image=ghcr.io/${{ github.repository }}/conciliator-app:${{ github.sha }} \
      --region=us-central1 \
      --platform=managed
```

### For AWS:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Deploy to ECS
  run: |
    aws ecs update-service --cluster my-cluster --service conciliator --force-new-deployment
```

## Handling Submodules

If your submodules use SSH, you'll need to set up SSH authentication:

```yaml
- name: Setup SSH
  uses: webfactory/ssh-agent@v0.8.0
  with:
    ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
```

## Testing Locally

You can test GitHub Actions workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Run the workflow locally
act -j build-and-deploy
```