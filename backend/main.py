"""
main.py — LegalEase AI Backend Orchestrator.
Fixed: PDF parsing using PyPDF2 (no more raw PDF code).
"""

import os
import uuid
import asyncio
import io
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2  # Added for robust PDF extraction

# Import our custom modules
from risk_classifier import classify_clause, segment_clauses
from risk_scorer import compute_risk_score
from trap_chain_detector import detect_trap_chains
from plain_english import generate_explanation
import ai_service
from ai_service import (
    analyze_contract_contextually,
    extract_contract_entities,
    extract_financial_data,
    analyze_gdpr_compliance,
    get_redline_suggestion,
    get_negotiation_advice,
    get_chat_response
)

app = FastAPI(title="LegalEase AI Backend", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────────────────────

class ClauseResult(BaseModel):
    id: str
    text: str
    risk_level: str
    confidence: float
    explanation: str
    suggested_redline: Optional[str] = None
    negotiation_advice: Optional[str] = None
    matched_kb_id: Optional[str] = None

class TrapChainResult(BaseModel):
    id: str
    type: str
    involved_indices: List[int]
    reason: str
    remedy: str

class DeadlineResult(BaseModel):
    title: str
    date: str
    description: str

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
    deadlines: List[DeadlineResult] = []
    jurisdiction_analysis: Optional[JurisdictionResult] = None
    negotiation_playbook: Optional[str] = None
    signature_readiness: Optional[Dict[str, Any]] = None

# ── Helper for PDF Extraction ────────────────────────────────────────────────

def extract_pdf_text(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes using PyPDF2."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
        return text.strip()
    except Exception as e:
        print(f"[Backend] PDF extraction failed: {e}")
        return ""

# ── Core parallel pipeline function ──────────────────────────────────────────

async def _run_pipeline_async(raw_text: str, filename: str) -> AnalysisResponse:
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Document appears to be empty or unreadable.")

    # 1 – Global Contextual Analysis
    global_risks = analyze_contract_contextually(raw_text)
    clause_hints = global_risks.get("clause_hints", [])

    # 2 – Segment into clauses
    clauses_text = segment_clauses(raw_text)

    # 3 & 4 – Classify (ML)
    classified_pre: List[Dict[str, Any]] = []
    for i, clause_text in enumerate(clauses_text):
        if len(clause_text.strip()) < 20: continue
        risk_level, confidence, kb_id = classify_clause(clause_text)
        
        # ── HYBRID OVERRIDE (ML + AI) ──
        # If statistical model is unsure (< 0.7), use AI hints as the source of truth
        for hint in (clause_hints or []):
            snippet = hint.get("text_snippet") or hint.get("text") or hint.get("snippet")
            if snippet and snippet.lower() in clause_text.lower():
                # AI Override: If AI is more 'sure' or ML is unsure
                if hint.get("risk") in ("high", "warning") or confidence < 0.7:
                    risk_level = hint.get("risk")
                    confidence = 0.98  # AI-verified
                    kb_id = f"ai_boost:{hint.get('category', 'risk')}"
        
        norm_risk = "high" if risk_level in ("high", "high-risk") else risk_level
        classified_pre.append({
            "idx": i,
            "text": clause_text,
            "risk_level": norm_risk,
            "confidence": confidence,
            "kb_id": kb_id
        })

    # ─── PARALLEL CLAUSE AI ───
    loop = asyncio.get_event_loop()
    
    async def process_clause_ai(c):
        explanation_task = loop.run_in_executor(None, generate_explanation, c["text"], c["kb_id"], c["risk_level"])
        
        redline = None
        advice = None
        
        if c["risk_level"] in ("warning", "high"):
            rl_task = loop.run_in_executor(None, get_redline_suggestion, c["text"], c["risk_level"])
            ad_task = loop.run_in_executor(None, get_negotiation_advice, c["text"], c["risk_level"])
            res = await asyncio.gather(explanation_task, rl_task, ad_task, return_exceptions=True)
            explanation = res[0] if not isinstance(res[0], Exception) else "Analysis pending."
            redline = res[1] if not isinstance(res[1], Exception) else None
            advice = res[2] if not isinstance(res[2], Exception) else None
        else:
            explanation = await explanation_task

        return ClauseResult(
            id=f"c{c['idx']+1}_{uuid.uuid4().hex[:6]}",
            text=c["text"],
            risk_level=c["risk_level"],
            confidence=round(c["confidence"], 3),
            explanation=explanation,
            suggested_redline=redline,
            negotiation_advice=advice,
            matched_kb_id=c["kb_id"]
        )

    classified_tasks = [process_clause_ai(c) for c in classified_pre]
    classified = await asyncio.gather(*classified_tasks)

    # ─── PARALLEL EXTRACTIONS ───
    tasks = [
        loop.run_in_executor(None, extract_contract_entities, raw_text),
        loop.run_in_executor(None, extract_financial_data, raw_text),
        loop.run_in_executor(None, analyze_gdpr_compliance, raw_text),
        loop.run_in_executor(None, ai_service.extract_deadlines, raw_text),
        loop.run_in_executor(None, ai_service.analyze_jurisdiction, raw_text),
        loop.run_in_executor(None, ai_service.generate_negotiation_playbook, raw_text)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    entities = results[0] if not isinstance(results[0], Exception) else {}
    financials = results[1] if not isinstance(results[1], Exception) else {}
    compliance = results[2] if not isinstance(results[2], Exception) else {}
    deadlines_raw = results[3] if not isinstance(results[3], Exception) else []
    juris_raw = results[4] if not isinstance(results[4], Exception) else {"location": "India", "is_favorable": True, "description": "Subject to Indian Jurisdictional Courts."}
    playbook = results[5] if not isinstance(results[5], Exception) else "Playbook generation failed."

    deadlines = [DeadlineResult(**d) for d in deadlines_raw]
    jurisdiction_analysis = JurisdictionResult(**juris_raw)

    trap_chain_dicts = detect_trap_chains([c.text for c in classified])
    trap_chains = [TrapChainResult(**t) for t in trap_chain_dicts]

    clause_dicts = [{"risk_level": c.risk_level, "confidence": c.confidence} for c in classified]
    score, label, colour = compute_risk_score(
        clause_dicts, 
        trap_chain_dicts, 
        ai_context_score=global_risks.get("global_risk_score")
    )

    return AnalysisResponse(
        filename=filename,
        overall_score=score,
        risk_label=label,
        risk_colour=colour,
        total_clauses=len(classified),
        high_risk_count=sum(1 for c in classified if c.risk_level == "high"),
        warning_count=sum(1 for c in classified if c.risk_level == "warning"),
        safe_count=sum(1 for c in classified if c.risk_level == "safe"),
        trap_chains=trap_chains,
        clauses=classified,
        entities=entities,
        financial_data=financials,
        compliance=compliance,
        deadlines=deadlines,
        jurisdiction_analysis=jurisdiction_analysis,
        negotiation_playbook=playbook,
        signature_readiness=_check_signature_readiness(raw_text)
    )

def _check_signature_readiness(text: str) -> Dict[str, Any]:
    lower = text.lower()
    has_sig = "signature" in lower or "signed by" in lower
    is_signed = "duly signed" in lower
    return {
        "has_signature_block": has_sig,
        "is_signed_detected": is_signed,
        "status": "Ready to Sign" if not is_signed and has_sig else "Execution Verified" if is_signed else "Draft"
    }

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_file(files: List[UploadFile] = File(...)):
    combined_text = []
    main_filename = files[0].filename
    for file in files:
        file_bytes = await file.read()
        ext = file.filename.lower().rsplit(".", 1)[-1]
        
        if ext == "pdf":
            text = extract_pdf_text(file_bytes)
        elif ext in ("png", "jpg", "jpeg"):
            text = ai_service.extract_text_from_image(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")
        
        if text.strip():
            combined_text.append(text)
    
    return await _run_pipeline_async("\n".join(combined_text), main_filename)

class TranslateRequest(BaseModel):
    text: str
    target_lang: str

@app.post("/api/translate")
async def translate(req: TranslateRequest):
    from translator import translate_text
    translated = translate_text(req.text, req.target_lang)
    if not translated:
        return {"translated": req.text, "error": "Translation failed"}
    return {"translated": translated}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply = get_chat_response(req.contract_text, req.query, req.history)
    return ChatResponse(reply=reply)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
