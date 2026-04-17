"""
main.py — LegalEase AI Backend (FastAPI)

Endpoints:
  GET  /                    → health check
  POST /api/analyze         → full contract analysis (upload file)
  POST /api/analyze-text    → full contract analysis (raw text JSON)
  POST /api/chat            → interactive Q&A with contract context
  POST /api/translate       → translate text

Pipeline:
  1. Extract text from uploaded file
  2. Segment text into clauses
  3. Classify each clause (RAG + keyword heuristics)
  4. Generate plain-English explanation for each clause
  5. Detect trap chains across the contract
  6. Compute overall risk score
"""

import os
import uuid
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()  # loads GEMINI_API_KEY and other vars from .env

from text_extractor import extract_text
from clause_segmenter import segment_clauses
from risk_classifier import classify_clause
from plain_english import generate_explanation
from trap_chain_detector import detect_trap_chains
from risk_scorer import compute_risk_score
from translator import translate_text
from ai_service import (
    get_redline_suggestion, 
    get_negotiation_advice, 
    extract_contract_entities, 
    extract_financial_data, 
    analyze_gdpr_compliance,
    get_chat_response
)
from database import save_contract_analysis, get_comments, add_comment

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LegalEase AI Backend",
    description="Contract analysis: clause detection, risk classification, plain English explanations, trap chain detection.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ───────────────────────────────────────────────────────────

class ClauseResult(BaseModel):
    id: str
    text: str
    risk_level: str           # "safe" | "warning" | "high"
    confidence: float
    explanation: str
    suggested_redline: Optional[str] = None
    negotiation_advice: Optional[str] = None
    matched_kb_id: Optional[str] = None

class TrapChainResult(BaseModel):
    name: str
    description: str
    matched_keywords: List[str]

class AnalysisResponse(BaseModel):
    filename: str
    overall_score: int
    risk_label: str
    risk_colour: str
    total_clauses: int
    high_risk_count: int
    warning_count: int
    safe_count: int
    trap_chains: List[TrapChainResult]
    clauses: List[ClauseResult]
    entities: Optional[Dict[str, Any]] = None
    financial_data: Optional[Dict[str, Any]] = None  # FIXED: Dict instead of List
    compliance: Optional[Dict[str, Any]] = None

class TextRequest(BaseModel):
    text: str
    filename: Optional[str] = "contract.txt"

class ChatRequest(BaseModel):
    contract_text: str
    query: str
    history: List[Dict[str, str]] = []

class ChatResponse(BaseModel):
    reply: str
    error: Optional[str] = None

class TranslateRequest(BaseModel):
    text: str
    target_lang: str    # 'hi' | 'mr' | etc.

class TranslateResponse(BaseModel):
    translated_text: str

# ── Core pipeline function ────────────────────────────────────────────────────

