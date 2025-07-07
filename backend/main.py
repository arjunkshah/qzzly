import os
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
import openai
import tempfile

# Set your OpenAI API key
openai.api_key = "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"

app = FastAPI()

# Allow CORS for local dev and prod frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file: UploadFile) -> str:
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name
    reader = PdfReader(tmp_path)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    os.remove(tmp_path)
    return text

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        return JSONResponse(status_code=400, content={"error": "Only PDF files are supported."})
    try:
        text = extract_text_from_pdf(file)
        return {"text": text}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

async def openai_chat(system_prompt: str, user_content: str, max_tokens: int = 1000):
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        max_tokens=max_tokens,
        temperature=0.3
    )
    return response.choices[0].message.content.strip()

@app.post("/api/summary")
async def generate_summary(text: str = Form(...)):
    system_prompt = (
        "You are an expert study assistant. Provide a comprehensive, educational summary of the following document. "
        "Focus on main topics, key concepts, and learning objectives. Use clear, educational language."
    )
    summary = await openai_chat(system_prompt, text, max_tokens=800)
    return {"summary": summary}

@app.post("/api/flashcards")
async def generate_flashcards(text: str = Form(...)):
    system_prompt = (
        "You are an expert at creating study flashcards. Read the document and generate 10 flashcards as a JSON array: "
        "[{\"question\": \"...\", \"answer\": \"...\"}, ...]. Focus on key concepts, definitions, and facts."
    )
    flashcards = await openai_chat(system_prompt, text, max_tokens=1500)
    return {"flashcards": flashcards}

@app.post("/api/quiz")
async def generate_quiz(text: str = Form(...)):
    system_prompt = (
        "You are an expert quiz creator. Generate a 5-question multiple choice quiz as a JSON array: "
        "[{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct\": 0}]. "
        "Base questions on the document."
    )
    quiz = await openai_chat(system_prompt, text, max_tokens=1200)
    return {"quiz": quiz}

@app.post("/api/chat")
async def chat_about_doc(text: str = Form(...), question: str = Form(...)):
    system_prompt = (
        "You are a helpful assistant that answers questions about the provided document. Use the document content to provide accurate and relevant answers."
    )
    user_content = f"Document: {text}\n\nQuestion: {question}"
    answer = await openai_chat(system_prompt, user_content, max_tokens=500)
    return {"answer": answer}

@app.post("/api/outline")
async def generate_outline(text: str = Form(...)):
    system_prompt = (
        "You are an expert at creating outlines. Generate a detailed outline of the document using bullet points and indentation."
    )
    outline = await openai_chat(system_prompt, text, max_tokens=1000)
    return {"outline": outline}

@app.post("/api/notes")
async def generate_notes(text: str = Form(...)):
    system_prompt = (
        "You are an expert at creating study notes. Create comprehensive notes from the document, including key concepts, facts, and definitions."
    )
    notes = await openai_chat(system_prompt, text, max_tokens=1500)
    return {"notes": notes}
