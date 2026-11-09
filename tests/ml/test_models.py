"""
Automated unit tests for ML models and predictor.
"""

import pytest
from ml.training.predict import OrganMatchPredictor
from ml.training.evaluate import load_or_compute_evaluations

def test_models_evaluation():
    evals = load_or_compute_evaluations()
    assert 'metrics' in evals
    metrics = evals['metrics']
    assert 'Logistic Regression' in metrics
    assert 'Random Forest' in metrics
    assert 'XGBoost' in metrics
    
    for name, m in metrics.items():
        assert m['accuracy'] > 0.85
        assert m['f1_score'] > 0.85
        assert m['roc_auc'] > 0.90

def test_predictor_inference():
    predictor = OrganMatchPredictor(model_name='xgboost')
    candidate = {
        'donor_age': 40,
        'recipient_age': 42,
        'blood_compatible': 1,
        'medical_urgency': 4,
        'waiting_time_days': 500,
        'distance_km': 80.0,
        'estimated_transit_hours': 1.8,
        'preservation_remaining_hours': 20.0,
        'hla_mismatch': 2,
        'pra_percent': 10.0
    }
    res = predictor.predict_candidate(candidate)
    assert 'ai_suitability_score' in res
    assert 0.0 <= res['ai_suitability_score'] <= 1.0
    assert res['model_used'] == 'xgboost'
