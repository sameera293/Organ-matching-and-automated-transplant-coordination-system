import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Recipient, Notification
from backend.app.schemas.recipient import RecipientCreate, RecipientUpdate, RecipientResponse

router = APIRouter(prefix="/recipients", tags=["Recipients"])

@router.get("", response_model=List[RecipientResponse])
def list_recipients(
    search: Optional[str] = None,
    required_organ: Optional[str] = None,
    blood_group: Optional[str] = None,
    min_urgency: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Recipient)
    if required_organ:
        query = query.filter(Recipient.required_organ.ilike(required_organ.strip()))
    if blood_group:
        query = query.filter(Recipient.blood_group == blood_group.strip().upper())
    if min_urgency:
        query = query.filter(Recipient.medical_urgency >= min_urgency)
    if status:
        query = query.filter(Recipient.eligibility_status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Recipient.name.ilike(s)) | (Recipient.recipient_id.ilike(s)) | (Recipient.hospital.ilike(s)))
        
    return query.order_by(Recipient.medical_urgency.desc(), Recipient.waiting_time.desc()).all()

@router.post("", response_model=RecipientResponse)
def create_recipient(rec_in: RecipientCreate, db: Session = Depends(get_db)):
    rec_id = rec_in.recipient_id or f"REC-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(Recipient).filter(Recipient.recipient_id == rec_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Recipient with ID '{rec_id}' already exists.")
        
    recipient = Recipient(
        recipient_id=rec_id,
        name=rec_in.name,
        age=rec_in.age,
        blood_group=rec_in.blood_group.strip().upper(),
        required_organ=rec_in.required_organ,
        medical_urgency=rec_in.medical_urgency,
        waiting_time=rec_in.waiting_time,
        hospital=rec_in.hospital,
        location=rec_in.location,
        eligibility_status=rec_in.eligibility_status
    )
    db.add(recipient)

    # Event Notification if critical urgency
    if recipient.medical_urgency >= 4:
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            type="HIGH_URGENCY_RECIPIENT",
            message=f"High urgency recipient registered: {recipient.name} ({recipient.required_organ}, {recipient.blood_group}, Urgency Level {recipient.medical_urgency}) at {recipient.hospital}.",
            severity="WARNING",
            status="UNREAD"
        )
        db.add(notif)

    db.commit()
    db.refresh(recipient)
    return recipient

@router.get("/{recipient_id}", response_model=RecipientResponse)
def get_recipient(recipient_id: str, db: Session = Depends(get_db)):
    rec = db.query(Recipient).filter(Recipient.recipient_id == recipient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found.")
    return rec

@router.put("/{recipient_id}", response_model=RecipientResponse)
def update_recipient(recipient_id: str, rec_in: RecipientUpdate, db: Session = Depends(get_db)):
    rec = db.query(Recipient).filter(Recipient.recipient_id == recipient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found.")
        
    update_data = rec_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "blood_group" and value:
            value = value.strip().upper()
        setattr(rec, field, value)
        
    db.commit()
    db.refresh(rec)
    return rec

@router.delete("/{recipient_id}")
def delete_recipient(recipient_id: str, db: Session = Depends(get_db)):
    rec = db.query(Recipient).filter(Recipient.recipient_id == recipient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found.")
    db.delete(rec)
    db.commit()
    return {"message": f"Recipient '{recipient_id}' successfully removed."}
