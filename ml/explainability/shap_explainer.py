"""
Explainable AI (XAI) Module using SHAP (SHapley Additive exPlanations).
Provides transparent, mathematically grounded feature attributions for
AI-assisted organ matching suitability scores.
"""

import os
import joblib
import numpy as np
import pandas as pd
import shap
from typing import Dict, Any, List

# Compatibility patch for SHAP + XGBoost 3.x bracketed base_score string (e.g. '[5E-1]')
try:
    import shap.explainers._tree as _shap_tree
    _orig_decode = _shap_tree.decode_ubjson_buffer

    def _safe_decode_ubjson(fd):
        res = _orig_decode(fd)
        try:
            if isinstance(res, dict) and "learner" in res and "learner_model_param" in res["learner"]:
                bs = res["learner"]["learner_model_param"].get("base_score")
                if isinstance(bs, str):
                    res["learner"]["learner_model_param"]["base_score"] = bs.strip("[]")
        except Exception:
            pass
        return res

    _shap_tree.decode_ubjson_buffer = _safe_decode_ubjson
except Exception:
    pass

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

FEATURE_HUMAN_NAMES = {
    'donor_age': 'Donor Age',
    'recipient_age': 'Recipient Age',
    'age_difference': 'Age Difference',
    'blood_compatible': 'Blood Group Compatibility',
    'medical_urgency': 'Medical Urgency Level',
    'waiting_time_days': 'Waiting Time (Days)',
    'distance_km': 'Geographic Distance (km)',
    'estimated_transit_hours': 'Estimated Transport Time (hrs)',
    'preservation_remaining_hours': 'Preservation Window Remaining (hrs)',
    'cold_ischemia_ratio': 'Cold Ischemia Risk Ratio',
    'hla_mismatch': 'HLA Antigen Mismatches',
    'pra_percent': 'Panel Reactive Antibodies (PRA %)'
}

