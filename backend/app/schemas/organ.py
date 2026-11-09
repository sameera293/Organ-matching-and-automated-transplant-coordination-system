from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class OrganBase(BaseModel):
    donor_id: str = Field(..., description="Linked donor identifier")
    organ_type: str = Field(..., description="Type of organ: Kidney, Liver, Heart, Lung, Pancreas")
    blood_group: str = Field(..., description="ABO/Rh blood group")
    retrieval_time: Optional[datetime] = Field(default_factory=datetime.utcnow)
    preservation_limit: float = Field(..., gt=0, description="Max cold ischemia time in hours")
    current_location: str = Field(..., description="Hospital or recovery center location")
    status: str = Field(default="Available", description="Available, Reserved for Review, In Transit, Transplanted, Expired")

class OrganCreate(OrganBase):
    organ_id: Optional[str] = None

class OrganUpdate(BaseModel):
    organ_type: Optional[str] = None
    blood_group: Optional[str] = None
    preservation_limit: Optional[float] = None
    current_location: Optional[str] = None
    status: Optional[str] = None

class OrganResponse(OrganBase):
    organ_id: str
    preservation_remaining_hours: Optional[float] = None
    is_approaching_limit: Optional[bool] = None

    class Config:
        from_attributes = True
