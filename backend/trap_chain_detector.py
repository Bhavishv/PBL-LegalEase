"""
trap_chain_detector.py — Detects combinations of risky clauses that form "traps".
Synchronized with AnalysisResponse API model.
"""

from __future__ import annotations
import re
import uuid
from typing import List, Dict, Any

from knowledge_base import TRAP_CHAINS


def detect_trap_chains(clauses: List[str]) -> List[Dict[str, Any]]:
    """
    Scans all clauses for defined trap chain patterns.

    Args:
        clauses: List of raw clause strings from the contract.

    Returns:
        List of detected trap chain dicts matching TrapChainResult model.
    """
    detected = []

    for chain in TRAP_CHAINS:
        keywords = chain["keywords"]
        matched_indices = []
        
        # Identify which clauses contain the keywords for this trap
        for i, clause in enumerate(clauses):
            lower_clause = clause.lower()
            for kw in keywords:
                if re.search(kw.lower(), lower_clause):
                    if i not in matched_indices:
                        matched_indices.append(i)
                    break 

        # Trigger the trap if ≥2 different keywords/clauses are involved
        if len(matched_indices) >= 2:
            # We map the KB fields to the API model fields
            detected.append({
                "id": f"trap_{uuid.uuid4().hex[:6]}",
                "type": chain["name"],
                "involved_indices": matched_indices,
                "reason": chain["description"],
                "remedy": chain.get("remedy", "Negotiate these clauses together to ensure they don't form a compounded risk.")
            })

    return detected
