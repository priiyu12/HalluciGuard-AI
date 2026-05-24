import json
import os
from typing import Any, Dict, List

from app.core.claim_extractor import normalize_sample_answers
from app.core.entity_checker import compare_entities
from app.core.report_generator import generate_report
from app.core.similarity import compare_claim_with_samples


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
BENCHMARK_PATH = os.path.join(PROJECT_ROOT, "benchmarks", "hallucination_cases.json")


def run_benchmark() -> Dict[str, Any]:
    cases = _load_cases()
    model_results = {
        "tfidf_baseline": _evaluate(cases, _predict_tfidf_baseline),
        "embedding_similarity": _evaluate(cases, _predict_embedding_similarity),
        "embedding_entity_mismatch": _evaluate(cases, _predict_embedding_entity),
        "embedding_entity_nli": _evaluate(cases, _predict_full_pipeline),
    }
    return {"total_cases": len(cases), "models": model_results}


def compute_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, Any]:
    tp = sum(1 for true, pred in zip(y_true, y_pred) if true == 1 and pred == 1)
    tn = sum(1 for true, pred in zip(y_true, y_pred) if true == 0 and pred == 0)
    fp = sum(1 for true, pred in zip(y_true, y_pred) if true == 0 and pred == 1)
    fn = sum(1 for true, pred in zip(y_true, y_pred) if true == 1 and pred == 0)

    accuracy = _safe_div(tp + tn, len(y_true))
    precision = _safe_div(tp, tp + fp)
    recall = _safe_div(tp, tp + fn)
    f1 = _safe_div(2 * precision * recall, precision + recall)

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn},
    }


def _evaluate(cases: List[Dict[str, Any]], predictor) -> Dict[str, Any]:
    y_true = [1 if case["label"] == "hallucinated" else 0 for case in cases]
    y_pred = [predictor(case) for case in cases]
    metrics = compute_metrics(y_true, y_pred)
    metrics["predictions"] = [
        {"id": case["id"], "expected": case["label"], "predicted": "hallucinated" if pred else "supported"}
        for case, pred in zip(cases, y_pred)
    ]
    return metrics


def _predict_tfidf_baseline(case: Dict[str, Any]) -> int:
    samples = normalize_sample_answers(case.get("sample_answers", []))
    if not samples:
        return 0
    score = compare_claim_with_samples(case["llm_answer"], samples)["best_match_score"]
    return 1 if score < 0.34 else 0


def _predict_embedding_similarity(case: Dict[str, Any]) -> int:
    samples = normalize_sample_answers(case.get("sample_answers", []))
    score = compare_claim_with_samples(case["llm_answer"], samples)["best_match_score"] if samples else 0.5
    return 1 if score < 0.48 else 0


def _predict_embedding_entity(case: Dict[str, Any]) -> int:
    samples = normalize_sample_answers(case.get("sample_answers", []))
    warnings = compare_entities(case["llm_answer"], samples)
    if warnings:
        return 1
    return _predict_embedding_similarity(case)


def _predict_full_pipeline(case: Dict[str, Any]) -> int:
    report = generate_report(
        question=case["question"],
        llm_answer=case["llm_answer"],
        raw_samples=case.get("sample_answers", []),
        context_text=case.get("context_text"),
    )
    return 1 if report["risk_score"] >= 50 else 0


def _load_cases() -> List[Dict[str, Any]]:
    with open(BENCHMARK_PATH, "r", encoding="utf-8") as file:
        cases = json.load(file)
    if not isinstance(cases, list):
        raise ValueError("Benchmark file must contain a list of cases.")
    return cases


def _safe_div(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator
