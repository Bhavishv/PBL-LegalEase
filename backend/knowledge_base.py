"""
knowledge_base.py — Static RAG knowledge base for contract risk analysis.

Contains labelled example clauses in three categories:
  - SAFE        → standard, balanced, or protective language
  - WARNING     → one-sided but common; warrants review
  - HIGH_RISK   → strongly unfair, predatory, or legally dangerous

Each entry carries:
  - id, risk, text, plain_english (existing)
  - contract_type : which contract type this is most relevant to ("any" = universal)
  - severity_tags : risk dimensions this clause affects

These examples are embedded and compared via TF-IDF / SBERT similarity.
"""

KNOWLEDGE_BASE = [
    # ═══════════════════════════════════════════════════════════════════════════
    # SAFE
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "id": "safe_01",
        "risk": "safe",
        "contract_type": "any",
        "severity_tags": [],
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
        "contract_type": "any",
        "severity_tags": [],
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
        "contract_type": "any",
        "severity_tags": [],
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
        "contract_type": "any",
        "severity_tags": [],
        "text": (
            "This agreement may be amended by mutual written consent of both parties."
        ),
        "plain_english": (
            "Any changes to this contract must be agreed to in writing by both sides. "
            "Neither side can change it alone."
        ),
    },
    {
        "id": "safe_05",
        "risk": "safe",
        "contract_type": "rental",
        "severity_tags": [],
        "text": (
            "The landlord shall return the security deposit within 30 days of "
            "lease termination, minus any documented damages."
        ),
        "plain_english": (
            "Your deposit comes back within 30 days after you move out, minus any "
            "damage costs that are documented. This is fair and standard."
        ),
    },
    {
        "id": "safe_06",
        "risk": "safe",
        "contract_type": "employment",
        "severity_tags": [],
        "text": (
            "The employee shall be entitled to 15 days of paid time off per year, "
            "accruing on a monthly basis."
        ),
        "plain_english": (
            "You get 15 days of paid vacation per year, building up each month. "
            "This is a standard employee benefit."
        ),
    },
    {
        "id": "safe_07",
        "risk": "safe",
        "contract_type": "saas",
        "severity_tags": [],
        "text": (
            "The service provider guarantees 99.9% uptime measured on a monthly basis. "
            "Service credits will be issued for any downtime exceeding the SLA."
        ),
        "plain_english": (
            "The service should be available 99.9% of the time. If it's not, you "
            "get credits. This is a fair and common SLA commitment."
        ),
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # WARNING
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "id": "warn_01",
        "risk": "warning",
        "contract_type": "any",
        "severity_tags": ["financial_risk"],
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
        "contract_type": "saas",
        "severity_tags": ["legal_lock_in"],
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
        "contract_type": "any",
        "severity_tags": ["dispute_difficulty"],
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
        "contract_type": "any",
        "severity_tags": ["privacy_risk"],
        "text": (
            "The vendor may subcontract its obligations without prior notice to the client."
        ),
        "plain_english": (
            "The vendor can outsource your work to third parties without telling you first. "
            "This may affect quality and data security."
        ),
    },
    {
        "id": "warn_05",
        "risk": "warning",
        "contract_type": "loan",
        "severity_tags": ["financial_risk"],
        "text": (
            "A late payment fee of 2% of the outstanding balance will be charged "
            "for each month the payment remains overdue."
        ),
        "plain_english": (
            "If you miss a payment, you'll be charged 2% of your balance each month. "
            "This adds up quickly — review the total cost of being late."
        ),
    },
    {
        "id": "warn_06",
        "risk": "warning",
        "contract_type": "rental",
        "severity_tags": ["financial_risk"],
        "text": (
            "The tenant shall be responsible for all maintenance and repairs to the "
            "premises during the term of the lease."
        ),
        "plain_english": (
            "You pay for ALL repairs and maintenance — even things that normally "
            "the landlord would handle. Review what this includes carefully."
        ),
    },
    {
        "id": "warn_07",
        "risk": "warning",
        "contract_type": "employment",
        "severity_tags": ["legal_lock_in"],
        "text": (
            "The employee agrees to a non-compete restriction for a period of "
            "one year within the same metropolitan area after termination."
        ),
        "plain_english": (
            "After leaving, you can't work for competitors in the same city for 1 year. "
            "This is restrictive but within typical limits for employment contracts."
        ),
    },
    {
        "id": "warn_08",
        "risk": "warning",
        "contract_type": "saas",
        "severity_tags": ["exit_difficulty"],
        "text": (
            "Upon termination, all user data will be deleted within 30 days. "
            "The client must export data before the termination date."
        ),
        "plain_english": (
            "When the contract ends, your data gets deleted in 30 days. Make sure "
            "you export everything before cancelling or you'll lose it."
        ),
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # HIGH RISK
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "id": "risk_01",
        "risk": "high-risk",
        "contract_type": "saas",
        "severity_tags": ["financial_risk", "exit_difficulty", "legal_lock_in"],
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
        "contract_type": "any",
        "severity_tags": ["financial_risk", "exit_difficulty"],
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
        "contract_type": "any",
        "severity_tags": ["dispute_difficulty", "legal_lock_in"],
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
        "contract_type": "any",
        "severity_tags": ["financial_risk", "dispute_difficulty"],
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
        "contract_type": "any",
        "severity_tags": ["privacy_risk"],
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
        "contract_type": "any",
        "severity_tags": ["financial_risk", "legal_lock_in"],
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
    {
        "id": "risk_07",
        "risk": "high-risk",
        "contract_type": "employment",
        "severity_tags": ["legal_lock_in", "exit_difficulty"],
        "text": (
            "The employee agrees to a non-compete restriction for a period of five years "
            "worldwide, covering all industries related to the company's business."
        ),
        "plain_english": (
            "⚠️ ABUSIVE NON-COMPETE: You can't work in ANY related industry ANYWHERE in "
            "the world for 5 years after leaving. This is unreasonably broad and may be "
            "unenforceable in many jurisdictions."
        ),
    },
    {
        "id": "risk_08",
        "risk": "high-risk",
        "contract_type": "employment",
        "severity_tags": ["legal_lock_in"],
        "text": (
            "All intellectual property created by the employee during the term of "
            "employment, including work done outside of business hours, shall be "
            "the exclusive property of the employer."
        ),
        "plain_english": (
            "⚠️ TOTAL IP GRAB: Everything you create — even personal projects done on "
            "your own time — belongs to the company. This is overly broad."
        ),
    },
    {
        "id": "risk_09",
        "risk": "high-risk",
        "contract_type": "rental",
        "severity_tags": ["financial_risk", "exit_difficulty"],
        "text": (
            "The security deposit is non-refundable and shall be retained by the "
            "landlord regardless of the condition of the premises at lease termination."
        ),
        "plain_english": (
            "⚠️ NON-REFUNDABLE DEPOSIT: You will never get your deposit back, no matter "
            "how well you maintain the property. This is unfair and may be illegal in some areas."
        ),
    },
    {
        "id": "risk_10",
        "risk": "high-risk",
        "contract_type": "loan",
        "severity_tags": ["financial_risk"],
        "text": (
            "In the event of default, the lender may accelerate the entire outstanding "
            "balance and apply a penalty interest rate of 25% per annum."
        ),
        "plain_english": (
            "⚠️ PREDATORY DEFAULT TERMS: If you miss a payment, the full loan becomes due "
            "immediately AND the interest jumps to 25% per year. This can lead to a debt spiral."
        ),
    },
    {
        "id": "risk_11",
        "risk": "high-risk",
        "contract_type": "loan",
        "severity_tags": ["financial_risk", "legal_lock_in"],
        "text": (
            "The borrower waives any right to notice before foreclosure proceedings "
            "are initiated by the lender."
        ),
        "plain_english": (
            "⚠️ NO FORECLOSURE NOTICE: The lender can start taking your collateral without "
            "warning you first. You could lose your property with no time to respond."
        ),
    },
    {
        "id": "risk_12",
        "risk": "high-risk",
        "contract_type": "saas",
        "severity_tags": ["privacy_risk", "exit_difficulty"],
        "text": (
            "Upon termination, the service provider retains the right to use, "
            "analyze, and derive insights from all data uploaded by the client "
            "during the term of service."
        ),
        "plain_english": (
            "⚠️ DATA HOSTAGE: Even after you leave, the company keeps and uses your data. "
            "Your proprietary information remains in their hands permanently."
        ),
    },
]


