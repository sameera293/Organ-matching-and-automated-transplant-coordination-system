import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Organ, Donor, Recipient, MatchResult, Notification
from backend.app.schemas.match import MatchRunRequest, MatchRunResponse, CandidateMatchDetail, MatchReviewUpdate
from backend.app.algorithms.compatibility_engine import CompatibilityEngine
from backend.app.algorithms.graph_network import MedicalTransitGraph
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra
from ml.training.predict import OrganMatchPredictor

router = APIRouter(prefix="/matching", tags=["Matching"])

graph_instance = MedicalTransitGraph()

@router.post("/run", response_model=MatchRunResponse)
def run_matching_pipeline(req: MatchRunRequest, db: Session = Depends(get_db)):
    organ = db.query(Organ).filter(Organ.organ_id == req.organ_id).first()
    if not organ:
        raise HTTPException(status_code=404, detail=f"Organ '{req.organ_id}' not found.")

    donor = db.query(Donor).filter(Donor.donor_id == organ.donor_id).first()
    donor_age = donor.age if donor else 45

    elapsed = (datetime.utcnow() - organ.retrieval_time).total_seconds() / 3600.0
    preservation_remaining = max(0.0, round(organ.preservation_limit - elapsed, 2))

    organ_dict = {
        'organ_id': organ.organ_id,
        'organ_type': organ.organ_type,
        'blood_group': organ.blood_group,
        'current_location': organ.current_location,
        'preservation_limit': organ.preservation_limit,
        'preservation_remaining_hours': preservation_remaining,
        'status': organ.status
    }

    # Fetch active recipients
    recipients = db.query(Recipient).all()
    if not recipients:
        raise HTTPException(status_code=400, detail="No registered recipients found in waitlist database.")

    # Distance / transit estimation resolver
    def resolve_transit(org_loc: str, rec_loc: str) -> float:
        s_node = graph_instance.resolve_nearest_node(org_loc)
        d_node = graph_instance.resolve_nearest_node(rec_loc)
        path_res = find_shortest_path_dijkstra(graph_instance, s_node, d_node)
        return max(0.5, path_res.get('total_time_hours', 1.5))

    recipient_dicts = [
        {
            'recipient_id': r.recipient_id,
            'name': r.name,
            'age': r.age,
            'blood_group': r.blood_group,
            'required_organ': r.required_organ,
            'medical_urgency': r.medical_urgency,
            'waiting_time': r.waiting_time,
            'hospital': r.hospital,
            'location': r.location,
            'eligibility_status': r.eligibility_status
        }
        for r in recipients
    ]

    # Stage 1: Rule-Based Compatibility Engine
    eligible_raw, filtered_raw = CompatibilityEngine.filter_candidate_pool(
        organ_dict, recipient_dicts, distance_calculator_fn=resolve_transit
    )

    # Initialize ML Predictor for Stage 2
    model_choice = req.model_name or "xgboost"
    predictor = OrganMatchPredictor(model_name=model_choice)

    eligible_candidates: List[CandidateMatchDetail] = []
    ineligible_candidates: List[CandidateMatchDetail] = []

    # Process Ineligible Candidates
    for rec in filtered_raw:
        eval_info = rec['compatibility_evaluation']
        ineligible_candidates.append(CandidateMatchDetail(
            recipient_id=rec['recipient_id'],
            recipient_name=rec['name'],
            age=rec['age'],
            blood_group=rec['blood_group'],
            hospital=rec['hospital'],
            location=rec['location'],
            medical_urgency=rec['medical_urgency'],
            waiting_time_days=rec['waiting_time'],
            is_eligible=False,
            compatibility_status="INCOMPATIBLE",
            failed_rules=eval_info['failed_rules'],
            reasons=eval_info['reasons'],
            ai_suitability_score=None,
            rank=None,
            distance_km=None,
            estimated_transit_hours=rec.get('estimated_transit_hours'),
            preservation_feasibility="INFEASIBLE_RULE"
        ))

    # Process Eligible Candidates with ML Predictor
    scored_pool = []
    for rec in eligible_raw:
        transit_hrs = rec.get('estimated_transit_hours', 1.5)
        # Compute route distance
        s_node = graph_instance.resolve_nearest_node(organ.current_location)
        d_node = graph_instance.resolve_nearest_node(rec['location'])
        route = find_shortest_path_dijkstra(graph_instance, s_node, d_node)
        dist_km = route.get('total_distance_km', 100.0)

        blood_rule = rec['compatibility_evaluation']['rule_evaluation_details']['blood_group_compatibility']
        feature_vector = {
            'donor_age': donor_age,
            'recipient_age': rec['age'],
            'blood_compatible': int(blood_rule['passed']),
            'medical_urgency': rec['medical_urgency'],
            'waiting_time_days': rec['waiting_time'],
            'distance_km': dist_km,
            'estimated_transit_hours': transit_hrs,
            'preservation_remaining_hours': preservation_remaining,
            'cold_ischemia_ratio': round(transit_hrs / max(preservation_remaining, 0.1), 3),
            'hla_mismatch': 2,
            'pra_percent': 10.0
        }

        pred_res = predictor.predict_candidate(feature_vector)
        ai_score = pred_res['ai_suitability_score']
        feasibility = "FEASIBLE" if transit_hrs <= preservation_remaining else "FEASIBILITY_CONCERN"

        scored_pool.append({
            'rec': rec,
            'ai_score': ai_score,
            'dist_km': dist_km,
            'transit_hrs': transit_hrs,
            'feasibility': feasibility
        })

    # Sort eligible candidates descending by AI Suitability Score
    scored_pool.sort(key=lambda x: x['ai_score'], reverse=True)

    for rank_idx, item in enumerate(scored_pool, start=1):
        rec = item['rec']
        cand_detail = CandidateMatchDetail(
            recipient_id=rec['recipient_id'],
            recipient_name=rec['name'],
            age=rec['age'],
            blood_group=rec['blood_group'],
            hospital=rec['hospital'],
            location=rec['location'],
            medical_urgency=rec['medical_urgency'],
            waiting_time_days=rec['waiting_time'],
            is_eligible=True,
            compatibility_status="COMPATIBLE",
            failed_rules=[],
            reasons=rec['compatibility_evaluation']['reasons'],
            ai_suitability_score=item['ai_score'],
            rank=rank_idx,
            distance_km=item['dist_km'],
            estimated_transit_hours=item['transit_hrs'],
            preservation_feasibility=item['feasibility']
        )
        eligible_candidates.append(cand_detail)

        # Upsert into MatchResult table for persistence and audit
        existing_match = db.query(MatchResult).filter(
            MatchResult.organ_id == organ.organ_id,
            MatchResult.recipient_id == rec['recipient_id']
        ).first()

        if not existing_match:
            new_match = MatchResult(
                match_id=f"MTC-{uuid.uuid4().hex[:8].upper()}",
                organ_id=organ.organ_id,
                recipient_id=rec['recipient_id'],
                compatibility_status="COMPATIBLE",
                ai_score=item['ai_score'],
                rank=rank_idx,
                urgency_score=float(rec['medical_urgency']),
                waiting_score=float(rec['waiting_time']),
                logistics_score=float(item['transit_hrs']),
                explanation=json.dumps({
                    "model_name": model_choice,
                    "reasons": rec['compatibility_evaluation']['reasons'],
                    "failed_rules": [],
                    "feature_values": feature_vector,
                }),
                review_status="Pending Review"
            )
            db.add(new_match)
        else:
            existing_match.ai_score = item['ai_score']
            existing_match.rank = rank_idx
            existing_match.urgency_score = float(rec['medical_urgency'])
            existing_match.waiting_score = float(rec['waiting_time'])
            existing_match.logistics_score = float(item['transit_hrs'])
            existing_match.explanation = json.dumps({
                "model_name": model_choice,
                "reasons": rec['compatibility_evaluation']['reasons'],
                "failed_rules": [],
                "feature_values": feature_vector,
            })

    # Automated Event Notification if matches identified
    if eligible_candidates:
        top_cand = eligible_candidates[0]
        existing_unread = db.query(Notification).filter(
            Notification.type == "MATCH_IDENTIFIED",
            Notification.status == "UNREAD",
            Notification.message.contains(f"Organ {organ.organ_id} ")
        ).first()
        if not existing_unread:
            notif = Notification(
                notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
                type="MATCH_IDENTIFIED",
                message=f"{len(eligible_candidates)} potentially suitable candidate(s) identified for Organ {organ.organ_id} ({organ.organ_type}). Top candidate: {top_cand.recipient_name} (AI score: {top_cand.ai_suitability_score}).",
                severity="INFO",
                status="UNREAD"
            )
            db.add(notif)

    db.commit()

    return MatchRunResponse(
        organ_id=organ.organ_id,
        organ_type=organ.organ_type,
        blood_group=organ.blood_group,
        current_location=organ.current_location,
        preservation_limit_hours=organ.preservation_limit,
        preservation_remaining_hours=preservation_remaining,
        model_used=model_choice,
        total_candidates_evaluated=len(recipients),
        eligible_candidates_count=len(eligible_candidates),
        ineligible_candidates_count=len(ineligible_candidates),
        ranked_eligible_candidates=eligible_candidates,
        ineligible_candidates=ineligible_candidates,
        disclaimer="AI-generated results are for research and decision-support purposes only. Final medical and allocation decisions remain with authorized healthcare professionals and applicable policies."
    )

