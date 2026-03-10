from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import uvicorn
import os

app = FastAPI(title="LegalEase AI Backend", version="1.0.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClauseResponse(BaseModel):
    id: str
    text: str
    risk_level: str
    explanation: Optional[str] = None
    trap_chain_detected: bool = False

class AnalyzeResponse(BaseModel):
    filename: str
    overall_score: int
    clauses: List[ClauseResponse]

@app.get("/")
def read_root():
    return {"message": "Welcome to the LegalEase AI Backend API"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_document(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file format. Supported formats: PDF, DOCX, TXT")
    
    # Placeholder for actual processing logic
    return {
        "filename": file.filename,
        "overall_score": 85,
        "clauses": [
            {
                "id": "c1",
                "text": "This agreement shall automatically renew for successive one-year terms unless either party provides written notice of its intent not to renew at least 90 days before the end of the then-current term.",
                "risk_level": "high-risk",
                "explanation": "This is an auto-renewal clause. You must cancel 90 days before it ends, or you will be locked in for another year.",
                "trap_chain_detected": True
            }
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