# ── Trap chain definitions ────────────────────────────────────────────────────
# A 'trap chain' is when several clauses combine to create a hidden danger.
# Each template has keywords to match AND a relationship structure for the graph.

TRAP_CHAINS = [
    # ── Universal traps ───────────────────────────────────────────────────────
    {
        "name": "Auto-Renewal Lock-In Trap",
        "description": (
            "Auto-renewal combined with a long cancellation notice period and "
            "high early-termination fee creates a financial trap — you're stuck "
            "paying even if you want out."
        ),
        "contract_type": "any",
        "risk_ids": ["risk_01", "risk_02"],
        "keywords": ["automatically renew", "auto-renew", "cancellation fee", "early termination"],
        "relationships": [
            {"from_kw": "automatically renew", "to_kw": "cancellation fee", "type": "blocks_exit"},
        ],
        "predicted_consequence": "You may be locked into payments for 1-2+ years with no way out.",
        "risk_tags": ["financial_risk", "exit_difficulty"],
    },
    {
        "name": "Liability Shield + Indemnification Trap",
        "description": (
            "The vendor has no liability for damages, yet you are fully responsible "
            "for any claims against the vendor arising from your use."
        ),
        "contract_type": "any",
        "risk_ids": ["risk_04", "risk_06"],
        "keywords": ["no liability", "not liable", "limitation of liability", "indemnify", "hold harmless"],
        "relationships": [
            {"from_kw": "no liability", "to_kw": "indemnify", "type": "shifts_liability"},
        ],
        "predicted_consequence": "If something goes wrong, you bear all the cost and the vendor bears none.",
        "risk_tags": ["financial_risk", "dispute_difficulty"],
    },
    {
        "name": "Privacy + Class Action Waiver Trap",
        "description": (
            "Your data is shared freely, but you can't join a class action to "
            "challenge the company — you must fight alone."
        ),
        "contract_type": "any",
        "risk_ids": ["risk_03", "risk_05"],
        "keywords": ["personal data", "share", "class action", "waives"],
        "relationships": [
            {"from_kw": "personal data", "to_kw": "class action", "type": "blocks_exit"},
        ],
        "predicted_consequence": "Your data can be misused and you have no practical legal recourse.",
        "risk_tags": ["privacy_risk", "dispute_difficulty"],
    },

    # ── SaaS-specific traps ───────────────────────────────────────────────────
    {
        "name": "Data Hostage Trap",
        "description": (
            "The provider keeps your data after you leave AND deletes your access. "
            "Combined with auto-renewal, this creates a vendor lock-in."
        ),
        "contract_type": "saas",
        "risk_ids": ["risk_12", "risk_01"],
        "keywords": ["retains the right", "data uploaded", "auto-renew", "automatically renew", "data will be deleted"],
        "relationships": [
            {"from_kw": "retains the right", "to_kw": "auto-renew", "type": "enables"},
        ],
        "predicted_consequence": "Leaving means losing data access while they keep using it. Staying means perpetual payments.",
        "risk_tags": ["privacy_risk", "exit_difficulty"],
    },
    {
        "name": "Unilateral Change + No Exit Trap",
        "description": (
            "The company can change terms at will with short notice, but you can't "
            "exit easily due to cancellation fees or long notice periods."
        ),
        "contract_type": "saas",
        "risk_ids": ["warn_02", "risk_02"],
        "keywords": ["modify these terms", "change.*terms", "cancellation fee", "early termination", "14 days notice"],
        "relationships": [
            {"from_kw": "modify these terms", "to_kw": "cancellation fee", "type": "amplifies"},
        ],
        "predicted_consequence": "Terms can worsen at any time and you can't leave without paying a penalty.",
        "risk_tags": ["legal_lock_in", "financial_risk"],
    },

    # ── Rental-specific traps ─────────────────────────────────────────────────
    {
        "name": "Deposit Lock-In Trap",
        "description": (
            "Non-refundable deposit combined with tenant-pays-all-maintenance "
            "creates a financial trap where the tenant pays twice."
        ),
        "contract_type": "rental",
        "risk_ids": ["risk_09", "warn_06"],
        "keywords": ["non-refundable", "security deposit", "maintenance", "repairs", "tenant shall be responsible"],
        "relationships": [
            {"from_kw": "non-refundable", "to_kw": "maintenance", "type": "amplifies"},
        ],
        "predicted_consequence": "You lose your deposit AND pay for all repairs — double financial exposure.",
        "risk_tags": ["financial_risk", "exit_difficulty"],
    },

    # ── Employment-specific traps ─────────────────────────────────────────────
    {
        "name": "Non-Compete + IP Grab Trap",
        "description": (
            "A broad non-compete prevents you from working elsewhere while the "
            "employer owns everything you create — even personal projects."
        ),
        "contract_type": "employment",
        "risk_ids": ["risk_07", "risk_08"],
        "keywords": ["non-compete", "non compete", "intellectual property", "exclusive property", "outside of business hours"],
        "relationships": [
            {"from_kw": "non-compete", "to_kw": "intellectual property", "type": "amplifies"},
        ],
        "predicted_consequence": "After leaving, you can't work in your field AND don't own your own side projects.",
        "risk_tags": ["legal_lock_in", "exit_difficulty"],
    },

    # ── Loan-specific traps ───────────────────────────────────────────────────
    {
        "name": "Hidden Penalty + No Notice Foreclosure Trap",
        "description": (
            "A harsh default penalty combined with no foreclosure notice means "
            "one missed payment can lead to asset seizure without warning."
        ),
        "contract_type": "loan",
        "risk_ids": ["risk_10", "risk_11"],
        "keywords": ["default", "penalty interest", "accelerate", "foreclosure", "waives.*notice"],
        "relationships": [
            {"from_kw": "default", "to_kw": "foreclosure", "type": "enables"},
            {"from_kw": "penalty interest", "to_kw": "accelerate", "type": "amplifies"},
        ],
        "predicted_consequence": "A single missed payment could trigger immediate full repayment demand and asset seizure.",
        "risk_tags": ["financial_risk", "legal_lock_in"],
    },
]
