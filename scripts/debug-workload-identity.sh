#!/bin/bash

echo "=== Debugging Workload Identity Setup ==="
echo ""

# Get the service account from user
read -p "Enter your service account email (from GCP_SERVICE_ACCOUNT secret): " SERVICE_ACCOUNT
echo ""

# Extract project from service account
PROJECT_ID=$(echo $SERVICE_ACCOUNT | sed 's/.*@\(.*\)\.iam\.gserviceaccount\.com/\1/')
echo "Project ID: $PROJECT_ID"

# Check if service account exists
echo ""
echo "1. Checking if service account exists..."
gcloud iam service-accounts describe $SERVICE_ACCOUNT --project=$PROJECT_ID 2>&1 || echo "❌ Service account not found!"

# List IAM policy bindings for this service account
echo ""
echo "2. Checking who can impersonate this service account..."
echo "   (Looking for Token Creator role)"
gcloud iam service-accounts get-iam-policy $SERVICE_ACCOUNT --project=$PROJECT_ID --format=json | \
  jq -r '.bindings[] | select(.role == "roles/iam.serviceAccountTokenCreator") | .members[]' | \
  grep -E "(principal|serviceAccount)" || echo "❌ No Token Creator bindings found!"

# Check workload identity pool
echo ""
echo "3. Checking workload identity pools..."
gcloud iam workload-identity-pools list --location=global

echo ""
echo "4. Checking workload identity providers..."
read -p "Enter your workload identity pool name (e.g., 'github-pool'): " POOL_NAME
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=$POOL_NAME \
  --location=global

echo ""
echo "5. Checking provider configuration..."
read -p "Enter your provider name (e.g., 'github'): " PROVIDER_NAME
gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
  --workload-identity-pool=$POOL_NAME \
  --location=global \
  --format="value(attributeMapping)"

echo ""
echo "=== What the principal should look like ==="
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "For repository shipstone-labs/conciliator-app:"
echo "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/shipstone-labs/conciliator-app"

echo ""
echo "=== Common Issues ==="
echo "1. Service account doesn't exist or is in a different project"
echo "2. Principal format doesn't match what's in the IAM binding"
echo "3. Attribute mapping is missing 'attribute.repository'"
echo "4. CEL condition is blocking access"