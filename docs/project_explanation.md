# Project Explanation: HalluciGuard AI v2

HalluciGuard AI v2 is an LLM reliability auditor. It is not a chatbot: it evaluates already generated answers and tells the user how much trust to place in them.

## Reference-Free Auditing

Reference-free means the system does not require a perfect gold answer. Instead, it compares the target answer with alternate sample answers for the same question. If the samples disagree on names, dates, numbers, organizations, or locations, the target claim is treated as unstable.

## Context-Grounded Auditing

When the user pastes context text, v2 switches on an additional faithfulness layer. It chunks the context, retrieves relevant evidence for each atomic claim, and labels the claim as Supported, Contradicted, or Not Enough Evidence.

## Why Atomic Claims Matter

LLM answers often combine several facts in one sentence. A sentence can be mostly correct while one detail is wrong. Atomic claim extraction helps isolate those details so risk scoring is more precise.

## Confidence Philosophy

The app distinguishes:

- full reference-free analysis with 2+ samples
- partial analysis with 1 sample
- limited single-answer analysis with no samples

It does not fake sample-based confidence when samples are missing.

## Portfolio Value

This project demonstrates practical full-stack AI/ML engineering:

- FastAPI and Pydantic API design
- React/Vite/Tailwind dashboard UX
- local model fallback strategy
- explainable scoring
- context retrieval and faithfulness checks
- benchmark evaluation
- persistent local history
- exportable reports
