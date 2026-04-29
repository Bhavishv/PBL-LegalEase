"""
context_verifier.py — False Positive Prevention Layer.

CORE INNOVATION #4 of the Decision Intelligence Layer.

Prevents over-flagging by verifying whether a detected "risky" clause is
actually standard industry practice. Not all arbitration clauses are unfair.
Not all auto-renewal is predatory.

Before finalizing a High Risk label, this layer checks:
  "Is this clause actually abnormal or is it standard industry practice?"

This shows the system has *domain intelligence*, not just pattern matching.

Architecture position:
  Layer 4 (Decision Intelligence) → Context Verification Layer
  Runs AFTER classification, BEFORE final risk assignment.
"""

from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional, List, Tuple


@dataclass
class VerificationResult:
    """Result of context verification for a single clause."""
    original_risk: str              # what the classifier said
    verified_risk: str              # after context check (may be downgraded)
    was_downgraded: bool            # True if a false positive was caught
    verification_reason: str        # human-readable reason for the decision
    industry_match: Optional[str]   # matched standard template name, or None

    def to_dict(self) -> dict:
        return {
            "original_risk": self.original_risk,
            "verified_risk": self.verified_risk,
            "was_downgraded": self.was_downgraded,
            "verification_reason": self.verification_reason,
            "industry_match": self.industry_match,
        }


# ══════════════════════════════════════════════════════════════════════════════
# STANDARD PRACTICE TEMPLATES
# ══════════════════════════════════════════════════════════════════════════════
# Each template defines:
#   - pattern: regex to match in clause text
#   - contract_types: which contract types this is standard for
#   - standard_condition: regex that must ALSO match for it to be standard
#   - abnormal_condition: regex that, if matched, means it's NOT standard
#   - downgrade_to: the risk level to downgrade to if standard
#   - template_name: human-readable name
#   - reason: explanation

