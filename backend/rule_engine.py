"""
rule_engine.py — Forward-chaining Rule-Based Legal Logic Engine.

CORE INNOVATION #1 of the Decision Intelligence Layer.

This module implements ~25 hand-crafted legal rules that detect cross-clause
risk patterns no pretrained ML model can catch. Each rule is a pure Python
function — no ML, no API calls — making this the project's primary
originality claim.

Rules are contract-type-aware: some rules only fire for specific contract
types (rental, SaaS, employment, loan), while universal rules fire for any.

Architecture position:
  Layer 4 (Decision Intelligence) → Rule-Based Legal Logic Engine
  Runs AFTER clause classification, BEFORE final risk scoring.
"""

from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class RuleResult:
    """Result from a single rule evaluation."""
    rule_id: str                          # e.g. "RULE_RENEWAL_LOCK"
    rule_name: str                        # human-readable name
    fired: bool                           # True if the rule conditions were met
    severity: str                         # "high-risk" | "warning"
    matched_clauses: List[int] = field(default_factory=list)  # clause indices
    explanation: str = ""                 # human-readable reason
    risk_tags: List[str] = field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# RULE DEFINITIONS
# ══════════════════════════════════════════════════════════════════════════════

# Each rule is a dict with:
#   id, name, severity, contract_types (list or ["any"]),
#   condition: callable(clauses_lower, contract_type) -> (fired, matched_indices, explanation)
#   risk_tags: list of severity dimensions

def _find_clauses_matching(clauses_lower: List[str], patterns: List[str]) -> List[int]:
    """Return indices of clauses matching ANY of the given regex patterns."""
    matched = []
    for i, clause in enumerate(clauses_lower):
        for pat in patterns:
            if re.search(pat, clause):
                matched.append(i)
                break
    return matched


def _any_clause_matches(clauses_lower: List[str], patterns: List[str]) -> bool:
    """Return True if any clause matches any pattern."""
    return len(_find_clauses_matching(clauses_lower, patterns)) > 0


# ── Rule condition functions ─────────────────────────────────────────────────

def _rule_renewal_lock(clauses_lower, _ct):
    auto = _find_clauses_matching(clauses_lower, [r"auto(?:matic(?:ally)?)?[- ]?renew"])
    cancel = _find_clauses_matching(clauses_lower, [r"cancellation fee", r"early termination fee", r"termination fee"])
    notice_long = _find_clauses_matching(clauses_lower, [r"(?:60|90|120)\s*(?:day|calendar day).*notice", r"notice.*(?:60|90|120)\s*day"])
    if auto and (cancel or notice_long):
        matched = list(set(auto + cancel + notice_long))
        return True, matched, (
            "Auto-renewal clause combined with cancellation fees or long notice period "
            "creates a lock-in trap — you may be stuck paying for another term."
        )
    return False, [], ""


def _rule_arbitration_privacy(clauses_lower, _ct):
    arb = _find_clauses_matching(clauses_lower, [r"mandatory arbitration", r"binding arbitration", r"arbitration only"])
    data = _find_clauses_matching(clauses_lower, [r"share.*personal data", r"personal data.*without restriction", r"collect.*personal information"])
    if arb and data:
        matched = list(set(arb + data))
        return True, matched, (
            "Mandatory arbitration combined with unrestricted data sharing means "
            "your data can be misused and you have limited legal recourse."
        )
    return False, [], ""


def _rule_noncompete_broad(clauses_lower, _ct):
    nc = _find_clauses_matching(clauses_lower, [r"non[- ]?compete"])
    broad = _find_clauses_matching(clauses_lower, [
        r"worldwide", r"global", r"five.*year", r"5.*year", r"all industr",
        r"any.*related.*business", r"any.*similar.*business",
    ])
    if nc and broad:
        matched = list(set(nc + broad))
        return True, matched, (
            "Non-compete clause with overly broad scope (worldwide/5+ years/all industries). "
            "This may be unenforceable but could still intimidate you into compliance."
        )
    return False, [], ""


def _rule_deposit_noreturn(clauses_lower, _ct):
    deposit = _find_clauses_matching(clauses_lower, [r"security deposit", r"deposit"])
    noreturn = _find_clauses_matching(clauses_lower, [r"non[- ]?refundable", r"not.*refund", r"shall not be returned", r"will not be returned"])
    if deposit and noreturn:
        matched = list(set(deposit + noreturn))
        return True, matched, (
            "Security deposit is marked as non-refundable. You will lose this money "
            "regardless of property condition at lease end."
        )
    return False, [], ""


