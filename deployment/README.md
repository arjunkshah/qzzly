# Qzzly.com Deployment Guide (Google Cloud)

This guide explains how to deploy the Qzzly.com site to Google Cloud Platform (GCP), including both the backend (FastAPI) and frontend (static React app), and configure the domain `qzzly.com`.

---

## 1. Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Project created in GCP (e.g., `qzzly-prod`)
- Domain `qzzly.com` purchased and DNS access

---

## 2. Backend (FastAPI) Deployment (Cloud Run)

1. **Dockerize FastAPI Backend**
   - Ensure your `backend/` folder has a `Dockerfile` (see `backend/Dockerfile` for example).

2. **Build & Push Docker Image**
   ```sh
   cd backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/qzzly-backend:latest
   ```
   Replace `PROJECT_ID` with your GCP project ID.

3. **Deploy to Cloud Run**
   ```sh
   gcloud run deploy qzzly-backend \
     --image gcr.io/PROJECT_ID/qzzly-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=your-key,STRIPE_SECRET_KEY=your-key,...
   ```
   - Note the service URL (e.g., `https://qzzly-backend-xxxx.a.run.app`)

---

## 3. Frontend (React) Deployment (Cloud Storage + CDN)

1. **Build the React App**
   ```sh
   cd frontend
   npm run build
   ```
   Output will be in `frontend/dist/`.

2. **Create a GCS Bucket**
   ```sh
   gsutil mb -p PROJECT_ID -c standard -l us-central1 gs://qzzly.com
   gsutil web set -m index.html -e 404.html gs://qzzly.com
   gsutil rsync -R dist gs://qzzly.com
   gsutil iam ch allUsers:objectViewer gs://qzzly.com
   ```

3. **(Optional) Set up Cloud CDN for the bucket**
   - Use Google Cloud Console to enable CDN for the bucket.

---

## 4. Domain (qzzly.com) DNS Setup

1. **Point DNS to Google Cloud**
   - In your domain registrar, set up an A/AAAA record or CNAME to point to the Cloud Run backend and GCS bucket (use Google Cloud Load Balancer if needed for custom domains).
   - Use Google Cloud Console > Cloud Run > Custom Domains to map `api.qzzly.com` to backend and `qzzly.com` to the frontend bucket.

2. **SSL/TLS**
   - Google Cloud will provision SSL certificates automatically for mapped domains.

---

## 5. Environment Variables
- Store secrets (OpenAI, Stripe, Supabase, etc.) in Cloud Run environment variables.
- Do NOT commit secrets to git.

---

## 6. Useful Commands
- Deploy backend: see above
- Deploy frontend: see above
- Update DNS: use registrar or Google Domains

---

## 7. References
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Static Website Hosting on GCS](https://cloud.google.com/storage/docs/hosting-static-website)
- [Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)

---

For any issues, see the Google Cloud documentation or contact your admin. 