from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class NotificationCreate(BaseModel):
    type: str = Field(..., description="ORGAN_REGISTERED, PRESERVATION_WARNING, MATCH_IDENTIFIED, LOGISTICS_ALERT")
    message: str
    severity: str = Field(default="INFO", description="INFO, WARNING, CRITICAL")

class NotificationResponse(BaseModel):
    notification_id: str
    type: str
    message: str
    severity: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
