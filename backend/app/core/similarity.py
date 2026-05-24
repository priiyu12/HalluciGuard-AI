from typing import List, Dict, Any
import numpy as np
from app.models.embedding_model import embedding_manager

def cosine_similarity_score(text1: str, text2: str) -> float:
    """
    Computes cosine similarity between two strings.
    """
    return embedding_manager.calculate_similarity(text1, text2)

def compare_claim_with_samples(claim: str, sample_answers: List[str]) -> Dict[str, Any]:
    """
    Compares a single claim against all sample answers.
    Returns details on the best matching sample and average similarity.
    """
    if not sample_answers:
        return {
            "best_match_score": 0.0,
            "best_match_text": "",
            "average_similarity": 0.0,
            "matched_samples": []
        }
        
    similarities = embedding_manager.calculate_similarity_batch(claim, sample_answers)
    
    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])
    best_text = sample_answers[best_idx]
    avg_score = float(np.mean(similarities))
    
    # Identify sample answers that are semantically related (threshold of 0.45)
    matched_samples = [
        sample_answers[i] for i, score in enumerate(similarities) if score >= 0.45
    ]
    
    return {
        "best_match_score": best_score,
        "best_match_text": best_text,
        "average_similarity": avg_score,
        "matched_samples": matched_samples
    }

def calculate_answer_stability(sample_answers: List[str]) -> float:
    """
    Measures how stable the generated samples are.
    Calculates the average pairwise similarity between all sample answers.
    """
    if not sample_answers:
        return 0.0
    if len(sample_answers) == 1:
        return 1.0
        
    scores = []
    # Calculate upper triangle of pairwise similarities
    for i in range(len(sample_answers)):
        current_sample = sample_answers[i]
        other_samples = sample_answers[i+1:]
        if other_samples:
            similarities = embedding_manager.calculate_similarity_batch(current_sample, other_samples)
            scores.extend(similarities)
            
    if not scores:
        return 0.0
    return float(np.mean(scores))
