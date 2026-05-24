from typing import Any, Dict, List

import numpy as np

from app.core.entity_checker import compare_entities
from app.core.similarity import calculate_answer_stability, compare_claim_with_samples


def compute_uncertainty_breakdown(
    claims: List[str],
    sample_answers: List[str],
    claim_results: List[Dict[str, Any]],
    entity_warnings: List[Dict[str, Any]],
    analysis_mode: str,
) -> Dict[str, Any]:
    sample_disagreement = _sample_disagreement(sample_answers)
    entity_instability = _entity_instability(claims, sample_answers, entity_warnings)
    semantic_variance = _semantic_variance(claims, sample_answers)
    contradiction_uncertainty = _contradiction_uncertainty(claim_results)

    mode_penalty = {
        "full_reference_free": 0,
        "partial_reference_free": 20,
        "single_answer_limited": 35,
    }.get(analysis_mode, 10)

    overall = int(
        round(
            0.25 * sample_disagreement
            + 0.25 * entity_instability
            + 0.25 * semantic_variance
            + 0.25 * contradiction_uncertainty
            + mode_penalty
        )
    )
    overall = max(0, min(100, overall))

    return {
        "sample_disagreement_score": sample_disagreement,
        "entity_instability_score": entity_instability,
        "semantic_variance_score": semantic_variance,
        "contradiction_uncertainty_score": contradiction_uncertainty,
        "overall_uncertainty_score": overall,
        "explanation": _explain_uncertainty(analysis_mode, overall),
    }


def _sample_disagreement(sample_answers: List[str]) -> int:
    if not sample_answers:
        return 100
    if len(sample_answers) == 1:
        return 70
    stability = calculate_answer_stability(sample_answers)
    return int(round((1.0 - stability) * 100))


def _entity_instability(
    claims: List[str],
    sample_answers: List[str],
    entity_warnings: List[Dict[str, Any]],
) -> int:
    if not sample_answers:
        return 60 if claims else 0
    warning_count = len(entity_warnings)
    claim_count = max(1, len(claims))
    return max(0, min(100, int(round((warning_count / claim_count) * 45))))


def _semantic_variance(claims: List[str], sample_answers: List[str]) -> int:
    if not sample_answers:
        return 100
    if not claims:
        return 0
    variances = []
    for claim in claims:
        sim_data = compare_claim_with_samples(claim, sample_answers)
        variances.append(1.0 - sim_data["average_similarity"])
    return int(round(float(np.mean(variances)) * 100))


def _contradiction_uncertainty(claim_results: List[Dict[str, Any]]) -> int:
    if not claim_results:
        return 0
    contradiction_scores = [item.get("contradiction_score", 0) for item in claim_results]
    support_scores = [item.get("support_score", 0) for item in claim_results]
    return int(round(0.5 * np.mean(contradiction_scores) + 0.5 * (100 - np.mean(support_scores))))


def _explain_uncertainty(analysis_mode: str, score: int) -> str:
    if analysis_mode == "single_answer_limited":
        return "Limited mode: no alternative samples were provided, so uncertainty is driven by internal specificity checks."
    if analysis_mode == "partial_reference_free":
        return "Partial mode: one sample provides some support, but self-consistency confidence is reduced."
    if score >= 65:
        return "High uncertainty: sampled answers diverge semantically or disagree on factual values."
    if score >= 35:
        return "Moderate uncertainty: samples provide mixed or incomplete support."
    return "Low uncertainty: samples are semantically stable with few factual mismatches."
