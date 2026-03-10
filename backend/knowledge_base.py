"""
knowledge_base.py — Static RAG knowledge base for contract risk analysis.

Contains labelled example clauses in three categories:
  - SAFE        → standard, balanced, or protective language
  - WARNING     → one-sided but common; warrants review
  - HIGH_RISK   → strongly unfair, predatory, or legally dangerous

These examples will be embedded and stored in ChromaDB.
Each entry also carries a `plain_english` explanation for UX purposes.
"""

KNOWLEDGE_BASE = [
    # ─── SAFE ───────────────────────────────────────────────────────────────
    {
        "id": "safe_01",
        "risk": "safe",
        "text": (
            "Either party may terminate this agreement with 30 days written notice "
            "to the other party."
        ),
        "plain_english": (
            "Both sides can end this contract by giving 30 days notice in writing. "
            "This is standard and fair."
        ),
    },
    {
        "id": "safe_02",
        "risk": "safe",
        "text": (
            "Payment shall be due within 30 days of invoice date. "
            "No interest shall accrue on timely payments."
        ),
        "plain_english": (
            "You must pay within 30 days of the invoice. No extra charges if "
            "you pay on time. This is reasonable."
        ),
    },
    {
        "id": "safe_03",
        "risk": "safe",
        "text": (
            "Each party shall retain ownership of its respective intellectual property. "
            "Nothing in this agreement transfers intellectual property rights."
        ),
        "plain_english": (
            "Each side keeps ownership of their own ideas and creations. "
            "Signing this doesn't give the other side your IP."
        ),
    },
    {
        "id": "safe_04",
        "risk": "safe",
        "text": (
            "This agreement may be amended by mutual written consent of both parties."
        ),
        "plain_english": (
            "Any changes to this contract must be agreed to in writing by both sides. "
            "Neither side can change it alone."
        ),
    },

    # ─── WARNING ────────────────────────────────────────────────────────────
    {
        "id": "warn_01",
        "risk": "warning",
        "text": (
            "Payment is due within 60 days of invoice date. "
            "Late payments shall accrue interest at 1.5% per month."
        ),
        "plain_english": (
            "You have 60 days to pay, but if you're late you'll be charged 1.5% "
            "monthly interest — that's 18% per year. Review if this timeline works for you."
        ),
    },
    {
        "id": "warn_02",
        "risk": "warning",
        "text": (
            "The Company reserves the right to modify these terms at any time "
            "with 14 days notice."
        ),
        "plain_english": (
            "The company can change the rules with only 14 days notice. "
            "You should check if that gives you enough time to adjust or exit."
        ),
    },
    {
        "id": "warn_03",
        "risk": "warning",
        "text": (
            "All disputes shall be resolved by binding arbitration. "
            "Each party shall bear its own legal costs."
        ),
        "plain_english": (
            "If there's a disagreement, you can't go to court — you must use an "
            "arbitrator instead, and you'll each pay your own legal fees. "
            "Arbitration can be expensive and often favors larger companies."
        ),
    },
    {
        "id": "warn_04",
        "risk": "warning",
        "text": (
            "The vendor may subcontract its obligations without prior notice to the client."
        ),
        "plain_english": (
            "The vendor can outsource your work to third parties without telling you first. "
            "This may affect quality and data security."
        ),
    },

    # ─── HIGH RISK ──────────────────────────────────────────────────────────
    {
        "id": "risk_01",
        "risk": "high-risk",
        "text": (
            "This agreement shall automatically renew for successive one-year terms "
            "unless written notice of non-renewal is provided at least 90 days "
            "prior to the end of the then-current term."
        ),
        "plain_english": (
            "⚠️ AUTO-RENEWAL TRAP: The contract silently renews every year. "
            "You must cancel 90 days before it ends or you're locked in for another year."
        ),
    },
    {
        "id": "risk_02",
        "risk": "high-risk",
        "text": (
            "In the event of early termination, the client shall pay a cancellation fee "
            "equal to 100% of the remaining contract value."
        ),
        "plain_english": (
            "⚠️ CANCELLATION PENALTY: If you leave early, you must pay 100% of what "
            "remains in the contract. This means you have to pay even if you stop using the service."
        ),
    },
    {
        "id": "risk_03",
        "risk": "high-risk",
        "text": (
            "The client waives all rights to class action lawsuits and agrees that "
            "any claims shall be brought solely in an individual capacity."
        ),
        "plain_english": (
            "⚠️ CLASS ACTION WAIVER: You give up your right to join a group lawsuit. "
            "If many people are harmed, each must fight the company alone — this protects "
            "the company from accountability."
        ),
    },
    {
        "id": "risk_04",
        "risk": "high-risk",
        "text": (
            "The vendor shall have no liability for any indirect, incidental, consequential, "
            "or punitive damages, regardless of cause, even if advised of the possibility."
        ),
        "plain_english": (
            "⚠️ LIABILITY WAIVER: The vendor is shielded from almost all financial consequences "
            "if something goes wrong, even if they knew it could happen."
        ),
    },
    {
        "id": "risk_05",
        "risk": "high-risk",
        "text": (
            "The company may collect, use, and share your personal data with third parties "
            "for any purpose without restriction."
        ),
        "plain_english": (
            "⚠️ PRIVACY RISK: Your personal data can be shared freely with anyone for any reason. "
            "You have no control over how it's used."
        ),
    },
    {
        "id": "risk_06",
        "risk": "high-risk",
        "text": (
            "Client shall indemnify and hold harmless the vendor for any and all "
            "claims, losses, and expenses, including legal fees, arising out of "
            "the client's use of the services."
        ),
        "plain_english": (
            "⚠️ UNCAPPED INDEMNIFICATION: If anyone sues the vendor for anything related to "
            "your use of their service, you are responsible for all their costs — even if "
            "it wasn't your fault."
        ),
    },
]

# ── Trap chain definitions ────────────────────────────────────────────────────
# A 'trap chain' is when several clauses combine to create a hidden danger.
TRAP_CHAINS = [
    {
        "name": "Auto-Renewal Trap",
        "description": (
            "Auto-renewal combined with a long cancellation notice period and "
            "high early-termination fee creates a financial trap."
        ),
        "risk_ids": ["risk_01", "risk_02"],      # IDs of matching clauses
        "keywords": ["automatically renew", "cancellation fee", "early termination"],
    },
    {
        "name": "Liability Shield + Indemnification Trap",
        "description": (
            "The vendor has no liability for damages, yet you are fully responsible "
            "for any claims against the vendor arising from your use."
        ),
        "risk_ids": ["risk_04", "risk_06"],
        "keywords": ["no liability", "indemnify", "hold harmless"],
    },
    {
        "name": "Privacy + Class Action Waiver Trap",
        "description": (
            "Your data is shared freely, but you can't join a class action to "
            "challenge the company — you must fight alone."
        ),
        "risk_ids": ["risk_03", "risk_05"],
        "keywords": ["personal data", "share", "class action", "waives"],
    },
]