_STANDARD_TEMPLATES: List[dict] = [
    # ── Arbitration ───────────────────────────────────────────────────────
    {
        "pattern": r"(?:binding|mandatory)\s*arbitration",
        "contract_types": ["saas", "general"],
        "standard_condition": None,  # Just matching is enough
        "abnormal_condition": r"waive.*(?:right|all|class action)",  # Class action waiver makes it abnormal
        "downgrade_to": "warning",
        "template_name": "Standard Arbitration Clause",
        "reason": "Binding arbitration is a common industry practice in SaaS and commercial agreements.",
    },

    # ── Auto-renewal with reasonable notice ───────────────────────────────
    {
        "pattern": r"auto(?:matic(?:ally)?)?[- ]?renew",
        "contract_types": ["saas", "general"],
        "standard_condition": r"(?:30|15|14)\s*(?:day|calendar)",  # 30-day notice = fair
        "abnormal_condition": r"(?:90|120|180)\s*day",  # 90+ day notice = restrictive
        "downgrade_to": "warning",
        "template_name": "Auto-Renewal with Fair Notice",
        "reason": "Auto-renewal with 30-day or shorter notice period is standard in SaaS contracts.",
    },

    # ── Security deposit (1-2 months) ─────────────────────────────────────
    {
        "pattern": r"security deposit",
        "contract_types": ["rental"],
        "standard_condition": r"(?:one|1|two|2)\s*month",
        "abnormal_condition": r"(?:non[- ]?refundable|six|6|twelve|12)\s*month",
        "downgrade_to": "safe",
        "template_name": "Standard Security Deposit",
        "reason": "A security deposit of 1-2 months rent is standard in most rental agreements.",
    },

    # ── Non-compete (reasonable scope) ────────────────────────────────────
    {
        "pattern": r"non[- ]?compete",
        "contract_types": ["employment"],
        "standard_condition": r"(?:one|1|twelve|12\s*month|same\s*(?:city|metropolitan|area))",
        "abnormal_condition": r"(?:worldwide|global|five|5|perpetual|all industr)",
        "downgrade_to": "warning",
        "template_name": "Reasonable Non-Compete",
        "reason": "A non-compete limited to 1 year in the same metropolitan area is within standard employment practice.",
    },

    # ── Late payment fee (reasonable rate) ─────────────────────────────────
    {
        "pattern": r"late\s*(?:payment\s*)?fee|interest.*per month",
        "contract_types": ["loan", "saas", "rental", "general"],
        "standard_condition": r"(?:1\.5|1|2)\s*%\s*(?:per month|monthly)",
        "abnormal_condition": r"(?:5|10|15|20|25)\s*%\s*(?:per month|monthly)",
        "downgrade_to": "warning",
        "template_name": "Standard Late Fee",
        "reason": "A late fee of 1-2% per month is common in commercial agreements.",
    },

    # ── Limitation of liability ───────────────────────────────────────────
    {
        "pattern": r"limitation of liability|limit.*liability",
        "contract_types": ["saas", "general"],
        "standard_condition": r"(?:not exceed|limited to|aggregate|cap|maximum)",
        "abnormal_condition": r"(?:no liability.*whatsoever|zero|excludes all)",
        "downgrade_to": "warning",
        "template_name": "Capped Liability Limitation",
        "reason": "Liability limitation with a defined cap is standard in commercial contracts.",
    },

    # ── Data deletion on termination ──────────────────────────────────────
    {
        "pattern": r"(?:delet|remov|destroy).*data.*(?:terminat|expir)",
        "contract_types": ["saas"],
        "standard_condition": r"(?:30|60)\s*day",
        "abnormal_condition": r"(?:immediately|without notice|0\s*day)",
        "downgrade_to": "safe",
        "template_name": "Standard Data Deletion Policy",
        "reason": "Data deletion within 30-60 days of termination is standard SaaS practice.",
    },

    # ── Governing law clause ──────────────────────────────────────────────
    {
        "pattern": r"governing law|jurisdiction",
        "contract_types": ["any"],
        "standard_condition": None,
        "abnormal_condition": r"(?:exclusive.*(?:cayman|bermuda|british virgin))",
        "downgrade_to": "safe",
        "template_name": "Standard Governing Law",
        "reason": "Specifying governing law and jurisdiction is standard and expected in contracts.",
    },

    # ── Confidentiality / NDA ─────────────────────────────────────────────
    {
        "pattern": r"confidential(?:ity)?|non[- ]?disclosure",
        "contract_types": ["any"],
        "standard_condition": r"(?:mutual|both parties|each party|reciprocal)",
        "abnormal_condition": r"(?:perpetual|indefinite|forever|unlimited\s*duration)",
        "downgrade_to": "safe",
        "template_name": "Mutual Confidentiality",
        "reason": "Mutual confidentiality obligations are standard and fair in most agreements.",
    },

    # ── Indemnification (mutual) ──────────────────────────────────────────
    {
        "pattern": r"indemnif",
        "contract_types": ["any"],
        "standard_condition": r"(?:mutual|each party.*indemnif|both parties)",
        "abnormal_condition": None,
        "downgrade_to": "warning",
        "template_name": "Mutual Indemnification",
        "reason": "Mutual indemnification where both parties share responsibility is standard practice.",
    },

    # ── Notice period for termination ─────────────────────────────────────
    {
        "pattern": r"(?:30|60)\s*day.*(?:notice|written notice).*terminat",
        "contract_types": ["any"],
        "standard_condition": None,
        "abnormal_condition": None,
        "downgrade_to": "safe",
        "template_name": "Standard Termination Notice",
        "reason": "A 30-60 day notice period for termination is standard and fair.",
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def verify_clause_context(
    clause_text: str,
    classified_risk: str,
    contract_type: str = "general",
    confidence: float = 0.5,
) -> VerificationResult:
    """
    Verify whether a flagged clause is actually standard industry practice.

    Only attempts to DOWNGRADE risk (never upgrades). A clause classified as
    "safe" passes through unchanged. A clause classified as "warning" or
    "high-risk" may be downgraded if it matches a standard practice template.

    Args:
        clause_text:     Raw text of the clause.
        classified_risk: Risk level from the classifier ("safe"|"warning"|"high-risk").
        contract_type:   Detected contract type.
        confidence:      Classifier confidence (0-1).

    Returns:
        VerificationResult with original and (possibly downgraded) risk level.
    """
    # Don't try to downgrade "safe" clauses
    if classified_risk == "safe":
        return VerificationResult(
            original_risk="safe",
            verified_risk="safe",
            was_downgraded=False,
            verification_reason="Clause is already classified as safe.",
            industry_match=None,
        )

    # Don't downgrade very high-confidence risky predictions (>=0.92)
    # The classifier is very sure — trust it
    if confidence >= 0.92 and classified_risk == "high-risk":
        return VerificationResult(
            original_risk=classified_risk,
            verified_risk=classified_risk,
            was_downgraded=False,
            verification_reason="High-confidence prediction — classifier is very certain.",
            industry_match=None,
        )

    lower = clause_text.lower()

    for template in _STANDARD_TEMPLATES:
        # Check if the clause matches the template pattern
        if not re.search(template["pattern"], lower):
            continue

        # Check contract type applicability
        allowed_types = template["contract_types"]
        if "any" not in allowed_types and contract_type not in allowed_types:
            continue

        # Check for abnormal conditions FIRST — if abnormal, skip this template
        if template.get("abnormal_condition"):
            if re.search(template["abnormal_condition"], lower):
                continue  # This IS abnormal — don't downgrade

        # Check for standard condition (if specified)
        if template.get("standard_condition"):
            if not re.search(template["standard_condition"], lower):
                continue  # Doesn't match the "standard" pattern

        # This clause matches a standard practice template → downgrade
        downgrade_to = template["downgrade_to"]

        # Only downgrade if the new level is actually lower
        risk_order = {"safe": 0, "warning": 1, "high-risk": 2}
        if risk_order.get(downgrade_to, 0) >= risk_order.get(classified_risk, 0):
            continue  # Not actually a downgrade

        return VerificationResult(
            original_risk=classified_risk,
            verified_risk=downgrade_to,
            was_downgraded=True,
            verification_reason=template["reason"],
            industry_match=template["template_name"],
        )

    # No standard template matched — keep original classification
    return VerificationResult(
        original_risk=classified_risk,
        verified_risk=classified_risk,
        was_downgraded=False,
        verification_reason="No matching standard practice template found for this contract type.",
        industry_match=None,
    )


def get_template_count() -> int:
    """Return total number of standard practice templates."""
    return len(_STANDARD_TEMPLATES)


if __name__ == "__main__":
    print("Context Verifier — Self-Test")
    print("=" * 50)

    tests = [
        ("All disputes resolved by binding arbitration.", "high-risk", "saas"),
        ("Auto-renew with 30 days notice.", "high-risk", "saas"),
        ("Auto-renew with 90 days notice required.", "high-risk", "saas"),
        ("Security deposit of one month rent.", "warning", "rental"),
        ("Security deposit is non-refundable.", "high-risk", "rental"),
        ("Non-compete for 1 year in the same city.", "high-risk", "employment"),
        ("Non-compete for 5 years worldwide.", "high-risk", "employment"),
    ]

    for text, risk, ct in tests:
        result = verify_clause_context(text, risk, ct)
        status = "⬇️ DOWNGRADED" if result.was_downgraded else "✓ KEPT"
        print(f"\n  {status}: '{text[:50]}...'")
        print(f"    {result.original_risk} → {result.verified_risk}")
        if result.industry_match:
            print(f"    Match: {result.industry_match}")
        print(f"    Reason: {result.verification_reason}")
