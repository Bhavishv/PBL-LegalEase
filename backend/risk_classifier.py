"""
risk_classifier.py — Hybrid Ensemble Risk Classifier for LegalEase.

UPGRADED: Instead of a linear priority fallthrough (CUAD → SBERT → TF-IDF → keywords),
this module now runs ALL available classifiers and combines their outputs using
a weighted ensemble vote. Individual model scores are preserved for explainability.

Classification pipeline:
  M1. CUAD-trained ML model  (TF-IDF + Logistic Regression on 510 real contracts)
  M2. Sentence-BERT semantic similarity against knowledge base
  M3. TF-IDF cosine-similarity against knowledge base
  M4. Keyword heuristics (pure Python, always available)
  →  Ensemble weighted vote → Final risk level + individual scores

The individual scores feed into:
  - Confidence Calibrator (for prediction stability)
  - Explainable AI Engine (for risk factor attribution)
  - Context Verifier (for false-positive prevention)

Risk levels returned: "safe" | "warning" | "high-risk"
"""

from __future__ import annotations
import re
from pathlib import Path
from typing import Tuple, Optional, Dict, Any

from knowledge_base import KNOWLEDGE_BASE
from semantic_classifier import sbert_classify, is_sbert_available
from legal_preprocessor import clean_clause_for_classification

# ── Paths ─────────────────────────────────────────────────────────────────────
_BACKEND_DIR  = Path(__file__).parent
_MODEL_PATH   = _BACKEND_DIR / "models" / "cuad_classifier.joblib"
_ENCODER_PATH = _BACKEND_DIR / "models" / "label_encoder.joblib"


# ══════════════════════════════════════════════════════════════════════════════
# 1. CUAD-TRAINED MODEL (M1)
# ══════════════════════════════════════════════════════════════════════════════

def _load_cuad_model():
    """
    Try to load the CUAD-trained sklearn pipeline and label encoder.
    Returns (pipeline, label_encoder) or (None, None) if not available.
    """
    if not (_MODEL_PATH.exists() and _ENCODER_PATH.exists()):
        return None, None
    try:
        import joblib
        clf = joblib.load(_MODEL_PATH)
        le  = joblib.load(_ENCODER_PATH)
        print(f"[LegalEase] ✅ CUAD model loaded from {_MODEL_PATH}")
        return clf, le
    except Exception as exc:
        print(f"[LegalEase] ⚠️  Could not load CUAD model ({exc}). Falling back.")
        return None, None


_cuad_clf, _cuad_le = _load_cuad_model()


def _cuad_classify(clause_text: str) -> Tuple[str, float]:
    """Classify using the CUAD-trained Logistic Regression model."""
    proba = _cuad_clf.predict_proba([clause_text])[0]
    top_idx = int(proba.argmax())
    risk = _cuad_le.inverse_transform([top_idx])[0]
    confidence = float(proba[top_idx])
    return risk, confidence


# ══════════════════════════════════════════════════════════════════════════════
# 2. TF-IDF + KNOWLEDGE BASE (M3)
# ══════════════════════════════════════════════════════════════════════════════

def _build_kb_index():
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        corpus = [entry["text"] for entry in KNOWLEDGE_BASE]
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(corpus)
        return vectorizer, tfidf_matrix, cosine_similarity, np
    except ImportError:
        return None, None, None, None


_vectorizer, _tfidf_matrix, _cosine_similarity, _np = _build_kb_index()


def _kb_classify(clause_text: str) -> Tuple[str, float, Optional[str]]:
    """Classify via TF-IDF cosine similarity against the knowledge base."""
    if _vectorizer is None:
        return "safe", 0.0, None

    query_vec = _vectorizer.transform([clause_text])
    scores = _cosine_similarity(query_vec, _tfidf_matrix)[0]
    top_idx = int(_np.argmax(scores))
    top_score = float(scores[top_idx])

    if top_score >= 0.15:
        matched = KNOWLEDGE_BASE[top_idx]
        return matched["risk"], top_score, matched["id"]

    return "safe", top_score, None


# ══════════════════════════════════════════════════════════════════════════════
# 3. KEYWORD HEURISTICS (M4)
# ══════════════════════════════════════════════════════════════════════════════

