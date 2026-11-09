import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Organ, Donor, Notification
from backend.app.schemas.organ import OrganCreate, OrganUpdate, OrganResponse

router = APIRouter(prefix="/organs", tags=["Organs"])

def calculate_preservation_metrics(organ: Organ) -> dict:
    elapsed = (datetime.utcnow() - organ.retrieval_time).total_seconds() / 3600.0
    remaining = max(0.0, round(organ.preservation_limit - elapsed, 2))
    approaching = remaining <= max(2.5, organ.preservation_limit * 0.25)
    return {
        'preservation_remaining_hours': remaining,
        'is_approaching_limit': approaching
    }

@router.get("", response_model=List[OrganResponse])
def list_organs(
    organ_type: Optional[str] = None,
    status: Optional[str] = None,
    blood_group: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Organ)
    if organ_type:
        query = query.filter(Organ.organ_type.ilike(organ_type.strip()))
    if status:
        query = query.filter(Organ.status == status)
    if blood_group:
        query = query.filter(Organ.blood_group == blood_group.strip().upper())
        
    organs = query.order_by(Organ.retrieval_time.desc()).all()
    results = []
    for org in organs:
        metrics = calculate_preservation_metrics(org)
        resp_item = OrganResponse.model_validate(org)
        resp_item.preservation_remaining_hours = metrics['preservation_remaining_hours']
        resp_item.is_approaching_limit = metrics['is_approaching_limit']
        results.append(resp_item)
    return results

@router.post("", response_model=OrganResponse)
def create_organ(organ_in: OrganCreate, db: Session = Depends(get_db)):
    donor = db.query(Donor).filter(Donor.donor_id == organ_in.donor_id).first()
    if not donor:
        raise HTTPException(status_code=400, detail=f"Linked donor '{organ_in.donor_id}' does not exist.")
    
    organ_id = organ_in.organ_id or f"ORG-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(Organ).filter(Organ.organ_id == organ_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Organ with ID '{organ_id}' already exists.")
        
    organ = Organ(
        organ_id=organ_id,
        donor_id=organ_in.donor_id,
        organ_type=organ_in.organ_type,
        blood_group=organ_in.blood_group.strip().upper(),
        retrieval_time=organ_in.retrieval_time or datetime.utcnow(),
        preservation_limit=organ_in.preservation_limit,
        current_location=organ_in.current_location,
        status=organ_in.status
    )
    db.add(organ)

    # Automated Event Notification: Organ Registered
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        type="ORGAN_REGISTERED",
        message=f"New donor organ ({organ.organ_type}, {organ.blood_group}) registered at {organ.current_location}. Matching analysis can be initiated.",
        severity="INFO",
        status="UNREAD"
    )
    db.add(notif)
    
    db.commit()
    db.refresh(organ)
    
    metrics = calculate_preservation_metrics(organ)
    resp = OrganResponse.model_validate(organ)
    resp.preservation_remaining_hours = metrics['preservation_remaining_hours']
    resp.is_approaching_limit = metrics['is_approaching_limit']
    return resp

@router.get("/{organ_id}", response_model=OrganResponse)
def get_organ(organ_id: str, db: Session = Depends(get_db)):
    organ = db.query(Organ).filter(Organ.organ_id == organ_id).first()
    if not organ:
        raise HTTPException(status_code=404, detail=f"Organ '{organ_id}' not found.")
    
    metrics = calculate_preservation_metrics(organ)
    resp = OrganResponse.model_validate(organ)
    resp.preservation_remaining_hours = metrics['preservation_remaining_hours']
    resp.is_approaching_limit = metrics['is_approaching_limit']
    return resp

@router.put("/{organ_id}", response_model=OrganResponse)
def update_organ(organ_id: str, organ_in: OrganUpdate, db: Session = Depends(get_db)):
    organ = db.query(Organ).filter(Organ.organ_id == organ_id).first()
    if not organ:
        raise HTTPException(status_code=404, detail=f"Organ '{organ_id}' not found.")
        
    update_data = organ_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "blood_group" and value:
            value = value.strip().upper()
        setattr(organ, field, value)
        
    db.commit()
    db.refresh(organ)
    
    metrics = calculate_preservation_metrics(organ)
    resp = OrganResponse.model_validate(organ)
    resp.preservation_remaining_hours = metrics['preservation_remaining_hours']
    resp.is_approaching_limit = metrics['is_approaching_limit']
    return resp

@router.delete("/{organ_id}")
def delete_organ(organ_id: str, db: Session = Depends(get_db)):
    organ = db.query(Organ).filter(Organ.organ_id == organ_id).first()
    if not organ:
        raise HTTPException(status_code=404, detail=f"Organ '{organ_id}' not found.")
    db.delete(organ)
    db.commit()
    return {"message": f"Organ '{organ_id}' successfully removed."}