class OrganMatchExplainer:
    def __init__(self, model_dir: str = None, model_name: str = 'xgboost'):
        if model_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_dir = os.path.join(base_dir, '..', 'saved_models')
            
        self.model_dir = model_dir
        self.model_name = model_name
        self.model = None
        self.explainer = None
        self._initialize_explainer()

    def _initialize_explainer(self):
        target_file = 'xgboost_model.joblib' if self.model_name == 'xgboost' else 'random_forest_model.joblib'
        model_path = os.path.join(self.model_dir, target_file)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}. Please train models first.")
            
        self.model = joblib.load(model_path)
        # Use TreeExplainer for fast, exact tree-based Shapley value computation
        self.explainer = shap.TreeExplainer(self.model)

    def explain_candidate(self, features: Dict[str, Any], candidate_id: str = None) -> Dict[str, Any]:
        """
        Generates comprehensive SHAP explanations for an individual candidate match.
        """
        if 'age_difference' not in features:
            features['age_difference'] = abs(features.get('donor_age', 40) - features.get('recipient_age', 40))
        if 'cold_ischemia_ratio' not in features:
            limit = max(features.get('preservation_remaining_hours', 10.0), 0.1)
            features['cold_ischemia_ratio'] = round(features.get('estimated_transit_hours', 2.0) / limit, 3)

        raw_vector = [features.get(col, 0.0) for col in FEATURE_COLUMNS]
        df_vector = pd.DataFrame([raw_vector], columns=FEATURE_COLUMNS)
        
        prob = float(self.model.predict_proba(df_vector)[0][1])
        
        shap_values_raw = self.explainer(df_vector)
        
        vals = shap_values_raw.values[0]
        if vals.ndim > 1:
            vals = vals[:, 1]
            
        base_val = shap_values_raw.base_values[0]
        if isinstance(base_val, np.ndarray) and len(base_val) > 1:
            base_val = base_val[1]
        base_val = float(base_val)

        feature_contributions = []
        positive_factors = []
        negative_factors = []

        for i, col in enumerate(FEATURE_COLUMNS):
            val = float(vals[i])
            actual_val = features.get(col, 0.0)
            human_name = FEATURE_HUMAN_NAMES.get(col, col)
            
            interpretation = self._generate_interpretation(col, actual_val, val)
            
            item = {
                'feature_key': col,
                'feature_name': human_name,
                'actual_value': actual_val,
                'shap_value': round(val, 4),
                'impact': 'positive' if val >= 0 else 'negative',
                'magnitude': abs(round(val, 4)),
                'interpretation': interpretation
            }
            feature_contributions.append(item)
            
            if val > 0.01:
                positive_factors.append(item)
            elif val < -0.01:
                negative_factors.append(item)

        feature_contributions.sort(key=lambda x: x['magnitude'], reverse=True)
        positive_factors.sort(key=lambda x: x['magnitude'], reverse=True)
        negative_factors.sort(key=lambda x: x['magnitude'], reverse=True)

        return {
            'candidate_id': candidate_id or features.get('recipient_id', 'UNKNOWN'),
            'model_evaluated': self.model_name,
            'ai_score': round(prob, 4),
            'base_value': round(base_val, 4),
            'top_positive_factors': positive_factors[:4],
            'top_negative_factors': negative_factors[:4],
            'waterfall_data': feature_contributions,
            'explanation_summary': self._summarize_explanation(prob, positive_factors, negative_factors),
            'clinical_disclaimer': 'SHAP feature attributions describe model behavior on synthetic benchmark data for academic decision support only. HLA mismatch (2) and PRA (10%) are fixed prototype assumptions because candidate-specific values are not stored in the current database; they are not measured recipient data.'
        }

    def _generate_interpretation(self, col: str, actual_val: Any, shap_val: float) -> str:
        sign = "+" if shap_val >= 0 else ""
        delta_str = f"({sign}{round(shap_val, 3)})"
        
        if col == 'blood_compatible':
            if actual_val != 1:
                return f"Blood group compatibility rule failed {delta_str}; this candidate is ineligible for AI ranking."
            direction = "increases" if shap_val >= 0 else "decreases"
            return f"ABO blood group compatibility {delta_str} {direction} the model probability."
        elif col == 'medical_urgency':
            direction = "increases" if shap_val >= 0 else "decreases"
            return f"Urgency priority tier {actual_val}/5 {delta_str} {direction} the model probability."
        elif col == 'waiting_time_days':
            direction = "increases" if shap_val >= 0 else "decreases"
            return f"Waiting queue duration of {actual_val} days {delta_str} {direction} the model probability."
        elif col == 'estimated_transit_hours':
            return f"Estimated transit duration of {actual_val} hrs {delta_str} impacts cold preservation margin."
        elif col == 'cold_ischemia_ratio':
            return f"Cold ischemia ratio of {actual_val} {delta_str} reflects organ preservation safety threshold."
        elif col == 'age_difference':
            return f"Donor-recipient age difference of {actual_val} yrs {delta_str} factor in long-term graft survival."
        elif col == 'hla_mismatch':
            return f"{actual_val} HLA antigen mismatches {delta_str} affects immunological risk."
        elif col == 'pra_percent':
            return f"Panel Reactive Antibodies ({actual_val}%) {delta_str} indicates sensitization level."
        elif col == 'distance_km':
            return f"Transit distance of {actual_val} km {delta_str} influences dispatch logistics."
        return f"{FEATURE_HUMAN_NAMES.get(col, col)} = {actual_val} {delta_str}"

    def _summarize_explanation(self, prob: float, positive: List[Dict], negative: List[Dict]) -> str:
        summary_parts = [f"Model assigned an AI-assisted suitability score of {round(prob, 3)}."]
        if positive:
            top_pos = [f"{p['feature_name']} (+{round(p['shap_value'], 3)})" for p in positive[:2]]
            summary_parts.append(f"Score was primarily elevated by: {', '.join(top_pos)}.")
        if negative:
            top_neg = [f"{n['feature_name']} ({round(n['shap_value'], 3)})" for n in negative[:2]]
            summary_parts.append(f"Score was penalized by: {', '.join(top_neg)}.")
        return " ".join(summary_parts)