_HIGH_RISK_KEYWORDS = [
    "automatically renew", "auto-renew", "auto renew",
    "cancellation fee", "early termination fee",
    "indemnify", "hold harmless", "indemnification",
    "no liability", "limitation of liability", "not liable",
    "waives all rights", "class action", "arbitration only",
    "share.*personal data", "collect.*personal information",
    "without restriction", "any purpose",
    "non-compete", "irrevocable", "perpetual license",
    "liquidated damages", "non-disparagement",
]

_WARNING_KEYWORDS = [
    "30 day notice", "60 day notice", "90 day notice",
    "interest.*per month", "late fee", "late payment",
    "subcontract", "assign.*without consent",
    "modify.*terms", "change.*terms", "amend.*unilaterally",
    "binding arbitration", "cap on liability",
    "exclusivity", "minimum commitment", "anti-assignment",
    "change of control",
]


def _keyword_classify(text: str) -> Tuple[str, float]:
    lower = text.lower()
    for kw in _HIGH_RISK_KEYWORDS:
        if re.search(kw, lower):
            return "high-risk", 0.80
    for kw in _WARNING_KEYWORDS:
        if re.search(kw, lower):
            return "warning", 0.65
    return "safe", 0.55


# ══════════════════════════════════════════════════════════════════════════════
# ENSEMBLE WEIGHTS (adjustable per contract type)
# ══════════════════════════════════════════════════════════════════════════════

_RISK_VALUE = {"safe": 0.0, "warning": 0.5, "high-risk": 1.0}
_VALUE_TO_RISK = [(0.0, 0.3, "safe"), (0.3, 0.6, "warning"), (0.6, 1.01, "high-risk")]

_DEFAULT_WEIGHTS = {
    "cuad": 0.25,
    "sbert": 0.20,
    "tfidf": 0.15,
    "keyword": 0.10,
}


def _ensemble_vote(
    predictions: Dict[str, Tuple[str, float]],
) -> Tuple[str, float]:
    """
    Smart Ensemble Meta-Classifier.

    Instead of a naive weighted average, uses deterministic trust rules:
      Rule 1: If ANY model finds a high-confidence (>85%) exact KB match,
              trust that model's risk level directly.
      Rule 2: If Keyword flags danger but SBERT says safe with HIGH confidence,
              trust SBERT (keyword was used out of context).
      Rule 3: If models split 50/50 (e.g. 2 say safe, 2 say high-risk),
              always escalate to the more dangerous prediction (safety-first).
      Rule 4: Fallback to weighted average only when no clear winner.
    """
    if not predictions:
        return "safe", 0.0

    # ── Rule 1: High-confidence exact match override ──────────────────────
    # If TF-IDF or SBERT found a KB match with >85% confidence, trust it.
    for model in ["tfidf", "sbert"]:
        if model in predictions:
            risk, conf = predictions[model]
            if conf >= 0.85 and risk != "safe":
                return risk, conf

    # If CUAD is very confident (>90%), trust it
    if "cuad" in predictions:
        risk, conf = predictions["cuad"]
        if conf >= 0.90:
            return risk, conf

    # ── Rule 2: Keyword vs SBERT conflict resolution ─────────────────────
    # Keywords are prone to false positives. If SBERT confidently says safe
    # but keyword says danger, trust SBERT.
    if "keyword" in predictions and "sbert" in predictions:
        kw_risk, kw_conf = predictions["keyword"]
        sb_risk, sb_conf = predictions["sbert"]
        if kw_risk in ("high-risk", "warning") and sb_risk == "safe" and sb_conf >= 0.60:
            # SBERT understands semantics — keyword was out of context
            predictions = {k: v for k, v in predictions.items() if k != "keyword"}

    # ── Rule 3: Safety-first majority vote ────────────────────────────────
    # Count votes per risk level
    votes = {"safe": 0, "warning": 0, "high-risk": 0}
    max_conf_per_level = {"safe": 0.0, "warning": 0.0, "high-risk": 0.0}
    for model_name, (risk, conf) in predictions.items():
        votes[risk] = votes.get(risk, 0) + 1
        max_conf_per_level[risk] = max(max_conf_per_level.get(risk, 0.0), conf)

    # If any model says high-risk AND has decent confidence, escalate
    if votes.get("high-risk", 0) >= 1 and max_conf_per_level["high-risk"] >= 0.50:
        return "high-risk", max_conf_per_level["high-risk"]

    # If majority says warning or higher
    if votes.get("warning", 0) + votes.get("high-risk", 0) >= len(predictions) / 2:
        best_risk = "high-risk" if votes.get("high-risk", 0) > 0 else "warning"
        return best_risk, max_conf_per_level[best_risk]

    # ── Rule 4: Weighted average fallback ─────────────────────────────────
    total_weight = 0.0
    weighted_risk = 0.0
    for model_name, (risk_level, confidence) in predictions.items():
        weight = _DEFAULT_WEIGHTS.get(model_name, 0.10)
        risk_val = _RISK_VALUE.get(risk_level, 0.0)
        weighted_risk += weight * confidence * risk_val
        total_weight += weight * confidence

    if total_weight == 0:
        return "safe", 0.0

    avg_risk = weighted_risk / total_weight

    for low, high, label in _VALUE_TO_RISK:
        if low <= avg_risk < high:
            return label, min(1.0, total_weight)

    return "safe", 0.0


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def classify_clause(clause_text: str) -> Tuple[str, float, str]:
    """
    Classify a contract clause using the hybrid ensemble.

    Returns:
        (risk_level, confidence, source_id)
        risk_level : "safe" | "warning" | "high-risk"
        confidence : 0.0–1.0  (ensemble confidence)
        source_id  : matched KB entry id or "ensemble"
    """
    result = classify_clause_ensemble(clause_text)
    return result["risk_level"], result["confidence"], result.get("matched_kb_id", "ensemble")


