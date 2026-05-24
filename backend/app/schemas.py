from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union

class AnalysisRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The original question that was asked.")
    llm_answer: str = Field(..., min_length=1, description="The LLM-generated answer to audit.")
    sample_answers: Optional[Union[List[str], str]] = Field(
        default=None,
        description="Alternative LLM responses. Can be a list of strings, newline-separated string, or '---'-separated string."
    )
    context_text: Optional[str] = Field(default=None, description="Optional pasted source/context text for context-grounded mode.")

class ClaimAnalysis(BaseModel):
    claim: str = Field(..., description="The extracted sentence-level claim.")
    risk_score: int = Field(..., description="Calculated risk score out of 100.")
    risk: str = Field(..., description="Risk tier: Low, Medium, or High.")
    reason: str = Field(..., description="Explanatory text for the calculated score.")
    support_score: int = Field(..., description="Semantic support rating (0-100).")
    contradiction_score: int = Field(..., description="Estimated contradiction likelihood (0-100).")
    matched_samples: List[str] = Field(..., description="Sample responses semantically supporting this claim.")
    atomic_claim: Optional[str] = Field(default=None, description="Atomic factual claim used for v2 analysis.")
    source_sentence: Optional[str] = Field(default=None, description="Original sentence the atomic claim came from.")
    claim_type: Optional[str] = Field(default=None, description="Atomic claim type: date/person/location/number/general.")
    nli_scores: Optional[Dict[str, Any]] = Field(default=None, description="Optional NLI or heuristic entailment/contradiction scores.")

class EntityWarning(BaseModel):
    type: str = Field(..., description="Entity category: PERSON, DATE, NUMBER, ORG, or GPE.")
    original: str = Field(..., description="Value present in the original claim.")
    conflicting_values: List[str] = Field(..., description="Alternative values detected in sample answers.")
    message: str = Field(..., description="Descriptive warning explanation.")

class HighlightSpan(BaseModel):
    text: str = Field(..., description="Raw text of the claim.")
    risk: str = Field(..., description="Risk tier: Low, Medium, or High.")

class AnalysisResponse(BaseModel):
    analysis_mode: str = Field(..., description="full_reference_free, partial_reference_free, or single_answer_limited.")
    confidence_note: str = Field(..., description="Plain-language confidence caveat for the selected analysis mode.")
    risk_score: int = Field(..., description="Overall hallucination risk score (0-100).")
    risk_level: str = Field(..., description="Overall threat classification: Low, Medium, or High.")
    uncertainty_score: int = Field(..., description="Overall uncertainty rating (0-100).")
    similarity_score: int = Field(..., description="Semantic overlap percentage (0-100).")
    verdict: str = Field(..., description="Summary explanation of the risk scoring.")
    claims: List[ClaimAnalysis] = Field(..., description="Claim-by-claim evaluation list.")
    entity_warnings: List[EntityWarning] = Field(..., description="List of factual mismatches and warning logs.")
    highlighted_answer: List[HighlightSpan] = Field(..., description="Text segments colored by claim risk.")
    atomic_claims: List[Dict[str, Any]] = Field(default_factory=list, description="Atomic claim extraction output.")
    uncertainty_breakdown: Dict[str, Any] = Field(default_factory=dict, description="Explainable uncertainty score components.")
    context_evidence: List[Dict[str, Any]] = Field(default_factory=list, description="Context-grounded evidence and faithfulness labels.")
    disclaimer: str = Field(..., description="Mandatory API disclaimer about heuristic outputs.")

class HealthResponse(BaseModel):
    status: str = Field("ok", description="Status code indicating server state.")
    model_mode: str = Field(..., description="Active embedding mode: sentence-transformers or tfidf-fallback.")
    message: str = Field(..., description="General health check message.")

class BenchmarkResponse(BaseModel):
    total_cases: int
    models: Dict[str, Dict[str, Any]]

class HistoryResponse(BaseModel):
    items: List[Dict[str, Any]]

class ModelComparisonCase(BaseModel):
    id: str
    domain: str = "general"
    question: str
    sample_answers: Optional[Union[List[str], str]] = None
    context_text: Optional[str] = None
    model_outputs: Dict[str, str]

class ModelComparisonRequest(BaseModel):
    cases: Optional[List[ModelComparisonCase]] = None

class ModelComparisonResponse(BaseModel):
    total_cases: int
    models_compared: int
    leaderboard: List[Dict[str, Any]]
    model_summaries: Dict[str, Dict[str, Any]]
    domain_reliability: Dict[str, Dict[str, Any]]
    case_results: Dict[str, List[Dict[str, Any]]]

class ModelQueryRunRequest(BaseModel):
    question: str = Field(..., min_length=1)
    domain: str = "general"
    selected_models: List[str] = Field(..., min_length=1)
    sample_answers: Optional[Union[List[str], str]] = None
    context_text: Optional[str] = None

class ModelQueryRunResponse(BaseModel):
    question: str
    domain: str
    total_models: int
    completed_models: int
    unavailable_models: int
    leaderboard: List[Dict[str, Any]]
    model_results: List[Dict[str, Any]]
    provider_note: str
