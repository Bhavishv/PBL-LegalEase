"""
risk_classifier.py — RAG-based clause risk classifier.

Uses TF-IDF cosine similarity (pure Python/sklearn) to compare an
incoming clause against the knowledge base — no GPU required.
Falls back gracefully if sklearn is unavailable.

Risk levels returned: "safe" | "warning" | "high-risk"
"""

from __future__ import annotations
import re
from typing import Tuple

from knowledge_base import KNOWLEDGE_BASE


# ── Build an in-memory TF-IDF index at import time ─────────────────────────

def _build_index():
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


_vectorizer, _tfidf_matrix, _cosine_similarity, _np = _build_index()


# ── Keyword heuristics (fallback if sklearn not available) ──────────────────

_HIGH_RISK_KEYWORDS = [
    "automatically renew", "auto-renew", "auto renew",
    "cancellation fee", "early termination fee",
    "indemnify", "hold harmless", "indemnification",
    "no liability", "limitation of liability", "not liable",
    "waives all rights", "class action", "arbitration only",
    "share.*personal data", "collect.*personal information",
    "without restriction", "any purpose",
]

_WARNING_KEYWORDS = [
    "30 day notice", "60 day notice", "90 day notice",
    "interest.*per month", "late fee", "late payment",
    "subcontract", "assign.*without consent",
    "modify.*terms", "change.*terms", "amend.*unilaterally",
    "binding arbitration",
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


# ── Main classifier ─────────────────────────────────────────────────────────

def classify_clause(clause_text: str) -> Tuple[str, float, str]:
    """
    Classifies a clause using RAG similarity + keyword heuristics.

    Returns:
        (risk_level, confidence_score, matched_knowledge_id)
        risk_level: "safe" | "warning" | "high-risk"
        confidence_score: 0.0 – 1.0
        matched_knowledge_id: ID of closest knowledge base entry
    """
    if _vectorizer is not None:
        # TF-IDF cosine similarity
        query_vec = _vectorizer.transform([clause_text])
        scores = _cosine_similarity(query_vec, _tfidf_matrix)[0]
        top_idx = int(_np.argmax(scores))
        top_score = float(scores[top_idx])

        if top_score >= 0.15:   # meaningful match
            matched = KNOWLEDGE_BASE[top_idx]
            return matched["risk"], top_score, matched["id"]

    # Fallback: keyword heuristics
    risk, confidence = _keyword_classify(clause_text)
    return risk, confidence, "heuristic"
