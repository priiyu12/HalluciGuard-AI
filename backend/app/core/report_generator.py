from typing import Any, Dict, List, Optional, Union

from app.context_mode.document_loader import has_context
from app.context_mode.faithfulness_checker import check_faithfulness
from app.core.atomic_claim_extractor import extract_atomic_claims
from app.core.claim_extractor import normalize_sample_answers
from app.core.entity_checker import compare_entities
from app.core.nli_checker import nli_checker
from app.core.risk_scorer import calculate_claim_risk, calculate_overall_risk
from app.core.uncertainty import compute_uncertainty_breakdown


DISCLAIMER = (
    "This score is a heuristic risk estimate indicating semantic instability, "
    "entity contradictions, and optional context faithfulness signals. It does "
    "not guarantee or prove absolute factual truth."
)


def generate_report(
    question: str,
    llm_answer: str,
    raw_samples: Optional[Union[List[str], str]] = None,
    context_text: Optional[str] = None,
) -> Dict[str, Any]:
    normalized_samples = normalize_sample_answers(raw_samples)
    analysis_mode = _analysis_mode(normalized_samples)
    atomic_claims = extract_atomic_claims(llm_answer)
    claim_texts = [item["atomic_claim"] for item in atomic_claims]

    if not claim_texts:
        return {
            "analysis_mode": analysis_mode,
            "confidence_note": _confidence_note(analysis_mode),
            "risk_score": 0,
            "risk_level": "Low",
            "uncertainty_score": 0,
            "similarity_score": 0,
            "verdict": "Empty answer. No claims to analyze.",
            "claims": [],
            "entity_warnings": [],
            "highlighted_answer": [],
            "atomic_claims": [],
            "uncertainty_breakdown": {},
            "context_evidence": [],
            "disclaimer": DISCLAIMER,
        }

    claim_results: List[Dict[str, Any]] = []
    entity_warnings: List[Dict[str, Any]] = []
    seen_warnings = set()

    for atomic in atomic_claims:
        claim = atomic["atomic_claim"]
        result = calculate_claim_risk(claim, normalized_samples, analysis_mode=analysis_mode)
        result.update(
            {
                "atomic_claim": claim,
                "source_sentence": atomic["source_sentence"],
                "claim_type": atomic["claim_type"],
                "nli_scores": nli_checker.score_claim(claim, normalized_samples) if normalized_samples else None,
            }
        )
        claim_results.append(result)

        for warning in compare_entities(claim, normalized_samples):
            warning_key = (warning["type"], warning["original"], tuple(warning["conflicting_values"]))
            if warning_key not in seen_warnings:
                seen_warnings.add(warning_key)
                entity_warnings.append(warning)

    overall = calculate_overall_risk(claim_results, normalized_samples, analysis_mode=analysis_mode)
    uncertainty_breakdown = compute_uncertainty_breakdown(
        claims=claim_texts,
        sample_answers=normalized_samples,
        claim_results=claim_results,
        entity_warnings=entity_warnings,
        analysis_mode=analysis_mode,
    )

    if uncertainty_breakdown:
        overall["uncertainty_score"] = uncertainty_breakdown["overall_uncertainty_score"]

    context_evidence = check_faithfulness(claim_texts, context_text) if has_context(context_text) else []

    return {
        "analysis_mode": analysis_mode,
        "confidence_note": _confidence_note(analysis_mode),
        "risk_score": overall["risk_score"],
        "risk_level": overall["risk_level"],
        "uncertainty_score": overall["uncertainty_score"],
        "similarity_score": overall["similarity_score"],
        "verdict": _contextual_verdict(overall["verdict"], context_evidence),
        "claims": claim_results,
        "entity_warnings": entity_warnings,
        "highlighted_answer": [
            {"text": claim_result["claim"], "risk": claim_result["risk"]}
            for claim_result in claim_results
        ],
        "atomic_claims": atomic_claims,
        "uncertainty_breakdown": uncertainty_breakdown,
        "context_evidence": context_evidence,
        "disclaimer": DISCLAIMER,
    }


def _analysis_mode(samples: List[str]) -> str:
    if len(samples) >= 2:
        return "full_reference_free"
    if len(samples) == 1:
        return "partial_reference_free"
    return "single_answer_limited"


def _confidence_note(mode: str) -> str:
    notes = {
        "full_reference_free": "Full reference-free analysis: multiple samples allow semantic stability and factual divergence checks.",
        "partial_reference_free": "At least 2 sample answers are recommended for reliable reference-free detection.",
        "single_answer_limited": "No sample answers provided. Running limited single-answer analysis. Self-consistency detection will be weaker.",
    }
    return notes[mode]


def _contextual_verdict(verdict: str, context_evidence: List[Dict[str, Any]]) -> str:
    if not context_evidence:
        return verdict
    contradicted = sum(1 for item in context_evidence if item["status"] == "Contradicted")
    supported = sum(1 for item in context_evidence if item["status"] == "Supported")
    if contradicted:
        return f"{verdict} Context-grounded mode found {contradicted} contradicted claim(s)."
    if supported:
        return f"{verdict} Context-grounded mode found {supported} supported claim(s)."
    return f"{verdict} Context-grounded mode did not find enough evidence for the extracted claims."
