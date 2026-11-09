"""
Unit tests for Rule-Based Compatibility Engine.
"""

from backend.app.algorithms.compatibility_engine import CompatibilityEngine

def test_compatible_blood_groups():
    # O- is universal donor
    assert CompatibilityEngine.check_blood_compatibility('O-', 'A+')[0] is True
    assert CompatibilityEngine.check_blood_compatibility('O-', 'AB-')[0] is True
    assert CompatibilityEngine.check_blood_compatibility('O+', 'O+')[0] is True
    # A+ to A+
    assert CompatibilityEngine.check_blood_compatibility('A+', 'A+')[0] is True
    # AB+ to AB+
    assert CompatibilityEngine.check_blood_compatibility('AB+', 'AB+')[0] is True

def test_incompatible_blood_groups():
    # A+ cannot donate to B+
    assert CompatibilityEngine.check_blood_compatibility('A+', 'B+')[0] is False
    # B+ cannot donate to A+
    assert CompatibilityEngine.check_blood_compatibility('B+', 'A+')[0] is False
    # AB+ cannot donate to O+
    assert CompatibilityEngine.check_blood_compatibility('AB+', 'O+')[0] is False

def test_organ_type_mismatch():
    organ = {'organ_type': 'Kidney', 'blood_group': 'O+', 'status': 'Available', 'preservation_limit': 24.0}
    recipient = {'recipient_id': 'REC-01', 'required_organ': 'Liver', 'blood_group': 'O+', 'eligibility_status': 'Eligible'}
    
    res = CompatibilityEngine.evaluate_candidate(organ, recipient, estimated_transit_hours=2.0)
    assert res['eligible'] is False
    assert 'ORGAN_TYPE_MISMATCH' in res['failed_rules']

def test_fully_compatible_candidate():
    organ = {'organ_type': 'Heart', 'blood_group': 'O-', 'status': 'Available', 'preservation_limit': 5.0}
    recipient = {'recipient_id': 'REC-02', 'required_organ': 'Heart', 'blood_group': 'B+', 'eligibility_status': 'Eligible'}
    
    res = CompatibilityEngine.evaluate_candidate(organ, recipient, estimated_transit_hours=1.5)
    assert res['eligible'] is True
    assert len(res['failed_rules']) == 0
