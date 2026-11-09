"""
Hungarian Algorithm (Kuhn-Munkres) for Multi-Organ / Multi-Recipient Optimization.
Solves global bipartite matching scenarios when multiple donor organs and
multiple waitlist candidates are simultaneously available.
NOTE: This module provides research-oriented assignment scenarios and does NOT
determine real-world clinical organ allocations.
"""

import numpy as np
from scipy.optimize import linear_sum_assignment
from typing import List, Dict, Any, Tuple
from backend.app.algorithms.compatibility_engine import CompatibilityEngine
from backend.app.algorithms.graph_network import MedicalTransitGraph
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra

_transit_graph = MedicalTransitGraph()

class HungarianOptimizer:
    @staticmethod
    def solve_multi_assignment(
        organs: List[Dict[str, Any]],
        recipients: List[Dict[str, Any]],
        ai_scores_matrix: Dict[Tuple[str, str], float] = None
    ) -> Dict[str, Any]:
        """
        Solves 1-to-1 global assignment using the Hungarian Algorithm.
        organs: list of organ dicts with organ_id, organ_type, blood_group, current_location, etc.
        recipients: list of recipient dicts with recipient_id, name, required_organ, blood_group, medical_urgency, etc.
        ai_scores_matrix: optional pre-calculated (organ_id, recipient_id) -> ai_score map.
        """
        if not organs or not recipients:
            return {
                'success': False,
                'message': 'Both organs and recipients must be provided for multi-candidate optimization.',
                'assignments': [],
                'total_system_utility': 0.0,
                'matrix': []
            }

        num_organs = len(organs)
        num_recipients = len(recipients)

        # Build Utility Matrix: rows = organs, cols = recipients
        utility_matrix = np.zeros((num_organs, num_recipients), dtype=float)
        matrix_table = []

        for i, organ in enumerate(organs):
            row_data = {
                'organ_id': organ['organ_id'],
                'organ_type': organ.get('organ_type', 'Kidney'),
                'blood_group': organ.get('blood_group', 'O+'),
                'scores': []
            }

            for j, recipient in enumerate(recipients):
                org_id = organ['organ_id']
                rec_id = recipient['recipient_id']

                # 1. Evaluate Rule-based compatibility
                source = _transit_graph.resolve_nearest_node(organ.get('current_location', ''))
                destination = _transit_graph.resolve_nearest_node(recipient.get('location', recipient.get('hospital', '')))
                route = find_shortest_path_dijkstra(_transit_graph, source, destination)
                transit_hours = route.get('total_time_hours', float('inf'))
                eval_res = CompatibilityEngine.evaluate_candidate(organ, recipient, estimated_transit_hours=transit_hours)
                
                if not eval_res['eligible']:
                    # Heavily penalize rule-incompatible pairs so Hungarian avoids matching them
                    utility = -100.0
                    score_display = 0.0
                    status_note = f"Incompatible: {', '.join(eval_res['failed_rules'])}"
                else:
                    # Retrieve or compute AI score
                    if ai_scores_matrix and (org_id, rec_id) in ai_scores_matrix:
                        raw_ai = ai_scores_matrix[(org_id, rec_id)]
                    else:
                        # Baseline synthetic formula for multi-organ demonstration
                        raw_ai = 0.65
                        if organ.get('blood_group') == recipient.get('blood_group'):
                            raw_ai += 0.15
                        raw_ai += (recipient.get('medical_urgency', 3) * 0.04)
                        raw_ai = float(np.clip(raw_ai, 0.1, 0.98))

                    # Scale utility (0 - 100) with medical urgency weighting
                    urgency_bonus = recipient.get('medical_urgency', 3) * 4.0
                    waiting_bonus = min(10.0, (recipient.get('waiting_time', 100) / 365.0) * 3.0)
                    utility = (raw_ai * 100.0) + urgency_bonus + waiting_bonus
                    score_display = round(raw_ai, 3)
                    status_note = "Eligible Candidate"

                utility_matrix[i, j] = utility
                row_data['scores'].append({
                    'recipient_id': rec_id,
                    'recipient_name': recipient.get('name', rec_id),
                    'ai_score': score_display,
                    'utility_score': round(utility, 2),
                    'eligible': eval_res['eligible'],
                    'note': status_note
                })

            matrix_table.append(row_data)

        # To maximize utility, we construct cost matrix = max_val - utility_matrix
        max_val = np.max(utility_matrix) + 10.0
        cost_matrix = max_val - utility_matrix

        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        assignments = []
        total_utility = 0.0
        assigned_organ_ids = set()
        assigned_rec_ids = set()

        for r, c in zip(row_ind, col_ind):
            organ = organs[r]
            recipient = recipients[c]
            utility = utility_matrix[r, c]

            # Only consider valid assignments if utility > 0 (i.e. not fundamentally incompatible)
            if utility > 0:
                total_utility += utility
                assigned_organ_ids.add(organ['organ_id'])
                assigned_rec_ids.add(recipient['recipient_id'])

                cell_score = matrix_table[r]['scores'][c]['ai_score']
                assignments.append({
                    'organ_id': organ['organ_id'],
                    'organ_type': organ.get('organ_type'),
                    'organ_blood_group': organ.get('blood_group'),
                    'organ_location': organ.get('current_location'),
                    'recipient_id': recipient['recipient_id'],
                    'recipient_name': recipient.get('name'),
                    'recipient_blood_group': recipient.get('blood_group'),
                    'recipient_hospital': recipient.get('hospital'),
                    'medical_urgency': recipient.get('medical_urgency'),
                    'ai_suitability_score': cell_score,
                    'computed_utility': round(utility, 2),
                    'assignment_status': 'OPTIMIZED_MATCH'
                })

        unmatched_organs = [o['organ_id'] for o in organs if o['organ_id'] not in assigned_organ_ids]
        unmatched_recipients = [r['recipient_id'] for r in recipients if r['recipient_id'] not in assigned_rec_ids]

        return {
            'success': True,
            'algorithm': 'Hungarian (Kuhn-Munkres) Bipartite Matching',
            'num_organs_evaluated': num_organs,
            'num_recipients_evaluated': num_recipients,
            'total_assignments': len(assignments),
            'total_system_utility': round(total_utility, 2),
            'assignments': assignments,
            'unmatched_organs': unmatched_organs,
            'unmatched_recipients': unmatched_recipients,
            'matrix_table': matrix_table,
            'research_disclaimer': 'The optimization module provides a research-oriented assignment scenario. It does not determine real-world transplant allocation.'
        }
