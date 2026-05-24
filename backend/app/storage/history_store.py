import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
HISTORY_PATH = os.path.join(PROJECT_ROOT, "data", "analysis_history.json")


def add_history_item(request_payload: Dict[str, Any], report: Dict[str, Any]) -> Dict[str, Any]:
    item = {
        "id": str(uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "question": request_payload.get("question", ""),
        "llm_answer": request_payload.get("llm_answer", ""),
        "analysis_mode": report.get("analysis_mode", ""),
        "risk_score": report.get("risk_score", 0),
        "risk_level": report.get("risk_level", "Low"),
        "report": report,
    }
    items = get_history_items()
    items.insert(0, item)
    _write_items(items[:100])
    return item


def get_history_items() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_PATH):
        return []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)
        if isinstance(data, list):
            return data
    except (json.JSONDecodeError, OSError):
        return []
    return []


def clear_history() -> None:
    _write_items([])


def _write_items(items: List[Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)
    with open(HISTORY_PATH, "w", encoding="utf-8") as file:
        json.dump(items, file, indent=2)
