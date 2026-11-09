from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ModelPerformanceMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    test_samples: int

class ModelEvaluationComparisonResponse(BaseModel):
    models: Dict[str, ModelPerformanceMetrics]
    dataset_disclaimer: str
    feature_importance: Optional[List[Dict[str, Any]]] = None

class ScenarioSimulationRequest(BaseModel):
    organ_id: str
    recipient_id: str
    travel_time_delay_hours: float = Field(default=0.0, ge=0)
    urgency_shift: int = 0
    waiting_time_shift_days: int = 0
    preservation_limit_override_hours: Optional[float] = Field(default=None, gt=0)

class ScenarioSimulationResponse(BaseModel):
    candidate_id: str
    baseline_score: float
    scenario_score: Optional[float] = None
    score_delta: Optional[float] = None
    baseline_rank: Optional[int] = None
    scenario_rank: Optional[int] = None
    rank_delta: Optional[int] = None
    baseline_transit_hours: float
    scenario_transit_hours: float
    feasibility_status: str
    explanation_delta: str
    disclaimer: str
