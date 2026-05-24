import re
from typing import Any, Dict, List

from app.core.entity_checker import extract_entities
from app.core.preprocessing import clean_text, split_sentences


CLAUSE_SPLIT_RE = re.compile(
    r"\s+(?:and|while|whereas|but)\s+|,\s+(?=(?:and\s+)?(?:[A-Z][a-z]+|it|the|a|an|he|she|they|this|that)\b)",
    re.IGNORECASE,
)


def extract_atomic_claims(answer: str) -> List[Dict[str, Any]]:
    """
    Splits sentence-level claims into smaller factual units using conservative
    rule-based clause splitting. Each atomic claim keeps its source sentence.
    """
    atomic_claims: List[Dict[str, Any]] = []
    for sentence in split_sentences(answer):
        for clause in _split_sentence(sentence):
            atomic_claims.append(
                {
                    "atomic_claim": clause,
                    "source_sentence": sentence,
                    "claim_type": infer_claim_type(clause),
                }
            )
    return atomic_claims


def infer_claim_type(claim: str) -> str:
    entities = extract_entities(claim)
    if entities["DATE"]:
        return "date"
    if entities["NUMBER"]:
        return "number"
    if entities["PERSON"]:
        return "person"
    if entities["GPE"]:
        return "location"
    return "general"


def _split_sentence(sentence: str) -> List[str]:
    cleaned = clean_text(sentence)
    if not cleaned:
        return []

    terminator = "." if cleaned.endswith(".") else ""
    cleaned = cleaned.rstrip(".!?")
    parts = [clean_text(part) for part in CLAUSE_SPLIT_RE.split(cleaned)]
    parts = [_repair_fragment(part, cleaned) for part in parts if _is_factual_clause(part)]

    if len(parts) <= 1:
        return [clean_text(sentence)]

    return [f"{part}{terminator}" if terminator and not part.endswith((".", "!", "?")) else part for part in parts]


def _is_factual_clause(clause: str) -> bool:
    clause = clean_text(clause)
    if len(clause.split()) < 3:
        return False
    factual_markers = (
        r"\b(is|are|was|were|has|have|had|founded|started|located|headquartered|born|died|released|launched|costs?)\b",
        r"\b(19\d{2}|20\d{2})\b",
        r"\b\d+(?:\.\d+)?\b",
    )
    return any(re.search(pattern, clause, re.IGNORECASE) for pattern in factual_markers)


def _repair_fragment(fragment: str, source: str) -> str:
    fragment = clean_text(fragment)
    if not fragment:
        return fragment

    if re.match(r"^(was|were|is|are|has|have|had|founded|started|located|headquartered)\b", fragment, re.IGNORECASE):
        subject_match = re.match(r"^([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*)?)\b", source)
        if subject_match:
            return f"{subject_match.group(1)} {fragment}"
    return fragment
