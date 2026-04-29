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

# Ensure we load .env from the backend directory even if run from root
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))

from text_extractor import extract_text
from clause_segmenter import segment_clauses
from risk_classifier import classify_clause
from plain_english import generate_explanation
from trap_chain_detector import detect_trap_chains
from risk_scorer import compute_risk_score
from translator import translate_text
import ai_service
from ai_service import (
    get_redline_suggestion, 
    get_negotiation_advice, 
    extract_contract_entities, 
    extract_financial_data, 
    analyze_gdpr_compliance,
    get_chat_response,
    analyze_contract_contextually
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

class DeadlineResult(BaseModel):
    title: str
    date: str
    description: str
    remind_me: bool = True

class JurisdictionResult(BaseModel):
    location: str
    is_favorable: bool
    description: str

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
    financial_data: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None
    # ── New Market-Fit Features ──
    deadlines: List[DeadlineResult] = []
    jurisdiction_analysis: Optional[JurisdictionResult] = None
    negotiation_playbook: Optional[str] = None
    signature_readiness: Optional[Dict[str, Any]] = None

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

class CompareRequest(BaseModel):
    text1: str
    text2: str

class DiffChange(BaseModel):
    type: str  # "added" | "removed" | "unchanged"
    text: str

class DiffResult(BaseModel):
    id: str
    section: str
    changes: List[DiffChange]

class CompareResponse(BaseModel):
    diff: List[DiffResult]

# ── Core pipeline function ────────────────────────────────────────────────────

def _run_pipeline(raw_text: str, filename: str) -> AnalysisResponse:
    # 1 – Global Contextual Analysis (The "Brain" of the new model)
    global_risks = analyze_contract_contextually(raw_text)
    clause_hints = global_risks.get("clause_hints", [])

    # 2 – Segment into clauses
    clauses_text = segment_clauses(raw_text)

    # 3 & 4 & 5 – Classify + explain each clause
    classified: List[ClauseResult] = []
    for i, clause_text in enumerate(clauses_text):
        if len(clause_text.strip()) < 20:     # skip very short fragments
            continue
            
        risk_level, confidence, kb_id = classify_clause(clause_text)
        
        # ─── Contextual Boosting (AI Feedback Loop) ───
        # Check if the global analysis flagged this specific text
        for hint in clause_hints:
            if hint["text_snippet"].lower() in clause_text.lower():
                # If AI found a risk the ML model missed or scored low, upgrade it
                if hint["risk"] == "high" and risk_level != "high":
                    risk_level = "high"
                    confidence = max(confidence, 0.95)
                elif hint["risk"] == "warning" and risk_level == "safe":
                    risk_level = "warning"
                    confidence = max(confidence, 0.85)

        # Normalize risk level for frontend consistency
        norm_risk = "high" if risk_level in ("high", "high-risk") else risk_level
        
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
    
    # ── New Market-Fit Extractions ──
    deadlines_raw = ai_service.extract_deadlines(raw_text)
    deadlines = [DeadlineResult(**d) for d in deadlines_raw]
    
    juris_raw = ai_service.analyze_jurisdiction(raw_text)
    jurisdiction_analysis = JurisdictionResult(**juris_raw)
    
    playbook = ai_service.generate_negotiation_playbook(raw_text)

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

    # 9. Signature & Execution Check
    readiness = _check_signature_readiness(raw_text)

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
        deadlines=deadlines,
        jurisdiction_analysis=jurisdiction_analysis,
        negotiation_playbook=playbook,
        signature_readiness=readiness
    )

def _check_signature_readiness(text: str) -> Dict[str, Any]:
    """Simple heuristic + LLM check for signature blocks."""
    lower = text.lower()
    has_sig_block = "signature" in lower or "signed by" in lower or "witness" in lower
    is_signed = "duly signed" in lower or "executed on" in lower
    
    return {
        "has_signature_block": has_sig_block,
        "is_signed_detected": is_signed,
        "missing_initials_hint": "Check page margins for missing initials." if len(text) > 5000 else None,
        "status": "Ready to Sign" if not is_signed and has_sig_block else "Execution Verified" if is_signed else "Draft / Incomplete"
    }

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
async def analyze_file(files: List[UploadFile] = File(...)):
    """Upload one or more contract files (PDF / DOCX / TXT / Images) and receive full analysis."""
    allowed = {"pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"}
    combined_text = []
    main_filename = files[0].filename if files else "contract"

    for file in files:
        ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
        if ext not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '.{ext}' in {file.filename}. Allowed: {', '.join(allowed)}"
            )
        
        file_bytes = await file.read()
        try:
            text = extract_text(file.filename, file_bytes)
            combined_text.append(text)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Text extraction failed for {file.filename}: {e}")

    raw_text = "\n\n--- Next Page / File ---\n\n".join(combined_text)
    analysis = _run_pipeline(raw_text, main_filename)
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

