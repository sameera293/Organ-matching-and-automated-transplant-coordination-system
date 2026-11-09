"""
Inference module for AI-assisted organ matching suitability scoring.

The classifier provides ML probability, while the final research-oriented
suitability score combines ML evidence with a continuous multi-factor
suitability index.

IMPORTANT:
This score is for academic decision support only.
It is NOT a clinical probability and does NOT make allocation decisions.
"""

import os
import joblib
import numpy as np
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


class OrganMatchPredictor:

    def __init__(self, model_dir: str = None, model_name: str = 'xgboost'):

        if model_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_dir = os.path.join(base_dir, '..', 'saved_models')

        self.model_dir = model_dir
        self.model_name = model_name
        self.model = None
        self.scaler = None

        self._load_resources()

    # ---------------------------------------------------------
    # Load trained model
    # ---------------------------------------------------------

    def _load_resources(self):

        scaler_path = os.path.join(
            self.model_dir,
            'scaler.joblib'
        )

        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)

        model_filename_map = {
            'xgboost': 'xgboost_model.joblib',
            'random_forest': 'random_forest_model.joblib',
            'logistic_regression': 'logistic_regression_model.joblib'
        }

        target_file = model_filename_map.get(
            self.model_name.lower(),
            'xgboost_model.joblib'
        )

        model_path = os.path.join(
            self.model_dir,
            target_file
        )

        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            raise FileNotFoundError(
                f"Model file not found at: {model_path}. "
                f"Train models first using train.py."
            )

    # ---------------------------------------------------------
    # Change model
    # ---------------------------------------------------------

    def set_model(self, model_name: str):

        self.model_name = model_name
        self._load_resources()

    # ---------------------------------------------------------
    # Continuous research suitability index
    # ---------------------------------------------------------

    def _continuous_suitability_index(
        self,
        features: Dict[str, Any]
    ) -> float:

        """
        Continuous research suitability index.

        This follows the same multi-factor logic used to generate
        the synthetic benchmark suitability score.

        It is NOT a clinical score.
        """

        blood = float(
            features.get('blood_compatible', 0)
        )

        urgency = float(
            features.get('medical_urgency', 3)
        )

        waiting_days = float(
            features.get('waiting_time_days', 30)
        )

        age_diff = float(
            features.get('age_difference', 0)
        )

        hla = float(
            features.get('hla_mismatch', 2)
        )

        pra = float(
            features.get('pra_percent', 10)
        )

        cold_ratio = float(
            features.get('cold_ischemia_ratio', 0.2)
        )

        transit = float(
            features.get('estimated_transit_hours', 2.0)
        )

        preservation = max(
            float(
                features.get(
                    'preservation_remaining_hours',
                    10.0
                )
            ),
            0.1
        )

        # Base suitability
        score = 40.0

        # Blood compatibility
        if blood == 1:
            score += 35.0
        else:
            score -= 35.0

        # Medical urgency
        score += urgency * 4.5

        # Waiting time contribution
        score += min(
            15.0,
            (waiting_days / 365.0) * 4.0
        )

        # Age difference penalty
        score -= age_diff * 0.25

        # HLA mismatch penalty
        score -= hla * 2.2

        # PRA penalty
        score -= pra * 0.1

        # Cold ischemia penalty
        if cold_ratio > 0.8:
            score -= 25.0

        # Logistics feasibility penalty
        if transit > preservation:
            score -= 40.0

        # Keep score in 1% - 99%
        score = np.clip(
            score / 100.0,
            0.01,
            0.99
        )

        return float(score)

    # ---------------------------------------------------------
    # Predict candidate
    # ---------------------------------------------------------

    def predict_candidate(
        self,
        features: Dict[str, Any]
    ) -> Dict[str, Any]:

        """
        Calculate AI-assisted suitability score.
        """

        # Age difference
        if 'age_difference' not in features:

            features['age_difference'] = abs(
                features.get('donor_age', 40)
                -
                features.get('recipient_age', 40)
            )

        # Cold ischemia ratio
        if 'cold_ischemia_ratio' not in features:

            preservation = max(
                features.get(
                    'preservation_remaining_hours',
                    10.0
                ),
                0.1
            )

            features['cold_ischemia_ratio'] = round(
                features.get(
                    'estimated_transit_hours',
                    2.0
                ) / preservation,
                3
            )

        # Build model feature vector
        row = [
            features.get(column, 0.0)
            for column in FEATURE_COLUMNS
        ]

        X = np.array([row])

        # Logistic Regression requires scaling
        if (
            self.model_name.lower()
            == 'logistic_regression'
            and self.scaler is not None
        ):
            X = self.scaler.transform(X)

        # ML probability
        model_probability = float(
            self.model.predict_proba(X)[0][1]
        )

        prediction = int(
            self.model.predict(X)[0]
        )

        # Continuous multi-factor score
        continuous_index = (
            self._continuous_suitability_index(
                features
            )
        )

        # -----------------------------------------------------
        # Hybrid AI-assisted research score
        #
        # 35% ML probability
        # 65% continuous suitability index
        # -----------------------------------------------------

        hybrid_score = (
            0.35 * model_probability
            +
            0.65 * continuous_index
        )

        hybrid_score = float(
            np.clip(
                hybrid_score,
                0.01,
                0.99
            )
        )

        return {

            'model_used': self.model_name,

            # Original ML probability
            'model_probability': round(
                model_probability,
                4
            ),

            # Continuous suitability component
            'continuous_suitability_index': round(
                continuous_index,
                4
            ),

            # Final displayed score
            'ai_suitability_score': round(
                hybrid_score,
                4
            ),

            'suitability_classification':
                'SUITABLE_CANDIDATE'
                if prediction == 1
                else 'EVALUATE_CAUTION',

            'features_processed': features,

            'disclaimer':
                'Research-oriented AI-assisted suitability score. '
                'For academic decision support only. '
                'Not an autonomous medical or allocation decision.'
        }

    # ---------------------------------------------------------
    # Batch prediction
    # ---------------------------------------------------------

    def predict_batch(
        self,
        candidate_features: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:

        results = []

        for features in candidate_features:

            results.append(
                self.predict_candidate(features)
            )

        return results