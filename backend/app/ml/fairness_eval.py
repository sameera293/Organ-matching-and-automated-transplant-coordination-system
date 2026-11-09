"""
Fairness and Algorithmic Bias Assessment Module.
Evaluates research model behavior across candidate demographic and clinical subgroups.
IMPORTANT: This is a research fairness assessment on synthetic benchmark data.
It evaluates statistical parity and equal opportunity metrics for academic transparency.
It does NOT certify clinical fairness or endorse unvalidated allocation rules.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, Any, List

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

def evaluate_subgroup_fairness(data_path: str = None, model_dir: str = None) -> Dict[str, Any]:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if data_path is None:
        data_path = os.path.join(base_dir, '..', '..', '..', 'data', 'processed', 'organ_matching_dataset.csv')
    if model_dir is None:
        model_dir = os.path.join(base_dir, '..', '..', '..', 'ml', 'saved_models')

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at: {data_path}")

    df = pd.read_csv(data_path)
    model_path = os.path.join(model_dir, 'xgboost_model.joblib')
    if not os.path.exists(model_path):
        model_path = os.path.join(model_dir, 'random_forest_model.joblib')

    model = joblib.load(model_path)
    X = df[FEATURE_COLUMNS]
    y_true = df['is_suitable']
    y_pred = model.predict(X)
    df['predicted'] = y_pred

    # 1. Group by Recipient Age Bracket
    def categorize_age(age):
        if age < 35:
            return 'Younger (<35)'
        elif age <= 55:
            return 'Middle-Aged (35-55)'
        else:
            return 'Older (>55)'

    df['age_group'] = df['recipient_age'].apply(categorize_age)
    age_eval = _compute_group_metrics(df, 'age_group', y_true_col='is_suitable', y_pred_col='predicted')

    # 2. Group by Recipient Blood Group Category
    def categorize_blood(bg):
        clean = bg.replace('+', '').replace('-', '')
        return f"Group {clean}"

    df['blood_category'] = df['recipient_blood_group'].apply(categorize_blood)
    blood_eval = _compute_group_metrics(df, 'blood_category', y_true_col='is_suitable', y_pred_col='predicted')

    # 3. Group by Geographic Distance Tier
    def categorize_distance(dist):
        if dist < 100:
            return 'Local Transit (<100 km)'
        elif dist <= 350:
            return 'Regional Transit (100-350 km)'
        else:
            return 'Long-Distance Transit (>350 km)'

    df['distance_tier'] = df['distance_km'].apply(categorize_distance)
    distance_eval = _compute_group_metrics(df, 'distance_tier', y_true_col='is_suitable', y_pred_col='predicted')

    # Overall Metrics
    overall_acc = round(float(accuracy_score(y_true, y_pred)), 4)
    overall_prec = round(float(precision_score(y_true, y_pred, zero_division=0)), 4)
    overall_rec = round(float(recall_score(y_true, y_pred, zero_division=0)), 4)

    return {
        'benchmark_label': 'Synthetic benchmark — not clinical validation.',
        'overall_metrics': {
            'accuracy': overall_acc,
            'precision': overall_prec,
            'recall': overall_rec,
            'total_samples': len(df)
        },
        'age_group_analysis': age_eval,
        'blood_group_analysis': blood_eval,
        'geographic_distance_analysis': distance_eval,
        'limitations_and_disclaimers': [
            "Research fairness assessment conducted solely on synthetic simulation data.",
            "Subgroup metric parity on synthetic distributions does not establish clinical fairness in diverse patient populations.",
            "Real-world clinical organ allocation is governed by national regulatory policies (e.g., OPTN/UNOS, NHSBT, Eurotransplant).",
            "This prototype is designed for decision-support and academic benchmarking only."
        ]
    }

def _compute_group_metrics(df: pd.DataFrame, group_col: str, y_true_col: str, y_pred_col: str) -> List[Dict[str, Any]]:
    group_results = []
    groups = df[group_col].unique()

    # Calculate overall selection rate for disparate impact computation
    overall_selection_rate = float(df[y_pred_col].mean())

    for g in sorted(groups):
        sub = df[df[group_col] == g]
        if len(sub) == 0:
            continue

        y_t = sub[y_true_col]
        y_p = sub[y_pred_col]

        acc = float(accuracy_score(y_t, y_p))
        prec = float(precision_score(y_t, y_p, zero_division=0))
        rec = float(recall_score(y_t, y_p, zero_division=0))
        selection_rate = float(y_p.mean())
        disparate_impact = round(selection_rate / max(overall_selection_rate, 0.001), 3)

        group_results.append({
            'group_name': g,
            'sample_count': int(len(sub)),
            'sample_share_percent': round((len(sub) / len(df)) * 100, 1),
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'selection_rate': round(selection_rate, 3),
            'disparate_impact_ratio': disparate_impact
        })

    return group_results
