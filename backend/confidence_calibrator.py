"""
confidence_calibrator.py — Prediction Confidence Stability Analysis.

CORE INNOVATION #3 of the Decision Intelligence Layer.

Analyzes agreement/disagreement across all classification models and assigns
a stability score. When models contradict each other (e.g., CUAD says
high-risk but SBERT says safe), the system detects the instability and
recommends manual review instead of blindly forcing a prediction.

This demonstrates that the system knows *when it doesn't know* — a hallmark
of mature, trustworthy AI systems.

Architecture position:
  Layer 4 (Decision Intelligence) → Confidence Calibration Layer
  Runs AFTER all classifiers, BEFORE final risk assignment.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Tuple


@dataclass
class CalibrationResult:
    """Result of confidence calibration across multiple models."""
    stability_score: float           # 0.0–1.0 (1.0 = perfect agreement)
    stability_label: str             # "High Confidence" | "Moderate" | "Low" | "Manual Review"
    model_agreement: Dict[str, str]  # {model_name: predicted_risk_level}
    disagreement_details: str        # human-readable disagreement summary
    recommendation: str              # "Prediction is stable" or "Manual review recommended"

    def to_dict(self) -> dict:
        return {
            "stability_score": round(self.stability_score, 3),
            "stability_label": self.stability_label,
            "model_agreement": self.model_agreement,
            "disagreement_details": self.disagreement_details,
            "recommendation": self.recommendation,
        }


# ── Risk level ordering for distance calculation ──────────────────────────────
_RISK_ORDER = {"safe": 0, "warning": 1, "high-risk": 2}


def _risk_distance(level_a: str, level_b: str) -> int:
    """Distance between two risk levels (0, 1, or 2)."""
    return abs(_RISK_ORDER.get(level_a, 0) - _RISK_ORDER.get(level_b, 0))


def _majority_vote(predictions: List[Tuple[str, float]]) -> str:
    """Return the risk level with the most votes, weighted by confidence."""
    scores = {"safe": 0.0, "warning": 0.0, "high-risk": 0.0}
    for level, conf in predictions:
        if level in scores:
            scores[level] += conf
    return max(scores, key=scores.get)


def calibrate_prediction(
    cuad_result: Optional[Tuple[str, float]] = None,
    sbert_result: Optional[Tuple[str, float]] = None,
    tfidf_result: Optional[Tuple[str, float]] = None,
    keyword_result: Optional[Tuple[str, float]] = None,
    rule_engine_fired: bool = False,
    rule_engine_severity: Optional[str] = None,
) -> CalibrationResult:
    """
    Analyze prediction stability across all available classifiers.

    Args:
        cuad_result:          (risk_level, confidence) from CUAD model, or None
        sbert_result:         (risk_level, confidence) from SBERT, or None
        tfidf_result:         (risk_level, confidence) from TF-IDF KB, or None
        keyword_result:       (risk_level, confidence) from keyword heuristics, or None
        rule_engine_fired:    True if any rule engine rule fired for this clause
        rule_engine_severity: severity from rule engine ("high-risk" | "warning"), or None

    Returns:
        CalibrationResult with stability score, label, and recommendation.
    """
    # Collect all available predictions
    model_agreement: Dict[str, str] = {}
    predictions: List[Tuple[str, float]] = []

    if cuad_result:
        model_agreement["CUAD Model"] = cuad_result[0]
        predictions.append(cuad_result)

    if sbert_result:
        model_agreement["SBERT"] = sbert_result[0]
        predictions.append(sbert_result)

    if tfidf_result:
        model_agreement["TF-IDF KB"] = tfidf_result[0]
        predictions.append(tfidf_result)

    if keyword_result:
        model_agreement["Keywords"] = keyword_result[0]
        predictions.append(keyword_result)

    if rule_engine_fired and rule_engine_severity:
        model_agreement["Rule Engine"] = rule_engine_severity
        predictions.append((rule_engine_severity, 0.90))  # high confidence for rules

    # ── Edge case: fewer than 2 models available ──────────────────────────
    if len(predictions) < 2:
        return CalibrationResult(
            stability_score=0.5,
            stability_label="Moderate Confidence",
            model_agreement=model_agreement,
            disagreement_details="Only one classifier available — limited cross-validation.",
            recommendation="Consider results with caution — single-model prediction.",
        )

    # ── Calculate agreement score ─────────────────────────────────────────
    # Compare all pairs of predictions and compute average distance
    total_distance = 0
    pair_count = 0
    for i in range(len(predictions)):
        for j in range(i + 1, len(predictions)):
            dist = _risk_distance(predictions[i][0], predictions[j][0])
            # Weight by confidence of both models
            avg_conf = (predictions[i][1] + predictions[j][1]) / 2
            total_distance += dist * avg_conf
            pair_count += 1

    avg_distance = total_distance / pair_count if pair_count > 0 else 0

    # Normalize: max possible distance is 2.0 (safe vs high-risk at 1.0 conf)
    # stability = 1.0 - normalized_distance
    stability_score = max(0.0, min(1.0, 1.0 - (avg_distance / 2.0)))

    # ── Check for high-confidence contradictions ──────────────────────────
    # Special case: two high-confidence models directly contradict
    high_conf_predictions = [(level, conf) for level, conf in predictions if conf >= 0.7]
    has_direct_contradiction = False
    contradiction_detail = ""

    if len(high_conf_predictions) >= 2:
        levels = set(level for level, _ in high_conf_predictions)
        if "safe" in levels and "high-risk" in levels:
            has_direct_contradiction = True
            # Find which models are contradicting
            safe_models = [m for m, l in model_agreement.items() if l == "safe"]
            risk_models = [m for m, l in model_agreement.items() if l == "high-risk"]
            contradiction_detail = (
                f"{', '.join(risk_models)} predict(s) high-risk but "
                f"{', '.join(safe_models)} predict(s) safe"
            )
            # Force stability down
            stability_score = min(stability_score, 0.25)

    # ── Determine stability label ─────────────────────────────────────────
    if has_direct_contradiction or stability_score < 0.3:
        stability_label = "Manual Review Recommended"
        recommendation = (
            "Models strongly disagree on this clause. "
            "A human reviewer should examine it before making a decision."
        )
    elif stability_score < 0.5:
        stability_label = "Low Confidence"
        recommendation = (
            "Prediction stability is low. "
            "Review this clause carefully — the risk level may not be accurate."
        )
    elif stability_score < 0.8:
        stability_label = "Moderate Confidence"
        recommendation = "Most models agree. Prediction is reasonably stable."
    else:
        stability_label = "High Confidence"
        recommendation = "All models agree on this prediction. High stability."

    # ── Build disagreement details ────────────────────────────────────────
    if not contradiction_detail:
        unique_levels = set(model_agreement.values())
        if len(unique_levels) == 1:
            contradiction_detail = f"All models agree: {unique_levels.pop()}"
        else:
            parts = [f"{model}: {level}" for model, level in model_agreement.items()]
            contradiction_detail = "Model predictions: " + ", ".join(parts)

    return CalibrationResult(
        stability_score=round(stability_score, 3),
        stability_label=stability_label,
        model_agreement=model_agreement,
        disagreement_details=contradiction_detail,
        recommendation=recommendation,
    )


if __name__ == "__main__":
    print("Confidence Calibrator — Self-Test")
    print("=" * 50)

    # Test 1: All agree
    r1 = calibrate_prediction(
        cuad_result=("high-risk", 0.85),
        sbert_result=("high-risk", 0.78),
        keyword_result=("high-risk", 0.80),
    )
    print(f"\n1. All agree (high-risk):")
    print(f"   Stability: {r1.stability_score} → {r1.stability_label}")

    # Test 2: Minor disagreement
    r2 = calibrate_prediction(
        cuad_result=("high-risk", 0.75),
        sbert_result=("warning", 0.65),
        keyword_result=("high-risk", 0.80),
    )
    print(f"\n2. Minor disagreement:")
    print(f"   Stability: {r2.stability_score} → {r2.stability_label}")

    # Test 3: Direct contradiction
    r3 = calibrate_prediction(
        cuad_result=("high-risk", 0.90),
        sbert_result=("safe", 0.85),
        keyword_result=("warning", 0.70),
    )
    print(f"\n3. Direct contradiction:")
    print(f"   Stability: {r3.stability_score} → {r3.stability_label}")
    print(f"   Detail: {r3.disagreement_details}")
    print(f"   Recommendation: {r3.recommendation}")
