from typing import Any, Dict, List

from app.context_mode.chunker import chunk_text
from app.context_mode.document_loader import load_context_text
from app.context_mode.retriever import retrieve_top_chunks
from app.core.entity_checker import compare_entities
from app.core.nli_checker import nli_checker


def check_claim_faithfulness(claim: str, context_text: str | None) -> Dict[str, Any]:
    context = load_context_text(context_text)
    chunks = chunk_text(context)
    evidence = retrieve_top_chunks(claim, chunks, top_k=3)
    evidence_texts = [item["chunk"] for item in evidence]

    if not evidence_texts:
        return {
            "claim": claim,
            "status": "Not Enough Evidence",
            "evidence": [],
            "nli": {"entailment": 0.0, "contradiction": 0.0, "neutral": 1.0, "mode": "no-evidence"},
            "reason": "No context chunks were available for retrieval.",
        }

    nli = nli_checker.score_claim(claim, evidence_texts)
    entity_conflicts = compare_entities(claim, evidence_texts)
    best_score = max(item["score"] for item in evidence)

    if entity_conflicts and nli["contradiction"] >= 0.35:
        status = "Contradicted"
        reason = "Retrieved context conflicts with one or more concrete factual values."
    elif nli["contradiction"] >= 0.62:
        status = "Contradicted"
        reason = "NLI/heuristic check indicates contradiction against retrieved context."
    elif nli["entailment"] >= 0.58 or best_score >= 0.58:
        status = "Supported"
        reason = "Retrieved context semantically supports the claim."
    else:
        status = "Not Enough Evidence"
        reason = "Retrieved context is related but does not strongly support or contradict the claim."

    return {
        "claim": claim,
        "status": status,
        "evidence": evidence,
        "nli": nli,
        "reason": reason,
    }


def check_faithfulness(claims: List[str], context_text: str | None) -> List[Dict[str, Any]]:
    return [check_claim_faithfulness(claim, context_text) for claim in claims]
