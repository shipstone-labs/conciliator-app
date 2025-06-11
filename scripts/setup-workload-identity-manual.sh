#!/bin/bash
set -e

# Configuration variables
PROJECT_ID="conciliator-456321"
GITHUB_ORG="shipstone-labs"
REPO_NAME="my-conciliate-app"
SERVICE_ACCOUNT_NAME="github-actions-sa"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generating instructions for manual setup of Workload Identity Federation${NC}"
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

# Get the project number
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")

echo -e "\n${RED}===========================================================================${NC}"
echo -e "${RED}MANUAL STEPS REQUIRED: Please follow these instructions to set up Workload Identity${NC}"
echo -e "${RED}===========================================================================${NC}"

echo -e "\n${YELLOW}STEP 1: Go to Google Cloud Console Workload Identity Federation${NC}"
echo "https://console.cloud.google.com/iam-admin/workload-identity-pools?project=${PROJECT_ID}"

echo -e "\n${YELLOW}STEP 2: Create a new Workload Identity Pool${NC}"
echo " - Click 'CREATE POOL'"
echo " - Name: github-pool"
echo " - Display name: GitHub Actions Pool"
echo " - Click 'CONTINUE'"
echo " - Leave all other settings as default"
echo " - Click 'CREATE'"

echo -e "\n${YELLOW}STEP 3: Add a provider to the pool${NC}"
echo " - Click 'ADD PROVIDER'"
echo " - Select 'OpenID Connect (OIDC)'"
echo " - Provider name: github-provider"
echo " - Issuer URL: https://token.actions.githubusercontent.com"
echo " - Click 'CONTINUE'"
echo " - Under 'Attribute mapping', add:"
echo "   - google.subject = assertion.sub"
echo " - Click 'SAVE'"

echo -e "\n${YELLOW}STEP 4: Configure allowed audiences (optional)${NC}"
echo " - If prompted for allowed audiences, you can leave it empty or use 'https://github.com/${GITHUB_ORG}'"
echo " - Click 'CONTINUE' and then 'SAVE'"

echo -e "\n${YELLOW}STEP 5: Grant the service account access${NC}"
echo " - Go to 'Service Accounts' in IAM"
echo "   https://console.cloud.google.com/iam-admin/serviceaccounts?project=${PROJECT_ID}"
echo " - Find and click on '${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com'"
echo " - Go to the 'PERMISSIONS' tab"
echo " - Click 'GRANT ACCESS'"
echo " - In 'New principals' field, paste:"
echo "   principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_ORG}/${REPO_NAME}"
echo " - For 'Role', select 'Workload Identity User'"
echo " - Click 'SAVE'"

echo -e "\n${YELLOW}STEP 6: Add GitHub repository secrets${NC}"
echo " - Add these secrets to your GitHub repository:"
echo -e "   ${GREEN}GCP_PROJECT_ID:${NC} ${PROJECT_ID}"
echo -e "   ${GREEN}GCP_SERVICE_ACCOUNT:${NC} ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo -e "   ${GREEN}GCP_WORKLOAD_IDENTITY_PROVIDER:${NC} projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}Service account permissions have been set up successfully.${NC}"
echo -e "${GREEN}Please follow the manual steps above to complete the setup.${NC}"
echo -e "${GREEN}======================================================${NC}"