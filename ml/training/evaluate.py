"""
Model Evaluation and Comparison Module.
Loads trained models, compares performance metrics on synthetic test data,
and returns structured benchmarking payloads for the dashboard.
"""

import os
import json
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

FEATURE_COLUMNS = [
    'donor_age',
    'recipient_age',
    'age_difference',
    'blood_compatible',
    'medical_urgency',
    'waiting_time_days',
    'distance_km',
    'estimated_transit_hours',
    'preservation_remaining_hours',
    'cold_ischemia_ratio',
    'hla_mismatch',
    'pra_percent'
]

def load_or_compute_evaluations(model_dir: str = None, data_path: str = None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if model_dir is None:
        model_dir = os.path.join(base_dir, '..', 'saved_models')
    if data_path is None:
        data_path = os.path.join(base_dir, '..', '..', 'data', 'processed', 'organ_matching_dataset.csv')
        
    meta_path = os.path.join(model_dir, 'model_metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            return json.load(f)
            
    # If metadata doesn't exist, compute directly
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLUMNS]
    y = df['is_suitable']
    
    # Simple split
    test_idx = int(len(df) * 0.8)
    X_test = X.iloc[test_idx:]
    y_test = y.iloc[test_idx:]
    
    scaler = joblib.load(os.path.join(model_dir, 'scaler.joblib'))
    lr = joblib.load(os.path.join(model_dir, 'logistic_regression_model.joblib'))
    rf = joblib.load(os.path.join(model_dir, 'random_forest_model.joblib'))
    xgb = joblib.load(os.path.join(model_dir, 'xgboost_model.joblib'))
    
    results = {}
    for name, clf, is_scaled in [
        ('Logistic Regression', lr, True),
        ('Random Forest', rf, False),
        ('XGBoost', xgb, False)
    ]:
        input_data = scaler.transform(X_test) if is_scaled else X_test
        preds = clf.predict(input_data)
        probs = clf.predict_proba(input_data)[:, 1]
        
        results[name] = {
            'accuracy': round(float(accuracy_score(y_test, preds)), 4),
            'precision': round(float(precision_score(y_test, preds, zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, preds, zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, preds, zero_division=0)), 4),
            'roc_auc': round(float(roc_auc_score(y_test, probs)), 4),
            'test_samples': len(y_test)
        }
        
    payload = {
        'metrics': results,
        'dataset_disclaimer': 'Synthetic research dataset. For prototype evaluation only, not clinical validation.'
    }
    return payload

if __name__ == '__main__':
    evals = load_or_compute_evaluations()
    print(json.dumps(evals, indent=2))
