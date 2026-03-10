"""
risk_scorer.py — Computes an overall contract risk score (0–100).

Lower score = riskier contract.
Higher score = safer contract.

Scoring weights:
  - Each "high-risk" clause deducts 15 points (cap: 60 pts total deduction)
  - Each "warning" clause deducts  6 points
  - Each "safe" clause adds        1 point (cap: 5 pts total bonus)
  - Each detected trap chain deducts 10 extra points
"""

from __future__ import annotations
from typing import List, Dict, Any, Tuple


_DEDUCT_HIGH_RISK = 15
_DEDUCT_WARNING   = 6
_DEDUCT_TRAP      = 10
_ADD_SAFE         = 1

_RISK_LABEL = {
    (85, 101): ("Safe Contract",    "#22c55e"),   # green
    (60,  85): ("Moderate Risk",    "#f59e0b"),   # amber
    (0,   60): ("High Risk",        "#ef4444"),   # red
}


def compute_risk_score(
    classified_clauses: List[Dict[str, Any]],
    trap_chains: List[Dict[str, Any]],
) -> Tuple[int, str, str]:
    """
    Args:
        classified_clauses: list of dicts with at least `risk_level` key.
        trap_chains:        list of detected trap chain dicts.

    Returns:
        (score_int, label_str, colour_hex)
    """
    high_risk_count = sum(1 for c in classified_clauses if c["risk_level"] == "high-risk")
    warning_count   = sum(1 for c in classified_clauses if c["risk_level"] == "warning")
    safe_count      = sum(1 for c in classified_clauses if c["risk_level"] == "safe")

    deduction = (
        min(high_risk_count * _DEDUCT_HIGH_RISK, 60)
        + warning_count * _DEDUCT_WARNING
        + len(trap_chains) * _DEDUCT_TRAP
    )
    bonus = min(safe_count * _ADD_SAFE, 5)

    score = max(0, min(100, 100 - deduction + bonus))

    for (low, high), (label, colour) in _RISK_LABEL.items():
        if low <= score < high:
            return score, label, colour

    return score, "Unknown", "#6b7280"
