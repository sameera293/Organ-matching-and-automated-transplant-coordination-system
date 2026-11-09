"""
Unit tests for Hungarian Multi-Organ Optimization Algorithm.
"""

from backend.app.algorithms.hungarian import HungarianOptimizer

def test_hungarian_multi_assignment():
    organs = [
        {'organ_id': 'ORG-01', 'organ_type': 'Kidney', 'blood_group': 'O+', 'current_location': 'Metro City'},
        {'organ_id': 'ORG-02', 'organ_type': 'Liver', 'blood_group': 'A+', 'current_location': 'North Haven'}
    ]
    recipients = [
        {'recipient_id': 'REC-101', 'name': 'John Doe', 'required_organ': 'Kidney', 'blood_group': 'O+', 'medical_urgency': 4, 'hospital': 'Metro Health'},
        {'recipient_id': 'REC-102', 'name': 'Jane Roe', 'required_organ': 'Liver', 'blood_group': 'A+', 'medical_urgency': 5, 'hospital': 'Southern Cross'},
        {'recipient_id': 'REC-103', 'name': 'Bob Smith', 'required_organ': 'Kidney', 'blood_group': 'B+', 'medical_urgency': 2, 'hospital': 'Western Heights'}
    ]

    res = HungarianOptimizer.solve_multi_assignment(organs, recipients)
    assert res['success'] is True
    assert len(res['assignments']) == 2
    assert res['total_system_utility'] > 0
    assigned_org_ids = [a['organ_id'] for a in res['assignments']]
    assert 'ORG-01' in assigned_org_ids
    assert 'ORG-02' in assigned_org_ids
