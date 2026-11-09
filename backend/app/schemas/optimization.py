from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class HungarianOptimizationRequest(BaseModel):
    organ_ids: Optional[List[str]] = Field(default=None, description="Optional list of organ IDs; defaults to all available organs")
    recipient_ids: Optional[List[str]] = Field(default=None, description="Optional list of recipient IDs; defaults to active recipients")

class AssignmentPair(BaseModel):
    organ_id: str
    organ_type: str
    organ_blood_group: str
    organ_location: str
    recipient_id: str
    recipient_name: str
    recipient_blood_group: str
    recipient_hospital: str
    medical_urgency: int
    ai_suitability_score: float
    computed_utility: float
    assignment_status: str

class MatrixRow(BaseModel):
    organ_id: str
    organ_type: str
    blood_group: str
    scores: List[Dict[str, Any]]

class HungarianOptimizationResponse(BaseModel):
    success: bool
    algorithm: str
    num_organs_evaluated: int
    num_recipients_evaluated: int
    total_assignments: int
    total_system_utility: float
    assignments: List[AssignmentPair]
    unmatched_organs: List[str]
    unmatched_recipients: List[str]
    matrix_table: List[MatrixRow]
    research_disclaimer: str
