from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Organ, Donor, Recipient
from backend.app.algorithms.compatibility_engine import CompatibilityEngine
from backend.app.schemas.evaluation import ScenarioSimulationRequest, ScenarioSimulationResponse
from backend.app.algorithms.graph_network import MedicalTransitGraph
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra
from ml.training.predict import OrganMatchPredictor

router = APIRouter(prefix="/scenario", tags=["Scenario Analysis"])

graph = MedicalTransitGraph()
predictor = OrganMatchPredictor(model_name='xgboost')

@router.post("/run", response_model=ScenarioSimulationResponse)
def simulate_scenario(req: ScenarioSimulationRequest, db: Session = Depends(get_db)):
    organ = db.query(Organ).filter(Organ.organ_id == req.organ_id).first()
    recipient = db.query(Recipient).filter(Recipient.recipient_id == req.recipient_id).first()

    if not organ:
        raise HTTPException(status_code=404, detail=f"Organ '{req.organ_id}' not found.")
    if not recipient:
        raise HTTPException(status_code=404, detail=f"Recipient '{req.recipient_id}' not found.")

    donor = db.query(Donor).filter(Donor.donor_id == organ.donor_id).first()
    donor_age = donor.age if donor else 45

    # Baseline logistics
    s_node = graph.resolve_nearest_node(organ.current_location)
    d_node = graph.resolve_nearest_node(recipient.location)
    base_route = find_shortest_path_dijkstra(graph, s_node, d_node)
    baseline_dist = base_route.get('total_distance_km', 100.0)
    baseline_transit = max(0.5, base_route.get('total_time_hours', 1.8))
    from datetime import datetime
    elapsed_hours = (datetime.utcnow() - organ.retrieval_time).total_seconds() / 3600.0
    baseline_preservation = max(0.0, organ.preservation_limit - elapsed_hours)
    blood_compatible, _ = CompatibilityEngine.check_blood_compatibility(organ.blood_group, recipient.blood_group)
    baseline_rules = CompatibilityEngine.evaluate_candidate(
        {
            "organ_type": organ.organ_type,
            "blood_group": organ.blood_group,
            "status": organ.status,
            "preservation_remaining_hours": baseline_preservation,
        },
        {
            "required_organ": recipient.required_organ,
            "blood_group": recipient.blood_group,
            "eligibility_status": recipient.eligibility_status,
        },
        baseline_transit,
    )
    if not baseline_rules["eligible"]:
        raise HTTPException(status_code=400, detail=f"Candidate fails hard eligibility rules: {', '.join(baseline_rules['failed_rules'])}")

    # 1. Baseline Features & Score
    base_features = {
        'donor_age': donor_age,
        'recipient_age': recipient.age,
        'blood_compatible': int(blood_compatible),
        'medical_urgency': recipient.medical_urgency,
        'waiting_time_days': recipient.waiting_time,
        'distance_km': baseline_dist,
        'estimated_transit_hours': baseline_transit,
        'preservation_remaining_hours': baseline_preservation,
        'cold_ischemia_ratio': round(baseline_transit / max(baseline_preservation, 0.1), 3),
        'hla_mismatch': 2,
        'pra_percent': 10.0
    }
    base_res = predictor.predict_candidate(base_features)
    base_score = base_res['ai_suitability_score']

    # 2. Perturbed Scenario Features & Score
    scenario_transit = max(0.5, round(baseline_transit + req.travel_time_delay_hours, 2))
    scenario_urgency = min(5, max(1, recipient.medical_urgency + req.urgency_shift))
    scenario_waiting = max(0, recipient.waiting_time + req.waiting_time_shift_days)
    scenario_preservation = req.preservation_limit_override_hours if req.preservation_limit_override_hours is not None else baseline_preservation

    scenario_features = {
        'donor_age': donor_age,
        'recipient_age': recipient.age,
        'blood_compatible': int(blood_compatible),
        'medical_urgency': scenario_urgency,
        'waiting_time_days': scenario_waiting,
        'distance_km': baseline_dist,
        'estimated_transit_hours': scenario_transit,
        'preservation_remaining_hours': scenario_preservation,
        'cold_ischemia_ratio': round(scenario_transit / max(scenario_preservation, 0.1), 3),
        'hla_mismatch': 2,
        'pra_percent': 10.0
    }
    scenario_rules = CompatibilityEngine.evaluate_candidate(
        {
            "organ_type": organ.organ_type,
            "blood_group": organ.blood_group,
            "status": organ.status,
            "preservation_remaining_hours": scenario_preservation,
        },
        {
            "required_organ": recipient.required_organ,
            "blood_group": recipient.blood_group,
            "eligibility_status": recipient.eligibility_status,
        },
        scenario_transit,
    )
    scenario_score = None
    score_delta = None
    if scenario_rules["eligible"]:
        scen_res = predictor.predict_candidate(scenario_features)
        scenario_score = scen_res['ai_suitability_score']
        score_delta = round(scenario_score - base_score, 4)

    # Rank changes require reranking the full eligible pool; no synthetic rank is reported.
    base_rank = None
    rank_delta = None
    scenario_rank = None

    feasibility = "FEASIBLE" if scenario_transit <= scenario_preservation else "FEASIBILITY_CONCERN"

    # Explanation of shift
    changes = []
    if req.travel_time_delay_hours != 0:
        changes.append(f"Transit delay of +{req.travel_time_delay_hours:.1f}h")
    if req.urgency_shift != 0:
        sign = "+" if req.urgency_shift > 0 else ""
        changes.append(f"Urgency tier shifted {sign}{req.urgency_shift}")
    if req.waiting_time_shift_days != 0:
        sign = "+" if req.waiting_time_shift_days > 0 else ""
        changes.append(f"Waitlist time {sign}{req.waiting_time_shift_days} days")

    change_str = ", ".join(changes) if changes else "No parameter perturbation applied"
    if scenario_rules["eligible"]:
        explanation_delta = f"Under simulated scenario ({change_str}), suitability score shifted by {score_delta:+.3f}. Feasibility status: {feasibility}."
    else:
        explanation_delta = f"The scenario fails hard eligibility rules ({', '.join(scenario_rules['failed_rules'])}); no AI suitability score was generated."

    return ScenarioSimulationResponse(
        candidate_id=recipient.recipient_id,
        baseline_score=base_score,
        scenario_score=scenario_score,
        score_delta=score_delta,
        baseline_rank=base_rank,
        scenario_rank=scenario_rank,
        rank_delta=rank_delta,
        baseline_transit_hours=baseline_transit,
        scenario_transit_hours=scenario_transit,
        feasibility_status=feasibility,
        explanation_delta=explanation_delta,
        disclaimer="What-If scenario simulation is an academic decision-support feature and does not constitute clinical allocation."
    )
