"""
main.py — LegalEase AI Backend (FastAPI)

Hybrid Legal Intelligence Engine — Multi-Clause Legal Reasoning Framework.

Endpoints:
  GET  /                    → health check
  POST /api/analyze         → full contract analysis (upload file)
  POST /api/analyze-text    → full contract analysis (raw text JSON)
  POST /api/chat            → conversational Q&A about a contract

Decision Intelligence Pipeline (10 steps):
  1.  Segment text into clauses
  2.  Detect contract type (rental, SaaS, employment, loan, NDA)
  3.  Run ALL classifiers (CUAD, SBERT, TF-IDF, keywords)
  4.  Run confidence calibration (prediction stability)
  5.  Run context verification (false-positive prevention)
  6.  Run rule engine (cross-clause pattern detection)
  7.  Analyze severity per clause (5 risk dimensions)
  8.  Detect trap chains (graph-based relationship intelligence)
  9.  Compute overall risk score (with full factor breakdown)
  10. Generate risk factors + plain-English explanations
"""

import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()  # loads GEMINI_API_KEY and other vars from .env

from text_extractor import extract_text
from clause_segmenter import segment_clauses
from risk_classifier import classify_clause_ensemble
from plain_english import generate_explanation, generate_risk_factors
from trap_chain_detector import detect_trap_chains
from risk_scorer import compute_risk_score
from contract_type_detector import detect_contract_type, detect_all_type_scores
from rule_engine import evaluate_rules
from confidence_calibrator import calibrate_prediction
from context_verifier import verify_clause_context
from severity_analyzer import analyze_severity, aggregate_severity, SeverityBreakdown

_genai_client = None

def _get_genai_client():
    global _genai_client
    if _genai_client is not None:
        return _genai_client

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    from google import genai
    _genai_client = genai.Client(api_key=api_key)
    return _genai_client

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LegalEase AI — Hybrid Legal Intelligence Engine",
    description=(
        "Multi-Clause Legal Reasoning Framework: clause detection, ensemble risk "
        "classification, confidence calibration, context verification, graph-based "
        "trap chain detection, severity prediction, and explainable risk analysis."
    ),
    version="2.0.0",
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
    risk_level: str                                 # "safe" | "warning" | "high-risk"
    confidence: float
    explanation: str
    matched_kb_id: Optional[str] = None
    # ── New fields from Decision Intelligence Layer ──
    severity: Optional[Dict[str, float]] = None     # 5-dimension severity breakdown
    risk_factors: Optional[List[Dict]] = None       # explainable risk factor list
    ensemble_scores: Optional[Dict] = None          # individual model scores
    confidence_stability: Optional[str] = None      # "High Confidence" | "Manual Review"
    stability_score: Optional[float] = None         # 0.0–1.0
    context_verified: Optional[bool] = None         # was context verification applied?
    verification_note: Optional[str] = None         # "Standard in SaaS contracts"

class TrapChainResult(BaseModel):
    name: str
    description: str
    matched_keywords: List[str]
    matched_clauses: Optional[List[int]] = None
    danger_score: Optional[float] = None
    relationship_graph: Optional[Dict] = None
    predicted_consequence: Optional[str] = None
    risk_tags: Optional[List[str]] = None

class RuleAlert(BaseModel):
    rule_id: str
    rule_name: str
    severity: str
    matched_clauses: List[int]
    explanation: str
    risk_tags: List[str]

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
    # ── New fields from Decision Intelligence Layer ──
    contract_type: Optional[str] = None
    contract_type_confidence: Optional[float] = None
    severity_summary: Optional[Dict[str, float]] = None
    rule_engine_alerts: Optional[List[RuleAlert]] = None
    ensemble_method: Optional[str] = "weighted_vote"
    score_breakdown: Optional[Dict] = None
    manual_review_clauses: Optional[int] = 0
    contract_summary: Optional[str] = None  # Mistral AI executive summary
    type_scores: Optional[Dict[str, float]] = None  # All contract type percentages

class TextRequest(BaseModel):
    text: str
    filename: Optional[str] = "contract.txt"


# ── Mistral AI Summary Generator ──────────────────────────────────────────────

