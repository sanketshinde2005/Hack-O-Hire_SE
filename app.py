from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import base64
import os
import io
from PIL import Image 
import pdf2image
import google.generativeai as genai
from typing import Optional, List
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI()

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

class ChatRequest(BaseModel):
    query: str

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

def get_gemini_response(input_text: str, pdf_content: Optional[list] = None, prompt: str = ""):
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        if pdf_content:
            response = model.generate_content([input_text, pdf_content[0], prompt])
        else:
            response = model.generate_content([input_text, prompt])
        return response.text
    except Exception as e:
        logger.error(f"Error in get_gemini_response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response")

def input_pdf_setup(file_content: bytes):
    try:
        images = pdf2image.convert_from_bytes(file_content)
        first_page = images[0]

        img_byte_arr = io.BytesIO()
        first_page.save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()

        pdf_parts = [
            {
                "mime_type": "image/jpeg",
                "data": base64.b64encode(img_byte_arr).decode()
            }
        ]
        return pdf_parts
    except Exception as e:
        logger.error(f"Error in input_pdf_setup: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to process PDF file")

async def process_single_file(file: UploadFile):
    try:
        file_content = await file.read()
        pdf_content = input_pdf_setup(file_content)
        
        prompt = """
        You are an AI expert in software requirement engineering. Analyze the provided document and extract key requirements.
        Format the response in a clear, structured manner.
        """
        
        response = get_gemini_response("", pdf_content, prompt)
        return {
            "filename": file.filename,
            "extractedRequirements": response,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}")
        return {
            "filename": file.filename,
            "error": str(e),
            "status": "error"
        }

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    if not all(file.filename.endswith('.pdf') for file in files):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        logger.info(f"Processing {len(files)} files")
        
        # Process files concurrently
        tasks = [process_single_file(file) for file in files]
        results = await asyncio.gather(*tasks)
        
        # Separate successful and failed results
        successful_results = [r for r in results if r["status"] == "success"]
        failed_results = [r for r in results if r["status"] == "error"]
        
        return {
            "successful": successful_results,
            "failed": failed_results
        }
    except Exception as e:
        logger.error(f"Error in upload_files: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Processing chat request: {request.query[:50]}...")
        prompt = """
        You are an AI-powered Requirements Extraction System designed to analyze textual and graphical inputs, extract functional and non-functional requirements, and structure them into standardized documents. Accept direct user inputs and uploaded files (PDFs, Word, Excel, emails, meeting minutes, and web pages) while incorporating public domain knowledge (e.g., regulations, standards). Accurately identify, categorize, and refine requirements, posing real-time clarifying questions as needed. Support multiple concurrent users handling different requirement sets. Generate a structured requirement document in Word format and extract user stories into an Excel sheet for Jira backlog updates, ensuring clarity, completeness, and adherence to industry standards.
        """
        
        response = get_gemini_response(request.query, prompt=prompt)
        logger.info("Successfully generated chat response")
        return {"response": response}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
