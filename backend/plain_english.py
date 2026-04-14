"""
plain_english.py — Generates plain-English explanations for contract clauses.

Priority:
  1. Gemini API — dynamic, clause-specific explanation (if API key is set)
  2. KB pre-written explanation (if clause matched a KB entry)
  3. Rule-based template (keyword pattern match)
  4. Generic explanation by risk level
"""

from __future__ import annotations
import os
import re
import logging
from typing import Optional

from knowledge_base import KNOWLEDGE_BASE

logger = logging.getLogger(__name__)

# ── Gemini setup ──────────────────────────────────────────────────────────────
_gemini_model = None

def _get_gemini():
    """Lazily initialise the Gemini model once."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=(
                "You are a plain-English legal expert. Your job is to explain a single "
                "contract clause to a non-lawyer in 2-3 simple sentences. "
                "Be direct, use everyday language, avoid legal jargon. "
                "Always end with what the practical consequence is for the person signing. "
                "Do NOT include any markdown, bullet points, or formatting."
            ),
        )
        logger.info("Gemini model initialised successfully.")
    except Exception as e:
        logger.warning(f"Gemini initialisation failed: {e}")
        _gemini_model = None

    return _gemini_model


def _gemini_explain(clause_text: str, risk_level: str) -> Optional[str]:
    """Call Gemini to generate a dynamic explanation. Returns None on failure."""
    model = _get_gemini()
    if model is None:
        return None

    risk_hint = {
        "high-risk": "This clause is HIGH RISK.",
        "warning":   "This clause has a WARNING level risk.",
        "safe":      "This clause appears SAFE.",
    }.get(risk_level, "")

    prompt = (
        f"{risk_hint}\n\n"
        f"Contract clause:\n\"{clause_text}\"\n\n"
        "Explain what this clause means in plain English for a non-lawyer. "
        "Focus on what the person signing actually agrees to and any potential downside."
    )

    try:
        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 150, "temperature": 0.3},
        )
        text = response.text.strip()
        if text:
            return text
    except Exception as e:
        logger.warning(f"Gemini explanation failed: {e}")

    return None


# ── KB lookup ─────────────────────────────────────────────────────────────────
def _get_kb_explanation(matched_id: str) -> Optional[str]:
    for entry in KNOWLEDGE_BASE:
        if entry["id"] == matched_id:
            return entry.get("plain_english")
    return None


# ── Rule-based templates (fallback) ──────────────────────────────────────────
_TEMPLATES = [
    (r"automatically renew",
     "This contract renews itself every period. You must actively cancel before the deadline or you'll be locked in again."),
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


# ── Public API ─────────────────────────────────────────────────────────────────
def generate_explanation(clause_text: str, matched_id: str, risk_level: str) -> str:
    """
    Returns a plain-English explanation for a contract clause.

    Priority order:
      1. Gemini API (dynamic, clause-specific)
      2. Knowledge-base pre-written explanation
      3. Keyword template
      4. Generic fallback by risk level
    """

    # 1 — Gemini (dynamic)
    gemini_result = _gemini_explain(clause_text, risk_level)
    if gemini_result:
        return gemini_result

    # 2 — Pre-written KB explanation
    if matched_id and matched_id != "heuristic":
        kb_explanation = _get_kb_explanation(matched_id)
        if kb_explanation:
            return kb_explanation

    # 3 — Rule-based template
    lower = clause_text.lower()
    for pattern, explanation in _TEMPLATES:
        if re.search(pattern, lower):
            return explanation

    # 4 — Generic by risk level
    if risk_level == "high-risk":
        return (
            "This clause contains language that could significantly limit your rights "
            "or expose you to financial or legal risk. Consider consulting a lawyer before signing."
        )
    elif risk_level == "warning":
        return (
            "This clause is somewhat one-sided or contains terms worth reviewing carefully. "
            "Make sure you understand the obligations before agreeing."
        )
    return (
        "This clause appears to be standard and balanced. "
        "It uses common legal language that protects both parties fairly."
    )
