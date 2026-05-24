from typing import List

from app.core.preprocessing import split_sentences


def chunk_text(context_text: str, max_sentences: int = 3) -> List[str]:
    sentences = split_sentences(context_text)
    chunks: List[str] = []
    for idx in range(0, len(sentences), max_sentences):
        chunk = " ".join(sentences[idx : idx + max_sentences]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks
