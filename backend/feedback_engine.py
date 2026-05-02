"""
feedback_engine.py — Continuous Learning & AI Fine-tuning Loop.
Collects user feedback (thumbs up/down) to retrain Tier 2 models.
"""

import os
import json
import time
from typing import List, Dict, Any

FEEDBACK_LOG = "retraining_queue.jsonl"

def log_feedback(clause_text: str, predicted_risk: str, user_correction: str, is_accurate: bool):
    """
    Saves feedback to a JSONL file for periodic fine-tuning.
    """
    entry = {
        "timestamp": time.time(),
        "text": clause_text,
        "prediction": predicted_risk,
        "label": user_correction if not is_accurate else predicted_risk,
        "is_accurate": is_accurate
    }
    
    with open(FEEDBACK_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

def get_retraining_stats() -> Dict[str, Any]:
    if not os.path.exists(FEEDBACK_LOG):
        return {"total": 0, "accuracy": 0}
    
    entries = []
    with open(FEEDBACK_LOG, "r", encoding="utf-8") as f:
        for line in f:
            entries.append(json.loads(line))
    
    total = len(entries)
    correct = sum(1 for e in entries if e["is_accurate"])
    
    return {
        "total_feedbacks": total,
        "current_accuracy": round(correct / total, 2) if total > 0 else 0,
        "needs_retraining": total > 100 # Trigger after 100 entries
    }

def process_for_finetuning():
    """
    Converts logs into a CSV format compatible with train_model.py.
    """
    # Placeholder for logic to update cuad_classifier dataset
    pass
