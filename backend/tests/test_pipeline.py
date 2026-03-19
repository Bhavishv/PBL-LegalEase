"""
tests/test_pipeline.py — Unit tests for the LegalEase AI pipeline.

Run with:  python -m pytest tests/ -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from clause_segmenter import segment_clauses
from risk_classifier import classify_clause
from plain_english import generate_explanation
from trap_chain_detector import detect_trap_chains
from risk_scorer import compute_risk_score


# ── Clause segmentation ───────────────────────────────────────────────────────

def test_segment_numbered_clauses():
    text = (
        "1. Term\nThis agreement begins on the date of signing.\n\n"
        "2. Payment\nPayment is due within 30 days.\n\n"
        "3. Termination\nEither party may terminate with 30 days notice."
    )
    clauses = segment_clauses(text)
    assert len(clauses) >= 3


def test_segment_fallback_paragraphs():
    text = "This is clause one.\n\nThis is clause two.\n\nThis is clause three."
    clauses = segment_clauses(text)
    assert len(clauses) == 3


# ── Risk classification ───────────────────────────────────────────────────────

def test_classify_high_risk_auto_renewal():
    clause = (
        "This agreement shall automatically renew for successive one-year terms "
        "unless written notice is provided at least 90 days prior."
    )
    risk, confidence, kb_id = classify_clause(clause)
    assert risk == "high-risk"


def test_classify_safe_termination():
    clause = "Either party may terminate this agreement with 30 days written notice."
    risk, confidence, kb_id = classify_clause(clause)
    assert risk == "safe"


def test_classify_warning_arbitration():
    clause = "All disputes shall be resolved by binding arbitration."
    risk, confidence, kb_id = classify_clause(clause)
    assert risk in ("warning", "high-risk")


# ── Plain English explanation ─────────────────────────────────────────────────

def test_explanation_returns_string():
    explanation = generate_explanation(
        "The company may share your data with third parties for any purpose.",
        "heuristic",
        "high-risk"
    )
    assert isinstance(explanation, str) and len(explanation) > 10


# ── Trap chain detection ──────────────────────────────────────────────────────

def test_detect_auto_renewal_trap():
    clauses = [
        "This agreement automatically renews unless cancelled 90 days prior.",
        "In the event of early termination, a cancellation fee equal to 100% of remaining value is due.",
    ]
    traps = detect_trap_chains(clauses)
    assert len(traps) >= 1
    assert any("Auto-Renewal" in t["name"] for t in traps)


def test_no_trap_when_safe():
    clauses = [
        "Either party may terminate with 30 days notice.",
        "Payment is due within 30 days of invoice.",
    ]
    traps = detect_trap_chains(clauses)
    assert len(traps) == 0


# ── Risk scoring ──────────────────────────────────────────────────────────────

def test_score_all_safe():
    clauses = [{"risk_level": "safe"}] * 5
    score, label, colour = compute_risk_score(clauses, [])
    assert score >= 85
    assert label == "Safe Contract"


def test_score_high_risk_clauses():
    clauses = [{"risk_level": "high-risk"}] * 4
    score, label, colour = compute_risk_score(clauses, [])
    assert score <= 60


def test_score_with_trap_chain():
    clauses = [{"risk_level": "warning"}] * 2
    traps = [{"name": "Auto-Renewal Trap", "description": "...", "matched_keywords": []}]
    score, label, colour = compute_risk_score(clauses, traps)
    assert score < 90
