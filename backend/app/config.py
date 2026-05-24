import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    MODEL_NAME: str = "all-MiniLM-L6-v2"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    DISABLE_TRANSFORMERS: bool = False

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Look for .env in the parent directory of backend/app (i.e. backend/.env)
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        extra="ignore",
    )

settings = Settings()
