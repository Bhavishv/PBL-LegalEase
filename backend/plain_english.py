"""
plain_english.py — Generates plain English explanations for contract clauses.

Approach (no LLM API key required):
  1. Look up the closest knowledge-base entry and return its pre-written explanation.
  2. If no close match is found, generate a rule-based template explanation 
     based on risk keywords present in the clause.
"""

from __future__ import annotations
import re
from typing import Optional

from knowledge_base import KNOWLEDGE_BASE


def _get_kb_explanation(matched_id: str) -> Optional[str]:
    """Return the pre-written explanation for a knowledge-base match."""
    for entry in KNOWLEDGE_BASE:
        if entry["id"] == matched_id:
            return entry.get("plain_english")
    return None


# Rule-based templates for common legal phrases
_TEMPLATES = [
    (r"automatically renew",
     "This contract renews itself every period. You must actively cancel before the deadline, or you'll be locked in again."),
    (r"cancellation fee|early termination",
     "If you cancel early, you'll owe a fee. Read the exact amount — it could be a significant sum."),
    (r"indemnif|hold harmless",
     "You agree to protect and pay for the other party's legal costs if something goes wrong, even if it's not your fault."),
    (r"no liability|not liable|limitation of liability",
     "The other party is protected from being sued for damages, limiting what you can recover if they cause harm."),
    (r"class action|waive.*right",
     "You give up the right to join a group lawsuit. You can only sue the company individually, making legal action costly."),
    (r"arbitration",
     "Disputes go to private arbitration, not court. This is often quicker but can favour the larger party."),
    (r"personal data|personal information",
     "This clause describes how your personal information is collected and used. Read carefully to understand your privacy rights."),
    (r"assign|transfer.*rights",
     "The other party can transfer this contract to a different company without necessarily needing your approval."),
    (r"intellectual property|ip rights",
     "This clause deals with ownership of ideas, inventions, and creative work produced under this contract."),
    (r"governing law|jurisdiction",
     "Legal disputes will be handled under the laws of a specific location. Make sure you're comfortable with that jurisdiction."),
    (r"force majeure",
     "Neither party is responsible for failures caused by events outside their control (e.g., natural disasters, pandemics)."),
    (r"confidential|non-disclosure",
     "You agree not to share certain information. Breaking this could result in legal consequences."),
]


def generate_explanation(clause_text: str, matched_id: str, risk_level: str) -> str:
    """
    Returns a plain English explanation for the given clause.
    Priority: KB pre-written → keyword template → generic by risk level.
    """
    # 1. Pre-written KB explanation
    if matched_id != "heuristic":
        kb_explanation = _get_kb_explanation(matched_id)
        if kb_explanation:
            return kb_explanation

    # 2. Rule-based template
    lower = clause_text.lower()
    for pattern, explanation in _TEMPLATES:
        if re.search(pattern, lower):
            return explanation

    # 3. Generic explanation based on risk level
    if risk_level == "high-risk":
        return (
            "⚠️ This clause contains language that could significantly limit your rights "
            "or expose you to financial or legal risk. Consider consulting a lawyer before signing."
        )
    elif risk_level == "warning":
        return (
            "⚡ This clause is somewhat one-sided or contains terms worth reviewing. "
            "Make sure you understand the obligations before agreeing."
        )
    else:
        return (
            "✅ This clause appears to be standard and balanced. "
            "It uses common legal language that protects both parties fairly."
        )
