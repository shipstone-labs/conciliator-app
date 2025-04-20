#!/bin/bash
# deploy-firebase-function.sh - Deploy a Firebase function and fix audience configuration
# Usage: ./deploy-firebase-function.sh [--skip-deploy] FUNCTION_NAME
# Example: ./deploy-firebase-function.sh stripeCheckoutCompleted
# Example with skip: ./deploy-firebase-function.sh --skip-deploy stripeCheckoutCompleted

set -e  # Exit on any error

SKIP_DEPLOY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --skip-deploy)
      SKIP_DEPLOY=true
      shift
      ;;
    *)
      FUNCTION_NAME="$1"
      shift
      ;;
  esac
done

if [ -z "$FUNCTION_NAME" ]; then
  echo "Error: Function name is required"
  echo "Usage: ./deploy-firebase-function.sh [--skip-deploy] FUNCTION_NAME"
  echo "Example: ./deploy-firebase-function.sh stripeCheckoutCompleted"
  echo "Example with skip: ./deploy-firebase-function.sh --skip-deploy stripeCheckoutCompleted"
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"  # Firebase Cloud Functions default region
SERVICE_NAME=$(echo "$FUNCTION_NAME" | tr '[:upper:]' '[:lower:]')

echo "Function name: $FUNCTION_NAME"
echo "Cloud Run service name will be: $SERVICE_NAME"

# Deploy the function using Firebase if not skipped
if [ "$SKIP_DEPLOY" = false ]; then
  echo "Deploying Firebase function: $FUNCTION_NAME"
  firebase deploy --only functions:$FUNCTION_NAME
  echo "Deployment complete. Fixing audience configuration..."
else
  echo "Skipping deployment, only fixing audience configuration..."
fi

# Wait a moment for deployment to fully complete
sleep 5

# Find the latest subscription for this function
SUBSCRIPTION=$(gcloud pubsub subscriptions list --format="value(name)" --filter="name~eventarc-us-central1-$SERVICE_NAME" | head -n 1)

if [ -z "$SUBSCRIPTION" ]; then
  echo "Error: Could not find PubSub subscription for $SERVICE_NAME"
  exit 1
fi

echo "Found subscription: $SUBSCRIPTION"

# Get the PubSub push endpoint audience
PUBSUB_AUDIENCE=$(gcloud pubsub subscriptions describe "$SUBSCRIPTION" --format='value(pushConfig.oidcToken.audience)')

if [ -z "$PUBSUB_AUDIENCE" ]; then
  echo "Error: Could not determine PubSub audience"
  exit 1
fi

echo "PubSub is using audience: $PUBSUB_AUDIENCE"

# Get current audience configuration from Cloud Run
CURRENT_AUDIENCES=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(labels."run.googleapis.com/custom-audiences")' 2>/dev/null || echo "[]")

# Convert from JSON string to actual string array
CURRENT_AUDIENCES=$(echo "$CURRENT_AUDIENCES" | tr -d '[]"' | tr ',' ' ')

# Check if the PubSub audience is already in the list
if [[ "$CURRENT_AUDIENCES" == *"$PUBSUB_AUDIENCE"* ]]; then
  echo "PubSub audience is already configured in Cloud Run. No changes needed."
  exit 0
fi

# Get project number and service accounts
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
PUBSUB_SA="service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"

# Add IAM permission for the service accounts
echo "Adding IAM permissions for service accounts..."
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/run.invoker"

gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --member="serviceAccount:${PUBSUB_SA}" \
  --role="roles/run.invoker"

# Add the PubSub audience to the Cloud Run service
echo "Adding PubSub audience to Cloud Run service..."
gcloud run services update "$SERVICE_NAME" \
  --region="$REGION" \
  --add-custom-audiences="$PUBSUB_AUDIENCE"

echo "Configuration complete!"
echo "Cloud Run service $SERVICE_NAME now accepts audiences:"
gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(labels."run.googleapis.com/custom-audiences")'

echo "Done! Function $FUNCTION_NAME is ready to receive events."