# Dockerfile for FastAPI backend (Google Cloud Run)
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run expects the app to listen on this port
EXPOSE 8080

# Cloud Run will set the PORT env variable; main.py reads it
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 