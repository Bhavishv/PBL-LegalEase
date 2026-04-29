"""
risk_scorer.py — Advanced Ensemble Scorer (ML + AI).
Calculates the 'Trust Score' by weighting statistical model confidence
against the AI's contextual risk detection.
"""

from __future__ import annotations
from typing import List, Dict, Any, Tuple


# ── Confidence-weighted deduction tables ─────────────────────────────────────
_DEDUCT = {
    "high-risk": {"high_conf": 18, "low_conf": 12},
    "warning":   {"high_conf":  8, "low_conf":  5},
}
_DEDUCT_TRAP = 10      # per detected trap chain
_ADD_SAFE    =  1      # per safe clause bonus
_CAP_RISK    = 65      
_CAP_SAFE    =  5      

_RISK_LABEL = {
    (85, 101): ("Safe to Sign", "#22c55e"),
    (65,  85): ("Moderate Risk", "#f59e0b"),
    (0,   65): ("High Risk",     "#ef4444"),
}

_HIGH_CONF_THRESHOLD = 0.75


def compute_risk_score(
    classified_clauses: List[Dict[str, Any]],
    trap_chains: List[Dict[str, Any]],
    ai_context_score: Optional[int] = None
) -> Tuple[int, str, str]:
    """
    Ensemble Scorer — Hybrid logic combining ML + AI.
    """
    ml_deductions = 0
    safe_bonus     = 0

    for clause in classified_clauses:
        level      = clause.get("risk_level", "safe")
        confidence = float(clause.get("confidence", 0.5))
        key        = "high_conf" if confidence >= _HIGH_CONF_THRESHOLD else "low_conf"

        if level in ("high-risk", "high"):
            ml_deductions += _DEDUCT["high-risk"][key]
        elif level == "warning":
            ml_deductions += _DEDUCT["warning"][key]
        else:
            safe_bonus += _ADD_SAFE

    trap_deduction = len(trap_chains) * _DEDUCT_TRAP
    
    # ── ENSEMBLE WEIGHTING ──
    # If AI contextual score exists, we give it a 40% weight and ML 60% weight
    ml_score = max(0, min(100, 100 - ml_deductions - trap_deduction + min(safe_bonus, _CAP_SAFE)))
    
    if ai_context_score is not None:
        # Combined Score = (ML * 0.6) + (AI * 0.4)
        final_score = int((ml_score * 0.6) + (ai_context_score * 0.4))
    else:
        final_score = ml_score

    for (low, high), (label, colour) in _RISK_LABEL.items():
        if low <= final_score < high:
            return final_score, label, colour

    return final_score, "High Risk", "#ef4444"
