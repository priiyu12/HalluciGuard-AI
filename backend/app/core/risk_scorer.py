from typing import List, Dict, Any
import numpy as np
from app.core.entity_checker import extract_entities, compare_entities
from app.core.contradiction_estimator import estimate_contradiction
from app.core.similarity import compare_claim_with_samples, calculate_answer_stability

def calculate_claim_risk(claim: str, sample_answers: List[str], analysis_mode: str = "full_reference_free") -> Dict[str, Any]:
    """
    Calculates the hallucination risk score for a single claim based on consistency,
    contradictions, and entity overlaps.
    """
    if not sample_answers:
        entities = extract_entities(claim)
        specificity = sum(len(values) for values in entities.values())
        vague_markers = ["might", "may", "possibly", "approximately", "around", "reportedly"]
        uncertainty_hint = any(marker in claim.lower() for marker in vague_markers)
        risk_score = 35 if specificity else 22
        if uncertainty_hint:
            risk_score = max(15, risk_score - 8)
        risk_level = "Medium" if risk_score > 30 else "Low"
        return {
            "claim": claim,
            "risk_score": risk_score,
            "risk": risk_level,
            "risk_level": risk_level,
            "reason": "Limited single-answer analysis: no sample-based support or contradiction was computed.",
            "support_score": 0,
            "contradiction_score": 0,
            "matched_samples": []
        }
        
    # 1. Contradiction Score (0.0 to 1.0)
    contradiction = estimate_contradiction(claim, sample_answers)
    
    # 2. Entity Mismatch Score (0.0 to 1.0)
    entities = extract_entities(claim)
    total_ents = sum(len(entities[k]) for k in entities)
    warnings = compare_entities(claim, sample_answers)
    
    if warnings:
        severity = {
            "DATE": 1.0,
            "NUMBER": 1.0,
            "PERSON": 1.0,
            "GPE": 0.75,
            "ORG": 0.65,
        }
        entity_mismatch = max(severity.get(w["type"], 0.5) for w in warnings)
    elif total_ents > 0:
        entity_mismatch = 0.0
    else:
        entity_mismatch = 0.0
    entity_mismatch = min(1.0, entity_mismatch)
    
    # 3. Similarity Data & Instability
    sim_data = compare_claim_with_samples(claim, sample_answers)
    best_score = sim_data["best_match_score"]
    avg_similarity = sim_data["average_similarity"]
    
    semantic_instability = max(0.0, 1.0 - avg_similarity)
    
    # 4. Uncertainty Score (based on best match score)
    uncertainty = max(0.0, 1.0 - best_score)
    
    # Formula execution
    risk_val = (
        0.35 * contradiction +
        0.25 * entity_mismatch +
        0.25 * semantic_instability +
        0.15 * uncertainty
    )
    
    # Normalize to 0-100 range
    risk_score = int(round(risk_val * 100))
    if analysis_mode == "partial_reference_free":
        risk_score = int(round(0.85 * risk_score + 15))
    # Keep score inside bounds
    risk_score = max(0, min(100, risk_score))
    
    # Risk Level mapping
    if risk_score <= 30:
        risk_level = "Low"
    elif risk_score <= 65:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    # Reason Generation Heuristics
    reason = "Consistent across alternative responses."
    if warnings:
        warn_types = [w["type"] for w in warnings]
        if "DATE" in warn_types:
            reason = "Date/year conflict detected across alternative samples."
        elif "NUMBER" in warn_types:
            reason = "Numeric contradiction detected in alternative samples."
        elif "PERSON" in warn_types:
            reason = "Person/entity names mismatch across samples."
        else:
            reason = "Entity mismatch (organization or location) across samples."
    elif contradiction > 0.6:
        reason = "Strong semantic contradiction with alternative samples."
    elif best_score < 0.5:
        reason = "The claim is not semantically supported by any alternative samples."
    elif avg_similarity < 0.6:
        reason = "Unstable claim: alternate samples offer different details."
        
    return {
        "claim": claim,
        "risk_score": risk_score,
        "risk": risk_level,  # Match frontend schema
        "reason": reason,
        "support_score": int(round(best_score * 100)),
        "contradiction_score": int(round(contradiction * 100)),
        "matched_samples": sim_data["matched_samples"]
    }

def calculate_overall_risk(
    claim_results: List[Dict[str, Any]],
    sample_answers: List[str],
    analysis_mode: str = "full_reference_free",
) -> Dict[str, Any]:
    """
    Aggregates claim-level results to formulate overall hallucination risk,
    uncertainty, and verdict details.
    """
    if not claim_results:
        return {
            "risk_score": 0,
            "risk_level": "Low",
            "uncertainty_score": 0,
            "similarity_score": 0,
            "verdict": "No claims analyzed."
        }
        
    # Overall risk score is a combination of average claim risk and maximum claim risk
    # This prevents a single highly hallucinated claim from being ignored
    claim_scores = [c["risk_score"] for c in claim_results]
    avg_claim_score = np.mean(claim_scores)
    max_claim_score = np.max(claim_scores)
    
    # 60% average, 40% maximum to emphasize critical vulnerabilities
    overall_risk = int(round(0.6 * avg_claim_score + 0.4 * max_claim_score))
    overall_risk = max(0, min(100, overall_risk))
    
    if overall_risk <= 30:
        risk_level = "Low"
    elif overall_risk <= 65:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    # Uncertainty is derived from the average contradiction and best-match scores
    avg_contradiction = np.mean([c["contradiction_score"] for c in claim_results])
    avg_support = np.mean([c["support_score"] for c in claim_results])
    
    # Higher stability of samples reduces overall uncertainty
    stability = calculate_answer_stability(sample_answers)
    uncertainty_val = 0.5 * (avg_contradiction) + 0.5 * (100 - avg_support)
    # Blend in stability
    uncertainty_score = int(round(0.7 * uncertainty_val + 0.3 * (100 - stability * 100)))
    if analysis_mode == "partial_reference_free":
        uncertainty_score += 15
    elif analysis_mode == "single_answer_limited":
        uncertainty_score = max(uncertainty_score, 70)
    uncertainty_score = max(0, min(100, uncertainty_score))
    
    # Determine the verdict
    if analysis_mode == "single_answer_limited":
        verdict = "Limited single-answer analysis. The response was inspected for specificity and internal risk signals, but no self-consistency check was possible without samples."
    elif analysis_mode == "partial_reference_free":
        verdict = "Partial reference-free analysis. One sample provided limited comparison signal; add more samples for stronger self-consistency detection."
    elif risk_level == "High":
        verdict = "High hallucination risk. The response contains critical claims contradicted or unsupported by generated alternative samples."
    elif risk_level == "Medium":
        verdict = "Medium hallucination risk. Factual elements (dates, names, or numbers) differ slightly across samples. Exercise caution."
    else:
        verdict = "Low hallucination risk. Factual claims are highly consistent and stable across alternative samples."
        
    return {
        "risk_score": overall_risk,
        "risk_level": risk_level,
        "uncertainty_score": uncertainty_score,
        "similarity_score": int(round(avg_support)),
        "verdict": verdict
    }
