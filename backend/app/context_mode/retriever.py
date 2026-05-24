from typing import Any, Dict, List

from app.core.similarity import compare_claim_with_samples, cosine_similarity_score


def retrieve_top_chunks(claim: str, chunks: List[str], top_k: int = 3) -> List[Dict[str, Any]]:
    if not chunks:
        return []

    scored = [
        {
            "chunk": chunk,
            "score": round(float(cosine_similarity_score(claim, chunk)), 4),
        }
        for chunk in chunks
    ]
    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:top_k]


def best_context_support(claim: str, chunks: List[str]) -> float:
    if not chunks:
        return 0.0
    return float(compare_claim_with_samples(claim, chunks)["best_match_score"])
