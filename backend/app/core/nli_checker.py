from typing import Dict, List

import numpy as np

from app.config import settings
from app.core.contradiction_estimator import estimate_contradiction
from app.core.similarity import compare_claim_with_samples


class NLIChecker:
    def __init__(self) -> None:
        self.model = None
        self.model_mode = "heuristic-fallback"
        self._initialized = False

    def initialize(self) -> None:
        if self._initialized:
            return
        if settings.DISABLE_TRANSFORMERS:
            self._initialized = True
            return
        try:
            from sentence_transformers import CrossEncoder

            self.model = CrossEncoder("cross-encoder/nli-deberta-v3-small")
            self.model_mode = "cross-encoder/nli-deberta-v3-small"
        except Exception as exc:
            print(f"NLI fallback active. Reason: {exc}")
            self.model = None
            self.model_mode = "heuristic-fallback"
        self._initialized = True

    def score_claim(self, claim: str, evidence_texts: List[str]) -> Dict[str, float | str]:
        self.initialize()
        if not evidence_texts:
            return {
                "entailment": 0.0,
                "contradiction": 0.0,
                "neutral": 1.0,
                "mode": "no-evidence",
            }

        if self.model is None:
            contradiction = estimate_contradiction(claim, evidence_texts)
            similarity = compare_claim_with_samples(claim, evidence_texts)["best_match_score"]
            neutral = max(0.0, 1.0 - max(contradiction, similarity))
            return {
                "entailment": round(float(similarity), 4),
                "contradiction": round(float(contradiction), 4),
                "neutral": round(float(neutral), 4),
                "mode": self.model_mode,
            }

        pairs = [(evidence, claim) for evidence in evidence_texts]
        logits = self.model.predict(pairs)
        probabilities = _softmax(np.asarray(logits))
        best = probabilities[int(np.argmax(probabilities[:, 1]))]
        labels = self._label_order()
        return {
            "entailment": round(float(best[labels["entailment"]]), 4),
            "contradiction": round(float(best[labels["contradiction"]]), 4),
            "neutral": round(float(best[labels["neutral"]]), 4),
            "mode": self.model_mode,
        }

    def _label_order(self) -> Dict[str, int]:
        try:
            id2label = self.model.model.config.id2label
            normalized = {str(label).lower(): int(idx) for idx, label in id2label.items()}
            return {
                "contradiction": normalized.get("contradiction", 0),
                "entailment": normalized.get("entailment", 1),
                "neutral": normalized.get("neutral", 2),
            }
        except Exception:
            return {"contradiction": 0, "entailment": 1, "neutral": 2}


def _softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - np.max(values, axis=1, keepdims=True)
    exp_values = np.exp(shifted)
    return exp_values / np.sum(exp_values, axis=1, keepdims=True)


nli_checker = NLIChecker()
