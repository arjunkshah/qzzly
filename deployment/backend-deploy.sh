#!/bin/bash
# Deploy FastAPI backend to Google Cloud Run for qzzly.com

set -e

PROJECT_ID="your-gcp-project-id" # <-- Replace with your GCP project ID
SERVICE="qzzly-backend"
REGION="us-central1"

cd ../backend

gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE:latest

gcloud run deploy $SERVICE \
  --image gcr.io/$PROJECT_ID/$SERVICE:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your-openai-key,STRIPE_SECRET_KEY=your-stripe-key

cd ../deployment

echo "Backend deployed to Cloud Run. Check Google Cloud Console for the service URL." 