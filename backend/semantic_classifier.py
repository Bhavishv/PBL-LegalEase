"""
semantic_classifier.py — M2: Sentence-BERT semantic similarity classifier.

Uses the lightweight 'all-MiniLM-L6-v2' pre-trained model (≈80 MB) from
sentence-transformers to encode contract clauses into dense vector embeddings
and compare them against the LegalEase knowledge base.

Why M2 on top of M1 (CUAD TF-IDF+LR)?
  - TF-IDF is sensitive to exact word overlap; semantically equivalent
    clauses phrased differently can fool it.
  - Sentence-BERT captures *meaning*, so "All disagreements shall be
    handled through private arbitration" still matches the KB entry for
    binding arbitration even though the words differ.

Classification pipeline position:
  Priority 1 → M1  CUAD TF-IDF + LR  (if model file present)
  Priority 2 → M2  Sentence-BERT     (THIS MODULE)
  Priority 3 → M3  TF-IDF KB cosine  (always available)
  Priority 4 → Keyword heuristics    (zero-dependency fallback)

Returns:
  (risk_level, confidence, matched_kb_id)
  risk_level ∈ {"safe", "warning", "high-risk"}
  confidence  0.0–1.0  (cosine similarity score)
  matched_kb_id: e.g. "risk_01", "warn_03", or None on failure
"""

from __future__ import annotations
from typing import Optional, Tuple

from knowledge_base import KNOWLEDGE_BASE

# ── Similarity threshold ──────────────────────────────────────────────────────
# SBERT embeddings are denser than TF-IDF; 0.45 balances precision vs recall.
_THRESHOLD = 0.45


# ── Lazy-load the model and KB embeddings ────────────────────────────────────

_model      = None   # SentenceTransformer instance
_kb_texts   = None   # list[str]  – plain text of each KB entry
_kb_risks   = None   # list[str]  – "safe" | "warning" | "high-risk"
_kb_ids     = None   # list[str]  – entry id (e.g. "risk_01")
_kb_embeds  = None   # np.ndarray of shape (len(KB), 384)


def _load() -> bool:
    """
    Load sentence-transformers and encode the knowledge base.
    Returns True on success, False if the library is not installed.
    Called automatically on first use.
    """
    global _model, _kb_texts, _kb_risks, _kb_ids, _kb_embeds

    if _model is not None:
        return True  # already loaded

    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np

        print("[LegalEase] ⏳ Loading Sentence-BERT (all-MiniLM-L6-v2)…")
        _model = SentenceTransformer("all-MiniLM-L6-v2")

        _kb_texts  = [entry["text"] for entry in KNOWLEDGE_BASE]
        _kb_risks  = [entry["risk"] for entry in KNOWLEDGE_BASE]
        _kb_ids    = [entry["id"]   for entry in KNOWLEDGE_BASE]

        _kb_embeds = _model.encode(
            _kb_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,  # unit vectors → dot product == cosine sim
            show_progress_bar=False,
        )

        print(f"[LegalEase] ✅ Sentence-BERT ready — {len(_kb_texts)} KB entries encoded.")
        return True

    except ImportError:
        print(
            "[LegalEase] ℹ️  sentence-transformers not installed. "
            "M2 Sentence-BERT classifier disabled. "
            "Run: pip install sentence-transformers"
        )
        return False
    except Exception as exc:
        print(f"[LegalEase] ⚠️  Sentence-BERT load failed ({exc}). M2 disabled.")
        return False


def is_sbert_available() -> bool:
    """Returns True if the Sentence-BERT model loaded successfully."""
    return _load()


def sbert_classify(clause_text: str) -> Tuple[str, float, Optional[str]]:
    """
    Classify a contract clause using Sentence-BERT semantic similarity.

    Args:
        clause_text: Raw text of the clause to evaluate.

    Returns:
        (risk_level, confidence, matched_kb_id)
        risk_level    : "safe" | "warning" | "high-risk"
        confidence    : cosine similarity score (0.0–1.0)
        matched_kb_id : knowledge-base entry id, or None if below threshold
    """
    if not _load():
        # Library not available — fall through to next tier
        return "safe", 0.0, None

    import numpy as np

    # Encode the clause (unit vector so dot == cosine)
    clause_embed = _model.encode(
        clause_text,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    # Cosine similarity against all KB entries
    similarities = _kb_embeds @ clause_embed          # shape (N,)
    top_idx      = int(np.argmax(similarities))
    top_score    = float(similarities[top_idx])

    if top_score >= _THRESHOLD:
        return _kb_risks[top_idx], top_score, _kb_ids[top_idx]

    # Below threshold — return a no-match signal so the caller can fall through
    return "safe", top_score, None
