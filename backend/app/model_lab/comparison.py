from typing import Any, Dict, List

import numpy as np

from app.core.report_generator import generate_report


DEFAULT_MODEL_CASES = [
    {
        "id": "founders-tesla",
        "domain": "business",
        "question": "Who founded Tesla?",
        "sample_answers": [
            "Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003.",
            "Elon Musk joined Tesla later as an investor and chairman.",
        ],
        "model_outputs": {
            "GPT": "Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003.",
            "Gemini": "Tesla was founded by Elon Musk in 2003.",
            "Claude": "Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning; Elon Musk joined later.",
            "Perplexity": "Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003, with Elon Musk joining later as an investor.",
            "Mistral": "Tesla was founded by Martin Eberhard, Marc Tarpenning, and Elon Musk in 2003.",
            "LLaMA": "Tesla was started by Martin Eberhard, Marc Tarpenning, and Elon Musk.",
            "RAG Pipeline": "Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning.",
        },
    },
    {
        "id": "apple-founded",
        "domain": "business",
        "question": "When was Apple founded?",
        "sample_answers": [
            "Apple was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
            "Apple Computer was started in 1976 by Jobs, Wozniak, and Wayne.",
        ],
        "model_outputs": {
            "GPT": "Apple was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
            "Gemini": "Apple was founded in 1976 by Steve Jobs and Steve Wozniak.",
            "Claude": "Apple was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
            "Perplexity": "Apple Computer was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
            "Mistral": "Apple was founded in 1976 by Steve Jobs and Steve Wozniak.",
            "LLaMA": "Apple was founded in 1977 by Steve Jobs and Steve Wozniak.",
            "RAG Pipeline": "Apple was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
        },
    },
    {
        "id": "titanic-date",
        "domain": "history",
        "question": "When did the Titanic sink?",
        "sample_answers": [
            "The Titanic sank on April 15, 1912.",
            "RMS Titanic sank in 1912 after hitting an iceberg.",
        ],
        "model_outputs": {
            "GPT": "The Titanic sank on April 15, 1912.",
            "Gemini": "The Titanic sank on April 15, 1912.",
            "Claude": "The Titanic sank on April 15, 1912.",
            "Perplexity": "RMS Titanic sank on April 15, 1912.",
            "Mistral": "The Titanic sank in 1912 after striking an iceberg.",
            "LLaMA": "The Titanic sank on April 15, 1915.",
            "RAG Pipeline": "The Titanic sank on April 15, 1912.",
        },
    },
    {
        "id": "seattle-population",
        "domain": "geography",
        "question": "What is the population of Seattle?",
        "sample_answers": [
            "Seattle has a population of about 730,000 people.",
            "Seattle's city population is roughly 740,000.",
        ],
        "model_outputs": {
            "GPT": "Seattle has about 740,000 residents.",
            "Gemini": "Seattle has a population of around 750,000 people.",
            "Claude": "Seattle's population is roughly 740,000 people.",
            "Perplexity": "Seattle has about 755,000 residents in recent estimates.",
            "Mistral": "Seattle has a population of roughly 730,000 to 750,000 people.",
            "LLaMA": "Seattle has a population of 1.2 million people.",
            "RAG Pipeline": "Seattle's population is roughly 740,000 people.",
        },
    },
    {
        "id": "openai-hq",
        "domain": "ai",
        "question": "Where is OpenAI headquartered?",
        "sample_answers": [
            "OpenAI is headquartered in San Francisco, California.",
            "OpenAI was founded in 2015 and is based in San Francisco.",
        ],
        "model_outputs": {
            "GPT": "OpenAI is headquartered in San Francisco and was founded in 2015.",
            "Gemini": "OpenAI is based in San Francisco, California.",
            "Claude": "OpenAI is headquartered in San Francisco, California and was founded in 2015.",
            "Perplexity": "OpenAI is headquartered in San Francisco and was founded in 2015.",
            "Mistral": "OpenAI is headquartered in San Francisco and was founded in 2016.",
            "LLaMA": "OpenAI is headquartered in New York and was founded in 2016.",
            "RAG Pipeline": "OpenAI is headquartered in San Francisco, California.",
        },
    },
]


def compare_models(cases: List[Dict[str, Any]] | None = None) -> Dict[str, Any]:
    eval_cases = cases or DEFAULT_MODEL_CASES
    model_runs: Dict[str, List[Dict[str, Any]]] = {}

    for case in eval_cases:
        for model_name, answer in case.get("model_outputs", {}).items():
            report = generate_report(
                question=case["question"],
                llm_answer=answer,
                raw_samples=case.get("sample_answers", []),
                context_text=case.get("context_text"),
            )
            model_runs.setdefault(model_name, []).append(
                {
                    "case_id": case["id"],
                    "domain": case.get("domain", "general"),
                    "question": case["question"],
                    "answer": answer,
                    "risk_score": report["risk_score"],
                    "risk_level": report["risk_level"],
                    "analysis_mode": report["analysis_mode"],
                    "verdict": report["verdict"],
                }
            )

    summaries = {
        model_name: _summarize_model(model_name, runs)
        for model_name, runs in model_runs.items()
    }
    leaderboard = sorted(
        summaries.values(),
        key=lambda item: (item["average_risk"], -item["reliability_score"]),
    )

    return {
        "total_cases": len(eval_cases),
        "models_compared": len(summaries),
        "leaderboard": leaderboard,
        "model_summaries": summaries,
        "domain_reliability": _domain_reliability(model_runs),
        "case_results": model_runs,
    }


def _summarize_model(model_name: str, runs: List[Dict[str, Any]]) -> Dict[str, Any]:
    risks = [run["risk_score"] for run in runs]
    high_risk = sum(1 for run in runs if run["risk_level"] == "High")
    medium_risk = sum(1 for run in runs if run["risk_level"] == "Medium")
    low_risk = sum(1 for run in runs if run["risk_level"] == "Low")
    average_risk = int(round(float(np.mean(risks)))) if risks else 0
    return {
        "model_name": model_name,
        "average_risk": average_risk,
        "reliability_score": max(0, 100 - average_risk),
        "high_risk_cases": high_risk,
        "medium_risk_cases": medium_risk,
        "low_risk_cases": low_risk,
        "total_cases": len(runs),
    }


def _domain_reliability(model_runs: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Dict[str, Any]]:
    domains: Dict[str, Dict[str, List[int]]] = {}
    for model_name, runs in model_runs.items():
        for run in runs:
            domains.setdefault(run["domain"], {}).setdefault(model_name, []).append(run["risk_score"])

    result: Dict[str, Dict[str, Any]] = {}
    for domain, model_scores in domains.items():
        result[domain] = {
            model_name: {
                "average_risk": int(round(float(np.mean(scores)))),
                "reliability_score": max(0, 100 - int(round(float(np.mean(scores))))),
            }
            for model_name, scores in model_scores.items()
        }
    return result
