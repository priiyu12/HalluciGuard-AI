from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Pre-initializes the embedding model manager on startup to avoid delay
    during the first request.
    """
    try:
        from app.models.embedding_model import embedding_manager
        print("Warmup: Initializing embedding manager...")
        embedding_manager.initialize()
        print(f"Warmup: Done. Active mode is: {embedding_manager.model_mode}")
    except Exception as e:
        print(f"Warmup: Error warming up models: {str(e)}")
    yield

app = FastAPI(
    title="HalluciGuard AI API",
    description="Reference-Free Hallucination Detector backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware setup for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    # Allow local direct running
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
