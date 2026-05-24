import re

def clean_extra_punctuation(text: str) -> str:
    """
    Cleans extra punctuation or leftover brackets.
    """
    if not text:
        return ""
    # Remove leading/trailing quote marks if mismatched, etc.
    return text.strip(" '\"`()[]{}")

def is_substring_of_any(item: str, items: list[str]) -> bool:
    """
    Checks if item is a strict substring of any string in the list (excluding itself).
    """
    item_lower = item.lower()
    for other in items:
        if item_lower != other.lower() and item_lower in other.lower():
            return True
    return False
