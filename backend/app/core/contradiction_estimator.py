from typing import List
from app.core.similarity import compare_claim_with_samples
from app.core.entity_checker import compare_entities, extract_entities

def estimate_contradiction(claim: str, sample_answers: List[str]) -> float:
    """
    Estimates the contradiction score (0.0 to 1.0) for a claim against sample answers.
    This is a heuristic contradiction detector that integrates:
    - Semantic similarity of the closest matching sample (low similarity increases contradiction)
    - Person/name mismatches
    - Date/year mismatches
    - Number/cardinal mismatches
    - Location/GPE mismatches
    - Organization mismatches
    """
    if not sample_answers:
        return 1.0  # Completely unsupported/contradicted if no samples exist
        
    # 1. Calculate semantic similarity to the best-matching sample
    sim_data = compare_claim_with_samples(claim, sample_answers)
    best_score = sim_data["best_match_score"]
    
    # Base contradiction score is inverse to semantic similarity
    # If similarity is 1.0, contradiction is 0.0. If 0.0, contradiction is 1.0.
    base_contradiction = max(0.0, 1.0 - best_score)
    
    # 2. Extract entity warnings
    warnings = compare_entities(claim, sample_answers)
    
    # Heuristics: add weight to contradiction score for entity clashes
    penalty = 0.0
    for warning in warnings:
        w_type = warning["type"]
        if w_type == "DATE":
            # Date/year mismatches are strong factual indicators
            penalty += 0.50
        elif w_type == "NUMBER":
            # Numeric conflicts (e.g. quantity/percentage differences) are very significant
            penalty += 0.50
        elif w_type == "PERSON":
            # Person mismatch (e.g. founder, CEO)
            penalty += 0.40
        elif w_type == "GPE":
            # Location mismatch (e.g. city, country)
            penalty += 0.30
        elif w_type == "ORG":
            # Organization mismatch
            penalty += 0.20
            
    # Combine base contradiction and entity penalties
    total_contradiction = base_contradiction + penalty
    
    # Cap between 0.0 and 1.0
    return max(0.0, min(1.0, total_contradiction))