def _run_pipeline(raw_text: str, filename: str) -> AnalysisResponse:
    # 1 – Segment into clauses
    clauses_text = segment_clauses(raw_text)

    # 2 & 3 & 4 – Classify + explain each clause
    classified: List[ClauseResult] = []
    for i, clause_text in enumerate(clauses_text):
        if len(clause_text.strip()) < 20:     # skip very short fragments
            continue
            
        risk_level, confidence, kb_id = classify_clause(clause_text)
        
        # Normailze risk level for frontend consistency
        norm_risk = "high" if risk_level == "high-risk" else risk_level
        
        explanation = generate_explanation(clause_text, kb_id, risk_level)
        
        # ─── Suggest redline and negotiation advice for risky clauses ──
        redline = None
        advice = None
        if norm_risk in ("warning", "high"):
            redline = get_redline_suggestion(clause_text, norm_risk)
            advice = get_negotiation_advice(clause_text, norm_risk)
            
        classified.append(ClauseResult(
            id=f"c{i+1}_{uuid.uuid4().hex[:6]}",
            text=clause_text,
            risk_level=norm_risk,
            confidence=round(confidence, 3),
            explanation=explanation,
            suggested_redline=redline,
            negotiation_advice=advice,
            matched_kb_id=kb_id,
        ))

    # 4b ─── Extract contract-wide entities, Finance & Compliance ──
    entities = extract_contract_entities(raw_text)
    financials = extract_financial_data(raw_text)
    compliance = analyze_gdpr_compliance(raw_text)

    # 5 – Detect trap chains (on original clause strings)
    raw_clauses_for_trap = [c.text for c in classified]
    trap_chain_dicts = detect_trap_chains(raw_clauses_for_trap)
    trap_chains = [TrapChainResult(**t) for t in trap_chain_dicts]

    # 6 – Compute overall score
    clause_dicts = [{"risk_level": c.risk_level, "confidence": c.confidence} for c in classified]
    score, label, colour = compute_risk_score(clause_dicts, trap_chain_dicts)

    high_risk = sum(1 for c in classified if c.risk_level == "high")
    warning   = sum(1 for c in classified if c.risk_level == "warning")
    safe      = sum(1 for c in classified if c.risk_level == "safe")

    return AnalysisResponse(
        filename=filename,
        overall_score=score,
        risk_label=label,
        risk_colour=colour,
        total_clauses=len(classified),
        high_risk_count=high_risk,
        warning_count=warning,
        safe_count=safe,
        trap_chains=trap_chains,
        clauses=classified,
        entities=entities,
        financial_data=financials,
        compliance=compliance,
    )

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok", "service": "LegalEase AI Backend v1.1.0"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_contract(req: ChatRequest):
    """
    Interactive Q&A using contract context.
    """
    try:
        reply = get_chat_response(req.contract_text, req.query, req.history)
        return ChatResponse(reply=reply)
    except Exception as e:
        return ChatResponse(reply="I'm sorry, I couldn't process that request.", error=str(e))

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_file(file: UploadFile = File(...)):
    """Upload a contract file (PDF / DOCX / TXT) and receive full analysis."""
    allowed = {"pdf", "docx", "doc", "txt"}
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(allowed)}"
        )
    file_bytes = await file.read()
    try:
        raw_text = extract_text(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {e}")

    analysis = _run_pipeline(raw_text, file.filename)
    # Persist to DB
    await save_contract_analysis(analysis.dict())
    return analysis

@app.post("/api/analyze-text", response_model=AnalysisResponse)
async def analyze_text_endpoint(body: TextRequest):
    """Send raw contract text as JSON and receive full analysis."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text body is empty.")
    analysis = _run_pipeline(body.text, body.filename or "contract.txt")
    # Persist to DB
    await save_contract_analysis(analysis.dict())
    return analysis

@app.post("/api/translate", response_model=TranslateResponse)
async def translate_text_endpoint(req: TranslateRequest):
    """Translate text to target language."""
    try:
        result = translate_text(req.text, req.target_lang)
        return TranslateResponse(translated_text=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crowd-intel")
def get_crowd_intel():
    """Returns crowd-sourced risk intelligence."""
    # Simplified fallback for this cleanup
    return {
        "clauses": [
            {
                "id": "cr1",
                "category": "Data Privacy",
                "title": "Unrestricted Data Sharing",
                "snippet": "...may share data with third-party partners...",
                "rejectionRate": 85,
                "renegotiationSuccess": 42,
                "trend": "spiking",
                "aiInsight": "Violates GDPR Article 6 principles.",
                "userCount": 12400,
                "comments": [{"user": "Sarah L.", "role": "Counsel", "text": "Reject this."}]
            }
        ],
        "total_analyzed": 2400000,
        "contributors": 14300,
        "last_updated": "Live"
    }

# ── Database Endpoints ───────────────────────────────────────────────────────

@app.get("/api/contracts/{contract_id}/comments")
def list_comments(contract_id: str):
    return get_comments(contract_id)

@app.post("/api/comments")
def post_comment(comment: Dict[str, Any]):
    return add_comment(comment)

# ── Run directly ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