def _rule_penalty_exit(clauses_lower, _ct):
    penalty = _find_clauses_matching(clauses_lower, [
        r"(?:100|75|80|90)\s*%.*remaining", r"cancellation fee", r"early termination.*fee",
        r"liquidated damages",
    ])
    no_convenience = not _any_clause_matches(clauses_lower, [r"termination for convenience", r"terminate at any time", r"terminate without cause"])
    if penalty and no_convenience:
        return True, penalty, (
            "High cancellation penalty exists but there is no termination-for-convenience clause. "
            "You have no easy way to exit this contract without significant cost."
        )
    return False, [], ""


def _rule_unilateral_change(clauses_lower, _ct):
    change = _find_clauses_matching(clauses_lower, [r"modify.*terms", r"change.*terms", r"amend.*unilateral", r"reserve.*right.*modify"])
    short_notice = _find_clauses_matching(clauses_lower, [r"(?:7|14|10)\s*day.*notice", r"notice.*(?:7|14|10)\s*day", r"without.*notice"])
    if change and short_notice:
        matched = list(set(change + short_notice))
        return True, matched, (
            "The company can unilaterally change terms with very short notice (14 days or less). "
            "You may be bound to unfavorable changes before you can react."
        )
    return False, [], ""


def _rule_ip_assignment(clauses_lower, _ct):
    ip = _find_clauses_matching(clauses_lower, [
        r"intellectual property.*(?:belong|assign|transfer|exclusive property)",
        r"(?:assign|transfer).*intellectual property",
        r"work product.*belong",
    ])
    broad = _find_clauses_matching(clauses_lower, [r"outside.*business hours", r"personal.*project", r"prior.*work", r"at all times"])
    if ip and broad:
        matched = list(set(ip + broad))
        return True, matched, (
            "IP assignment clause extends to work done outside business hours or personal projects. "
            "This is overly broad — your personal creations may belong to the employer."
        )
    return False, [], ""


def _rule_hidden_interest(clauses_lower, _ct):
    interest = _find_clauses_matching(clauses_lower, [r"interest rate", r"interest.*per month", r"per annum"])
    no_apr = not _any_clause_matches(clauses_lower, [r"APR", r"annual percentage rate", r"effective annual"])
    if interest and no_apr:
        return True, interest, (
            "Interest rate is specified but no Annual Percentage Rate (APR) disclosure found. "
            "The true cost of borrowing may be hidden."
        )
    return False, [], ""


def _rule_liability_waiver_total(clauses_lower, _ct):
    waiver = _find_clauses_matching(clauses_lower, [
        r"no liability.*whatsoever", r"shall not be liable.*any",
        r"excludes all liability", r"waives all.*liability",
    ])
    if waiver:
        return True, waiver, (
            "Total liability waiver detected — the other party accepts zero responsibility "
            "for any damages, even if they are at fault."
        )
    return False, [], ""


def _rule_class_action_waiver(clauses_lower, _ct):
    waiver = _find_clauses_matching(clauses_lower, [r"class action", r"waive.*right.*class", r"individual capacity"])
    if waiver:
        return True, waiver, (
            "Class action waiver detected — you cannot join a group lawsuit, forcing you "
            "to fight the company alone which is expensive and often impractical."
        )
    return False, [], ""


def _rule_foreclosure_no_notice(clauses_lower, _ct):
    foreclosure = _find_clauses_matching(clauses_lower, [r"foreclosure", r"seize.*collateral", r"repossess"])
    no_notice = _find_clauses_matching(clauses_lower, [r"waive.*notice.*foreclosure", r"without.*notice.*foreclosure", r"waive.*right.*notice"])
    if foreclosure and no_notice:
        matched = list(set(foreclosure + no_notice))
        return True, matched, (
            "Foreclosure can proceed without notifying you first. You could lose your "
            "collateral or property with no time to respond or cure the default."
        )
    return False, [], ""


def _rule_indemnification_uncapped(clauses_lower, _ct):
    indem = _find_clauses_matching(clauses_lower, [r"indemnif", r"hold harmless"])
    uncapped = not _any_clause_matches(clauses_lower, [r"cap on indem", r"maximum.*indem", r"not exceed.*indem", r"limited to"])
    no_mutual = not _any_clause_matches(clauses_lower, [r"mutual.*indemnif", r"each party.*indemnif"])
    if indem and uncapped and no_mutual:
        return True, indem, (
            "One-sided, uncapped indemnification — you could be liable for unlimited costs "
            "without any reciprocal protection."
        )
    return False, [], ""