def classify_clause_ensemble(clause_text: str) -> Dict[str, Any]:
    """
    Run ALL classifiers and return the ensemble result with individual scores.

    Returns a dict with:
      - risk_level: final ensemble decision
      - confidence: ensemble confidence
      - matched_kb_id: KB match ID (if any)
      - individual_scores: {model_name: {risk, confidence}} for each model
      - model_predictions: {model_name: (risk, confidence)} for calibrator
    """
    predictions: Dict[str, Tuple[str, float]] = {}
    individual_scores: Dict[str, Dict] = {}
    matched_kb_id: Optional[str] = None

    # ── STEP 0: Legal noise reduction ─────────────────────────────────────
    # Clean the clause for classification only (original text preserved)
    cleaned_text = clean_clause_for_classification(clause_text)

    # M1 — CUAD model (uses cleaned text for better accuracy)
    if _cuad_clf is not None:
        try:
            risk, conf = _cuad_classify(cleaned_text)
            predictions["cuad"] = (risk, conf)
            individual_scores["cuad"] = {"risk": risk, "confidence": round(conf, 3)}
        except Exception:
            pass

    # M2 — Sentence-BERT (uses cleaned text for better accuracy)
    if is_sbert_available():
        try:
            risk, conf, kb_id = sbert_classify(cleaned_text)
            if kb_id is not None:
                matched_kb_id = kb_id
            predictions["sbert"] = (risk, conf)
            individual_scores["sbert"] = {"risk": risk, "confidence": round(conf, 3)}
        except Exception:
            pass

    # M3 — TF-IDF KB (uses cleaned text for better accuracy)
    try:
        risk, conf, kb_id = _kb_classify(cleaned_text)
        if kb_id and matched_kb_id is None:
            matched_kb_id = kb_id
        predictions["tfidf"] = (risk, conf)
        individual_scores["tfidf"] = {"risk": risk, "confidence": round(conf, 3)}
    except Exception:
        pass

    # M4 — Keywords (uses ORIGINAL text — keywords need exact phrases)
    risk, conf = _keyword_classify(clause_text)
    predictions["keyword"] = (risk, conf)
    individual_scores["keyword"] = {"risk": risk, "confidence": round(conf, 3)}

    # Ensemble vote
    if len(predictions) >= 2:
        final_risk, final_conf = _ensemble_vote(predictions)
    else:
        # Only one model available — use its result directly
        model_name = next(iter(predictions))
        final_risk, final_conf = predictions[model_name]

    return {
        "risk_level": final_risk,
        "confidence": round(final_conf, 3),
        "matched_kb_id": matched_kb_id,
        "individual_scores": individual_scores,
        "model_predictions": predictions,  # raw tuples for calibrator
    }


def is_cuad_model_loaded() -> bool:
    """Returns True if the CUAD-trained M1 model is active."""
    return _cuad_clf is not None


def is_sbert_model_loaded() -> bool:
    """Returns True if the Sentence-BERT M2 model is available."""
    return is_sbert_available()