@router.get("/{organ_id}")
def get_match_history(organ_id: str, db: Session = Depends(get_db)):
    matches = db.query(MatchResult).filter(MatchResult.organ_id == organ_id).order_by(MatchResult.rank.asc()).all()
    result = []
    for match in matches:
        detail = json.loads(match.explanation) if match.explanation else {}
        recipient = match.recipient
        result.append({
            "match_id": match.match_id,
            "organ_id": match.organ_id,
            "recipient_id": match.recipient_id,
            "recipient_name": recipient.name if recipient else match.recipient_id,
            "recipient_age": recipient.age if recipient else None,
            "recipient_blood_group": recipient.blood_group if recipient else None,
            "recipient_hospital": recipient.hospital if recipient else None,
            "ai_score": match.ai_score,
            "rank": match.rank,
            "compatibility_status": match.compatibility_status,
            "review_status": match.review_status,
            "review_notes": match.review_notes,
            "explanation": detail,
        })
    return result

@router.put("/review/{match_id}")
def update_match_review(match_id: str, update_in: MatchReviewUpdate, db: Session = Depends(get_db)):
    match = db.query(MatchResult).filter(MatchResult.match_id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail=f"Match '{match_id}' not found.")
    
    match.review_status = update_in.review_status
    if update_in.review_notes is not None:
        match.review_notes = update_in.review_notes
        
    db.commit()
    db.refresh(match)
    return {
        "message": f"Match record {match_id} updated.",
        "review_status": match.review_status,
        "review_notes": match.review_notes
    }
