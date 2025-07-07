#!/bin/bash
# Deploy React frontend to Google Cloud Storage for qzzly.com

set -e

PROJECT_ID="your-gcp-project-id" # <-- Replace with your GCP project ID
BUCKET="qzzly.com"

cd ../frontend
npm run build

cd ../deployment

gsutil mb -p $PROJECT_ID -c standard -l us-central1 gs://$BUCKET || true
gsutil web set -m index.html -e 404.html gs://$BUCKET
gsutil rsync -R ../frontend/dist gs://$BUCKET
gsutil iam ch allUsers:objectViewer gs://$BUCKET

echo "Frontend deployed to https://storage.googleapis.com/$BUCKET/index.html" 