"""
Model Training Module for AI-Driven Organ Matching Prototype.
Trains and compares:
1. Logistic Regression (Linear baseline)
2. Random Forest Classifier (Non-linear ensemble)
3. XGBoost Classifier (Gradient boosted trees)

Evaluates on Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
Serializes trained models and evaluation benchmarks.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

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

TARGET_COLUMN = 'is_suitable'

def train_and_evaluate(data_path: str = None, output_dir: str = None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if data_path is None:
        data_path = os.path.join(base_dir, '..', '..', 'data', 'processed', 'organ_matching_dataset.csv')
    if output_dir is None:
        output_dir = os.path.join(base_dir, '..', 'saved_models')
        
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    models = {
        'Logistic Regression': {
            'model': LogisticRegression(max_iter=1000, random_state=42),
            'scaled_input': True,
            'file_name': 'logistic_regression_model.joblib'
        },
        'Random Forest': {
            'model': RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42),
            'scaled_input': False,
            'file_name': 'random_forest_model.joblib'
        },
        'XGBoost': {
            'model': XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.08, eval_metric='logloss', random_state=42),
            'scaled_input': False,
            'file_name': 'xgboost_model.joblib'
        }
    }
    
    metrics_summary = {}
    
    print("\nTraining and evaluating candidate models:")
    print("-" * 75)
    print(f"{'Model':<22} | {'Accuracy':<8} | {'Precision':<9} | {'Recall':<6} | {'F1':<6} | {'ROC-AUC':<7}")
    print("-" * 75)
    
    for name, item in models.items():
        clf = item['model']
        if item['scaled_input']:
            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)
            y_proba = clf.predict_proba(X_test_scaled)[:, 1]
        else:
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test)
            y_proba = clf.predict_proba(X_test)[:, 1]
            
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_proba))
        
        metrics_summary[name] = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'roc_auc': round(auc, 4),
            'test_samples': int(len(y_test))
        }
        
        print(f"{name:<22} | {acc:<8.4f} | {prec:<9.4f} | {rec:<6.4f} | {f1:<6.4f} | {auc:<7.4f}")
        
        # Save model
        joblib.dump(clf, os.path.join(output_dir, item['file_name']))
        
    print("-" * 75)
    
    # Save scaler and metadata
    joblib.dump(scaler, os.path.join(output_dir, 'scaler.joblib'))
    
    metadata = {
        'feature_columns': FEATURE_COLUMNS,
        'target_column': TARGET_COLUMN,
        'metrics': metrics_summary,
        'sample_size_train': int(len(X_train)),
        'sample_size_test': int(len(X_test)),
        'dataset_disclaimer': 'Synthetic research dataset. For prototype evaluation only, not clinical validation.'
    }
    
    with open(os.path.join(output_dir, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nAll models, scaler, and metadata saved to: {output_dir}")
    return metadata

if __name__ == '__main__':
    train_and_evaluate()
