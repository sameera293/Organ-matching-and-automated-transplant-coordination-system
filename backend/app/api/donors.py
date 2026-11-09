import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Donor
from backend.app.schemas.donor import DonorCreate, DonorUpdate, DonorResponse

router = APIRouter(prefix="/donors", tags=["Donors"])

@router.get("", response_model=List[DonorResponse])
def list_donors(
    search: Optional[str] = None,
    blood_group: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Donor)
    if blood_group:
        query = query.filter(Donor.blood_group == blood_group.strip().upper())
    if status:
        query = query.filter(Donor.donor_status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Donor.donor_id.ilike(s)) | (Donor.location.ilike(s)))
    return query.order_by(Donor.registration_date.desc()).all()

@router.post("", response_model=DonorResponse)
def create_donor(donor_in: DonorCreate, db: Session = Depends(get_db)):
    donor_id = donor_in.donor_id or f"DON-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Donor with ID '{donor_id}' already exists.")
    
    donor = Donor(
        donor_id=donor_id,
        age=donor_in.age,
        blood_group=donor_in.blood_group.strip().upper(),
        gender=donor_in.gender,
        location=donor_in.location,
        donor_status=donor_in.donor_status
    )
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor

@router.get("/{donor_id}", response_model=DonorResponse)
def get_donor(donor_id: str, db: Session = Depends(get_db)):
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail=f"Donor '{donor_id}' not found.")
    return donor

@router.put("/{donor_id}", response_model=DonorResponse)
def update_donor(donor_id: str, donor_in: DonorUpdate, db: Session = Depends(get_db)):
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail=f"Donor '{donor_id}' not found.")
    
    update_data = donor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "blood_group" and value:
            value = value.strip().upper()
        setattr(donor, field, value)
    
    db.commit()
    db.refresh(donor)
    return donor

@router.delete("/{donor_id}")
def delete_donor(donor_id: str, db: Session = Depends(get_db)):
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail=f"Donor '{donor_id}' not found.")
    db.delete(donor)
    db.commit()
    return {"message": f"Donor '{donor_id}' successfully removed."}
