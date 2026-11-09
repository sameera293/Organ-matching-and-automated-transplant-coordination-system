from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.app.database.session import get_db
from backend.app.database.models import Organ, Donor, Recipient
from backend.app.algorithms.graph_network import MedicalTransitGraph
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra
from backend.app.algorithms.compatibility_engine import CompatibilityEngine

from ml.explainability.shap_explainer import OrganMatchExplainer
from ml.training.predict import OrganMatchPredictor


router = APIRouter(
    prefix="/explain",
    tags=["Explainability"]
)


# ---------------------------------------------------------
# Shared resources
# ---------------------------------------------------------

explainer_xgb = OrganMatchExplainer(
    model_name="xgboost"
)

explainer_rf = OrganMatchExplainer(
    model_name="random_forest"
)

graph_instance = MedicalTransitGraph()


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class ExplainRequest(BaseModel):
    organ_id: str
    recipient_id: str
    model_name: Optional[str] = Field(
        default="xgboost",
        description="xgboost or random_forest"
    )


# ---------------------------------------------------------
# Explainability endpoint
# ---------------------------------------------------------

@router.post("")
def explain_match(
    req: ExplainRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:

    # -----------------------------------------------------
    # 1. Fetch organ
    # -----------------------------------------------------

    organ = (
        db.query(Organ)
        .filter(Organ.organ_id == req.organ_id)
        .first()
    )

    if not organ:
        raise HTTPException(
            status_code=404,
            detail=f"Organ '{req.organ_id}' not found."
        )

    # -----------------------------------------------------
    # 2. Fetch recipient
    # -----------------------------------------------------

    recipient = (
        db.query(Recipient)
        .filter(
            Recipient.recipient_id == req.recipient_id
        )
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail=f"Recipient '{req.recipient_id}' not found."
        )

    # -----------------------------------------------------
    # 3. Fetch donor
    # -----------------------------------------------------

    donor = (
        db.query(Donor)
        .filter(
            Donor.donor_id == organ.donor_id
        )
        .first()
    )

    donor_age = donor.age if donor else 45

    # -----------------------------------------------------
    # 4. Calculate logistics metrics
    # -----------------------------------------------------

    s_node = graph_instance.resolve_nearest_node(
        organ.current_location
    )

    d_node = graph_instance.resolve_nearest_node(
        recipient.location
    )

    route = find_shortest_path_dijkstra(
        graph_instance,
        s_node,
        d_node
    )

    dist_km = route.get(
        "total_distance_km",
        80.0
    )

    transit_hrs = max(
        0.5,
        route.get(
            "total_time_hours",
            1.5
        )
    )

    # -----------------------------------------------------
    # 5. Calculate preservation remaining
    # -----------------------------------------------------

    from datetime import datetime

    elapsed_hours = (
        datetime.utcnow()
        - organ.retrieval_time
    ).total_seconds() / 3600.0

    preservation_remaining = max(
        0.0,
        organ.preservation_limit
        - elapsed_hours
    )

    # -----------------------------------------------------
    # 6. Calculate REAL blood compatibility
    # -----------------------------------------------------

    blood_compatible, blood_reason = (
        CompatibilityEngine.check_blood_compatibility(
            organ.blood_group,
            recipient.blood_group
        )
    )

    eligibility = CompatibilityEngine.evaluate_candidate(
        {
            "organ_type": organ.organ_type,
            "blood_group": organ.blood_group,
            "status": organ.status,
            "preservation_remaining_hours": preservation_remaining,
        },
        {
            "required_organ": recipient.required_organ,
            "blood_group": recipient.blood_group,
            "eligibility_status": recipient.eligibility_status,
        },
        transit_hrs,
    )
    if not eligibility["eligible"]:
        raise HTTPException(
            status_code=400,
            detail=f"SHAP is available only for candidates passing hard eligibility rules: {', '.join(eligibility['failed_rules'])}",
        )

    # -----------------------------------------------------
    # 7. Build model features
    # -----------------------------------------------------

    features = {

        "donor_age":
            donor_age,

        "recipient_age":
            recipient.age,

        "age_difference":
            abs(
                donor_age
                - recipient.age
            ),

        "blood_compatible":
            1 if blood_compatible else 0,

        "medical_urgency":
            recipient.medical_urgency,

        "waiting_time_days":
            recipient.waiting_time,

        "distance_km":
            dist_km,

        "estimated_transit_hours":
            transit_hrs,

        "preservation_remaining_hours":
            preservation_remaining,

        "cold_ischemia_ratio":
            round(
                transit_hrs
                / max(
                    preservation_remaining,
                    0.1
                ),
                3
            ),

        # Current research prototype values
        "hla_mismatch":
            2,

        "pra_percent":
            10.0
    }

    # -----------------------------------------------------
    # 8. Select explanation model
    # -----------------------------------------------------

    if req.model_name.lower() == "random_forest":
        explainer = explainer_rf
    else:
        explainer = explainer_xgb

    # -----------------------------------------------------
    # 9. Generate SHAP explanation
    # -----------------------------------------------------

    explanation = explainer.explain_candidate(
        features,
        candidate_id=recipient.recipient_id
    )

    # -----------------------------------------------------
    # 10. Generate AI-assisted suitability score
    # -----------------------------------------------------

    score_predictor = OrganMatchPredictor(
        model_name=req.model_name
    )

    score_result = (
        score_predictor.predict_candidate(
            features
        )
    )

    # -----------------------------------------------------
    # 11. Attach score information
    # -----------------------------------------------------

    explanation["ai_suitability_score"] = score_result["ai_suitability_score"]

    explanation["model_probability"] = (
        score_result[
            "model_probability"
        ]
    )

    explanation["continuous_suitability_index"] = (
        score_result[
            "continuous_suitability_index"
        ]
    )

    explanation["suitability_classification"] = (
        score_result[
            "suitability_classification"
        ]
    )

    # -----------------------------------------------------
    # 12. Attach compatibility information
    # -----------------------------------------------------

    explanation["compatibility"] = {
        "blood_compatible":
            blood_compatible,

        "blood_reason":
            blood_reason
    }

    # -----------------------------------------------------
    # 13. Attach organ information
    # -----------------------------------------------------

    explanation["organ_details"] = {

        "organ_id":
            organ.organ_id,

        "organ_type":
            organ.organ_type,

        "blood_group":
            organ.blood_group,

        "location":
            organ.current_location
    }

    # -----------------------------------------------------
    # 14. Attach recipient information
    # -----------------------------------------------------

    explanation["recipient_details"] = {

        "recipient_id":
            recipient.recipient_id,

        "name":
            recipient.name,

        "hospital":
            recipient.hospital,

        "blood_group":
            recipient.blood_group,

        "urgency":
            recipient.medical_urgency
    }

    # -----------------------------------------------------
    # 15. Return complete explanation
    # -----------------------------------------------------

    return explanation
