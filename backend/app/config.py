"""
Application Configuration Settings.
Loads settings from environment variables with sensible defaults.
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Driven Intelligent Organ Matching and Automated Transplant Coordination System"
    PROJECT_SUBTITLE: str = "An Explainable AI-Based Decision-Support Framework"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./organ_matching.db")
    
    # Server & CORS
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8011"))
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]
    
    # ML & Assets
    MODEL_DIR: str = os.getenv("MODEL_DIR", "ml/saved_models")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "xgboost")
    
    # Safety Banner
    MANDATORY_DISCLAIMER: str = (
        "AI-generated results are for research and decision-support purposes only. "
        "Final medical and allocation decisions remain with authorized healthcare professionals "
        "and applicable policies."
    )

    class Config:
        case_sensitive = True
        extra = "ignore"

settings = Settings()
