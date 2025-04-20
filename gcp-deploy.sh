#!/bin/bash
# Deploy script with OpenTelemetry agent for Google Cloud Run

SERVICE_NAME="conciliate-app"
REGION="us-central1"  # Change as needed
PROJECT_ID=$(gcloud config get-value project)

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account="$SERVICE_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars="NODE_ENV=production" \
  --memory=2Gi \
  --cpu=2 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10 \
  --update-labels="managed-by=gcloud" \
  --update-secrets="/env/.env=conciliate-app-env:latest" \
  --execution-environment=gen2 \
  --ingress=all \
  --timeout=300s \
  --cpu-throttling \
  --no-cpu-boost

# After deployment, add IAM permissions for Cloud Trace
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtrace.agent"