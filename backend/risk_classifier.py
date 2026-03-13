"""
risk_classifier.py — Clause risk classifier for LegalEase.

Classification priority:
  1. CUAD-trained ML model  (TF-IDF + Logistic Regression on 510 real contracts)
     → loaded from  models/cuad_classifier.joblib  if present
  2. TF-IDF cosine-similarity against the hand-written knowledge base
     → built at import time from knowledge_base.py
  3. Keyword heuristics (pure Python, always available as final fallback)

Risk levels returned: "safe" | "warning" | "high-risk"
"""

from __future__ import annotations
import re
from pathlib import Path
from typing import Tuple

from knowledge_base import KNOWLEDGE_BASE

# ── Paths ─────────────────────────────────────────────────────────────────────
_BACKEND_DIR  = Path(__file__).parent
_MODEL_PATH   = _BACKEND_DIR / "models" / "cuad_classifier.joblib"
_ENCODER_PATH = _BACKEND_DIR / "models" / "label_encoder.joblib"


# ══════════════════════════════════════════════════════════════════════════════
# 1. CUAD-TRAINED MODEL (primary)
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
        print(f"[LegalEase] ⚠️  Could not load CUAD model ({exc}). Falling back to TF-IDF KB.")
        return None, None


_cuad_clf, _cuad_le = _load_cuad_model()


def _cuad_classify(clause_text: str) -> Tuple[str, float, str]:
    """Classify using the CUAD-trained Logistic Regression model."""
    proba = _cuad_clf.predict_proba([clause_text])[0]
    top_idx = int(proba.argmax())
    risk = _cuad_le.inverse_transform([top_idx])[0]
    confidence = float(proba[top_idx])
    return risk, confidence, "cuad_model"


# ══════════════════════════════════════════════════════════════════════════════
# 2. TF-IDF + KNOWLEDGE BASE (secondary fallback)
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


def _kb_classify(clause_text: str) -> Tuple[str, float, str]:
    """Classify via TF-IDF cosine similarity against the knowledge base."""
    if _vectorizer is None:
        return _keyword_classify(clause_text) + ("heuristic",)

    query_vec = _vectorizer.transform([clause_text])
    scores = _cosine_similarity(query_vec, _tfidf_matrix)[0]
    top_idx = int(_np.argmax(scores))
    top_score = float(scores[top_idx])

    if top_score >= 0.15:   # meaningful match
        matched = KNOWLEDGE_BASE[top_idx]
        return matched["risk"], top_score, matched["id"]

    # No close match → fall through to keywords
    risk, confidence = _keyword_classify(clause_text)
    return risk, confidence, "heuristic"


# ══════════════════════════════════════════════════════════════════════════════
# 3. KEYWORD HEURISTICS (tertiary fallback — zero dependencies)
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
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def classify_clause(clause_text: str) -> Tuple[str, float, str]:
    """
    Classify a contract clause and return (risk_level, confidence, source_id).

    Args:
        clause_text: Raw text of the clause to classify.

    Returns:
        risk_level     : "safe" | "warning" | "high-risk"
        confidence     : 0.0 – 1.0  (model probability or heuristic estimate)
        source_id      : "cuad_model" | <kb_entry_id> | "heuristic"
    """
    # ── Priority 1: CUAD-trained ML model ────────────────────────────────────
    if _cuad_clf is not None:
        return _cuad_classify(clause_text)

    # ── Priority 2: TF-IDF KB similarity ──────────────────────────────────────
    return _kb_classify(clause_text)


def is_cuad_model_loaded() -> bool:
    """Returns True if the CUAD-trained model is active."""
    return _cuad_clf is not None