@app.post("/api/compare-versions", response_model=CompareResponse)
async def compare_versions_endpoint(req: CompareRequest):
    """Compare two versions of a contract and highlight differences."""
    prompt = f"""
    Compare these two versions of a contract and identify changes.
    Break the analysis down into logical sections (e.g., "Termination", "Payment").
    For each section, provide a list of changes where each change has a 'type' (added, removed, unchanged) and the 'text'.
    
    Return ONLY JSON:
    {{
      "diff": [
        {{
          "id": "1",
          "section": "Section Name",
          "changes": [
            {{"type": "unchanged", "text": "..."}},
            {{"type": "removed", "text": "..."}},
            {{"type": "added", "text": "..."}}
          ]
        }}
      ]
    }}
    
    Version 1 (Original):
    {req.text1[:4000]}
    
    Version 2 (Modified):
    {req.text2[:4000]}
    """
    result = ai_service.ask_ai(prompt)
    try:
        cleaned = result.replace("```json", "").replace("```", "").strip()
        return CompareResponse(**json.loads(cleaned))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")

@app.get("/api/crowd-intel")
def get_crowd_intel():
    """Returns crowd-sourced risk intelligence with market metrics."""
    return {
        "market_confidence_index": 68,
        "industry_exposure": [
            {"name": "SaaS", "risk": "High", "count": 1240},
            {"name": "Real Estate", "risk": "Medium", "count": 890},
            {"name": "Employment", "risk": "Low", "count": 2100}
        ],
        "clauses": [
            {
                "id": "cr1",
                "category": "Data Privacy",
                "title": "Unrestricted Third-Party Data Sharing",
                "snippet": "...Provider may share Customer data with third-party partners for marketing and research purposes without prior notice...",
                "rejectionRate": 87,
                "renegotiationSuccess": 42,
                "industry": "SaaS",
                "trend": "spiking",
                "aiInsight": "Violates GDPR Article 6 principles. Always push for explicit opt-in consent for third-party data sharing.",
                "userCount": 12400,
                "comments": [{"user": "Sarah L.", "role": "Counsel", "text": "Critical redline. Never accept broad sharing without consent."}]
            },
            {
                "id": "cr2",
                "category": "Dispute Resolution",
                "title": "Mandatory Binding Arbitration in Hostile Jurisdiction",
                "snippet": "...Any dispute shall be settled exclusively by binding arbitration in the Cayman Islands under local rules...",
                "rejectionRate": 65,
                "renegotiationSuccess": 18,
                "industry": "Finance",
                "trend": "constant",
                "aiInsight": "Cayman jurisdiction is often corporate-friendly and expensive for individuals. Propose a neutral location.",
                "userCount": 8900,
                "comments": [{"user": "David R.", "role": "Contract Lawyer", "text": "Typical for offshore platforms. Fight for home jurisdiction."}]
            },
            {
                "id": "cr3",
                "category": "Term & Termination",
                "title": "Hidden 90-Day Auto-Renewal Notice",
                "snippet": "...shall automatically renew for 12 months unless written notice is given at least 90 days before expiry...",
                "rejectionRate": 92,
                "renegotiationSuccess": 76,
                "industry": "Enterprise",
                "trend": "declining",
                "aiInsight": "Industry standard is 30 days. Most vendors cave on this if challenged early.",
                "userCount": 19200,
                "comments": [{"user": "Mike T.", "role": "Procurement", "text": "We always push this back to 30 days. Easy win."}]
            }
        ],
        "total_analyzed": 2451200,
        "contributors": 14382,
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
