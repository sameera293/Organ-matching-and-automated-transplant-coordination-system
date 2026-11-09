from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Organ, Recipient
from backend.app.schemas.optimization import HungarianOptimizationRequest, HungarianOptimizationResponse, AssignmentPair, MatrixRow
from backend.app.algorithms.hungarian import HungarianOptimizer
from backend.app.algorithms.graph_network import MedicalTransitGraph
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra
from datetime import datetime

router = APIRouter(prefix="/optimization", tags=["Optimization"])
graph = MedicalTransitGraph()

@router.post("/run", response_model=HungarianOptimizationResponse)
def run_hungarian_optimization(req: HungarianOptimizationRequest, db: Session = Depends(get_db)):
    # Fetch organs
    organ_query = db.query(Organ).filter(Organ.status == 'Available')
    if req.organ_ids:
        organ_query = organ_query.filter(Organ.organ_id.in_(req.organ_ids))
    organs = organ_query.all()

    # Fetch recipients
    rec_query = db.query(Recipient).filter(Recipient.eligibility_status.in_(['Eligible', 'Active']))
    if req.recipient_ids:
        rec_query = rec_query.filter(Recipient.recipient_id.in_(req.recipient_ids))
    recipients = rec_query.all()

    if not organs:
        raise HTTPException(status_code=400, detail="No available organs found for multi-candidate optimization.")
    if not recipients:
        raise HTTPException(status_code=400, detail="No eligible waitlist recipients found.")

    organ_dicts = [
        {
            'organ_id': o.organ_id,
            'organ_type': o.organ_type,
            'blood_group': o.blood_group,
            'current_location': o.current_location,
            'preservation_limit': o.preservation_limit,
            'preservation_remaining_hours': max(0.0, o.preservation_limit - (datetime.utcnow() - o.retrieval_time).total_seconds() / 3600.0),
            'status': o.status
        }
        for o in organs
    ]

    rec_dicts = [
        {
            'recipient_id': r.recipient_id,
            'name': r.name,
            'required_organ': r.required_organ,
            'blood_group': r.blood_group,
            'medical_urgency': r.medical_urgency,
            'waiting_time': r.waiting_time,
            'hospital': r.hospital,
            'location': r.location,
            'eligibility_status': r.eligibility_status
        }
        for r in recipients
    ]

    result = HungarianOptimizer.solve_multi_assignment(organ_dicts, rec_dicts)

    assignments = [
        AssignmentPair(
            organ_id=a['organ_id'],
            organ_type=a['organ_type'],
            organ_blood_group=a['organ_blood_group'],
            organ_location=a['organ_location'],
            recipient_id=a['recipient_id'],
            recipient_name=a['recipient_name'],
            recipient_blood_group=a['recipient_blood_group'],
            recipient_hospital=a['recipient_hospital'],
            medical_urgency=a['medical_urgency'],
            ai_suitability_score=a['ai_suitability_score'],
            computed_utility=a['computed_utility'],
            assignment_status=a['assignment_status']
        )
        for a in result['assignments']
    ]

    matrix_rows = [
        MatrixRow(
            organ_id=row['organ_id'],
            organ_type=row['organ_type'],
            blood_group=row['blood_group'],
            scores=row['scores']
        )
        for row in result['matrix_table']
    ]

    return HungarianOptimizationResponse(
        success=True,
        algorithm=result['algorithm'],
        num_organs_evaluated=result['num_organs_evaluated'],
        num_recipients_evaluated=result['num_recipients_evaluated'],
        total_assignments=result['total_assignments'],
        total_system_utility=result['total_system_utility'],
        assignments=assignments,
        unmatched_organs=result['unmatched_organs'],
        unmatched_recipients=result['unmatched_recipients'],
        matrix_table=matrix_rows,
        research_disclaimer=result['research_disclaimer']
    )
