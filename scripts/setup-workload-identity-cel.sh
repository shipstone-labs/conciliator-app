#!/bin/bash
set -e

# Configuration variables
PROJECT_ID="conciliator-456321"
GITHUB_ORG="shipstone-labs"
REPO_NAME="my-conciliate-app"
SERVICE_ACCOUNT_NAME="github-actions-sa"
POOL_NAME="github-pool-new"  # New pool name to avoid conflicts
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

# Grant necessary permissions
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

# Create a new workload identity pool (use a new name to avoid conflicts)
echo -e "\n${GREEN}Creating Workload Identity Pool...${NC}"
gcloud iam workload-identity-pools create ${POOL_NAME} \
  --location="global" \
  --display-name="GitHub Actions Pool (New)" \
  --description="Pool for GitHub Actions workload identity"

# Create the provider with attribute mappings
echo -e "\n${GREEN}Creating Workload Identity Provider with attribute mappings...${NC}"
gcloud iam workload-identity-pools providers create-oidc ${PROVIDER_NAME} \
  --location="global" \
  --workload-identity-pool=${POOL_NAME} \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository_owner=assertion.repository_owner,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get the project number
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
FULL_PROVIDER_PATH="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

# Create a proper condition to match repository owner and name
CONDITION_TITLE="${GITHUB_ORG}-${REPO_NAME}-access"
CONDITION_EXPR="(attribute.repository_owner == \"${GITHUB_ORG}\" && attribute.repository == \"${GITHUB_ORG}/${REPO_NAME}\")"

echo -e "\n${GREEN}Setting up repository-specific service account binding...${NC}"
echo "Creating IAM binding with CEL expression condition..."

# Add binding with the conditional expression
gcloud iam service-accounts add-iam-policy-binding \
  ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${FULL_PROVIDER_PATH}" \
  --condition="expression=${CONDITION_EXPR},title=${CONDITION_TITLE}"

# Output the required secrets
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