def _rule_perpetual_license(clauses_lower, _ct):
    perp = _find_clauses_matching(clauses_lower, [r"perpetual licen[sc]e", r"irrevocable.*licen[sc]e", r"forever.*licen[sc]e"])
    if perp:
        return True, perp, (
            "Perpetual or irrevocable license granted — once given, this right cannot be "
            "taken back even after the contract ends."
        )
    return False, [], ""


def _rule_data_retention_post_termination(clauses_lower, _ct):
    retention = _find_clauses_matching(clauses_lower, [
        r"retain.*data.*after.*terminat", r"keep.*data.*terminat",
        r"retains the right.*data", r"data.*after.*expir",
    ])
    if retention:
        return True, retention, (
            "The other party retains your data after the contract ends. Your sensitive "
            "information remains in their systems indefinitely."
        )
    return False, [], ""


def _rule_maintenance_all_tenant(clauses_lower, ct):
    if ct not in ("rental", "any"):
        return False, [], ""
    maint = _find_clauses_matching(clauses_lower, [
        r"tenant.*responsible.*(?:all|any).*(?:maintenance|repair)",
        r"(?:all|any).*(?:maintenance|repair).*tenant",
    ])
    if maint:
        return True, maint, (
            "Tenant is responsible for ALL maintenance and repairs. Normally major repairs "
            "are the landlord's responsibility — this shifts significant cost to you."
        )
    return False, [], ""


def _rule_acceleration_clause(clauses_lower, ct):
    if ct not in ("loan", "any"):
        return False, [], ""
    accel = _find_clauses_matching(clauses_lower, [r"accelerat.*(?:entire|full|outstanding).*balance", r"(?:entire|full).*balance.*immediately"])
    if accel:
        return True, accel, (
            "Acceleration clause detected — the lender can demand the ENTIRE remaining "
            "balance immediately upon default. One missed payment could trigger full repayment."
        )
    return False, [], ""


def _rule_non_disparagement(clauses_lower, _ct):
    nd = _find_clauses_matching(clauses_lower, [r"non[- ]?disparagement", r"shall not.*disparag", r"refrain.*negative.*statement"])
    if nd:
        return True, nd, (
            "Non-disparagement clause limits your ability to share negative experiences "
            "publicly. This could prevent honest reviews or whistleblowing."
        )
    return False, [], ""


def _rule_exclusive_jurisdiction_foreign(clauses_lower, _ct):
    juris = _find_clauses_matching(clauses_lower, [
        r"exclusive jurisdiction.*(?:delaware|singapore|cayman|london|new york)",
        r"governing law.*(?:delaware|singapore|cayman|london)",
    ])
    if juris:
        return True, juris, (
            "Exclusive jurisdiction is set to a specific (potentially foreign) location. "
            "If a dispute arises, you may need to travel and hire lawyers in that jurisdiction."
        )
    return False, [], ""


# ══════════════════════════════════════════════════════════════════════════════
# RULE REGISTRY
# ══════════════════════════════════════════════════════════════════════════════

