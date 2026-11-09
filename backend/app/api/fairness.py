from fastapi import APIRouter, HTTPException
from backend.app.ml.fairness_eval import evaluate_subgroup_fairness

router = APIRouter(prefix="/fairness", tags=["Fairness Evaluation"])

@router.get("/evaluation")
def get_fairness_assessment():
    """
    Returns research fairness metrics, evaluating equal opportunity and
    selection rate parity across candidate age brackets, blood categories,
    and transit distance tiers on synthetic data.
    """
    try:
        results = evaluate_subgroup_fairness()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fairness evaluation failed: {str(e)}")