def _generate_mistral_summary(
    contract_text: str,
    risk_label: str,
    overall_score: int,
    high_risk_count: int,
    warning_count: int,
    safe_count: int,
    contract_type: str,
) -> str:
    """
    Generate a concise executive summary of the contract using Mistral AI.

    The prompt includes the pipeline's final score and risk label so the
    summary is guaranteed to align with the model's prediction.
    """
    import urllib.request
    import json as json_lib

    api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    if not api_key:
        return _fallback_summary(risk_label, overall_score, high_risk_count, warning_count, safe_count, contract_type)

    try:
        prompt = (
            f"You are a legal contract analyst. Here is a contract (type: {contract_type}).\n\n"
            f"Our AI analysis scored this contract {overall_score}/100 with a risk level of '{risk_label}'.\n"
            f"Clause breakdown: {high_risk_count} high-risk, {warning_count} warnings, {safe_count} safe.\n\n"
            f"Write a 2-3 sentence executive summary of this contract for a non-lawyer.\n"
            f"CRITICAL: Your summary MUST align with our risk score of {overall_score}/100 ({risk_label}).\n"
            f"- If the score is below 60, clearly warn the user about the risks.\n"
            f"- If the score is 60-84, mention it needs careful review.\n"
            f"- If the score is 85+, say it appears generally fair.\n"
            f"Do NOT add any headers, bullet points, or formatting — just write plain sentences.\n\n"
            f"CONTRACT TEXT:\n{contract_text}"
        )

        model_name = os.getenv("MISTRAL_MODEL", "").strip() or "mistral-small-latest"

        payload = json_lib.dumps({
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 250,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.mistral.ai/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=20) as resp:
            result = json_lib.loads(resp.read().decode("utf-8"))

        summary = result["choices"][0]["message"]["content"].strip()
        if summary:
            return summary

    except Exception as e:
        print(f"[LegalEase] ⚠️ Mistral summary failed: {e}")

    return _fallback_summary(risk_label, overall_score, high_risk_count, warning_count, safe_count, contract_type)


def _fallback_summary(risk_label, overall_score, high_risk_count, warning_count, safe_count, contract_type):
    """Deterministic fallback if Mistral API is unavailable."""
    ctype = contract_type if contract_type != "general" else "standard"
    if overall_score >= 85 and high_risk_count == 0:
        return (
            f"This {ctype} contract appears generally fair and well-balanced. "
            f"All {safe_count} clauses were classified as safe with no significant risks detected."
        )
    elif overall_score >= 60:
        return (
            f"This {ctype} contract requires careful review before signing. "
            f"Our analysis found {warning_count} clause{'s' if warning_count != 1 else ''} needing attention "
            f"and {high_risk_count} high-risk clause{'s' if high_risk_count != 1 else ''}. "
            f"Overall risk score: {overall_score}/100."
        )
    else:
        return (
            f"This {ctype} contract carries significant risks and should not be signed without legal review. "
            f"Our analysis flagged {high_risk_count} high-risk clause{'s' if high_risk_count != 1 else ''} "
            f"and {warning_count} warning{'s' if warning_count != 1 else ''}. "
            f"Overall risk score: {overall_score}/100."
        )


# ── Core pipeline function ────────────────────────────────────────────────────

def _run_pipeline(raw_text: str, filename: str) -> AnalysisResponse:
    # ── Step 1: Segment into clauses ──────────────────────────────────────
    clauses_text = segment_clauses(raw_text)

    # ── Step 2: Detect contract type ──────────────────────────────────────
    contract_type, type_confidence = detect_contract_type(raw_text)

    # ── Step 2b: Get all type scores as percentages ─────────────────────
    type_scores = detect_all_type_scores(raw_text)

    # ── Step 3+4+5+7+10: Classify, calibrate, verify, severity, explain ──
    classified: List[ClauseResult] = []
    severity_breakdowns: List[SeverityBreakdown] = []
    verification_downgrades = 0
    manual_review_count = 0

    for i, clause_text in enumerate(clauses_text):
        if len(clause_text.strip()) < 20:     # skip very short fragments
            continue

        # Step 3: Run ALL classifiers (ensemble)
        ensemble = classify_clause_ensemble(clause_text)
        risk_level = ensemble["risk_level"]
        confidence = ensemble["confidence"]
        kb_id = ensemble.get("matched_kb_id")
        individual_scores = ensemble.get("individual_scores", {})
        model_predictions = ensemble.get("model_predictions", {})

        # Step 4: Confidence calibration
        calibration = calibrate_prediction(
            cuad_result=model_predictions.get("cuad"),
            sbert_result=model_predictions.get("sbert"),
            tfidf_result=model_predictions.get("tfidf"),
            keyword_result=model_predictions.get("keyword"),
        )
        stability_label = calibration.stability_label
        stability_score = calibration.stability_score
        if stability_label == "Manual Review Recommended":
            manual_review_count += 1

        # Step 5: Context verification (false-positive prevention)
        verification = verify_clause_context(
            clause_text=clause_text,
            classified_risk=risk_level,
            contract_type=contract_type,
            confidence=confidence,
        )
        verified_risk = verification.verified_risk
        was_downgraded = verification.was_downgraded
        if was_downgraded:
            risk_level = verified_risk
            verification_downgrades += 1

        # Step 7: Severity analysis (5 dimensions)
        kb_entry = None
        severity_tags = None
        if kb_id:
            from knowledge_base import KNOWLEDGE_BASE
            for entry in KNOWLEDGE_BASE:
                if entry["id"] == kb_id:
                    kb_entry = entry
                    severity_tags = entry.get("severity_tags")
                    break

        severity = analyze_severity(
            clause_text=clause_text,
            risk_level=risk_level,
            matched_kb_id=kb_id,
            contract_type=contract_type,
            severity_tags=severity_tags,
        )
        severity_breakdowns.append(severity)

        # Step 10: Generate explanation + risk factors
        explanation = generate_explanation(clause_text, kb_id, risk_level)
        risk_factors = generate_risk_factors(
            clause_text=clause_text,
            individual_scores=individual_scores,
            matched_kb_id=kb_id,
            verification_result=verification.to_dict() if was_downgraded else None,
        )

        classified.append(ClauseResult(
            id=f"c{i+1}_{uuid.uuid4().hex[:6]}",
            text=clause_text,
            risk_level=risk_level,
            confidence=round(confidence, 3),
            explanation=explanation,
            matched_kb_id=kb_id,
            severity=severity.to_dict(),
            risk_factors=risk_factors,
            ensemble_scores=individual_scores,
            confidence_stability=stability_label,
            stability_score=round(stability_score, 3),
            context_verified=was_downgraded,
            verification_note=verification.verification_reason if was_downgraded else None,
        ))

    # ── Step 6: Rule engine (cross-clause) ────────────────────────────────
    raw_clauses_for_rules = [c.text for c in classified]
    rule_results = evaluate_rules(raw_clauses_for_rules, contract_type)

    # Enrich clause risk factors with applicable rule results
    for rule in rule_results:
        for clause_idx in rule.matched_clauses:
            if clause_idx < len(classified):
                clause = classified[clause_idx]
                if clause.risk_factors is None:
                    clause.risk_factors = []
                clause.risk_factors.append({
                    "source": "Rule Engine",
                    "reason": f"Rule '{rule.rule_name}': {rule.explanation}",
                    "evidence": rule.rule_id,
                    "confidence": 0.90,
                })

    rule_alerts = [
        RuleAlert(
            rule_id=r.rule_id,
            rule_name=r.rule_name,
            severity=r.severity,
            matched_clauses=r.matched_clauses,
            explanation=r.explanation,
            risk_tags=r.risk_tags,
        )
        for r in rule_results
    ]

    # ── Step 8: Detect trap chains (graph-based) ──────────────────────────
    raw_clauses_for_trap = [c.text for c in classified]
    trap_chain_dicts = detect_trap_chains(raw_clauses_for_trap, contract_type)
    trap_chains = [TrapChainResult(**t) for t in trap_chain_dicts]

    # ── Step 8b: RISK ESCALATION — eliminate contradictions ───────────────
    #   If a clause is caught inside a trap chain or rule engine alert but
    #   is individually classified as "safe", escalate it to at least
    #   "warning" so the user never sees green badges inside danger sections.
    escalated_indices = set()

    # Collect clause indices caught in trap chains
    for tc in trap_chain_dicts:
        for idx in tc.get("matched_clauses", []):
            escalated_indices.add(idx)

    # Collect clause indices caught in rule engine alerts
    for rule in rule_results:
        for idx in rule.matched_clauses:
            escalated_indices.add(idx)

    # Escalate and re-sync severity + explanation
    for idx in escalated_indices:
        if idx < len(classified):
            clause = classified[idx]
            if clause.risk_level == "safe":
                clause.risk_level = "warning"
                # Re-run severity with the corrected risk level
                new_severity = analyze_severity(
                    clause_text=clause.text,
                    risk_level="warning",
                    matched_kb_id=clause.matched_kb_id,
                    contract_type=contract_type,
                )
                clause.severity = new_severity.to_dict()
                severity_breakdowns[idx] = new_severity
                # Re-generate explanation with the corrected risk level
                clause.explanation = generate_explanation(
                    clause.text, clause.matched_kb_id, "warning"
                )

    # ── Step 9: Compute overall risk score ────────────────────────────────
    clause_dicts = [{"risk": c.risk_level, "confidence": c.confidence} for c in classified]
    rule_dicts = [
        {"severity": r.severity, "rule_id": r.rule_id}
        for r in rule_results
    ]
    score_result = compute_risk_score(
        results=clause_dicts,
        rule_engine_results=rule_dicts,
        trap_chains=trap_chain_dicts,
        contract_type=contract_type,
        verification_downgrades=verification_downgrades,
    )

    high_risk = sum(1 for c in classified if c.risk_level == "high-risk")
    warning   = sum(1 for c in classified if c.risk_level == "warning")
    safe      = sum(1 for c in classified if c.risk_level == "safe")

    # Aggregate severity across all clauses
    severity_summary = aggregate_severity(severity_breakdowns)

    # ── Step 11: Generate Mistral AI Executive Summary ────────────────────
    contract_summary = _generate_mistral_summary(
        raw_text[:4000],  # first 4000 chars to keep within token limits
        score_result["risk_label"],
        score_result["overall_score"],
        high_risk,
        warning,
        safe,
        contract_type,
    )

    return AnalysisResponse(
        filename=filename,
        overall_score=score_result["overall_score"],
        risk_label=score_result["risk_label"],
        risk_colour=score_result["risk_colour"],
        total_clauses=len(classified),
        high_risk_count=high_risk,
        warning_count=warning,
        safe_count=safe,
        trap_chains=trap_chains,
        clauses=classified,
        # New Decision Intelligence Layer fields
        contract_type=contract_type,
        contract_type_confidence=round(type_confidence, 3),
        severity_summary=severity_summary,
        rule_engine_alerts=rule_alerts,
        ensemble_method="weighted_vote",
        score_breakdown=score_result,
        manual_review_clauses=manual_review_count,
        contract_summary=contract_summary,
        type_scores=type_scores,
    )

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "LegalEase AI — Hybrid Legal Intelligence Engine v2.0.0",
        "decision_intelligence": {
            "rule_engine": True,
            "trap_chain_v2": True,
            "confidence_calibration": True,
            "context_verification": True,
            "severity_prediction": True,
            "ensemble_classification": True,
        },
    }


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_file(file: UploadFile = File(...)):
    """Upload a contract file (PDF / DOCX / TXT / image) and receive full analysis."""
    allowed = {"pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"}
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


