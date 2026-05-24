import os
from typing import Any, Dict, List, Optional, Union

import httpx
from app.context_mode.chunker import chunk_text
from app.context_mode.retriever import retrieve_top_chunks
from app.core.claim_extractor import normalize_sample_answers
from app.core.report_generator import generate_report


SUPPORTED_LIVE_MODELS = ["GPT", "Gemini", "Claude", "Perplexity", "Mistral", "LLaMA", "RAG Pipeline"]


async def run_models_and_score(
    question: str,
    selected_models: List[str],
    domain: str = "general",
    sample_answers: Optional[Union[List[str], str]] = None,
    context_text: Optional[str] = None,
) -> Dict[str, Any]:
    normalized_samples = normalize_sample_answers(sample_answers)
    run_results = []

    async with httpx.AsyncClient(timeout=45.0) as client:
        for model_name in selected_models:
            run_results.append(await _run_single_model(client, model_name, question, context_text))

    completed = [item for item in run_results if item["status"] == "completed" and item.get("answer")]
    completed_answers = [item["answer"] for item in completed]

    scored_results = []
    for item in run_results:
        if item["status"] != "completed":
            scored_results.append(item)
            continue

        peer_answers = [answer for answer in completed_answers if answer != item["answer"]]
        report = generate_report(
            question=question,
            llm_answer=item["answer"],
            raw_samples=[*normalized_samples, *peer_answers],
            context_text=context_text,
        )
        scored_results.append(
            {
                **item,
                "domain": domain,
                "risk_score": report["risk_score"],
                "risk_level": report["risk_level"],
                "uncertainty_score": report["uncertainty_score"],
                "analysis_mode": report["analysis_mode"],
                "verdict": report["verdict"],
                "entity_warnings": report["entity_warnings"],
            }
        )

    leaderboard = _leaderboard(scored_results)
    return {
        "question": question,
        "domain": domain,
        "total_models": len(selected_models),
        "completed_models": len(completed),
        "unavailable_models": len(selected_models) - len(completed),
        "leaderboard": leaderboard,
        "model_results": scored_results,
        "provider_note": (
            "Live querying uses configured provider API keys or local Ollama. "
            "Unavailable models are not faked."
        ),
    }


async def _run_single_model(
    client: httpx.AsyncClient,
    model_name: str,
    question: str,
    context_text: Optional[str],
) -> Dict[str, Any]:
    try:
        if model_name == "GPT":
            return await _run_openai(client, question)
        if model_name == "Gemini":
            return await _run_gemini(client, question)
        if model_name == "Claude":
            return await _run_claude(client, question)
        if model_name == "Perplexity":
            return await _run_perplexity(client, question)
        if model_name == "Mistral":
            return await _run_mistral(client, question)
        if model_name == "LLaMA":
            return await _run_ollama(client, model_name, question, os.getenv("OLLAMA_LLAMA_MODEL", "llama3.1"))
        if model_name == "RAG Pipeline":
            return _run_rag_pipeline(question, context_text)
        return _unavailable(model_name, "No live provider adapter is configured for this custom model.")
    except httpx.HTTPError as exc:
        return _unavailable(model_name, f"Provider request failed: {exc}")
    except Exception as exc:
        return _unavailable(model_name, f"Provider run failed: {exc}")


async def _run_openai(client: httpx.AsyncClient, question: str) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _unavailable("GPT", "Missing OPENAI_API_KEY.")
    response = await client.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": _messages(question),
            "temperature": 0.2,
        },
    )
    response.raise_for_status()
    data = response.json()
    return _completed("GPT", data["choices"][0]["message"]["content"], "OpenAI")


async def _run_gemini(client: httpx.AsyncClient, question: str) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return _unavailable("Gemini", "Missing GEMINI_API_KEY or GOOGLE_API_KEY.")
    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    response = await client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        json={"contents": [{"parts": [{"text": _prompt(question)}]}]},
    )
    response.raise_for_status()
    data = response.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return _completed("Gemini", text, "Google Gemini")


