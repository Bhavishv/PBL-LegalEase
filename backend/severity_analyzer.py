"""
severity_analyzer.py — Multi-Dimensional Severity Prediction.

Instead of only classifying clauses as safe/warning/high-risk, this module
predicts severity across 5 risk dimensions:

  1. financial_risk      — potential monetary impact
  2. privacy_risk        — personal data exposure
  3. legal_lock_in_risk  — contractual entrapment
  4. dispute_difficulty   — how hard it is to resolve disagreements
  5. exit_difficulty     — how hard it is to leave the contract

Architecture position:
  Layer 4 (Decision Intelligence) → Multi-Dimensional Severity Prediction
"""

from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class SeverityBreakdown:
    """Multi-dimensional severity prediction for a clause."""
    financial_risk: float = 0.0        # 0.0–1.0
    privacy_risk: float = 0.0          # 0.0–1.0
    legal_lock_in_risk: float = 0.0    # 0.0–1.0
    dispute_difficulty: float = 0.0    # 0.0–1.0
    exit_difficulty: float = 0.0       # 0.0–1.0

    def to_dict(self) -> dict:
        return {
            "financial_risk": round(self.financial_risk, 2),
            "privacy_risk": round(self.privacy_risk, 2),
            "legal_lock_in_risk": round(self.legal_lock_in_risk, 2),
            "dispute_difficulty": round(self.dispute_difficulty, 2),
            "exit_difficulty": round(self.exit_difficulty, 2),
        }

    def max_severity(self) -> float:
        """Return the highest severity across all dimensions."""
        return max(
            self.financial_risk, self.privacy_risk, self.legal_lock_in_risk,
            self.dispute_difficulty, self.exit_difficulty,
        )


# ── Keyword → dimension scoring tables ────────────────────────────────────────
# Each entry: (regex_pattern, {dimension: score_to_add})

_SEVERITY_PATTERNS = [
    # Financial risk
    (r"cancellation fee|early termination fee", {"financial_risk": 0.8, "exit_difficulty": 0.6}),
    (r"(?:100|75|80|90)\s*%.*remaining", {"financial_risk": 0.9, "exit_difficulty": 0.8}),
    (r"liquidated damages", {"financial_risk": 0.7}),
    (r"penalty", {"financial_risk": 0.5}),
    (r"fee|charge|cost", {"financial_risk": 0.2}),
    (r"interest.*per month|late.*fee", {"financial_risk": 0.5}),
    (r"non[- ]?refundable", {"financial_risk": 0.7, "exit_difficulty": 0.5}),
    (r"indemnif|hold harmless", {"financial_risk": 0.7}),
    (r"no liability|not liable|limitation of liability", {"financial_risk": 0.4}),

    # Privacy risk
    (r"personal data|personal information", {"privacy_risk": 0.6}),
    (r"share.*(?:data|information).*third part", {"privacy_risk": 0.8}),
    (r"collect.*(?:data|information)", {"privacy_risk": 0.4}),
    (r"without restriction.*(?:data|information)", {"privacy_risk": 0.9}),
    (r"retain.*data.*(?:terminat|after)", {"privacy_risk": 0.7}),
    (r"track|monitor|surveil", {"privacy_risk": 0.5}),

    # Legal lock-in
    (r"auto(?:matic(?:ally)?)?[- ]?renew", {"legal_lock_in_risk": 0.7, "exit_difficulty": 0.5}),
    (r"perpetual|irrevocable", {"legal_lock_in_risk": 0.8}),
    (r"non[- ]?compete", {"legal_lock_in_risk": 0.6, "exit_difficulty": 0.5}),
    (r"exclusive", {"legal_lock_in_risk": 0.4}),
    (r"modify.*terms|change.*terms|amend.*unilateral", {"legal_lock_in_risk": 0.5}),
    (r"intellectual property.*(?:assign|transfer|belong)", {"legal_lock_in_risk": 0.6}),
    (r"non[- ]?disparagement", {"legal_lock_in_risk": 0.3}),
    (r"waives? all rights", {"legal_lock_in_risk": 0.7}),

    # Dispute difficulty
    (r"(?:binding|mandatory)\s*arbitration", {"dispute_difficulty": 0.6}),
    (r"class action.*waiv", {"dispute_difficulty": 0.8}),
    (r"individual capacity", {"dispute_difficulty": 0.7}),
    (r"exclusive jurisdiction", {"dispute_difficulty": 0.4}),
    (r"(?:bear|pay).*(?:own|legal).*(?:cost|fee)", {"dispute_difficulty": 0.5}),
    (r"covenant not to sue", {"dispute_difficulty": 0.6}),

    # Exit difficulty
    (r"(?:60|90|120|180)\s*day.*notice", {"exit_difficulty": 0.6}),
    (r"cancellation fee|early termination", {"exit_difficulty": 0.7}),
    (r"no.*termination.*convenience", {"exit_difficulty": 0.8}),
    (r"minimum.*(?:term|commitment|period)", {"exit_difficulty": 0.5}),
    (r"(?:lock|locked)[- ]?in", {"exit_difficulty": 0.7}),
    (r"foreclosure|repossess|seize", {"exit_difficulty": 0.6, "financial_risk": 0.7}),
]

