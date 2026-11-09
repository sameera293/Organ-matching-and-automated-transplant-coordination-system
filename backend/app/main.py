"""
FastAPI Main Application Entry Point.
AI-Driven Intelligent Organ Matching and Automated Transplant Coordination System.
An Explainable AI-Based Decision-Support Framework.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.app.config import settings
from backend.app.database.session import engine, Base
from backend.app.database.models import Donor, Organ, Recipient, MatchResult, Route, Notification, ModelEvaluation

# API Routers
from backend.app.api import (
    donors,
    organs,
    recipients,
    matching,
    explain,
    logistics,
    optimization,
    scenarios,
    notifications,
    ml_evaluation,
    fairness,
    dashboard
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("organ_matching_system")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    try:
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception:
        logger.exception("Error creating database tables")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Research and Decision-Support Framework for Intelligent Organ Compatibility Filtering, "
        "AI-Assisted Suitability Scoring, SHAP Explainability, Graph-Based Logistics, "
        "Hungarian Multi-Candidate Optimization, and Automated Transplant Coordination.\n\n"
        "**MANDATORY MEDICAL SAFETY NOTICE:** "
        "AI-generated results are for research and decision-support purposes only. "
        "The system does NOT make autonomous clinical decisions. Final allocation decisions remain "
        "with authorized healthcare professionals and governing policies."
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS for Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler: Protects against leaking unformatted tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Processing Error",
            "message": "A server-side error occurred while processing this request. Please retry or check the server configuration.",
            "safety_disclaimer": settings.MANDATORY_DISCLAIMER
        }
    )

# Include Routers under /api
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(donors.router, prefix=settings.API_V1_STR)
app.include_router(organs.router, prefix=settings.API_V1_STR)
app.include_router(recipients.router, prefix=settings.API_V1_STR)
app.include_router(matching.router, prefix=settings.API_V1_STR)
app.include_router(explain.router, prefix=settings.API_V1_STR)
app.include_router(logistics.router, prefix=settings.API_V1_STR)
app.include_router(optimization.router, prefix=settings.API_V1_STR)
app.include_router(scenarios.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(ml_evaluation.router, prefix=settings.API_V1_STR)
app.include_router(fairness.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "scope": "Academic / Research Prototype Decision-Support System",
        "safety_disclaimer": settings.MANDATORY_DISCLAIMER,
        "docs_url": "/docs"
    }

@app.get("/health", include_in_schema=False)
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
