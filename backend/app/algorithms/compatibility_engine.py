"""
Rule-Based Compatibility Engine for Organ Matching.
First-stage hard medical filtering.
Candidates failing hard constraints are filtered out immediately and NEVER passed to the ML model.
Every failure is accompanied by transparent, audit-ready medical explanations.
"""

from typing import Dict, Any, List, Tuple

# Comprehensive ABO Blood Compatibility Chart
# Key: Donor blood group -> Value: Compatible Recipient blood groups
ABO_COMPATIBILITY_RULES = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],  # Universal red-cell donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']  # Universal recipient receives all, but AB+ only donates to AB+
}

# Standard Clinical Preservation Limits (Cold Ischemia Time in Hours)
ORGAN_PRESERVATION_LIMITS = {
    'Heart': {'max_cold_ischemia': 6.0, 'recommended_window': 4.0},
    'Lung': {'max_cold_ischemia': 8.0, 'recommended_window': 6.0},
    'Liver': {'max_cold_ischemia': 12.0, 'recommended_window': 10.0},
    'Pancreas': {'max_cold_ischemia': 18.0, 'recommended_window': 12.0},
    'Kidney': {'max_cold_ischemia': 36.0, 'recommended_window': 24.0}
}

class CompatibilityEngine:
    @staticmethod
    def check_blood_compatibility(donor_bg: str, recipient_bg: str) -> Tuple[bool, str]:
        donor_clean = donor_bg.strip().upper()
        rec_clean = recipient_bg.strip().upper()
        
        allowed_recipients = ABO_COMPATIBILITY_RULES.get(donor_clean, [])
        if rec_clean in allowed_recipients:
            return True, f"ABO Compatible: Donor {donor_clean} can safely donate to Recipient {rec_clean}."
        else:
            return False, f"ABO Incompatible: Donor {donor_clean} cannot donate to Recipient {rec_clean}."

    @staticmethod
    def check_organ_type_match(organ_type: str, required_organ: str) -> Tuple[bool, str]:
        if organ_type.strip().lower() == required_organ.strip().lower():
            return True, f"Organ Match: Available organ ({organ_type}) matches required organ ({required_organ})."
        return False, f"Organ Mismatch: Available organ ({organ_type}) does not match required organ ({required_organ})."

    @staticmethod
    def check_organ_status(organ_status: str) -> Tuple[bool, str]:
        if organ_status.strip().lower() == 'available':
            return True, "Organ Status: Organ is available for matching review."
        return False, f"Organ Status Ineligible: Organ status is currently '{organ_status}' (must be 'Available')."

    @staticmethod
    def check_recipient_eligibility(recipient_status: str) -> Tuple[bool, str]:
        status_norm = recipient_status.strip().lower()
        if status_norm in ['eligible', 'active', 'pending_match']:
            return True, f"Recipient Status: Candidate status '{recipient_status}' is active on transplant waitlist."
        return False, f"Recipient Status Ineligible: Candidate status '{recipient_status}' is not eligible for active matching."

    @staticmethod
    def check_preservation_sanity(organ_type: str, estimated_transit_hours: float, preservation_remaining: float) -> Tuple[bool, str]:
        limits = ORGAN_PRESERVATION_LIMITS.get(organ_type, {'max_cold_ischemia': 24.0, 'recommended_window': 12.0})
        
        if preservation_remaining <= 0.5:
            return False, f"Preservation Limit Exceeded: Only {preservation_remaining:.1f} hours remaining in cold ischemia window."
            
        if estimated_transit_hours > preservation_remaining:
            return False, f"Transit Exceeds Preservation Window: Estimated travel time ({estimated_transit_hours:.1f}h) exceeds remaining preservation time ({preservation_remaining:.1f}h)."
            
        return True, f"Logistics Feasible: Estimated travel time ({estimated_transit_hours:.1f}h) fits within remaining window ({preservation_remaining:.1f}h)."

    @classmethod
    def evaluate_candidate(cls, organ_data: Dict[str, Any], recipient_data: Dict[str, Any], estimated_transit_hours: float = 2.0) -> Dict[str, Any]:
        """
        Evaluates a single recipient against an available organ.
        Returns full audit breakdown with pass/fail on every rule.
        """
        candidate_id = recipient_data.get('recipient_id', 'UNKNOWN')
        reasons = []
        failed_rules = []
        rule_details = {}

        # 1. Organ Type Rule
        passed_organ, reason_organ = cls.check_organ_type_match(
            organ_data.get('organ_type', ''),
            recipient_data.get('required_organ', '')
        )
        rule_details['organ_type_match'] = {'passed': passed_organ, 'reason': reason_organ}
        reasons.append(reason_organ)
        if not passed_organ:
            failed_rules.append('ORGAN_TYPE_MISMATCH')

        # 2. Blood Group Compatibility Rule
        passed_blood, reason_blood = cls.check_blood_compatibility(
            organ_data.get('blood_group', ''),
            recipient_data.get('blood_group', '')
        )
        rule_details['blood_group_compatibility'] = {'passed': passed_blood, 'reason': reason_blood}
        reasons.append(reason_blood)
        if not passed_blood:
            failed_rules.append('BLOOD_GROUP_INCOMPATIBLE')

        # 3. Organ Status Rule
        passed_organ_status, reason_organ_status = cls.check_organ_status(
            organ_data.get('status', 'Available')
        )
        rule_details['organ_status_valid'] = {'passed': passed_organ_status, 'reason': reason_organ_status}
        reasons.append(reason_organ_status)
        if not passed_organ_status:
            failed_rules.append('ORGAN_STATUS_INVALID')

        # 4. Recipient Status Rule
        passed_rec_status, reason_rec_status = cls.check_recipient_eligibility(
            recipient_data.get('eligibility_status', 'Eligible')
        )
        rule_details['recipient_eligibility'] = {'passed': passed_rec_status, 'reason': reason_rec_status}
        reasons.append(reason_rec_status)
        if not passed_rec_status:
            failed_rules.append('RECIPIENT_STATUS_INELIGIBLE')

        # 5. Preservation & Transit Feasibility Rule
        preservation_remaining = float(organ_data.get('preservation_remaining_hours', organ_data.get('preservation_limit', 12.0)))
        passed_preservation, reason_preservation = cls.check_preservation_sanity(
            organ_data.get('organ_type', 'Kidney'),
            estimated_transit_hours,
            preservation_remaining
        )
        rule_details['preservation_sanity'] = {'passed': passed_preservation, 'reason': reason_preservation}
        reasons.append(reason_preservation)
        if not passed_preservation:
            failed_rules.append('PRESERVATION_LIMIT_EXCEEDED')

        is_eligible = len(failed_rules) == 0

        return {
            'candidate_id': candidate_id,
            'eligible': is_eligible,
            'reasons': reasons,
            'failed_rules': failed_rules,
            'rule_evaluation_details': rule_details,
            'summary': "Candidate satisfies all deterministic clinical eligibility rules." if is_eligible else f"Candidate filtered out due to {len(failed_rules)} failed rule(s): {', '.join(failed_rules)}."
        }

    @classmethod
    def filter_candidate_pool(cls, organ_data: Dict[str, Any], recipients_pool: List[Dict[str, Any]], distance_calculator_fn = None) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Splits candidate pool into eligible candidates (proceeding to ML stage)
        and filtered-out candidates (with audit explanations).
        """
        eligible = []
        filtered_out = []

        for recipient in recipients_pool:
            transit_hours = 2.0
            if distance_calculator_fn:
                transit_hours = distance_calculator_fn(organ_data.get('current_location'), recipient.get('location', recipient.get('hospital')))
                
            eval_result = cls.evaluate_candidate(organ_data, recipient, transit_hours)
            
            combined_record = {
                **recipient,
                'compatibility_evaluation': eval_result,
                'is_eligible': eval_result['eligible'],
                'estimated_transit_hours': transit_hours
            }
            
            if eval_result['eligible']:
                eligible.append(combined_record)
            else:
                filtered_out.append(combined_record)

        return eligible, filtered_out
