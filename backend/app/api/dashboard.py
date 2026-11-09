from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.session import get_db
from backend.app.database.models import Donor, Organ, Recipient, MatchResult, Notification

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_donors = db.query(Donor).count()
    available_organs = db.query(Organ).filter(Organ.status == 'Available').count()
    active_recipients = db.query(Recipient).filter(Recipient.eligibility_status.in_(['Eligible', 'Active'])).count()
    high_urgency_recipients = db.query(Recipient).filter(
        Recipient.medical_urgency >= 4,
        Recipient.eligibility_status.in_(['Eligible', 'Active'])
    ).count()
    
    pending_reviews = db.query(MatchResult).filter(MatchResult.review_status == 'Pending Review').count()
    unread_notifications = db.query(Notification).filter(Notification.status == 'UNREAD').count()

    # Organ Type Distribution
    organ_counts = db.query(Organ.organ_type, func.count(Organ.organ_id)).group_by(Organ.organ_type).all()
    organ_distribution = [{'organ_type': item[0], 'count': item[1]} for item in organ_counts]

    # Recipient Urgency Distribution
    urgency_counts = db.query(Recipient.medical_urgency, func.count(Recipient.recipient_id)).group_by(Recipient.medical_urgency).order_by(Recipient.medical_urgency).all()
    urgency_distribution = [{'urgency_level': f"Tier {item[0]}", 'count': item[1]} for item in urgency_counts]

    # Recent Matches
    recent_matches = db.query(MatchResult).order_by(MatchResult.created_at.desc()).limit(6).all()
    match_list = []
    for m in recent_matches:
        rec = db.query(Recipient).filter(Recipient.recipient_id == m.recipient_id).first()
        org = db.query(Organ).filter(Organ.organ_id == m.organ_id).first()
        match_list.append({
            'match_id': m.match_id,
            'organ_id': m.organ_id,
            'organ_type': org.organ_type if org else 'Unknown',
            'recipient_id': m.recipient_id,
            'recipient_name': rec.name if rec else 'Unknown',
            'ai_score': m.ai_score,
            'rank': m.rank,
            'review_status': m.review_status,
            'created_at': m.created_at
        })

    # Recent Notifications
    recent_notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(5).all()

    return {
        'stats': {
            'total_donors': total_donors,
            'available_organs': available_organs,
            'active_recipients': active_recipients,
            'high_urgency_recipients': high_urgency_recipients,
            'pending_reviews': pending_reviews,
            'unread_notifications': unread_notifications
        },
        'organ_distribution': organ_distribution,
        'urgency_distribution': urgency_distribution,
        'recent_matches': match_list,
        'recent_notifications': [
            {
                'notification_id': n.notification_id,
                'type': n.type,
                'message': n.message,
                'severity': n.severity,
                'status': n.status,
                'created_at': n.created_at
            }
            for n in recent_notifs
        ],
        'safety_disclaimer': "AI-generated results are for research and decision-support purposes only. Final medical and allocation decisions remain with authorized healthcare professionals and applicable policies."
    }
