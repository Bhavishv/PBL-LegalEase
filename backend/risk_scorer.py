"""
risk_scorer.py — Contract-Level Risk Score Calculator.

UPGRADED: Now incorporates rule engine results, trap chain danger scores,
confidence calibration, and context verification into the final score.
Returns a detailed ScoreBreakdown for full explainability.

The score starts at 100 (perfect) and deductions are applied based on:
  1. Clause-level risks (from ensemble classifier)
  2. Rule engine fires (cross-clause pattern risks)
  3. Trap chain danger scores (multi-clause relationship risks)
  4. Context verification bonuses (false-positive corrections)
  5. Safe clause bonuses (for genuinely protective language)

Architecture position:
  Layer 4 (Decision Intelligence) → Hybrid Ensemble Risk Engine
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional


# ── Deduction tables ──────────────────────────────────────────────────────────
_CLAUSE_DEDUCTION = {
    "high-risk": 18,
    "warning": 10,
    "safe": 0,
}

_RULE_DEDUCTION = {
    "high-risk": 8,
    "warning": 4,
}

# ── Contract-type adjustment multipliers ──────────────────────────────────────
# Some contract types have higher baseline complexity → slightly reduce deduction
_TYPE_ADJUSTMENT = {
    "rental": 0.95,
    "saas": 1.0,
    "employment": 0.95,
    "loan": 1.05,  # loan contracts have higher inherent risk
    "nda": 0.85,   # NDAs are simpler → lower deduction
    "general": 1.0,
}

# ── Score → label mapping ─────────────────────────────────────────────────────
def _score_to_label(score: int) -> tuple:
    """Return (label, colour) for a given score."""
    if score >= 80:
        return "Low Risk", "#22c55e"     # green
    elif score >= 55:
        return "Medium Risk", "#f59e0b"  # amber
    else:
        return "High Risk", "#ef4444"    # red


def compute_risk_score(
    results: List[Dict[str, Any]],
    rule_engine_results: Optional[List[Dict[str, Any]]] = None,
    trap_chains: Optional[List[Dict[str, Any]]] = None,
    contract_type: str = "general",
    verification_downgrades: int = 0,
) -> Dict[str, Any]:
    """
    Compute the overall contract risk score with full breakdown.

    Args:
        results:                 List of clause analysis dicts with 'risk' key.
        rule_engine_results:     List of fired rule dicts with 'severity' key.
        trap_chains:             List of detected trap chains with 'danger_score' key.
        contract_type:           Detected contract type.
        verification_downgrades: Number of clauses that were downgraded by context verifier.

    Returns:
        Dict with overall_score, risk_label, risk_colour, and full breakdown.
    """
    score = 100.0
    clause_deduction = 0
    rule_deduction = 0
    trap_deduction = 0
    safe_bonus = 0
    verification_bonus = 0
    factor_contributions = []

    type_multiplier = _TYPE_ADJUSTMENT.get(contract_type, 1.0)

    # 1. Clause-level deductions
    for clause in results:
        risk = clause.get("risk", "safe")
        ded = _CLAUSE_DEDUCTION.get(risk, 0)
        clause_deduction += ded

    clause_deduction = int(clause_deduction * type_multiplier)
    score -= clause_deduction

    if clause_deduction > 0:
        factor_contributions.append({
            "factor": "Risky Clauses",
            "deduction": clause_deduction,
            "description": f"Found clauses with risk (adjusted for {contract_type} contract type)",
        })

    # 2. Rule engine deductions
    if rule_engine_results:
        for rule in rule_engine_results:
            severity = rule.get("severity", "warning")
            rule_deduction += _RULE_DEDUCTION.get(severity, 4)

        score -= rule_deduction
        factor_contributions.append({
            "factor": "Rule Engine Alerts",
            "deduction": rule_deduction,
            "description": f"{len(rule_engine_results)} legal rule(s) triggered",
        })

    # 3. Trap chain deductions (scaled by danger score)
    if trap_chains:
        for chain in trap_chains:
            danger = chain.get("danger_score", 50)
            # Scale: 0-100 danger → 2-12 point deduction
            ded = int(2 + (danger / 100) * 10)
            trap_deduction += ded

        score -= trap_deduction
        factor_contributions.append({
            "factor": "Trap Chain Risks",
            "deduction": trap_deduction,
            "description": f"{len(trap_chains)} multi-clause trap(s) detected",
        })

    # 4. Safe clause bonuses
    safe_count = sum(1 for c in results if c.get("risk") == "safe")
    if safe_count > 0:
        safe_bonus = min(10, safe_count * 2)
        score += safe_bonus
        factor_contributions.append({
            "factor": "Safe Clauses",
            "deduction": -safe_bonus,  # negative = bonus
            "description": f"{safe_count} clause(s) identified as safe/protective",
        })

    # 5. Context verification bonus (rewarding false-positive prevention)
    if verification_downgrades > 0:
        verification_bonus = min(8, verification_downgrades * 3)
        score += verification_bonus
        factor_contributions.append({
            "factor": "Context Verification",
            "deduction": -verification_bonus,
            "description": f"{verification_downgrades} clause(s) verified as industry standard",
        })

    # Clamp to 0–100
    overall_score = max(0, min(100, int(score)))
    risk_label, risk_colour = _score_to_label(overall_score)

    return {
        "overall_score": overall_score,
        "risk_label": risk_label,
        "risk_colour": risk_colour,
        "clause_deduction": clause_deduction,
        "rule_engine_deduction": rule_deduction,
        "trap_chain_deduction": trap_deduction,
        "safe_bonus": safe_bonus,
        "verification_bonus": verification_bonus,
        "contract_type_adjustment": contract_type,
        "factor_contributions": factor_contributions,
    }
