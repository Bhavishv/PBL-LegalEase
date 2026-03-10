"""
clause_segmenter.py — Splits a contract's raw text into individual clauses.

Strategy:
  1. Detect numbered headings (e.g. "1.", "1.1", "Article I", "Section 2").
  2. Fall back to paragraph-level splitting (double newlines).
"""

import re
from typing import List

# Patterns that mark the beginning of a new clause / section
_HEADING_PATTERNS = re.compile(
    r'(?m)^'                                     # start of line
    r'(?:'
    r'(?:ARTICLE|SECTION|CLAUSE)\s+[\dIVXivx]+'  # ARTICLE I / SECTION 3
    r'|'
    r'\d{1,2}\.\d{0,2}\s+[A-Z]'                  # 1.1 Definitions / 2.3 Payment
    r'|'
    r'\d{1,2}\.\s+[A-Z]'                          # 1. Term
    r'|'
    r'[A-Z][A-Z\s\-]{5,}$'                        # ALL CAPS headings
    r')'
)


def segment_clauses(text: str) -> List[str]:
    """
    Returns a list of clause strings extracted from `text`.
    Each element is a self-contained clause block.
    """
    # Find positions where a new clause starts
    splits = [m.start() for m in _HEADING_PATTERNS.finditer(text)]

    if len(splits) > 1:
        clauses = []
        for i, start in enumerate(splits):
            end = splits[i + 1] if i + 1 < len(splits) else len(text)
            block = text[start:end].strip()
            if block:
                clauses.append(block)
        return clauses

    # Fallback: split on double newlines (paragraphs)
    paragraphs = [p.strip() for p in re.split(r'\n{2,}', text) if p.strip()]

    # If still a single blob, split by sentence-ending punctuation
    if len(paragraphs) <= 1:
        sentences = re.split(r'(?<=[.!?])\s{2,}', text)
        paragraphs = [s.strip() for s in sentences if s.strip()]

    return paragraphs
