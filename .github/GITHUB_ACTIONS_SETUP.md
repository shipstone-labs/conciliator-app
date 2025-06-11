# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for this project, particularly for deploying to Google Cloud Run.

## Prerequisites

1. A Google Cloud Platform (GCP) project with Cloud Run and Container Registry enabled
2. A service account with appropriate permissions
3. Workload Identity Federation set up for GitHub Actions

## Setting Up GCP for GitHub Actions

### 1. Create a Service Account

```bash
# Create a service account
gcloud iam service-accounts create github-actions-runner \
  --description="Service account for GitHub Actions" \
  --display-name="GitHub Actions Runner"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 2. Set Up Workload Identity Federation

```bash
# Create a workload identity pool
gcloud iam workload-identity-pools create github-actions \
  --location="global" \
  --description="GitHub Actions pool" \
  --display-name="GitHub Actions"

# Get the pool ID
POOL_ID=$(gcloud iam workload-identity-pools describe github-actions \
  --location="global" \
  --format="value(name)")

# Create a workload identity provider in the pool
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get the provider ID
PROVIDER_ID=$(gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --format="value(name)")

# Allow the provider to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${PROVIDER_ID}/attribute.repository/YOUR_GITHUB_USERNAME/my-conciliate-app"
```

## Setting Up GitHub Repository Secrets

Add the following secrets to your GitHub repository:

1. **GCP_PROJECT_ID**:
   - Your Google Cloud project ID

2. **GCP_WORKLOAD_IDENTITY_PROVIDER**:
   - Format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`
   - Use the following command to get it:
     ```bash
     echo "projects/$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-actions/providers/github-provider"
     ```

3. **GCP_SERVICE_ACCOUNT**:
   - Format: `github-actions-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com`

## Configuring the Build and Deploy Workflow

The workflow is already set up in `.github/workflows/build-and-deploy.yml`. It:

1. Builds the application using pnpm
2. Packages the application into a Docker container
3. Pushes the container to Google Container Registry
4. Deploys the container to Google Cloud Run

## Testing the Workflow

To test the workflow:

1. Push a commit to the main branch or create a pull request
2. Check the "Actions" tab in your GitHub repository to monitor the workflow
3. For main branch pushes, verify the deployment to Cloud Run

## Troubleshooting

Common issues:

1. **Authentication Failures**:
   - Check the Workload Identity Provider configuration
   - Verify repository secrets are correctly set

2. **Build Failures**:
   - Check that the package caching system is working correctly
   - Verify that the Docker build has all necessary files

3. **Deployment Failures**:
   - Check that the service account has proper permissions
   - Verify the Cloud Run configuration