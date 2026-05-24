from fastapi import APIRouter, HTTPException
from app.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    BenchmarkResponse,
    HealthResponse,
    HistoryResponse,
    ModelComparisonRequest,
    ModelComparisonResponse,
)
from app.benchmark.evaluator import run_benchmark
from app.core.report_generator import generate_report
from app.model_lab.comparison import compare_models
from app.models.embedding_model import get_model_mode
from app.storage.history_store import add_history_item, clear_history, get_history_items

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Checks backend server readiness and returns the active embedding model mode.
    """
    try:
        mode = get_model_mode()
        return HealthResponse(
            status="ok",
            model_mode=mode,
            message="HalluciGuard backend running"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed to initialize: {str(e)}"
        )

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_hallucination(request: AnalysisRequest):
    """
    Main analysis endpoint: audits an LLM response sentence-by-sentence
    against a list of generated alternative sample responses.
    """
    try:
        report = generate_report(
            question=request.question,
            llm_answer=request.llm_answer,
            raw_samples=request.sample_answers,
            context_text=request.context_text,
        )
        add_history_item(request.model_dump(), report)
        return AnalysisResponse(**report)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Analysis engine failure: {str(e)}"
        )

@router.get("/history", response_model=HistoryResponse)
async def get_history():
    return HistoryResponse(items=get_history_items())

@router.delete("/history")
async def delete_history():
    clear_history()
    return {"status": "ok", "message": "Analysis history cleared."}

@router.get("/benchmark/run", response_model=BenchmarkResponse)
async def benchmark_run():
    try:
        return BenchmarkResponse(**run_benchmark())
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Benchmark failure: {str(e)}"
        )

@router.post("/models/compare", response_model=ModelComparisonResponse)
async def compare_model_outputs(request: ModelComparisonRequest):
    try:
        cases = [case.model_dump() for case in request.cases] if request.cases else None
        return ModelComparisonResponse(**compare_models(cases))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Model comparison failure: {str(e)}"
        )

@router.get("/models/compare/demo", response_model=ModelComparisonResponse)
async def compare_demo_models():
    try:
        return ModelComparisonResponse(**compare_models())
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Demo model comparison failure: {str(e)}"
        )
