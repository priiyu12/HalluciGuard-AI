from typing import List

from app.core.preprocessing import clean_text


def load_context_text(context_text: str | None) -> str:
    return clean_text(context_text or "")


def has_context(context_text: str | None) -> bool:
    return bool(load_context_text(context_text))


def context_lines(context_text: str | None) -> List[str]:
    return [line.strip() for line in (context_text or "").splitlines() if line.strip()]
