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

class TextRequest(BaseModel):
    text: str
    filename: Optional[str] = "contract.txt"

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
        classified.append(ClauseResult(
            id=f"c{i+1}_{uuid.uuid4().hex[:6]}",
            text=clause_text,
            risk_level=risk_level,
            confidence=round(confidence, 3),
            explanation=explanation,
            matched_kb_id=kb_id,
        ))

    # 5 – Detect trap chains (on original clause strings)
    raw_clauses_for_trap = [c.text for c in classified]
    trap_chain_dicts = detect_trap_chains(raw_clauses_for_trap)
    trap_chains = [TrapChainResult(**t) for t in trap_chain_dicts]

    # 6 – Compute overall score
    clause_dicts = [{"risk_level": c.risk_level, "confidence": c.confidence} for c in classified]
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


# ── Run directly ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
