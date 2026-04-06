"""
main.py — LegalEase AI Backend (FastAPI)

Endpoints:
  GET  /                    → health check
  POST /api/analyze         → full contract analysis (upload file)
  POST /api/analyze-text    → full contract analysis (raw text JSON)

Pipeline:
  1. Extract text from uploaded file
  2. Segment text into clauses
  3. Classify each clause (RAG + keyword heuristics)
  4. Generate plain-English explanation for each clause
  5. Detect trap chains across the contract
  6. Compute overall risk score
"""

import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from text_extractor import extract_text
from clause_segmenter import segment_clauses
from risk_classifier import classify_clause
from plain_english import generate_explanation
from trap_chain_detector import detect_trap_chains
from risk_scorer import compute_risk_score
from translator import translate_text
from ai_service import get_redline_suggestion, extract_contract_entities, extract_financial_data, analyze_gdpr_compliance
from database import save_contract_analysis, get_comments, add_comment

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LegalEase AI Backend",
    description="Contract analysis: clause detection, risk classification, plain English explanations, trap chain detection.",
    version="1.0.0",
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
    risk_level: str           # "safe" | "warning" | "high-risk"
    confidence: float
    explanation: str
    suggested_redline: Optional[str] = None
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
    financial_data: Optional[List[Dict[str, Any]]] = None
    compliance: Optional[Dict[str, Any]] = None

class TextRequest(BaseModel):
    text: str
    filename: Optional[str] = "contract.txt"

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
        explanation = generate_explanation(clause_text, kb_id, risk_level)
        
        # ─── NEW: Suggest redline for warnings and high-risk clauses ─────
        redline = None
        if risk_level in ("warning", "high-risk"):
            redline = get_redline_suggestion(clause_text, risk_level)
            
        classified.append(ClauseResult(
            id=f"c{i+1}_{uuid.uuid4().hex[:6]}",
            text=clause_text,
            risk_level=risk_level,
            confidence=round(confidence, 3),
            explanation=explanation,
            suggested_redline=redline,
            matched_kb_id=kb_id,
        ))

    # 4b ─── NEW: Extract contract-wide entities, Finance & Compliance ──
    entities = extract_contract_entities(raw_text)
    financials = extract_financial_data(raw_text)
    compliance = analyze_gdpr_compliance(raw_text)

    # 5 – Detect trap chains (on original clause strings)
    raw_clauses_for_trap = [c.text for c in classified]
    trap_chain_dicts = detect_trap_chains(raw_clauses_for_trap)
    trap_chains = [TrapChainResult(**t) for t in trap_chain_dicts]

    # 6 – Compute overall score
    clause_dicts = [{"risk_level": c.risk_level} for c in classified]
    score, label, colour = compute_risk_score(clause_dicts, trap_chain_dicts)

    high_risk = sum(1 for c in classified if c.risk_level == "high-risk")
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
    return {"status": "ok", "service": "LegalEase AI Backend v1.0.0"}


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

    return _run_pipeline(raw_text, file.filename)


@app.post("/api/analyze-text", response_model=AnalysisResponse)
def analyze_text(body: TextRequest):
    """Send raw contract text as JSON and receive full analysis."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text body is empty.")
    return _run_pipeline(body.text, body.filename or "contract.txt")


@app.post("/api/translate", response_model=TranslateResponse)
def translate(body: TranslateRequest):
    """Translate text to a target language on-demand."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")
    try:
        translated = translate_text(body.text, body.target_lang)
        return TranslateResponse(translated_text=translated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DiffRequest(BaseModel):
    text1: str
    text2: str

@app.post("/api/diff")
def compare_versions(body: DiffRequest):
    """
    Compare two versions of a contract using Gemini.
    Returns a list of diff objects for the UI.
    """
    from ai_service import model
    if not model:
        return {"diff": []}
        
    prompt = f"""
    You are a legal document expert. Compare these two versions of a contract and identify key changes.
    Version 1:
    {body.text1}
    
    Version 2:
    {body.text2}
    
    Respond with a JSON list of objects. Each object should have:
    - "id": unique string
    - "section": heading name
    - "original": text from V1
    - "modified": text from V2
    - "changes": A list of parts with type "unchanged", "added", or "removed".
    
    Respond ONLY with valid JSON.
    """
    try:
        response = model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "").strip()
        return {"diff": json.loads(raw_json)}
    except Exception as e:
        return {"diff": [], "error": str(e)}


# ─── Collaboration (Comments) ────────────────────────────────────────────────

class CommentRequest(BaseModel):
    contract_id: str
    author: str
    text: str
    clause_id: Optional[str] = None

@app.get("/api/contracts/{contract_id}/comments")
async def fetch_comments(contract_id: str):
    return {"comments": await get_comments(contract_id)}

@app.post("/api/comments")
async def post_comment(body: CommentRequest):
    cid = await add_comment(body.contract_id, body.author, body.text, body.clause_id)
    return {"id": cid, "message": "Comment added successfully."}


# ── Run directly ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
