"""
cuad_label_mapper.py — Maps CUAD's 41 clause category titles to
LegalEase risk levels: "safe" | "warning" | "high-risk"

CUAD uses a QA format: each question asks whether a particular clause type
EXISTS in the contract. The answer span is the actual clause text.

Reference: https://huggingface.co/datasets/theatticusproject/cuad
41 category labels in the CUAD dataset.
"""

from __future__ import annotations
from typing import Dict

# ── Risk level mapping for all 41 CUAD clause categories ─────────────────────
#
# Methodology:
#   HIGH-RISK  → clauses that significantly restrict user rights, create
#                financial exposure, or waive legal protections.
#   WARNING    → clauses that are one-sided, require careful review, or
#                create obligations that could be problematic.
#   SAFE       → standard balanced clauses, or categories where presence
#                of the clause is generally neutral/protective for both sides.

CUAD_RISK_MAP: Dict[str, str] = {
    # ── HIGH RISK ─────────────────────────────────────────────────────────────
    "Auto-Renewal": "high-risk",
    "Termination For Convenience": "high-risk",
    "Unlimited/All-You-Can-Eat-License": "high-risk",
    "Indemnification": "high-risk",
    "Limitation Of Liability": "high-risk",
    "No-Solicit Of Customers": "high-risk",
    "Non-Compete": "high-risk",
    "Non-Transferable License": "high-risk",
    "Warranty Duration": "high-risk",
    "Irrevocable Or Perpetual License": "high-risk",
    "Source Code Escrow": "high-risk",
    "Post-Termination Services": "high-risk",
    "Liquidated Damages": "high-risk",
    "Non-Disparagement": "high-risk",
    "IP Ownership Assignment": "high-risk",

    # ── WARNING ───────────────────────────────────────────────────────────────
    "Arbitration": "warning",
    "Cap On Liability": "warning",
    "Change Of Control": "warning",
    "Competitive Restriction Exception": "warning",
    "Covenant Not To Sue": "warning",
    "Exclusivity": "warning",
    "Minimum Commitment": "warning",
    "Most Favored Nation": "warning",
    "No-Solicit Of Employees": "warning",
    "Non-Disparagement": "warning",
    "Price Restrictions": "warning",
    "Renewal Term": "warning",
    "Revenue/Profit Sharing": "warning",
    "Rofr/Rofo/Rofn": "warning",
    "Third Party Beneficiary": "warning",
    "Volume Restriction": "warning",
    "Anti-Assignment": "warning",
    "License Grant": "warning",
    "Audit Rights": "warning",

    # ── SAFE ──────────────────────────────────────────────────────────────────
    "Agreement Date": "safe",
    "Document Name": "safe",
    "Effective Date": "safe",
    "Expiration Date": "safe",
    "Governing Law": "safe",
    "Insurance": "safe",
    "Notice Period To Terminate Renewal": "safe",
    "Parties": "safe",
    "Payment Frequency": "safe",
}


def get_risk_level(cuad_category: str) -> str:
    """
    Return the risk level for a given CUAD category label.
    Defaults to 'safe' for unknown or no-answer categories.
    """
    return CUAD_RISK_MAP.get(cuad_category, "safe")


def get_all_high_risk_categories() -> list[str]:
    """Return all CUAD category names mapped to 'high-risk'."""
    return [k for k, v in CUAD_RISK_MAP.items() if v == "high-risk"]


def get_all_warning_categories() -> list[str]:
    """Return all CUAD category names mapped to 'warning'."""
    return [k for k, v in CUAD_RISK_MAP.items() if v == "warning"]


if __name__ == "__main__":
    print("CUAD Risk Level Mapping:")
    print(f"  High-risk categories : {len(get_all_high_risk_categories())}")
    print(f"  Warning categories   : {len(get_all_warning_categories())}")
    safe = [k for k, v in CUAD_RISK_MAP.items() if v == "safe"]
    print(f"  Safe categories      : {len(safe)}")
