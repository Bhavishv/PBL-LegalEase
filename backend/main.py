"""
main.py — LegalEase AI Backend Orchestrator (Production Overhaul).
"""

import os
import uuid
import asyncio
import io
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import PyPDF2

# Custom Modules
from risk_classifier import classify_clause, segment_clauses
from risk_scorer import compute_risk_score
from trap_chain_detector import detect_trap_chains
from plain_english import generate_explanation
import ai_service
import blockchain_service
import feedback_engine
from negotiation_socket import manager as socket_manager
from fastapi import WebSocket, WebSocketDisconnect

app = FastAPI(title="LegalEase AI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────────────────────

class RiskObject(BaseModel):
    clause_type: str
    severity: str
    explanation: str
    counter_offer: str

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
    severity_score: float

class DashboardData(BaseModel):
    health_score: int
    radar_data: List[int]
    industry_percentile: int
    benchmarking: str

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
    dashboard_data: Optional[DashboardData] = None
    jurisdiction_analysis: Optional[Dict[str, Any]] = None
    negotiation_letter: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_file(files: List[UploadFile] = File(...)):
    combined_text = []
    main_filename = files[0].filename
    for file in files:
        file_bytes = await file.read()
        ext = file.filename.lower().rsplit(".", 1)[-1]
        if ext == "pdf":
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
        elif ext in ("png", "jpg", "jpeg"):
            text = ai_service.extract_text_from_image(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")
        combined_text.append(text)
    
    full_text = "\n\n".join(combined_text)
    
    # 1. Pipeline execution
    clauses_text = segment_clauses(full_text)
    classified = []
    for i, txt in enumerate(clauses_text):
        risk, conf, kb_id = classify_clause(txt)
        expl = generate_explanation(txt, kb_id, risk)
        
        redline = None
        if risk in ("high", "warning"):
            redline = ai_service.ask_ai(f"Provide a balanced redline for this {risk} clause: {txt}")

        classified.append(ClauseResult(
            id=f"c{i}_{uuid.uuid4().hex[:4]}",
            text=txt,
            risk_level=risk,
            confidence=round(conf, 3),
            explanation=expl,
            suggested_redline=redline
        ))

    # 2. Advanced Analysis
    # Convert to format expected by graph-based detector
    trap_input = [{"index": i, "text": c.text, "type": c.matched_kb_id or "Clause", "risk_level": c.risk_level} for i, c in enumerate(classified)]
    trap_chain_dicts = detect_trap_chains(trap_input)
    trap_chains = [TrapChainResult(**t) for t in trap_chain_dicts]

    # 3. Overall Score & Dashboard
    score, label, colour = compute_risk_score(
        [{"risk_level": c.risk_level, "confidence": c.confidence} for c in classified],
        trap_chain_dicts
    )
    
    dashboard = DashboardData(**ai_service.get_risk_dashboard_data(score, classified))
    jurisdiction = ai_service.analyze_jurisdiction_enhanced(full_text)
    
    # 4. Final Polish
    entities = ai_service.extract_contract_entities(full_text)
    letter = ai_service.generate_negotiation_letter(main_filename, [
        {"clause_type": c.id, "explanation": c.explanation} for c in classified if c.risk_level == "high"
    ])

    return AnalysisResponse(
        filename=main_filename,
        overall_score=score,
        risk_label=label,
        risk_colour=colour,
        total_clauses=len(classified),
        high_risk_count=sum(1 for c in classified if c.risk_level == "high"),
        warning_count=sum(1 for c in classified if c.risk_level == "warning"),
        safe_count=sum(1 for c in classified if c.risk_level == "safe"),
        trap_chains=trap_chains,
        clauses=classified,
        dashboard_data=dashboard,
        jurisdiction_analysis=jurisdiction,
        negotiation_letter=letter,
        entities=entities
    )

class ChatRequest(BaseModel):
    contract_id: str
    contract_text: str
    query: str

@app.post("/api/chat")
async def chat(req: ChatRequest):
    return ai_service.get_chat_response(req.contract_id, req.contract_text, req.query)

class CompareRequest(BaseModel):
    v1_text: str
    v2_text: str

@app.post("/api/compare")
async def compare(req: CompareRequest):
    return ai_service.compare_contracts(req.v1_text, req.v2_text)

# ── Multi-User Negotiation (WebSockets) ───────────────────────────────────

@app.websocket("/ws/negotiate/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await socket_manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await socket_manager.broadcast(room_id, message, websocket)
    except WebSocketDisconnect:
        socket_manager.disconnect(room_id, websocket)

# ── Blockchain & Feedback ──────────────────────────────────────────────────

class NotarizeRequest(BaseModel):
    contract_text: str
    signatures: List[str]

@app.post("/api/notarize")
async def notarize_contract(req: NotarizeRequest):
    return blockchain_service.notarizer.generate_proof(req.contract_text, req.signatures)

class FeedbackRequest(BaseModel):
    clause_text: str
    predicted_risk: str
    user_correction: Optional[str] = None
    is_accurate: bool

@app.post("/api/feedback")
async def save_feedback(req: FeedbackRequest):
    feedback_engine.log_feedback(req.clause_text, req.predicted_risk, req.user_correction, req.is_accurate)
    return {"status": "recorded", "stats": feedback_engine.get_retraining_stats()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
