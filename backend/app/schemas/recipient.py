from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class RecipientBase(BaseModel):
    name: str = Field(..., description="Anonymized recipient name/code")
    age: int = Field(..., ge=0, le=120)
    blood_group: str = Field(..., description="Recipient ABO/Rh blood group")
    required_organ: str = Field(..., description="Required organ: Kidney, Liver, Heart, Lung, Pancreas")
    medical_urgency: int = Field(default=3, ge=1, le=5, description="Urgency priority scale 1 (lowest) to 5 (highest)")
    waiting_time: int = Field(default=30, ge=0, description="Waitlist duration in days")
    hospital: str = Field(..., description="Recipient transplant hospital")
    location: str = Field(..., description="City or geographic location")
    eligibility_status: str = Field(default="Eligible", description="Eligible, Suspended, Transplanted, Inactive")

class RecipientCreate(RecipientBase):
    recipient_id: Optional[str] = None

class RecipientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    blood_group: Optional[str] = None
    required_organ: Optional[str] = None
    medical_urgency: Optional[int] = None
    waiting_time: Optional[int] = None
    hospital: Optional[str] = None
    location: Optional[str] = None
    eligibility_status: Optional[str] = None

class RecipientResponse(RecipientBase):
    recipient_id: str
    registration_date: datetime

    class Config:
        from_attributes = True
