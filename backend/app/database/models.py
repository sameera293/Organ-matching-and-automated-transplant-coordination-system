"""
SQLAlchemy Relational Database Models.
Tables: Donors, Organs, Recipients, MatchResults, Routes, Notifications, ModelEvaluations.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Donor(Base):
    __tablename__ = 'donors'

    donor_id = Column(String(50), primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    blood_group = Column(String(10), nullable=False, index=True)
    gender = Column(String(20), nullable=False)
    location = Column(String(100), nullable=False)
    donor_status = Column(String(50), default='Active', index=True)  # Active, Deceased Donor, Archived
    registration_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organs = relationship("Organ", back_populates="donor", cascade="all, delete-orphan")

class Organ(Base):
    __tablename__ = 'organs'

    organ_id = Column(String(50), primary_key=True, index=True)
    donor_id = Column(String(50), ForeignKey('donors.donor_id', ondelete="CASCADE"), nullable=False, index=True)
    organ_type = Column(String(50), nullable=False, index=True)  # Kidney, Liver, Heart, Lung, Pancreas
    blood_group = Column(String(10), nullable=False, index=True)
    retrieval_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    preservation_limit = Column(Float, nullable=False)  # Max cold ischemia hours (e.g., 4.5, 12.0, 30.0)
    current_location = Column(String(100), nullable=False)
    status = Column(String(50), default='Available', index=True)  # Available, Reserved for Review, In Transit, Transplanted, Expired

    # Relationships
    donor = relationship("Donor", back_populates="organs")
    matches = relationship("MatchResult", back_populates="organ", cascade="all, delete-orphan")

class Recipient(Base):
    __tablename__ = 'recipients'

    recipient_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    blood_group = Column(String(10), nullable=False, index=True)
    required_organ = Column(String(50), nullable=False, index=True)
    medical_urgency = Column(Integer, nullable=False, default=3, index=True)  # 1 (lowest) to 5 (highest critical)
    waiting_time = Column(Integer, nullable=False, default=30)  # Days on waitlist
    hospital = Column(String(150), nullable=False)
    location = Column(String(100), nullable=False)
    eligibility_status = Column(String(50), default='Eligible', index=True)  # Eligible, Suspended, Transplanted, Inactive
    registration_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    matches = relationship("MatchResult", back_populates="recipient", cascade="all, delete-orphan")

class MatchResult(Base):
    __tablename__ = 'match_results'

    match_id = Column(String(50), primary_key=True, index=True)
    organ_id = Column(String(50), ForeignKey('organs.organ_id', ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(String(50), ForeignKey('recipients.recipient_id', ondelete="CASCADE"), nullable=False, index=True)
    compatibility_status = Column(String(50), nullable=False)  # COMPATIBLE, INCOMPATIBLE
    ai_score = Column(Float, nullable=True)  # Research-oriented AI suitability score (0.0 to 1.0)
    rank = Column(Integer, nullable=True)
    urgency_score = Column(Float, nullable=True)
    waiting_score = Column(Float, nullable=True)
    logistics_score = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)  # JSON-encoded SHAP feature attribution & rule outcomes
    review_status = Column(String(50), default='Pending Review', index=True)  # Pending Review, Reviewed, Forwarded for Review
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organ = relationship("Organ", back_populates="matches")
    recipient = relationship("Recipient", back_populates="matches")

class Route(Base):
    __tablename__ = 'routes'

    route_id = Column(String(50), primary_key=True, index=True)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    distance = Column(Float, nullable=False)  # Distance in km
    estimated_time = Column(Float, nullable=False)  # Time in hours
    algorithm_used = Column(String(50), nullable=False)  # Dijkstra, A*
    feasibility_status = Column(String(50), nullable=False)  # FEASIBLE, FEASIBILITY_CONCERN
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = 'notifications'

    notification_id = Column(String(50), primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # ORGAN_REGISTERED, PRESERVATION_WARNING, MATCH_IDENTIFIED, LOGISTICS_ALERT
    message = Column(Text, nullable=False)
    severity = Column(String(20), default='INFO')  # INFO, WARNING, CRITICAL
    status = Column(String(20), default='UNREAD', index=True)  # UNREAD, READ
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ModelEvaluation(Base):
    __tablename__ = 'model_evaluations'

    evaluation_id = Column(String(50), primary_key=True, index=True)
    model_name = Column(String(50), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