_RULES = [
    # (rule_id, rule_name, severity, contract_types, condition_fn, risk_tags)
    ("RULE_RENEWAL_LOCK", "Auto-Renewal + No Easy Exit", "high-risk",
     ["saas", "any"], _rule_renewal_lock, ["financial_risk", "exit_difficulty"]),

    ("RULE_ARBITRATION_PRIVACY", "Mandatory Arbitration + Data Sharing", "high-risk",
     ["any"], _rule_arbitration_privacy, ["privacy_risk", "dispute_difficulty"]),

    ("RULE_NONCOMPETE_BROAD", "Overly Broad Non-Compete", "high-risk",
     ["employment"], _rule_noncompete_broad, ["legal_lock_in", "exit_difficulty"]),

    ("RULE_DEPOSIT_NORETURN", "Non-Refundable Security Deposit", "high-risk",
     ["rental"], _rule_deposit_noreturn, ["financial_risk"]),

    ("RULE_PENALTY_EXIT", "High Penalty + No Convenience Exit", "high-risk",
     ["any"], _rule_penalty_exit, ["financial_risk", "exit_difficulty"]),

    ("RULE_UNILATERAL_CHANGE", "Unilateral Term Changes with Short Notice", "warning",
     ["any"], _rule_unilateral_change, ["legal_lock_in"]),

    ("RULE_IP_ASSIGNMENT", "Overly Broad IP Assignment", "high-risk",
     ["employment"], _rule_ip_assignment, ["legal_lock_in"]),

    ("RULE_HIDDEN_INTEREST", "Hidden Interest Rate (No APR)", "warning",
     ["loan"], _rule_hidden_interest, ["financial_risk"]),

    ("RULE_LIABILITY_TOTAL", "Total Liability Waiver", "high-risk",
     ["any"], _rule_liability_waiver_total, ["financial_risk", "dispute_difficulty"]),

    ("RULE_CLASS_ACTION", "Class Action Waiver", "high-risk",
     ["any"], _rule_class_action_waiver, ["dispute_difficulty"]),

    ("RULE_FORECLOSURE_NO_NOTICE", "Foreclosure Without Notice", "high-risk",
     ["loan"], _rule_foreclosure_no_notice, ["financial_risk", "legal_lock_in"]),

    ("RULE_INDEM_UNCAPPED", "Uncapped One-Sided Indemnification", "high-risk",
     ["any"], _rule_indemnification_uncapped, ["financial_risk"]),

    ("RULE_PERPETUAL_LICENSE", "Perpetual / Irrevocable License", "warning",
     ["any"], _rule_perpetual_license, ["legal_lock_in"]),

    ("RULE_DATA_RETENTION", "Post-Termination Data Retention", "warning",
     ["saas", "any"], _rule_data_retention_post_termination, ["privacy_risk"]),

    ("RULE_MAINT_ALL_TENANT", "All Maintenance on Tenant", "warning",
     ["rental"], _rule_maintenance_all_tenant, ["financial_risk"]),

    ("RULE_ACCELERATION", "Loan Acceleration Clause", "warning",
     ["loan"], _rule_acceleration_clause, ["financial_risk"]),

    ("RULE_NON_DISPARAGE", "Non-Disparagement Clause", "warning",
     ["any"], _rule_non_disparagement, ["legal_lock_in"]),

    ("RULE_FOREIGN_JURISDICTION", "Exclusive Foreign Jurisdiction", "warning",
     ["any"], _rule_exclusive_jurisdiction_foreign, ["dispute_difficulty"]),
]


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_rules(
    clauses: List[str],
    contract_type: str = "general",
) -> List[RuleResult]:
    """
    Evaluate all legal rules against the contract's clauses.

    Args:
        clauses:       List of clause text strings.
        contract_type: Detected contract type ("rental", "saas", "employment", "loan", "general").

    Returns:
        List of RuleResult for rules that fired (fired=True).
    """
    clauses_lower = [c.lower() for c in clauses]
    fired_rules: List[RuleResult] = []

    for rule_id, rule_name, severity, types, condition_fn, risk_tags in _RULES:
        # Skip rules that don't apply to this contract type
        if "any" not in types and contract_type not in types:
            continue

        fired, matched, explanation = condition_fn(clauses_lower, contract_type)

        if fired:
            fired_rules.append(RuleResult(
                rule_id=rule_id,
                rule_name=rule_name,
                fired=True,
                severity=severity,
                matched_clauses=matched,
                explanation=explanation,
                risk_tags=risk_tags,
            ))

    return fired_rules


def get_rule_count() -> int:
    """Return total number of registered rules."""
    return len(_RULES)


if __name__ == "__main__":
    print(f"Rule Engine: {get_rule_count()} rules registered")
    print()

    # Quick self-test with a sample SaaS contract
    sample_clauses = [
        "This agreement shall automatically renew for successive one-year terms unless cancelled.",
        "In the event of early termination, a cancellation fee of 100% of remaining value applies.",
        "All disputes shall be resolved by mandatory binding arbitration.",
        "The company may collect and share your personal data with third parties without restriction.",
        "The company reserves the right to modify these terms with 14 days notice.",
    ]

    results = evaluate_rules(sample_clauses, contract_type="saas")
    print(f"Fired {len(results)} rules on sample SaaS contract:")
    for r in results:
        print(f"  ⚡ {r.rule_id}: {r.rule_name}")
        print(f"     Severity: {r.severity} | Clauses: {r.matched_clauses}")
        print(f"     {r.explanation}")
        print()
