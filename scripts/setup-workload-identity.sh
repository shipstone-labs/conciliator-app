#!/bin/bash
set -e

# Configuration variables
PROJECT_ID="conciliator-456321"
GITHUB_ORG="shipstone-labs"
REPO_NAME="my-conciliate-app"
SERVICE_ACCOUNT_NAME="github-actions-sa"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Workload Identity Federation for GitHub Actions${NC}"
echo -e "${YELLOW}Project: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}GitHub: ${GITHUB_ORG}/${REPO_NAME}${NC}"

# Set the GCP project
echo -e "\n${GREEN}Setting GCP project...${NC}"
gcloud config set project ${PROJECT_ID}

# Create or get the service account
echo -e "\n${GREEN}Setting up service account...${NC}"
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
  echo -e "${YELLOW}Service account ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com already exists${NC}"
else
  echo "Creating service account ${SERVICE_ACCOUNT_NAME}"
  gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --description="Service account for GitHub Actions" \
    --display-name="GitHub Actions"
fi

# Grant necessary permissions - handling existing conditions
echo -e "\n${GREEN}Granting required permissions...${NC}"

# Function to add or update a binding with no condition
add_binding() {
  local project=$1
  local member=$2
  local role=$3
  local description=$4
  
  echo "Granting ${description}..."
  
  # Add the binding using the --condition=None flag
  gcloud projects add-iam-policy-binding ${project} \
    --member="${member}" \
    --role="${role}" \
    --condition=None
}

# Add all required permissions
add_binding ${PROJECT_ID} "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" "roles/artifactregistry.admin" "Artifact Registry permissions"
add_binding ${PROJECT_ID} "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" "roles/storage.admin" "Container Registry permissions (for gcr.io)"
add_binding ${PROJECT_ID} "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" "roles/run.admin" "Cloud Run admin permissions"
add_binding ${PROJECT_ID} "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" "roles/iam.serviceAccountUser" "Service Account User role"

# Handle workload identity pool 
echo -e "\n${GREEN}Setting up Workload Identity Pool...${NC}"
if gcloud iam workload-identity-pools describe ${POOL_NAME} --location="global" &>/dev/null; then
  echo -e "${YELLOW}Workload identity pool ${POOL_NAME} already exists${NC}"
  
  # Check if the provider exists
  if gcloud iam workload-identity-pools providers describe ${PROVIDER_NAME} \
     --location="global" \
     --workload-identity-pool=${POOL_NAME} &>/dev/null; then
    echo -e "${YELLOW}Workload identity provider ${PROVIDER_NAME} already exists${NC}"
    
    # Keep the existing provider, just update attributes if needed
    echo "Updating provider attributes..."
    gcloud iam workload-identity-pools providers update-oidc ${PROVIDER_NAME} \
      --location="global" \
      --workload-identity-pool=${POOL_NAME} \
      --attribute-mapping="google.subject=assertion.sub" \
      --issuer-uri="https://token.actions.githubusercontent.com"
  else
    # Create provider in existing pool
    echo "Creating workload identity provider ${PROVIDER_NAME} in existing pool"
    gcloud iam workload-identity-pools providers create-oidc ${PROVIDER_NAME} \
      --location="global" \
      --workload-identity-pool=${POOL_NAME} \
      --display-name="GitHub Provider" \
      --attribute-mapping="google.subject=assertion.sub" \
      --issuer-uri="https://token.actions.githubusercontent.com"
  fi
else
  echo "Creating workload identity pool ${POOL_NAME}"
  gcloud iam workload-identity-pools create ${POOL_NAME} \
    --location="global" \
    --display-name="GitHub Actions Pool"
    
  echo "Creating workload identity provider ${PROVIDER_NAME}"
  gcloud iam workload-identity-pools providers create-oidc ${PROVIDER_NAME} \
    --location="global" \
    --workload-identity-pool=${POOL_NAME} \
    --display-name="GitHub Provider" \
    --attribute-mapping="google.subject=assertion.sub" \
    --issuer-uri="https://token.actions.githubusercontent.com"
fi

# Get the project number and full provider path
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
FULL_PROVIDER_PATH="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

# Create the GitHub Actions specific binding
echo -e "\n${GREEN}Setting up repository-specific service account binding...${NC}"

# First try to remove any existing bindings for this role (clean slate)
echo "Removing existing workload identity bindings if any..."
(gcloud iam service-accounts get-iam-policy ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com --format=json | \
 jq 'del(.bindings[] | select(.role == "roles/iam.workloadIdentityUser"))' > /tmp/cleaned_policy.json) || true

if [ -s "/tmp/cleaned_policy.json" ]; then
  echo "Applying cleaned policy without workloadIdentityUser bindings..."
  gcloud iam service-accounts set-iam-policy ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com /tmp/cleaned_policy.json || true
fi

# Now create a fresh IAM policy for the service account with repository constraint
echo "Creating new service account binding for ${GITHUB_ORG}/${REPO_NAME}..."

# GitHub Actions tokens include the repository claim in the format "owner/repo"
gcloud iam service-accounts add-iam-policy-binding \
  ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${FULL_PROVIDER_PATH}/subject/repo:${GITHUB_ORG}/${REPO_NAME}:ref:refs/heads/main"

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Workload Identity Federation setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "\nAdd the following secrets to your GitHub repository:"
echo -e "\n${YELLOW}GCP_PROJECT_ID:${NC}"
echo -e "${PROJECT_ID}"
echo -e "\n${YELLOW}GCP_WORKLOAD_IDENTITY_PROVIDER:${NC}"
echo -e "${FULL_PROVIDER_PATH}"
echo -e "\n${YELLOW}GCP_SERVICE_ACCOUNT:${NC}"
echo -e "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"