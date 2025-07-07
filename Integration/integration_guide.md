# Frontend-Backend Integration Guide

This guide explains how to connect the frontend and backend for QuizIO AI Study.

## 1. Backend (FastAPI)
- Make sure the backend is running: `cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000`
- The backend will be available at `http://localhost:8000` by default.

## 2. Frontend (Vite/React)
- The frontend expects a backend URL for API calls.
- Set the backend URL in your environment variables:

```
VITE_BACKEND_URL=http://localhost:8000
```
- You can add this to a `.env` file in `frontend/` or set it in your deployment environment.

## 3. API Endpoints
- `/api/upload` — Upload PDF and extract text
- `/api/summary` — Generate summary from text
- `/api/flashcards` — Generate flashcards from text
- `/api/quiz` — Generate quiz from text
- `/api/chat` — Chat about document
- `/api/outline` — Generate outline from text
- `/api/notes` — Generate study notes from text

## 4. Connecting Frontend to Backend
- The frontend uses the `VITE_BACKEND_URL` to make requests to the backend endpoints above.
- Ensure both frontend and backend are running and accessible to each other (CORS is enabled in backend).

## 5. Example Workflow
1. User uploads a PDF in the frontend.
2. Frontend sends the file to `/api/upload` on the backend.
3. Backend extracts text and returns it to the frontend.
4. Frontend sends the extracted text to `/api/summary`, `/api/flashcards`, etc., as needed.
5. Backend returns results, which are displayed in the frontend UI.

---

For any issues, check browser console and backend logs for errors. 