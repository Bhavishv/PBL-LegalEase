"""
trap_chain_detector.py — Graph-Based Multi-Clause Relationship Intelligence.

CORE INNOVATION #2 of the Decision Intelligence Layer.

Upgraded from simple keyword matching to a graph-based system that:
  1. Builds a directed graph where nodes = clauses, edges = relationships
  2. Detects multi-clause trap patterns using template matching
  3. Scores each trap chain by danger level (0-100)
  4. Predicts real-world consequences of each trap
  5. Provides relationship graph data for frontend visualization

A 'trap chain' occurs when multiple clauses individually appear manageable
but together create a hidden, compounded risk.

Architecture position:
  Layer 4 (Decision Intelligence) → Clause Relationship Intelligence
"""

from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from knowledge_base import TRAP_CHAINS


# ══════════════════════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class TrapChainV2:
    """Enhanced trap chain result with graph data and consequence prediction."""
    name: str
    description: str
    matched_clauses: List[int] = field(default_factory=list)
    matched_keywords: List[str] = field(default_factory=list)
    danger_score: float = 0.0
    relationship_graph: Dict[str, Any] = field(default_factory=dict)
    predicted_consequence: str = ""
    risk_tags: List[str] = field(default_factory=list)
    contract_type: str = "any"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for JSON serialization."""
        return {
            "name": self.name,
            "description": self.description,
            "matched_clauses": self.matched_clauses,
            "matched_keywords": self.matched_keywords,
            "danger_score": round(self.danger_score, 1),
            "relationship_graph": self.relationship_graph,
            "predicted_consequence": self.predicted_consequence,
            "risk_tags": self.risk_tags,
        }


# ══════════════════════════════════════════════════════════════════════════════
# RELATIONSHIP TYPES
# ══════════════════════════════════════════════════════════════════════════════
# These describe how clauses interact with each other.

RELATIONSHIP_TYPES = {
    "amplifies": {
        "label": "Amplifies Risk",
        "description": "This clause makes another clause more dangerous",
        "weight": 1.5,
    },
    "enables": {
        "label": "Enables",
        "description": "This clause creates conditions for another clause to be exploited",
        "weight": 1.3,
    },
    "blocks_exit": {
        "label": "Blocks Exit",
        "description": "This clause prevents you from escaping the effect of another clause",
        "weight": 1.8,
    },
    "shifts_liability": {
        "label": "Shifts Liability",
        "description": "This clause transfers responsibility from one party to another",
        "weight": 1.6,
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# GRAPH BUILDING
# ══════════════════════════════════════════════════════════════════════════════

def _find_keyword_in_clauses(clauses_lower: List[str], keyword: str) -> List[int]:
    """Return indices of clauses containing the keyword pattern."""
    return [i for i, c in enumerate(clauses_lower) if re.search(keyword.lower(), c)]


def _build_relationship_graph(
    chain_template: Dict,
    clauses_lower: List[str],
    matched_keyword_indices: Dict[str, List[int]],
) -> Dict[str, Any]:
    """
    Build a relationship graph from the chain template.

    Returns a dict with:
      - nodes: list of {id, clause_index, keyword, label}
      - edges: list of {from, to, type, label}
    """
    relationships = chain_template.get("relationships", [])
    if not relationships:
        return {"nodes": [], "edges": []}

    nodes = {}
    edges = []

    for rel in relationships:
        from_kw = rel.get("from_kw", "")
        to_kw = rel.get("to_kw", "")
        rel_type = rel.get("type", "amplifies")
        rel_info = RELATIONSHIP_TYPES.get(rel_type, RELATIONSHIP_TYPES["amplifies"])

        # Find clause indices for each keyword
        from_indices = matched_keyword_indices.get(from_kw, [])
        to_indices = matched_keyword_indices.get(to_kw, [])

        for fi in from_indices:
            node_id_from = f"c{fi}_{from_kw[:15]}"
            if node_id_from not in nodes:
                nodes[node_id_from] = {
                    "id": node_id_from,
                    "clause_index": fi,
                    "keyword": from_kw,
                    "label": f"Clause {fi + 1}",
                }

        for ti in to_indices:
            node_id_to = f"c{ti}_{to_kw[:15]}"
            if node_id_to not in nodes:
                nodes[node_id_to] = {
                    "id": node_id_to,
                    "clause_index": ti,
                    "keyword": to_kw,
                    "label": f"Clause {ti + 1}",
                }

        # Create edges between clause pairs
        for fi in from_indices:
            for ti in to_indices:
                if fi != ti:
                    edges.append({
                        "from": f"c{fi}_{from_kw[:15]}",
                        "to": f"c{ti}_{to_kw[:15]}",
                        "type": rel_type,
                        "label": rel_info["label"],
                    })

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }


# ══════════════════════════════════════════════════════════════════════════════
# DANGER SCORING
# ══════════════════════════════════════════════════════════════════════════════

def _compute_danger_score(
    matched_count: int,
    total_keywords: int,
    graph: Dict[str, Any],
    chain_template: Dict,
) -> float:
    """
    Compute a danger score (0-100) for a detected trap chain.

    Factors:
      1. Keyword coverage: what fraction of the chain's keywords were found
      2. Relationship weight: sum of edge weights in the graph
      3. Number of clauses involved: more clauses = more dangerous
    """
    # Base score from keyword coverage (0-50)
    coverage = matched_count / max(total_keywords, 1)
    base_score = coverage * 50

    # Relationship weight bonus (0-30)
    edge_weight = 0.0
    for edge in graph.get("edges", []):
        rel_type = edge.get("type", "amplifies")
        edge_weight += RELATIONSHIP_TYPES.get(rel_type, {}).get("weight", 1.0)
    rel_score = min(30, edge_weight * 10)

    # Clause count bonus (0-20)
    clause_count = len(set(
        n["clause_index"] for n in graph.get("nodes", [])
    ))
    clause_score = min(20, clause_count * 7)

    total = base_score + rel_score + clause_score
    return min(100.0, max(0.0, total))


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def detect_trap_chains(
    clauses: List[str],
    contract_type: str = "general",
) -> List[Dict[str, Any]]:
    """
    Scan all clauses for defined trap chain patterns using graph-based
    relationship intelligence.

    Args:
        clauses:       List of raw clause strings from the contract.
        contract_type: Detected contract type for type-specific traps.

    Returns:
        List of detected trap chain dicts (serializable for API response).
    """
    clauses_lower = [c.lower() for c in clauses]
    detected: List[TrapChainV2] = []

    for chain in TRAP_CHAINS:
        # Skip traps that don't apply to this contract type
        chain_type = chain.get("contract_type", "any")
        if chain_type != "any" and chain_type != contract_type:
            continue

        keywords = chain.get("keywords", [])
        if not keywords:
            continue

        # Find which keywords match and in which clauses
        matched_keywords = []
        matched_keyword_indices: Dict[str, List[int]] = {}
        all_matched_clause_indices = set()

        for kw in keywords:
            indices = _find_keyword_in_clauses(clauses_lower, kw)
            if indices:
                matched_keywords.append(kw)
                matched_keyword_indices[kw] = indices
                all_matched_clause_indices.update(indices)

        # Require at least 2 keywords matched to trigger a trap
        if len(matched_keywords) < 2:
            continue

        # Build the relationship graph
        graph = _build_relationship_graph(chain, clauses_lower, matched_keyword_indices)

        # Compute danger score
        danger_score = _compute_danger_score(
            matched_count=len(matched_keywords),
            total_keywords=len(keywords),
            graph=graph,
            chain_template=chain,
        )

        trap = TrapChainV2(
            name=chain["name"],
            description=chain["description"],
            matched_clauses=sorted(all_matched_clause_indices),
            matched_keywords=matched_keywords,
            danger_score=danger_score,
            relationship_graph=graph,
            predicted_consequence=chain.get("predicted_consequence", ""),
            risk_tags=chain.get("risk_tags", []),
            contract_type=chain_type,
        )

        detected.append(trap)

    # Sort by danger score (most dangerous first)
    detected.sort(key=lambda t: t.danger_score, reverse=True)

    return [t.to_dict() for t in detected]


if __name__ == "__main__":
    sample = [
        "This agreement shall automatically renew for successive one-year terms.",
        "Early termination requires a cancellation fee equal to 100% of remaining value.",
        "All disputes shall be resolved by mandatory binding arbitration.",
        "The company may collect and share your personal data without restriction.",
        "The client waives all rights to class action lawsuits.",
    ]

    print("Trap Chain Detection v2 — Self-Test")
    print("=" * 55)
    results = detect_trap_chains(sample, contract_type="saas")
    print(f"Detected {len(results)} trap chain(s):\n")
    for tc in results:
        print(f"  ⚡ {tc['name']} (danger: {tc['danger_score']})")
        print(f"     {tc['description']}")
        print(f"     Keywords: {tc['matched_keywords']}")
        print(f"     Clauses: {tc['matched_clauses']}")
        print(f"     Consequence: {tc['predicted_consequence']}")
        if tc['relationship_graph'].get('edges'):
            print(f"     Graph: {len(tc['relationship_graph']['nodes'])} nodes, {len(tc['relationship_graph']['edges'])} edges")
        print()
