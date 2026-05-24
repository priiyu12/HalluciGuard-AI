# API Contract: HalluciGuard AI v2

## GET /api/health

Returns backend readiness and embedding mode.

```json
{
  "status": "ok",
  "model_mode": "sentence-transformers",
  "message": "HalluciGuard backend running"
}
```

`model_mode` can also be `tfidf-fallback`.

## POST /api/analyze

Audits any custom LLM answer. Samples are optional.

```json
{
  "question": "Who founded Tesla?",
  "llm_answer": "Tesla was founded by Elon Musk in 2003.",
  "sample_answers": "sample one\nsample two",
  "context_text": "Optional pasted context for grounded checking."
}
```

`sample_answers` accepts:

- list of strings
- newline-separated string
- `---` separated string
- empty or missing

Response includes the original v1 fields plus v2 fields:

```json
{
  "analysis_mode": "full_reference_free",
  "confidence_note": "Full reference-free analysis: multiple samples allow semantic stability and factual divergence checks.",
  "risk_score": 71,
  "risk_level": "High",
  "uncertainty_score": 58,
  "similarity_score": 64,
  "verdict": "High hallucination risk...",
  "claims": [],
  "entity_warnings": [],
  "highlighted_answer": [],
  "atomic_claims": [],
  "uncertainty_breakdown": {},
  "context_evidence": [],
  "disclaimer": "..."
}
```

Analysis modes:

- `full_reference_free`: 2+ samples.
- `partial_reference_free`: 1 sample.
- `single_answer_limited`: no samples.

## GET /api/history

Returns local JSON-backed report history.

```json
{ "items": [] }
```

## DELETE /api/history

Clears local report history.

```json
{ "status": "ok", "message": "Analysis history cleared." }
```

## GET /api/benchmark/run

Runs the 50-case benchmark and returns metrics for each strategy.

```json
{
  "total_cases": 50,
  "models": {
    "tfidf_baseline": {
      "accuracy": 0.8,
      "precision": 0.8,
      "recall": 0.8,
      "f1_score": 0.8,
      "confusion_matrix": { "tp": 20, "tn": 20, "fp": 5, "fn": 5 }
    }
  }
}
```

## GET /api/models/compare/demo

Runs the built-in v3 model-comparison demo across GPT, Gemini, LLaMA, and RAG-style outputs.

```json
{
  "total_cases": 5,
  "models_compared": 4,
  "leaderboard": [],
  "model_summaries": {},
  "domain_reliability": {},
  "case_results": {}
}
```

## POST /api/models/compare

Runs a custom model comparison batch.

```json
{
  "cases": [
    {
      "id": "case-001",
      "domain": "business",
      "question": "Who founded Tesla?",
      "sample_answers": [
        "Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003."
      ],
      "model_outputs": {
        "GPT": "Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003.",
        "Gemini": "Tesla was founded by Elon Musk in 2003.",
        "RAG Pipeline": "Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning."
      }
    }
  ]
}
```

The response ranks models by average hallucination risk and includes domain-wise reliability scores.
