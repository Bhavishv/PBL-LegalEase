"""
risk_scorer.py — M3: Statistical Risk Scorer Ensemble.

Computes an overall contract risk score (0–100) from the outputs of M1
(CUAD TF-IDF+LR) and M2 (Sentence-BERT). High-confidence detections are
weighted more heavily than low-confidence heuristic fallbacks.

Score interpretation:
  85–100 → Safe Contract    (green)
   60–84 → Moderate Risk    (amber)
    0–59 → High Risk        (red)
"""

from __future__ import annotations
from typing import List, Dict, Any, Tuple


# ── Confidence-weighted deduction tables ─────────────────────────────────────
# High confidence (>= 0.75): M1/M2 model is fairly certain → heavier penalty
# Low confidence (< 0.75):   heuristic / weak match → lighter penalty

_DEDUCT = {
    "high-risk": {"high_conf": 18, "low_conf": 12},
    "warning":   {"high_conf":  8, "low_conf":  5},
}
_DEDUCT_TRAP = 10      # per detected trap chain (always applied at full weight)
_ADD_SAFE    =  1      # per safe clause (bonus, capped)
_CAP_RISK    = 60      # maximum deduction from high-risk clauses alone
_CAP_SAFE    =  5      # maximum bonus from safe clauses

_RISK_LABEL = {
    (85, 101): ("Safe Contract", "#22c55e"),    # green
    (60,  85): ("Moderate Risk", "#f59e0b"),    # amber
    (0,   60): ("High Risk",     "#ef4444"),    # red
}

_HIGH_CONF_THRESHOLD = 0.75


def compute_risk_score(
    classified_clauses: List[Dict[str, Any]],
    trap_chains: List[Dict[str, Any]],
) -> Tuple[int, str, str]:
    """
    M3 ensemble scorer — confidence-weighted.

    Args:
        classified_clauses: list of dicts with keys:
            `risk_level`  – "safe" | "warning" | "high-risk"
            `confidence`  – float 0–1 (optional; defaults to 0.5 if absent)
        trap_chains: list of detected trap chain dicts.

    Returns:
        (score_int, label_str, colour_hex)
    """
    risk_deduction = 0
    warn_deduction = 0
    safe_bonus     = 0

    for clause in classified_clauses:
        level      = clause.get("risk_level", "safe")
        confidence = float(clause.get("confidence", 0.5))
        key        = "high_conf" if confidence >= _HIGH_CONF_THRESHOLD else "low_conf"

        if level == "high-risk":
            risk_deduction += _DEDUCT["high-risk"][key]
        elif level == "warning":
            warn_deduction += _DEDUCT["warning"][key]
        else:
            safe_bonus += _ADD_SAFE

    trap_deduction = len(trap_chains) * _DEDUCT_TRAP
    total_deduction = (
        min(risk_deduction, _CAP_RISK)
        + warn_deduction
        + trap_deduction
    )
    bonus = min(safe_bonus, _CAP_SAFE)

    score = max(0, min(100, 100 - total_deduction + bonus))

    for (low, high), (label, colour) in _RISK_LABEL.items():
        if low <= score < high:
            return score, label, colour

    return score, "Unknown", "#6b7280"
