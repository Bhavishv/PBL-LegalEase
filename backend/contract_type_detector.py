"""
contract_type_detector.py — Detects the type of contract from its text.

Supported types:
  - "rental"      (lease / tenancy / property agreements)
  - "saas"        (SaaS / subscription / software service agreements)
  - "employment"  (employment / offer letters / HR agreements)
  - "loan"        (loan / credit / mortgage / financing agreements)
  - "nda"         (non-disclosure / confidentiality agreements)
  - "general"     (fallback when no strong signal is found)

Detection strategy:
  1. Weighted keyword frequency scoring per type
  2. Returns the top match with a confidence score (0–1)

This module is part of the Decision Intelligence Layer (Layer 4).
"""

from __future__ import annotations
import re
from typing import Tuple, Dict, List

# ── Type keyword sets ─────────────────────────────────────────────────────────
# Each type has a list of (keyword_pattern, weight) tuples.
# Higher weight = stronger signal for that contract type.

_TYPE_KEYWORDS: Dict[str, List[Tuple[str, float]]] = {
    "rental": [
        (r"\btenant\b", 3.0),
        (r"\blandlord\b", 3.0),
        (r"\blease\b", 2.5),
        (r"\brent\b", 2.0),
        (r"\bpremises\b", 2.5),
        (r"\bsecurity deposit\b", 2.0),
        (r"\beviction\b", 2.5),
        (r"\bmaintenance\b", 1.0),
        (r"\boccupancy\b", 2.0),
        (r"\bproperty\b", 1.0),
        (r"\btenancy\b", 3.0),
        (r"\bsublease\b", 2.5),
        (r"\bhabitable\b", 2.0),
        (r"\bfurnished\b", 1.5),
        (r"\bmonthly rent\b", 2.5),
        (r"\butilities\b", 1.0),
    ],
    "saas": [
        (r"\bsubscription\b", 2.5),
        (r"\bauto[- ]?renew", 2.0),
        (r"\bSLA\b", 3.0),
        (r"\bservice level\b", 3.0),
        (r"\buptime\b", 3.0),
        (r"\bSaaS\b", 4.0),
        (r"\bsoftware as a service\b", 4.0),
        (r"\buser licen[sc]e\b", 2.5),
        (r"\bcloud\b", 1.5),
        (r"\bAPI\b", 1.5),
        (r"\bdata processing\b", 1.5),
        (r"\bterms of service\b", 2.0),
        (r"\bservice agreement\b", 2.0),
        (r"\bplatform\b", 1.0),
        (r"\baccount\b", 0.5),
        (r"\bsupport ticket\b", 2.0),
    ],
    "employment": [
        (r"\bemployee\b", 3.0),
        (r"\bemployer\b", 3.0),
        (r"\bsalary\b", 2.5),
        (r"\bcompensation\b", 2.0),
        (r"\bnon[- ]?compete\b", 3.0),
        (r"\bprobation\b", 2.5),
        (r"\bbenefits\b", 1.5),
        (r"\btermination of employment\b", 3.0),
        (r"\bwork[- ]?from[- ]?home\b", 2.0),
        (r"\bjob title\b", 2.5),
        (r"\bpaid time off\b", 2.5),
        (r"\bPTO\b", 2.0),
        (r"\bemployment agreement\b", 4.0),
        (r"\boffer letter\b", 3.5),
        (r"\breporting to\b", 2.0),
        (r"\bnotice period\b", 1.5),
        (r"\bseverance\b", 2.5),
        (r"\brestrictive covenant\b", 2.5),
    ],
    "loan": [
        (r"\bprincipal\b", 2.0),
        (r"\binterest rate\b", 3.0),
        (r"\bcollateral\b", 3.0),
        (r"\bforeclosure\b", 3.5),
        (r"\brepayment\b", 2.5),
        (r"\bdefault\b", 1.5),
        (r"\bamortization\b", 3.0),
        (r"\bloan agreement\b", 4.0),
        (r"\bborrower\b", 3.0),
        (r"\blender\b", 3.0),
        (r"\bmortgage\b", 3.5),
        (r"\binstallment\b", 2.0),
        (r"\bpromissory note\b", 3.5),
        (r"\bAPR\b", 2.5),
        (r"\bannual percentage\b", 2.5),
        (r"\bcredit\b", 1.0),
        (r"\bsecured\b", 1.5),
        (r"\bunsecured\b", 2.0),
    ],
    "nda": [
        (r"\bnon[- ]?disclosure\b", 4.0),
        (r"\bconfidential information\b", 3.5),
        (r"\bconfidentiality\b", 3.0),
        (r"\bdisclosing party\b", 3.5),
        (r"\breceiving party\b", 3.5),
        (r"\btrade secret\b", 3.0),
        (r"\bproprietary\b", 2.0),
        (r"\bnon[- ]?disclosure agreement\b", 5.0),
        (r"\bNDA\b", 4.0),
        (r"\bconfidential\b", 1.5),
    ],
}