# ── Risk level multipliers ────────────────────────────────────────────────────
_RISK_MULTIPLIER = {"safe": 0.3, "warning": 0.7, "high-risk": 1.0}


def analyze_severity(
    clause_text: str,
    risk_level: str = "safe",
    matched_kb_id: Optional[str] = None,
    contract_type: str = "general",
    severity_tags: Optional[list] = None,
) -> SeverityBreakdown:
    """
    Analyze a clause's severity across 5 risk dimensions.

    Args:
        clause_text:   Raw clause text.
        risk_level:    Classified risk level ("safe"|"warning"|"high-risk").
        matched_kb_id: Matched knowledge base entry ID (if any).
        contract_type: Detected contract type.
        severity_tags: Severity tags from KB entry (if matched).

    Returns:
        SeverityBreakdown with scores for each dimension.
    """
    lower = clause_text.lower()
    multiplier = _RISK_MULTIPLIER.get(risk_level, 0.5)

    scores = {
        "financial_risk": 0.0,
        "privacy_risk": 0.0,
        "legal_lock_in_risk": 0.0,
        "dispute_difficulty": 0.0,
        "exit_difficulty": 0.0,
    }

    # 1. Score from keyword patterns
    for pattern, dimension_scores in _SEVERITY_PATTERNS:
        if re.search(pattern, lower):
            for dim, score in dimension_scores.items():
                scores[dim] = max(scores[dim], score)

    # 2. Boost from severity_tags (from KB entry)
    if severity_tags:
        tag_boost = 0.2
        for tag in severity_tags:
            dim_key = tag if tag in scores else f"{tag}_risk"
            if dim_key in scores:
                scores[dim_key] = min(1.0, scores[dim_key] + tag_boost)

    # 3. Apply risk level multiplier
    for dim in scores:
        scores[dim] = min(1.0, scores[dim] * multiplier)

    # 4. Minimum severity floor — prevent green bars on risky clauses
    #    If the clause IS high-risk or warning, guarantee at least one bar
    #    shows meaningful danger. This prevents contradictions where the
    #    explanation says "⚠️ DANGER" but all bars show 5% green.
    if risk_level == "high-risk":
        max_val = max(scores.values())
        if max_val < 0.70:
            # Find the best dimension and boost it
            best_dim = max(scores, key=scores.get)
            scores[best_dim] = max(scores[best_dim], 0.75)
            # Also give a secondary boost to financial_risk as a safe default
            if best_dim != "financial_risk":
                scores["financial_risk"] = max(scores["financial_risk"], 0.50)
    elif risk_level == "warning":
        max_val = max(scores.values())
        if max_val < 0.40:
            best_dim = max(scores, key=scores.get)
            scores[best_dim] = max(scores[best_dim], 0.45)

    return SeverityBreakdown(**scores)


def aggregate_severity(breakdowns: list[SeverityBreakdown]) -> dict:
    """
    Aggregate severity across all clauses into a contract-level summary.
    Uses max value per dimension (worst case across all clauses).
    """
    if not breakdowns:
        return SeverityBreakdown().to_dict()

    return {
        "financial_risk": round(max(b.financial_risk for b in breakdowns), 2),
        "privacy_risk": round(max(b.privacy_risk for b in breakdowns), 2),
        "legal_lock_in_risk": round(max(b.legal_lock_in_risk for b in breakdowns), 2),
        "dispute_difficulty": round(max(b.dispute_difficulty for b in breakdowns), 2),
        "exit_difficulty": round(max(b.exit_difficulty for b in breakdowns), 2),
    }
