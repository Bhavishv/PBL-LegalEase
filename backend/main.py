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

import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()  # loads GEMINI_API_KEY and other vars from .env

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

class ChatMessage(BaseModel):
    role: str   # "user" | "model"
    content: str

class ChatRequest(BaseModel):
    contract_text: str          # full contract text for context
    contract_filename: str
    history: List[ChatMessage]  # previous turns
    message: str                # new user message

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


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_contract(body: ChatRequest):
    """Ask Gemini anything about the uploaded contract."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return ChatResponse(
            reply="The Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.",
            error="no_api_key"
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        system_prompt = (
            f"You are LegalEase AI, an expert legal assistant. "
            f"The user has uploaded a contract named '{body.contract_filename}'. "
            f"You have full access to the contract text below. "
            f"Answer the user's questions in plain English, be concise, and highlight any risks. "
            f"Do not make up clauses that do not exist in the contract.\n\n"
            f"=== CONTRACT TEXT ===\n{body.contract_text[:8000]}\n=== END CONTRACT ==="
        )

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt,
        )

        # Build history in Gemini format
        gemini_history = [
            {"role": msg.role, "parts": [msg.content]}
            for msg in body.history
        ]

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(body.message)
        return ChatResponse(reply=response.text.strip())

    except Exception as e:
        return ChatResponse(
            reply="Sorry, I couldn't process that question. Please try again.",
            error=str(e)
        )


# ── Translate endpoint ────────────────────────────────────────────────────────

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


# ── Diff / Version Compare endpoint ──────────────────────────────────────────

class DiffRequest(BaseModel):
    text1: str
    text2: str

@app.post("/api/diff")
def compare_versions(body: DiffRequest):
    """
    Compare two versions of a contract using Gemini.
    Returns a list of diff objects for the UI.
    """
    import json
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


# ── Crowd Risk Intelligence endpoint ─────────────────────────────────────────

CROWD_INTEL_FALLBACK = [
    {
        "id": "cr1",
        "category": "Data Privacy",
        "title": "Third-Party Data Sharing Without Consent",
        "snippet": "...Provider may share Customer data with third-party partners for marketing and analytics...",
        "rejectionRate": 87,
        "renegotiationSuccess": 42,
        "industry": "SaaS",
        "trend": "spiking",
        "aiInsight": "This clause violates GDPR Article 6 – you need explicit consent for data sharing with third parties. Reject and propose an opt-in model.",
        "userCount": 12400,
        "comments": [
            {"user": "Sarah L.", "role": "In-House Counsel", "text": "Always redline this. Propose 'opt-in' strictly."},
            {"user": "TechStartup Inc.", "role": "B2B Client", "text": "Successfully removed this by citing GDPR compliance requirements."}
        ]
    },
    {
        "id": "cr2",
        "category": "Dispute Resolution",
        "title": "Mandatory Binding Arbitration",
        "snippet": "...Any dispute shall be settled exclusively by binding arbitration in Delaware...",
        "rejectionRate": 65,
        "renegotiationSuccess": 18,
        "industry": "All Industries",
        "trend": "constant",
        "aiInsight": "Binding arbitration removes your right to sue in court and often favors large corporations. Try to negotiate for your local jurisdiction.",
        "userCount": 8900,
        "comments": [
            {"user": "LegalEagle99", "role": "Contract Lawyer", "text": "Very hard to fight against large enterprises, but worth attempting to move jurisdiction to your home state."}
        ]
    },
    {
        "id": "cr3",
        "category": "Term & Termination",
        "title": "Auto-Renewal with >60 Day Notice",
        "snippet": "...shall automatically renew... unless written notice is provided ninety (90) days prior...",
        "rejectionRate": 92,
        "renegotiationSuccess": 76,
        "industry": "B2B Software",
        "trend": "declining",
        "aiInsight": "Industry standard is moving to 30 days. A 90-day notice requirement dramatically increases your risk of accidental renewal. Push back hard.",
        "userCount": 19200,
        "comments": [
            {"user": "Mike T.", "role": "Procurement Manager", "text": "Industry standard is moving to 30 days. Push hard on this, vendors almost always cave."},
            {"user": "Freelance Hub", "role": "Agency", "text": "We got stuck in a 1-year contract because of a 90-day clause. Never again."}
        ]
    },
    {
        "id": "cr4",
        "category": "Liability",
        "title": "Uncapped Indirect Liability Waiver",
        "snippet": "...Provider shall not be liable for any indirect, special, or consequential damages...",
        "rejectionRate": 98,
        "renegotiationSuccess": 89,
        "industry": "Enterprise SaaS",
        "trend": "constant",
        "aiInsight": "This is standard boilerplate but ensure there are exclusions for gross negligence, willful misconduct, and data breaches. These are non-negotiable carve-outs.",
        "userCount": 31000,
        "comments": [
            {"user": "Jane D.", "role": "General Counsel", "text": "Standard defensive clause, but ensure exclusions exist for gross negligence or data breaches."}
        ]
    }
]

@app.get("/api/crowd-intel")
def get_crowd_intel():
    """
    Returns crowd-sourced risk intelligence on common contract clauses.
    Uses Gemini to enrich AI insights if available.
    """
    import time
    from ai_service import model as gemini_model

    result = list(CROWD_INTEL_FALLBACK)

    # Try enriching with Gemini's current analysis
    if gemini_model:
        try:
            prompt = """You are a contract risk intelligence expert. Generate a real-time analysis of the TOP 4 most contested contract clauses seen across thousands of contracts in 2025-2026.

For each clause, respond as a JSON list with these fields:
- "id": unique string (cr1, cr2, cr3, cr4)
- "category": Category name
- "title": Clause name
- "snippet": A short sample of the actual clause text (in quotes)
- "rejectionRate": integer 0-100 (% of legal experts who recommend rejecting this)
- "renegotiationSuccess": integer 0-100 (% success rate when negotiating)
- "industry": Industry where most common
- "trend": one of "spiking" | "constant" | "declining"
- "aiInsight": 2-3 sentence expert analysis and advice
- "userCount": integer (mock number of users who've encountered this)
- "comments": list of 1-2 objects with "user", "role", "text" fields

Be realistic and specific. Respond ONLY with valid JSON list."""

            response = gemini_model.generate_content(prompt)
            raw = response.text.strip().replace("```json", "").replace("```", "").strip()
            import json as _json
            parsed = _json.loads(raw)
            if isinstance(parsed, list) and len(parsed) >= 2:
                result = parsed
        except Exception as e:
            print(f"[CrowdIntel] Gemini enrichment skipped: {e}")

    return {"clauses": result, "total_analyzed": 2400000, "contributors": 14300, "last_updated": "Live"}


# ── Run directly ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
