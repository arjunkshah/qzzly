import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import aiofiles
import subprocess
import json

# For Deta Space: expose the FastAPI app as 'app' at the module level
app = FastAPI(title="Quiz.io PDF Processing API", version="1.0.0")

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://quizio-ai-study.surge.sh",
        "https://quizio-ai-study.shard.sh", 
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Quiz.io PDF Processing API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "olmocr-pdf-processor"}

@app.post("/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    """
    Extract text from PDF using olmOCR
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Create temporary directories
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace_dir = os.path.join(temp_dir, "workspace")
            os.makedirs(workspace_dir, exist_ok=True)
            
            # Save uploaded file
            pdf_path = os.path.join(temp_dir, file.filename)
            async with aiofiles.open(pdf_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Run olmOCR pipeline
            cmd = [
                "python", "-m", "olmocr.pipeline",
                workspace_dir,
                "--markdown",
                "--pdfs", pdf_path
            ]
            
            print(f"Running olmOCR command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=temp_dir,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                print(f"olmOCR error: {result.stderr}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"PDF processing failed: {result.stderr}"
                )
            
            # Look for the generated markdown file
            markdown_dir = os.path.join(workspace_dir, "markdown")
            if not os.path.exists(markdown_dir):
                raise HTTPException(
                    status_code=500,
                    detail="No markdown output directory found"
                )
            
            # Find the markdown file (should have the same name as the PDF)
            pdf_name = Path(file.filename).stem
            markdown_file = os.path.join(markdown_dir, f"{pdf_name}.md")
            
            if not os.path.exists(markdown_file):
                # Try to find any markdown file in the directory
                md_files = list(Path(markdown_dir).glob("*.md"))
                if md_files:
                    markdown_file = str(md_files[0])
                else:
                    raise HTTPException(
                        status_code=500,
                        detail="No markdown file generated"
                    )
            
            # Read the extracted text
            async with aiofiles.open(markdown_file, 'r', encoding='utf-8') as f:
                extracted_text = await f.read()
            
            # Also look for Dolma format files
            dolma_files = list(Path(workspace_dir).glob("*.jsonl"))
            dolma_content = []
            if dolma_files:
                async with aiofiles.open(dolma_files[0], 'r', encoding='utf-8') as f:
                    async for line in f:
                        if line.strip():
                            dolma_content.append(json.loads(line))
            
            return {
                "success": True,
                "text": extracted_text,
                "dolma_content": dolma_content,
                "filename": file.filename,
                "text_length": len(extracted_text)
            }
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="PDF processing timed out")
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")

@app.post("/validate-pdf")
async def validate_pdf(file: UploadFile = File(...)):
    """
    Validate PDF and return extraction quality assessment
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # First extract text to assess quality
        extraction_result = await extract_pdf_text(file)
        
        text = extraction_result["text"]
        text_length = len(text)
        
        # Assess quality
        if text_length == 0:
            quality = "poor"
            issues = ["No text extracted - likely image-based PDF"]
        elif text_length < 200:
            quality = "poor"
            issues = ["Very little text extracted"]
        elif text_length < 1000:
            quality = "fair"
            issues = ["Limited text content"]
        elif text_length < 5000:
            quality = "good"
            issues = []
        else:
            quality = "excellent"
            issues = []
        
        # Check for extraction errors
        if "Failed to extract" in text or "Unable to extract" in text:
            quality = "poor"
            issues.append("Extraction errors detected")
        
        return {
            "success": text_length > 0,
            "text_length": text_length,
            "quality": quality,
            "issues": issues,
            "sample": text[:500] + ("..." if len(text) > 500 else ""),
            "filename": file.filename
        }
        
    except Exception as e:
        return {
            "success": False,
            "text_length": 0,
            "quality": "poor",
            "issues": [f"Validation failed: {str(e)}"],
            "sample": "",
            "filename": file.filename
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 