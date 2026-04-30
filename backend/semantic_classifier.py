"""
semantic_classifier.py - M2: Sentence-BERT semantic similarity classifier.
"""

from __future__ import annotations
from typing import Optional, Tuple

from knowledge_base import KNOWLEDGE_BASE

# -- Similarity threshold --
_THRESHOLD = 0.45


# -- Lazy-load the model and KB embeddings --

_model      = None   # SentenceTransformer instance
_kb_texts   = None   # list[str]
_kb_risks   = None   # list[str]
_kb_ids     = None   # list[str]
_kb_embeds  = None   # np.ndarray of shape (len(KB), 384)


def _load() -> bool:
    """
    Load sentence-transformers and encode the knowledge base.
    """
    global _model, _kb_texts, _kb_risks, _kb_ids, _kb_embeds

    if _model is not None:
        return True

    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np

        print("[LegalEase] [INFO] Loading Legal-BERT (nlpaueb/legal-bert-base-uncased)...")
        _model = SentenceTransformer("nlpaueb/legal-bert-base-uncased")

        _kb_texts  = [entry["text"] for entry in KNOWLEDGE_BASE]
        _kb_risks  = [entry["risk"] for entry in KNOWLEDGE_BASE]
        _kb_ids    = [entry["id"]   for entry in KNOWLEDGE_BASE]

        _kb_embeds = _model.encode(
            _kb_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        print(f"[LegalEase] [SUCCESS] Sentence-BERT ready - {len(_kb_texts)} KB entries encoded.")
        return True

    except ImportError:
        print(
            "[LegalEase] [INFO] sentence-transformers not installed. "
            "M2 Sentence-BERT classifier disabled."
        )
        return False
    except Exception as exc:
        # We print the error but avoid non-ASCII characters in the message
        print(f"[LegalEase] [ERROR] Sentence-BERT load failed. M2 disabled.")
        return False


def is_sbert_available() -> bool:
    return _load()


def sbert_classify(clause_text: str) -> Tuple[str, float, Optional[str]]:
    if not _load():
        return "safe", 0.0, None

    import numpy as np

    clause_embed = _model.encode(
        clause_text,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    similarities = _kb_embeds @ clause_embed
    top_idx      = int(np.argmax(similarities))
    top_score    = float(similarities[top_idx])

    if top_score >= _THRESHOLD:
        return _kb_risks[top_idx], top_score, _kb_ids[top_idx]

    return "safe", top_score, None
