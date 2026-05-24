import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.preprocessing import split_sentences, clean_text
from app.core.entity_checker import extract_entities, compare_entities
from app.core.risk_scorer import calculate_claim_risk
from app.core.atomic_claim_extractor import extract_atomic_claims
from app.core.uncertainty import compute_uncertainty_breakdown
from app.context_mode.faithfulness_checker import check_claim_faithfulness
from app.benchmark.evaluator import compute_metrics
from app.model_lab.comparison import compare_models

client = TestClient(app)

def test_sentence_splitting():
    text = "Tesla was founded by Elon Musk in 2003. It is headquartered in Austin. Dr. Eberhard was there."
    sentences = split_sentences(text)
    assert len(sentences) == 3
    assert sentences[0] == "Tesla was founded by Elon Musk in 2003."
    assert sentences[1] == "It is headquartered in Austin."
    assert sentences[2] == "Dr. Eberhard was there."

def test_entity_extraction():
    text = "Elon Musk founded Tesla in 2003 in San Francisco."
    ents = extract_entities(text)
    assert any("Elon Musk" in p or p in "Elon Musk" for p in ents["PERSON"])
    assert "2003" in ents["DATE"]
    assert any("San Francisco" in g or g in "San Francisco" for g in ents["GPE"])
    assert any("Tesla" in o or o in "Tesla" for o in ents["ORG"])

def test_year_mismatch_detection():
    # If original claim year is 2003 and samples mention 2005
    claim = "Tesla was founded in 2003."
    samples = ["Tesla Motors was started in 2005.", "The company was established in 2005."]
    warnings = compare_entities(claim, samples)
    date_warnings = [w for w in warnings if w["type"] == "DATE"]
    assert len(date_warnings) > 0
    assert date_warnings[0]["original"] == "2003"
    assert "2005" in date_warnings[0]["conflicting_values"]

def test_risk_score_thresholds():
    # High risk case
    claim = "Tesla was founded by Elon Musk."
    samples = ["Martin Eberhard founded Tesla.", "Marc Tarpenning started Tesla."]
    risk_data = calculate_claim_risk(claim, samples)
    # Person warning should trigger and cause risk to be High or Medium-High (e.g. > 65)
    assert risk_data["risk_score"] > 65
    assert risk_data["risk"] == "High"

    # Low risk case
    claim = "Apple was founded in 1976."
    samples = ["Apple was founded in 1976.", "Apple Computer was started in 1976."]
    risk_data = calculate_claim_risk(claim, samples)
    assert risk_data["risk_score"] <= 30
    assert risk_data["risk"] == "Low"

def test_api_response_structure():
    payload = {
        "question": "Who founded Tesla?",
        "llm_answer": "Tesla was founded by Elon Musk in 2003.",
        "sample_answers": [
            "Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning.",
            "Tesla Motors was started by Martin Eberhard and Marc Tarpenning."
        ]
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "risk_level" in data
    assert "uncertainty_score" in data
    assert "similarity_score" in data
    assert "verdict" in data
    assert "claims" in data
    assert "entity_warnings" in data
    assert "highlighted_answer" in data
    assert "disclaimer" in data
    assert len(data["entity_warnings"]) > 0
    assert data["entity_warnings"][0]["type"] == "PERSON"
    assert data["analysis_mode"] == "full_reference_free"
    assert "confidence_note" in data
    assert "uncertainty_breakdown" in data
    assert "atomic_claims" in data

def test_optional_samples_single_answer_mode():
    payload = {
        "question": "Who founded Tesla?",
        "llm_answer": "Tesla was founded by Elon Musk in 2003."
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_mode"] == "single_answer_limited"
    assert "No sample answers provided" in data["confidence_note"]

def test_atomic_claim_extraction():
    answer = "OpenAI is based in San Francisco and was founded in 2015, while Tesla was founded in 2003."
    atomic = extract_atomic_claims(answer)
    claim_texts = [item["atomic_claim"] for item in atomic]
    assert len(atomic) >= 3
    assert any("OpenAI is based" in claim for claim in claim_texts)
    assert any(item["claim_type"] == "date" for item in atomic)

def test_uncertainty_breakdown():
    claims = ["Tesla was founded by Elon Musk in 2003."]
    samples = ["Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003."]
    claim_results = [calculate_claim_risk(claims[0], samples, analysis_mode="partial_reference_free")]
    breakdown = compute_uncertainty_breakdown(claims, samples, claim_results, [], "partial_reference_free")
    assert 0 <= breakdown["overall_uncertainty_score"] <= 100
    assert breakdown["sample_disagreement_score"] >= 0

def test_context_faithfulness_checker():
    context = "Apple was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne."
    result = check_claim_faithfulness("Apple was founded in 1976 by Steve Jobs.", context)
    assert result["status"] in {"Supported", "Not Enough Evidence"}
    assert result["evidence"]

def test_benchmark_metrics():
    metrics = compute_metrics([1, 1, 0, 0], [1, 0, 0, 1])
    assert metrics["confusion_matrix"] == {"tp": 1, "tn": 1, "fp": 1, "fn": 1}
    assert metrics["accuracy"] == 0.5

def test_model_comparison_summary():
    result = compare_models()
    assert result["total_cases"] >= 5
    assert result["models_compared"] >= 4
    assert result["leaderboard"][0]["average_risk"] <= result["leaderboard"][-1]["average_risk"]
    assert "domain_reliability" in result

def test_model_comparison_api():
    response = client.get("/api/models/compare/demo")
    assert response.status_code == 200
    data = response.json()
    assert data["models_compared"] >= 4
    assert "leaderboard" in data
