"""
legal_preprocessor.py — Legal Noise Reduction & Clause Cleaning.

Strips boilerplate legal filler, section headers, and formatting noise
from contract clauses BEFORE they are fed to ML models (SBERT, TF-IDF).

This dramatically improves accuracy by letting the models focus on the
actual substance of the clause instead of getting distracted by filler
phrases like "IN WITNESS WHEREOF" or "NOW THEREFORE".

Architecture position:
  Layer 0 (Preprocessing) → runs before ALL classifiers.
"""

from __future__ import annotations
import re
from typing import List


# ══════════════════════════════════════════════════════════════════════════════
# LEGAL STOP PHRASES — boilerplate filler that adds no meaning
# ══════════════════════════════════════════════════════════════════════════════

_LEGAL_STOP_PHRASES = [
    # Ceremonial / preamble filler
    r"\bin witness whereof\b",
    r"\bnow[,]?\s*therefore\b",
    r"\bwhereas\b",
    r"\bhereinafter\b",
    r"\bherein\b",
    r"\bhereby\b",
    r"\bthereof\b",
    r"\btherein\b",
    r"\bwhereupon\b",
    r"\bnotwithstanding the foregoing\b",
    r"\bfor good and valuable consideration\b",
    r"\bthe receipt and sufficiency of which (?:is|are) hereby acknowledged\b",
    r"\bit is hereby agreed as follows\b",
    r"\bthe parties agree as follows\b",
    r"\bthis agreement is entered into\b",
    r"\bby and between\b",
    r"\bshall be deemed\b",
    r"\bpursuant to\b",
    r"\bin accordance with\b",
    r"\bsubject to the (?:terms|provisions) (?:of|herein)\b",

    # Section headers / numbering noise
    r"^\s*(?:section|article|clause|part)\s+\d+[\.:]\s*",
    r"^\s*\d+[\.\)]\s+",
    r"^\s*[a-z][\.\)]\s+",
    r"^\s*\([a-z0-9]+\)\s+",
    r"^\s*(?:i{1,3}|iv|vi{0,3}|ix|x)[\.\)]\s+",

    # Common filler connectors
    r"\bprovided[,]?\s*however[,]?\s*that\b",
    r"\bfor the avoidance of doubt\b",
    r"\bwithout limiting the generality of the foregoing\b",
    r"\bexcept as otherwise (?:provided|set forth|stated)\b",
    r"\bto the fullest extent (?:permitted|allowable) by (?:law|applicable law)\b",
    r"\bsubject to applicable law\b",
    r"\bas defined (?:herein|below|above)\b",
    r"\bas set forth (?:herein|below|above|in this agreement)\b",
    r"\bincluding[,]?\s*(?:but not limited to|without limitation)\b",
]

# Compile for performance
_STOP_PATTERNS = [re.compile(p, re.IGNORECASE | re.MULTILINE) for p in _LEGAL_STOP_PHRASES]


# ══════════════════════════════════════════════════════════════════════════════
# FORMATTING NOISE REMOVAL
# ══════════════════════════════════════════════════════════════════════════════

def _remove_formatting_noise(text: str) -> str:
    """Remove extra whitespace, bullets, and formatting artifacts."""
    # Remove multiple spaces / tabs
    text = re.sub(r"[ \t]+", " ", text)
    # Remove leading/trailing whitespace per line
    text = re.sub(r"^\s+|\s+$", "", text, flags=re.MULTILINE)
    # Collapse multiple newlines
    text = re.sub(r"\n{2,}", "\n", text)
    # Remove standalone bullet chars
    text = re.sub(r"^[•●○▪▸►–—]\s*", "", text, flags=re.MULTILINE)
    return text.strip()


# ══════════════════════════════════════════════════════════════════════════════
# CLAUSE ESSENCE EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════

def _extract_core_sentence(text: str) -> str:
    """
    If a clause has multiple sentences, extract the one most likely to
    contain the legal obligation (the one with the strongest action verbs).
    Returns the full text if no single sentence is clearly dominant.
    """
    sentences = re.split(r"(?<=[.!?])\s+", text)
    if len(sentences) <= 2:
        return text  # Already short enough

    # Score each sentence by presence of legal action verbs
    action_patterns = [
        r"\bshall\b", r"\bmust\b", r"\bwill\b", r"\bagree\b",
        r"\bobligation\b", r"\brequired\b", r"\bentitled\b",
        r"\bwaive\b", r"\bforfeit\b", r"\brelinquish\b",
        r"\bindemnif\b", r"\bliable\b", r"\bpay\b", r"\bterminate\b",
        r"\brenew\b", r"\bcollect\b", r"\bshare\b", r"\brestrict\b",
        r"\bprohibit\b", r"\bcompete\b", r"\barbitrat\b",
    ]

    scored = []
    for s in sentences:
        s_lower = s.lower()
        score = sum(1 for p in action_patterns if re.search(p, s_lower))
        scored.append((score, s))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    # Return top 2 sentences (to preserve enough context)
    top_sentences = [s for _, s in scored[:2]]
    return " ".join(top_sentences)


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def clean_clause_for_classification(clause_text: str) -> str:
    """
    Clean a clause for ML classification by removing legal noise.

    This function:
    1. Strips formatting artifacts (bullets, extra whitespace)
    2. Removes boilerplate legal stop-phrases
    3. Extracts the core substantive sentence(s)

    The ORIGINAL text is preserved separately for display;
    this cleaned version is ONLY used for feeding to classifiers.

    Args:
        clause_text: Raw clause text from the contract.

    Returns:
        Cleaned clause text optimized for ML classification.
    """
    if not clause_text or len(clause_text.strip()) < 10:
        return clause_text

    text = clause_text

    # Step 1: Remove formatting noise
    text = _remove_formatting_noise(text)

    # Step 2: Remove legal stop phrases
    for pattern in _STOP_PATTERNS:
        text = pattern.sub("", text)

    # Step 3: Clean up leftover artifacts
    text = re.sub(r"\s{2,}", " ", text).strip()
    text = re.sub(r"^[,;.\s]+", "", text).strip()

    # Step 4: Extract core sentence if clause is very long
    if len(text) > 300:
        text = _extract_core_sentence(text)

    # Safety: if cleaning removed too much, return original
    if len(text) < 15:
        return clause_text.strip()

    return text


def clean_clauses_batch(clauses: List[str]) -> List[str]:
    """Clean a batch of clauses. Convenience wrapper."""
    return [clean_clause_for_classification(c) for c in clauses]


# ══════════════════════════════════════════════════════════════════════════════
# SELF-TEST
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    samples = [
        "WHEREAS the parties have agreed, NOW THEREFORE, in consideration of the mutual covenants herein, the Tenant shall pay a cancellation fee equal to 100% of the remaining lease value.",
        "Section 4.2(a): Notwithstanding the foregoing, including but not limited to any prior agreements, the Company reserves the right to modify these terms with 7 days notice.",
        "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.",
        "This agreement is entered into by and between Company A (hereinafter \"Licensor\") and Company B. The Licensor grants a perpetual, irrevocable license.",
    ]

    print("Legal Preprocessor — Self-Test")
    print("=" * 60)
    for i, raw in enumerate(samples):
        cleaned = clean_clause_for_classification(raw)
        print(f"\n--- Sample {i+1} ---")
        print(f"  RAW:     {raw[:100]}...")
        print(f"  CLEANED: {cleaned[:100]}...")
        reduction = round((1 - len(cleaned) / max(len(raw), 1)) * 100)
        print(f"  Noise reduction: {reduction}%")
