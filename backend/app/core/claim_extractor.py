from typing import Union, List
from app.core.preprocessing import split_sentences, clean_text

def extract_claims(answer: str) -> List[str]:
    """
    Extracts individual claims from the LLM answer.
    For this MVP, each sentence is treated as an individual claim.
    """
    if not answer:
        return []
    return split_sentences(answer)

def normalize_sample_answers(samples: Union[List[str], str]) -> List[str]:
    """
    Normalizes sample answers from various formats (list, newline-separated, or '---'-separated)
    into a clean list of non-empty strings.
    """
    if not samples:
        return []
        
    if isinstance(samples, list):
        normalized = []
        for s in samples:
            if isinstance(s, str):
                cleaned = clean_text(s)
                if cleaned:
                    normalized.append(cleaned)
        return normalized

    if isinstance(samples, str):
        # Check if separated by "---"
        if "---" in samples:
            parts = samples.split("---")
        else:
            # Split by newline
            parts = samples.split("\n")
            
        normalized = []
        for part in parts:
            cleaned = clean_text(part)
            if cleaned:
                # Filter out raw separators if any remain
                cleaned_val = cleaned.replace("---", "").strip()
                if cleaned_val:
                    normalized.append(cleaned_val)
        return normalized
        
    return []
