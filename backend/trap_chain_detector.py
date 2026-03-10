"""
trap_chain_detector.py — Detects combinations of risky clauses that form "traps".

A 'trap chain' occurs when multiple clauses individually appear manageable
but together create a hidden, compounded risk (e.g., auto-renewal + high
cancellation fee + no termination-for-convenience clause).
"""

from __future__ import annotations
import re
from typing import List, Dict, Any

from knowledge_base import TRAP_CHAINS


def _clause_text_matches_keywords(clause_text: str, keywords: List[str]) -> bool:
    """Return True if any keyword is found in the clause text."""
    lower = clause_text.lower()
    return any(re.search(kw.lower(), lower) for kw in keywords)


def detect_trap_chains(clauses: List[str]) -> List[Dict[str, Any]]:
    """
    Scans all clauses for defined trap chain patterns.

    Args:
        clauses: List of raw clause strings from the contract.

    Returns:
        List of detected trap chain dicts with name and description.
    """
    detected = []

    for chain in TRAP_CHAINS:
        keywords = chain["keywords"]
        # Count how many keywords from this chain appear across all clauses
        matched_keywords = []
        for kw in keywords:
            for clause in clauses:
                if re.search(kw.lower(), clause.lower()):
                    matched_keywords.append(kw)
                    break  # Only count each keyword once

        # Trigger the trap if ≥2 of the keywords are found across the contract
        if len(matched_keywords) >= 2:
            detected.append({
                "name": chain["name"],
                "description": chain["description"],
                "matched_keywords": matched_keywords,
            })

    return detected
