import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Notification
from backend.app.schemas.notification import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if status:
        query = query.filter(Notification.status == status.upper())
    if severity:
        query = query.filter(Notification.severity == severity.upper())
    return query.order_by(Notification.created_at.desc()).limit(limit).all()

@router.post("", response_model=NotificationResponse)
def create_notification(notif_in: NotificationCreate, db: Session = Depends(get_db)):
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        type=notif_in.type,
        message=notif_in.message,
        severity=notif_in.severity.upper(),
        status="UNREAD"
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(notification_id: str, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail=f"Notification '{notification_id}' not found.")
    notif.status = "READ"
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/read-all")
def mark_all_as_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.status == "UNREAD").update({"status": "READ"})
    db.commit()
    return {"message": "All notifications marked as read."}
