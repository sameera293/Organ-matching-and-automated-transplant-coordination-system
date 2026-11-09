from fastapi import APIRouter, HTTPException
from ml.training.evaluate import load_or_compute_evaluations
from ml.training.train import train_and_evaluate

router = APIRouter(prefix="/ml", tags=["ML Evaluation"])

@router.get("/evaluation")
def get_model_evaluations():
    """
    Returns comparative evaluation metrics across Logistic Regression, Random Forest,
    and XGBoost trained on the synthetic research dataset.
    """
    try:
        evals = load_or_compute_evaluations()
        return evals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load evaluations: {str(e)}")

@router.post("/train")
def trigger_training():
    """
    Retrains candidate models on the synthetic research dataset.
    """
    try:
        metadata = train_and_evaluate()
        return {
            "message": "Models successfully retrained and serialized.",
            "metrics": metadata['metrics'],
            "sample_size_train": metadata['sample_size_train'],
            "sample_size_test": metadata['sample_size_test'],
            "disclaimer": metadata['dataset_disclaimer']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
