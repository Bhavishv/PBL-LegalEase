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
from semantic_classifier import sbert_classify, is_sbert_available

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
        print(f"[LegalEase] CUAD model loaded from {_MODEL_PATH}")
        return clf, le
    except Exception as exc:
        print(f"[LegalEase] Could not load CUAD model ({exc}). Falling back to TF-IDF KB.")
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
        confidence     : 0.0 – 1.0  (model probability or similarity score)
        source_id      : "cuad_model" | "sbert" | <kb_entry_id> | "heuristic"
    """
    # ── Priority 1: M1 — CUAD TF-IDF + Logistic Regression ───────────────────
    ml_risk, ml_conf, ml_source = "safe", 0.0, "none"
    if _cuad_clf is not None:
        ml_risk, ml_conf, ml_source = _cuad_classify(clause_text)

    # ── Priority 2: M2 — Legal-BERT semantic similarity ────────────────────
    bert_risk, bert_conf, bert_id = "safe", 0.0, None
    if is_sbert_available():
        bert_risk, bert_conf, bert_id = sbert_classify(clause_text)

    # ── TIE-BREAKER / GROUND TRUTH LOGIC ──
    # If Legal-BERT and ML agree on high-risk, we are very confident.
    # If they disagree or confidence is low, we prepare a flag for the main pipeline to use AI.
    
    if bert_id:
        return bert_risk, bert_conf, f"legal-bert:{bert_id}"
    
    if ml_conf > 0.7:
        return ml_risk, ml_conf, ml_source

    # Default to ML but with the lower confidence
    return ml_risk, ml_conf, ml_source


def is_cuad_model_loaded() -> bool:
    """Returns True if the CUAD-trained M1 model is active."""
    return _cuad_clf is not None


def is_sbert_model_loaded() -> bool:
    """Returns True if the Sentence-BERT M2 model is available."""
    return is_sbert_available()


def segment_clauses(text: str) -> list[str]:
    """
    Intelligently splits raw contract text into individual clauses.
    Uses regex patterns to identify sections, articles, and numbered lists.
    """
    if not text:
        return []

    # 1. Normalize line endings
    text = text.replace("\r\n", "\n")

    # 2. Identify common legal section markers
    # Pattern 1: "Section X.X" or "Article X" or "Clause X"
    # Pattern 2: Numbered lists like "1. ", "2.1 ", "(a) "
    # Pattern 3: Double newlines (paragraphs)
    
    # We use a combined regex to find split points
    # Look for: Start of line + optional space + (Numbering or Header keyword)
    patterns = [
        r'\n\s*(?:Section|Article|Clause|ITEM|EXHIBIT)\s+\d+', # Section 1, Article 2
        r'\n\s*\d+\.\d+(?:\.\d+)*\s+',                       # 1.1, 2.1.1
        r'\n\s*\d+\.\s+',                                    # 1., 2.
        r'\n\n+',                                            # Paragraph breaks
    ]
    
    combined_pattern = f"(?:{'|'.join(patterns)})"
    
    # Split the text
    segments = re.split(combined_pattern, text, flags=re.IGNORECASE)
    
    # Clean up segments
    clauses = []
    for s in segments:
        clean = s.strip()
        if len(clean) > 20: # Ignore fragments like "Page 1" or headers
            clauses.append(clean)
            
    # If no segments found, return the whole text as one clause
    if not clauses and text.strip():
        return [text.strip()]
        
    return clauses
