"""
trap_chain_detector.py — Advanced Graph-based Trap Chain Detection.
Uses NetworkX to identify predatory relationships between contract clauses.
"""

from __future__ import annotations
import uuid
import networkx as nx
from typing import List, Dict, Any

# Define predatory relationships between clause types
# Format: (Source Clause Type, Target Clause Type, Weight/Severity)
PREDATORY_EDGES = [
    ("Auto-Renewal", "Short Cancellation Window", 0.9),
    ("Auto-Renewal", "Late Fee", 0.7),
    ("Unlimited Liability", "Indemnification", 0.95),
    ("Unlimited Liability", "Governing Law (Foreign)", 0.8),
    ("No Liability", "Data Sharing", 0.85),
    ("Binding Arbitration", "Foreign Jurisdiction", 0.9),
    ("Unilateral Amendment", "No Cancellation Right", 0.95),
    ("Strict Cancellation", "Liquidated Damages", 0.8),
]

def detect_trap_chains(clauses_with_types: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Builds a graph of the contract and finds 'trap chains' using Tarjan's SCC 
    and path-based severity analysis.
    
    Args:
        clauses_with_types: List of dicts with {index, text, type, risk_level}
        
    Returns:
        List of detected trap chain dicts.
    """
    G = nx.DiGraph()
    
    # 1. Add nodes for each identified risky clause
    risky_indices = [c for c in clauses_with_types if c["risk_level"] in ("high", "warning")]
    for c in risky_indices:
        G.add_node(c["index"], type=c["type"], text=c["text"])
        
    # 2. Add edges based on predatory relationships
    for i in range(len(risky_indices)):
        for j in range(len(risky_indices)):
            if i == j: continue
            
            u = risky_indices[i]
            v = risky_indices[j]
            
            # Check if there is a predatory link defined between these types
            for src_type, tgt_type, weight in PREDATORY_EDGES:
                # We do a loose check on type (case-insensitive, partial match)
                if src_type.lower() in u["type"].lower() and tgt_type.lower() in v["type"].lower():
                    G.add_edge(u["index"], v["index"], weight=weight, relation=f"{src_type} -> {tgt_type}")

    detected_chains = []
    
    # 3. Use Tarjan's to find Strongly Connected Components (Cyclic Traps)
    sccs = list(nx.strongly_connected_components(G))
    for scc in sccs:
        if len(scc) > 1:
            chain_indices = sorted(list(scc))
            severity = sum(G.nodes[idx].get("weight", 0.5) for idx in chain_indices) / len(chain_indices)
            
            detected_chains.append({
                "id": f"trap_cycle_{uuid.uuid4().hex[:6]}",
                "type": "Predatory Cycle",
                "involved_indices": chain_indices,
                "reason": "These clauses form a circular dependency that makes termination nearly impossible.",
                "remedy": "Negotiate to break the cycle by adding a clear 'Termination for Convenience' clause.",
                "severity_score": min(1.0, severity + 0.2)
            })

    # 4. Find Simple Paths (Linear Traps)
    # We look for any edge that exists and flag it as a chain if it's a known predatory link
    for u_idx, v_idx, data in G.edges(data=True):
        if not any(u_idx in c["involved_indices"] and v_idx in c["involved_indices"] for c in detected_chains):
            detected_chains.append({
                "id": f"trap_link_{uuid.uuid4().hex[:6]}",
                "type": "Predatory Link",
                "involved_indices": [u_idx, v_idx],
                "reason": f"Combined risk: {data['relation']}. The {G.nodes[u_idx]['type']} clause is worsened by the {G.nodes[v_idx]['type']} clause.",
                "remedy": "Either remove one clause or add a balancing safeguard.",
                "severity_score": data["weight"]
            })

    return detected_chains