# ── Minimum score to be considered a valid match ──────────────────────────────
_MIN_SCORE = 3.0


def detect_contract_type(text: str) -> Tuple[str, float]:
    """
    Detect the type of contract from its full text.

    Args:
        text: Full contract text (cleaned).

    Returns:
        (contract_type, confidence)
        contract_type : "rental" | "saas" | "employment" | "loan" | "nda" | "general"
        confidence    : 0.0–1.0 (normalized score relative to the best match)
    """
    lower = text.lower()
    scores: Dict[str, float] = {}

    for contract_type, keywords in _TYPE_KEYWORDS.items():
        type_score = 0.0
        for pattern, weight in keywords:
            matches = len(re.findall(pattern, lower))
            if matches > 0:
                # Diminishing returns: first match = full weight, subsequent = 0.3x
                type_score += weight + (matches - 1) * weight * 0.3
        scores[contract_type] = type_score

    if not scores:
        return "general", 0.0

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    if best_score < _MIN_SCORE:
        return "general", 0.0

    # Normalize confidence: ratio of best score to total scores
    total = sum(scores.values())
    confidence = best_score / total if total > 0 else 0.0

    # Clamp to 0–1 range
    confidence = min(1.0, max(0.0, confidence))

    return best_type, round(confidence, 3)


def get_all_supported_types() -> list[str]:
    """Return all supported contract types (excluding 'general')."""
    return list(_TYPE_KEYWORDS.keys())


def detect_all_type_scores(text: str) -> Dict[str, float]:
    """
    Return percentage scores for ALL contract types.

    Unlike detect_contract_type() which only returns the top match,
    this returns a dict like: {"rental": 0.65, "saas": 0.20, "loan": 0.10, ...}
    All values sum to ~1.0 (100%).
    """
    lower = text.lower()
    scores: Dict[str, float] = {}

    for contract_type, keywords in _TYPE_KEYWORDS.items():
        type_score = 0.0
        for pattern, weight in keywords:
            matches = len(re.findall(pattern, lower))
            if matches > 0:
                type_score += weight + (matches - 1) * weight * 0.3
        scores[contract_type] = type_score

    total = sum(scores.values())
    if total == 0:
        return {k: 0.0 for k in _TYPE_KEYWORDS}

    # Normalize to percentages
    return {k: round(v / total, 3) for k, v in scores.items()}


if __name__ == "__main__":
    # Quick self-test
    samples = {
        "rental": "This lease agreement between landlord and tenant for the premises at 123 Main St. Monthly rent of $1500 with a security deposit of $3000.",
        "saas": "This SaaS subscription agreement governs your use of the platform. Service level agreement guarantees 99.9% uptime. Auto-renewal applies.",
        "employment": "This employment agreement between employer and employee. Salary of $80,000/year. Non-compete clause applies for 1 year. Probation period of 90 days.",
        "loan": "This loan agreement between borrower and lender. Principal amount of $50,000 at 5.5% interest rate. Collateral required. Monthly repayment schedule.",
        "nda": "This non-disclosure agreement between the disclosing party and receiving party regarding confidential information and trade secrets.",
    }

    print("Contract Type Detection Self-Test:")
    print("=" * 50)
    for expected, text in samples.items():
        detected, conf = detect_contract_type(text)
        status = "✅" if detected == expected else "❌"
        print(f"  {status} Expected: {expected:12s} → Detected: {detected:12s} (confidence: {conf:.1%})")
