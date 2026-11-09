"""
Automated unit tests for SHAP explainability module.
"""

import pytest
from ml.explainability.shap_explainer import OrganMatchExplainer

def test_shap_explainer_initialization():
    explainer = OrganMatchExplainer(model_name='xgboost')
    assert explainer.model is not None
    assert explainer.explainer is not None

def test_shap_candidate_explanation():
    explainer = OrganMatchExplainer(model_name='xgboost')
    sample_candidate = {
        'donor_age': 45,
        'recipient_age': 50,
        'blood_compatible': 1,
        'medical_urgency': 4,
        'waiting_time_days': 450,
        'distance_km': 120.0,
        'estimated_transit_hours': 2.5,
        'preservation_remaining_hours': 22.0,
        'hla_mismatch': 2,
        'pra_percent': 15.0
    }
    explanation = explainer.explain_candidate(sample_candidate, candidate_id='REC-TEST-01')
    
    assert 'ai_score' in explanation
    assert 'waterfall_data' in explanation
    assert len(explanation['waterfall_data']) == 12
    assert 'top_positive_factors' in explanation
    assert 'top_negative_factors' in explanation
    assert explanation['candidate_id'] == 'REC-TEST-01'
    assert 0.0 <= explanation['ai_score'] <= 1.0

def test_shap_random_forest():
    explainer = OrganMatchExplainer(model_name='random_forest')
    sample_candidate = {
        'donor_age': 30,
        'recipient_age': 32,
        'blood_compatible': 1,
        'medical_urgency': 5,
        'waiting_time_days': 600,
        'distance_km': 50.0,
        'estimated_transit_hours': 1.0,
        'preservation_remaining_hours': 28.0,
        'hla_mismatch': 1,
        'pra_percent': 5.0
    }
    explanation = explainer.explain_candidate(sample_candidate)
    assert explanation['model_evaluated'] == 'random_forest'
    assert explanation['ai_score'] > 0.5
