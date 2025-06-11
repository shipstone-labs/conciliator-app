#!/bin/bash
set -e

echo "====== Fixing Workload Identity Permissions ======"
echo ""
echo "This script will help you fix the 'iam.serviceAccounts.getAccessToken' error"
echo ""

# Get the current project
PROJECT_ID=$(gcloud config get-value project)
echo "Current project: $PROJECT_ID"
echo ""

# Get required information
echo "Please provide the following information:"
echo "(You can find these in your GitHub repository secrets)"
echo ""

read -p "1. Service Account Email (from GCP_SERVICE_ACCOUNT secret): " SERVICE_ACCOUNT
read -p "2. GitHub org/username (e.g., 'andy' from andy/conciliator-app): " GITHUB_ORG
read -p "3. GitHub repository name (e.g., 'conciliator-app'): " GITHUB_REPO

# Extract pool from provider
echo ""
echo "Please paste your full Workload Identity Provider string"
echo "(from GCP_WORKLOAD_IDENTITY_PROVIDER secret)"
echo "It should look like: projects/123456/locations/global/workloadIdentityPools/my-pool/providers/my-provider"
read -p "Provider: " PROVIDER

# Extract the pool ID from the provider string
POOL_ID=$(echo $PROVIDER | sed -E 's|projects/[0-9]+/locations/global/workloadIdentityPools/([^/]+)/providers/.*|\1|')
PROJECT_NUMBER=$(echo $PROVIDER | sed -E 's|projects/([0-9]+)/.*|\1|')

echo ""
echo "Extracted:"
echo "- Pool ID: $POOL_ID"
echo "- Project Number: $PROJECT_NUMBER"
echo ""

# The critical permission - allow the GitHub Actions workflow to impersonate the service account
echo "Adding Service Account Token Creator role..."
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
    --role="roles/iam.serviceAccountTokenCreator" \
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$GITHUB_ORG/$GITHUB_REPO" \
    --project=$PROJECT_ID

echo ""
echo "✅ Permission added successfully!"
echo ""
echo "The GitHub Actions workflow from $GITHUB_ORG/$GITHUB_REPO can now impersonate $SERVICE_ACCOUNT"
echo ""
echo "Additional permissions you might need:"
echo ""

# Check if service account has necessary roles
echo "Checking service account roles..."
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
    --format="table(bindings.role)" | grep -E "(artifactregistry|storage)" || echo "⚠️  No Artifact Registry roles found"

echo ""
echo "If you need to add Artifact Registry permissions, run:"
echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "    --member=\"serviceAccount:$SERVICE_ACCOUNT\" \\"
echo "    --role=\"roles/artifactregistry.writer\""