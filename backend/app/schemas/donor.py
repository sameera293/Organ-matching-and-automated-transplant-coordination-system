from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class DonorBase(BaseModel):
    age: int = Field(..., ge=0, le=120, description="Age of the donor")
    blood_group: str = Field(..., description="ABO/Rh Blood Group (e.g., O+, A-, B+, AB+)")
    gender: str = Field(..., description="Gender (e.g., Male, Female, Other)")
    location: str = Field(..., description="Hospital or geographical location")
    donor_status: str = Field(default="Active", description="Status of donor")

class DonorCreate(DonorBase):
    donor_id: Optional[str] = None

class DonorUpdate(BaseModel):
    age: Optional[int] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    donor_status: Optional[str] = None

class DonorResponse(DonorBase):
    donor_id: str
    registration_date: datetime

    class Config:
        from_attributes = True