# ── Chat endpoint (Mistral — General Legal Assistant) ─────────────────────────

class GeneralChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class GeneralChatRequest(BaseModel):
    history: List[GeneralChatMessage]  # previous turns
    message: str                        # new user message

class GeneralChatResponse(BaseModel):
    reply: str
    error: Optional[str] = None


@app.post("/api/chat", response_model=GeneralChatResponse)
def general_legal_chat(body: GeneralChatRequest):
    """
    General legal opinion chatbot powered by Mistral AI.
    This is NOT for contract analysis — it answers general legal questions.
    """
    api_key = os.getenv("MISTRAL_API_KEY", "").strip()
    if not api_key:
        return GeneralChatResponse(
            reply="The Mistral API key is not configured. Please add MISTRAL_API_KEY to your .env file.",
            error="no_api_key"
        )

    try:
        import urllib.request
        import json as json_lib

        system_prompt = (
            "You are LegalEase AI, a helpful legal knowledge assistant. "
            "You provide general legal opinions, explain legal concepts in simple English, "
            "and help users understand common contract terms and risks. "
            "IMPORTANT: You are NOT analyzing any specific contract. You are a general legal advisor. "
            "Always include a disclaimer that your advice is for educational purposes only "
            "and users should consult a licensed attorney for specific legal matters. "
            "Keep responses concise (3-5 sentences max), friendly, and easy to understand."
        )

        model_name = os.getenv("MISTRAL_MODEL", "").strip() or "mistral-small-latest"

        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]
        for msg in body.history:
            role = msg.role if msg.role in ("user", "assistant") else "user"
            messages.append({"role": role, "content": msg.content})
        messages.append({"role": "user", "content": body.message})

        # Direct HTTP request to Mistral API (no SDK needed)
        payload = json_lib.dumps({
            "model": model_name,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 500,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.mistral.ai/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json_lib.loads(resp.read().decode("utf-8"))

        reply = result["choices"][0]["message"]["content"].strip()
        if not reply:
            reply = "Sorry — I didn't get a response back. Please try again."
        return GeneralChatResponse(reply=reply)

    except urllib.error.HTTPError as he:
        error_body = he.read().decode("utf-8", errors="replace")
        print(f"[LegalEase] ❌ Mistral HTTP {he.code}: {error_body[:300]}")
        if he.code == 401:
            return GeneralChatResponse(
                reply="Mistral API key is invalid. Please check your MISTRAL_API_KEY in the .env file.",
                error=f"HTTP 401: {error_body[:200]}",
            )
        if he.code == 429:
            return GeneralChatResponse(
                reply="Mistral rate limit exceeded. Please wait a moment and try again.",
                error=f"HTTP 429: {error_body[:200]}",
            )
        return GeneralChatResponse(
            reply=f"Mistral API error ({he.code}). Please try again.",
            error=f"HTTP {he.code}: {error_body[:200]}",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[LegalEase] ❌ Chat error: {e}")
        return GeneralChatResponse(
            reply=f"Sorry, I couldn't process that question. Error: {str(e)[:200]}",
            error=str(e),
        )


# ── Run directly ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

