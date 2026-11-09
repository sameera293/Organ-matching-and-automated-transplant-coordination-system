from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class MatchRunRequest(BaseModel):
    organ_id: str = Field(..., description="ID of available organ to evaluate")
    model_name: Optional[str] = Field(default="xgboost", description="Model: xgboost, random_forest, logistic_regression")

class CandidateMatchDetail(BaseModel):
    recipient_id: str
    recipient_name: str
    age: int
    blood_group: str
    hospital: str
    location: str
    medical_urgency: int
    waiting_time_days: int
    is_eligible: bool
    compatibility_status: str
    failed_rules: List[str] = []
    reasons: List[str] = []
    ai_suitability_score: Optional[float] = None
    rank: Optional[int] = None
    distance_km: Optional[float] = None
    estimated_transit_hours: Optional[float] = None
    preservation_feasibility: Optional[str] = None
    review_status: str = "Pending Review"

class MatchRunResponse(BaseModel):
    organ_id: str
    organ_type: str
    blood_group: str
    current_location: str
    preservation_limit_hours: float
    preservation_remaining_hours: float
    model_used: str
    total_candidates_evaluated: int
    eligible_candidates_count: int
    ineligible_candidates_count: int
    ranked_eligible_candidates: List[CandidateMatchDetail]
    ineligible_candidates: List[CandidateMatchDetail]
    disclaimer: str

class MatchReviewUpdate(BaseModel):
    review_status: str = Field(..., description="Reviewed, Forwarded for Review, Flagged")
    review_notes: Optional[str] = None
