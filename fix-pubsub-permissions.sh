#!/bin/bash
# fix-pubsub-permissions.sh - Add correct service account permissions for PubSub push delivery
# Usage: ./fix-pubsub-permissions.sh

set -e  # Exit on any error

REGION="us-central1"
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
PUBSUB_SA="service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"

# List of Stripe function services
SERVICES=(
  "stripecheckoutcompleted"
  "stripecheckoutfailed"
  "stripecheckoutsucceeded"
  "stripeinvoicefailed"
  "stripeinvoicesucceeded"
  "stripepaymentfailed"
  "stripepaymentsucceeded"
)

echo "Adding PubSub service agent permissions to Cloud Run services..."

for SERVICE in "${SERVICES[@]}"; do
  echo "Fixing permissions for $SERVICE..."
  
  # Add the PubSub service agent with run.invoker role
  gcloud run services add-iam-policy-binding "$SERVICE" \
    --region="$REGION" \
    --member="serviceAccount:$PUBSUB_SA" \
    --role="roles/run.invoker"
  
  echo "Done fixing $SERVICE"
  echo ""
done

echo "All services have been updated with PubSub service agent permissions!"
echo "You may need to seek the subscriptions to reprocess any pending messages:"
echo ""
echo "gcloud pubsub subscriptions seek SUBSCRIPTION_NAME --time=\"$(date -u +%Y-%m-%dT%H:%M:%S.%NZ)\""