async def _run_claude(client: httpx.AsyncClient, question: str) -> Dict[str, Any]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _unavailable("Claude", "Missing ANTHROPIC_API_KEY.")
    response = await client.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json={
            "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest"),
            "max_tokens": 700,
            "temperature": 0.2,
            "messages": [{"role": "user", "content": _prompt(question)}],
        },
    )
    response.raise_for_status()
    data = response.json()
    return _completed("Claude", data["content"][0]["text"], "Anthropic")


async def _run_perplexity(client: httpx.AsyncClient, question: str) -> Dict[str, Any]:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return _unavailable("Perplexity", "Missing PERPLEXITY_API_KEY.")
    response = await client.post(
        "https://api.perplexity.ai/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": os.getenv("PERPLEXITY_MODEL", "sonar"),
            "messages": _messages(question),
            "temperature": 0.2,
        },
    )
    response.raise_for_status()
    data = response.json()
    return _completed("Perplexity", data["choices"][0]["message"]["content"], "Perplexity")


async def _run_mistral(client: httpx.AsyncClient, question: str) -> Dict[str, Any]:
    api_key = os.getenv("MISTRAL_API_KEY")
    if api_key:
        response = await client.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": os.getenv("MISTRAL_MODEL", "mistral-small-latest"),
                "messages": _messages(question),
                "temperature": 0.2,
            },
        )
        response.raise_for_status()
        data = response.json()
        return _completed("Mistral", data["choices"][0]["message"]["content"], "Mistral API")
    return await _run_ollama(client, "Mistral", question, os.getenv("OLLAMA_MISTRAL_MODEL", "mistral"))


async def _run_ollama(client: httpx.AsyncClient, model_name: str, question: str, ollama_model: str) -> Dict[str, Any]:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        response = await client.post(
            f"{base_url}/api/generate",
            json={"model": ollama_model, "prompt": _prompt(question), "stream": False},
        )
        response.raise_for_status()
        data = response.json()
        return _completed(model_name, data.get("response", ""), f"Ollama/{ollama_model}")
    except httpx.HTTPError:
        return _unavailable(model_name, f"Missing cloud API key and local Ollama model '{ollama_model}' is unavailable.")


def _run_rag_pipeline(question: str, context_text: Optional[str]) -> Dict[str, Any]:
    if not context_text:
        return _unavailable("RAG Pipeline", "RAG Pipeline requires context text.")
    chunks = chunk_text(context_text)
    evidence = retrieve_top_chunks(question, chunks, top_k=2)
    if not evidence:
        return _unavailable("RAG Pipeline", "No retrievable context chunks were found.")
    answer = " ".join(item["chunk"] for item in evidence)
    return _completed("RAG Pipeline", answer, "Local context retriever")


def _leaderboard(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    completed = [item for item in results if item.get("status") == "completed" and "risk_score" in item]
    return sorted(
        [
            {
                "model_name": item["model_name"],
                "risk_score": item["risk_score"],
                "risk_level": item["risk_level"],
                "reliability_score": max(0, 100 - item["risk_score"]),
            }
            for item in completed
        ],
        key=lambda item: (item["risk_score"], -item["reliability_score"]),
    )


def _messages(question: str) -> List[Dict[str, str]]:
    return [
        {"role": "system", "content": "Answer factually and concisely. Do not include citations unless asked."},
        {"role": "user", "content": question},
    ]


def _prompt(question: str) -> str:
    return f"Answer this question factually and concisely:\n\n{question}"


def _completed(model_name: str, answer: str, provider: str) -> Dict[str, Any]:
    return {
        "model_name": model_name,
        "provider": provider,
        "status": "completed",
        "answer": answer.strip(),
    }


def _unavailable(model_name: str, reason: str) -> Dict[str, Any]:
    return {
        "model_name": model_name,
        "provider": None,
        "status": "unavailable",
        "answer": "",
        "error": reason,
    }
