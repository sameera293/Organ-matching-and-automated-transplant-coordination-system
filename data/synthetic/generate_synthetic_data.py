"""
Synthetic Dataset Generator for Organ Matching and Decision Support.
Academic and research prototype data generation.
NOTE: This dataset is entirely synthetic and simulated for benchmarking
machine learning, explainability, and multi-factor decision-support models.
It does NOT represent actual patient medical records.
"""

import os
import random
import numpy as np
import pandas as pd

np.random.seed(42)
random.seed(42)

BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
ORGAN_TYPES = {
    'Kidney': {'preservation_limit': 30.0, 'cold_ischemia_max': 36.0},
    'Liver': {'preservation_limit': 10.0, 'cold_ischemia_max': 12.0},
    'Heart': {'preservation_limit': 4.5, 'cold_ischemia_max': 6.0},
    'Lung': {'preservation_limit': 6.0, 'cold_ischemia_max': 8.0},
    'Pancreas': {'preservation_limit': 14.0, 'cold_ischemia_max': 18.0}
}

# Standard ABO compatibility matrix
ABO_COMPATIBILITY = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],  # Universal donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']  # Universal recipient accepts all, but AB+ only donates to AB+
}

def is_blood_compatible(donor_bg: str, recipient_bg: str) -> bool:
    return recipient_bg in ABO_COMPATIBILITY.get(donor_bg, [])

def generate_dataset(num_samples: int = 3500) -> pd.DataFrame:
    records = []
    
    organ_names = list(ORGAN_TYPES.keys())
    
    for i in range(num_samples):
        pair_id = f"PAIR-{i+1:05d}"
        donor_id = f"DON-{random.randint(100, 999)}"
        recipient_id = f"REC-{random.randint(1000, 9999)}"
        
        organ = random.choice(organ_names)
        pres_cfg = ORGAN_TYPES[organ]
        
        donor_age = int(np.clip(np.random.normal(42, 14), 18, 72))
        recipient_age = int(np.clip(np.random.normal(48, 13), 18, 75))
        age_diff = abs(donor_age - recipient_age)
        
        donor_bg = random.choice(BLOOD_GROUPS)
        recipient_bg = random.choice(BLOOD_GROUPS)
        blood_comp = 1 if is_blood_compatible(donor_bg, recipient_bg) else 0
        
        # Medical urgency (Scale 1 to 5)
        medical_urgency = int(np.clip(np.random.choice([1, 2, 3, 4, 5], p=[0.1, 0.25, 0.35, 0.2, 0.1]), 1, 5))
        
        # Waiting time in days
        waiting_time_days = int(np.clip(np.random.exponential(scale=380) + 30, 15, 2200))
        
        # Distance and transport
        distance_km = float(np.clip(np.random.exponential(scale=260) + 15, 10, 1400))
        
        # Transport speed varies by distance (ground vs air ambulance)
        if distance_km < 120:
            # Ground ambulance ~60 km/h + 0.5h prep
            transit_hours = round(distance_km / 60.0 + 0.5, 2)
        else:
            # Air transport ~250 km/h + 1.2h airfield & dispatch transfer
            transit_hours = round(distance_km / 250.0 + 1.2, 2)
            
        preservation_limit = pres_cfg['preservation_limit']
        elapsed_retrieval_time = round(random.uniform(0.5, 2.5), 2)
        preservation_remaining = max(0.1, round(preservation_limit - elapsed_retrieval_time, 2))
        
        cold_ischemia_ratio = round(transit_hours / max(preservation_limit, 0.1), 3)
        logistics_feasible = 1 if transit_hours <= preservation_remaining else 0
        
        # Immunological factors
        hla_mismatch = random.randint(0, 6)
        pra_percent = round(random.betavariate(1.5, 5.0) * 100, 1)  # Most patients have lower PRA
        
        # Synthetic ground truth suitability score (continuous clinical suitability index)
        # Factors:
        # + Blood compatibility (+35 pts)
        # + Urgency (+5 to +25 pts)
        # + Waiting time (+2 to +15 pts)
        # - Cold ischemia / transport penalty (-30 pts if ratio > 0.8)
        # - Age difference penalty (-10 pts if diff > 30)
        # - HLA mismatch penalty (-10 pts if mismatch >= 4)
        # - Infeasible logistics (-50 pts)
        
        base_score = 40.0
        if blood_comp == 1:
            base_score += 35.0
        else:
            base_score -= 35.0
            
        base_score += (medical_urgency * 4.5)
        base_score += min(15.0, (waiting_time_days / 365.0) * 4.0)
        base_score -= (age_diff * 0.25)
        base_score -= (hla_mismatch * 2.2)
        base_score -= (pra_percent * 0.1)
        
        if cold_ischemia_ratio > 0.8:
            base_score -= 25.0
        if logistics_feasible == 0:
            base_score -= 40.0
            
        # Add slight natural medical noise
        noise = np.random.normal(0, 4.0)
        composite_score = float(np.clip((base_score + noise) / 100.0, 0.01, 0.99))
        
        # Target classification: 1 if composite_score >= 0.58 and blood_comp == 1 and logistics_feasible == 1
        binary_suitability = 1 if (composite_score >= 0.55 and blood_comp == 1 and logistics_feasible == 1) else 0
        
        records.append({
            'pair_id': pair_id,
            'donor_id': donor_id,
            'recipient_id': recipient_id,
            'organ_type': organ,
            'donor_age': donor_age,
            'recipient_age': recipient_age,
            'age_difference': age_diff,
            'donor_blood_group': donor_bg,
            'recipient_blood_group': recipient_bg,
            'blood_compatible': blood_comp,
            'medical_urgency': medical_urgency,
            'waiting_time_days': waiting_time_days,
            'distance_km': round(distance_km, 1),
            'estimated_transit_hours': transit_hours,
            'preservation_limit_hours': preservation_limit,
            'preservation_remaining_hours': preservation_remaining,
            'cold_ischemia_ratio': cold_ischemia_ratio,
            'logistics_feasible': logistics_feasible,
            'hla_mismatch': hla_mismatch,
            'pra_percent': pra_percent,
            'suitability_score': round(composite_score, 4),
            'is_suitable': binary_suitability
        })
        
    df = pd.DataFrame(records)
    return df

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    processed_dir = os.path.join(script_dir, '..', 'processed')
    os.makedirs(processed_dir, exist_ok=True)
    
    out_path = os.path.join(processed_dir, 'organ_matching_dataset.csv')
    df = generate_dataset(3500)
    df.to_csv(out_path, index=False)
    print(f"Generated synthetic research dataset with {len(df)} records at: {out_path}")
    print("Class distribution (is_suitable):")
    print(df['is_suitable'].value_counts(normalize=True))

if __name__ == '__main__':
    main()
