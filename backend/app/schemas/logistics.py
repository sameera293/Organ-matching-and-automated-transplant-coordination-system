from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RouteCalculationRequest(BaseModel):
    source_location: str = Field(..., description="Donor recovery center / hospital")
    destination_location: str = Field(..., description="Recipient transplant center / hospital")
    algorithm: Optional[str] = Field(default="Dijkstra", description="Dijkstra or A*")
    organ_type: Optional[str] = Field(default="Kidney", description="Organ type to evaluate preservation window")
    preservation_limit_hours: Optional[float] = Field(default=24.0)

class RouteSegment(BaseModel):
    from_node: str
    from_name: str
    to_node: str
    to_name: str
    distance_km: float
    time_hours: float
    route_type: str

class RouteCalculationResponse(BaseModel):
    success: bool
    algorithm_used: str
    source: str
    destination: str
    path: List[str]
    path_nodes: List[Dict[str, Any]]
    total_distance_km: float
    total_time_hours: float
    segments: List[RouteSegment]
    nodes_explored_count: int
    preservation_limit_hours: float
    preservation_time_remaining_hours: float
    preservation_margin_hours: float
    feasibility_status: str  # FEASIBLE or FEASIBILITY_CONCERN
    research_disclaimer: str
