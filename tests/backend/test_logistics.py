"""
Unit tests for Logistics Routing Algorithms (Dijkstra and A*).
"""

from backend.app.algorithms.graph_network import MedicalTransitGraph
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra
from backend.app.algorithms.astar import find_shortest_path_astar

def test_dijkstra_path_found():
    graph = MedicalTransitGraph()
    res = find_shortest_path_dijkstra(graph, 'HOSP-METRO-01', 'HOSP-SOUTH-05')
    assert res['success'] is True
    assert len(res['path']) >= 2
    assert res['total_time_hours'] > 0
    assert res['total_distance_km'] > 0

def test_astar_path_found():
    graph = MedicalTransitGraph()
    res = find_shortest_path_astar(graph, 'HOSP-METRO-01', 'HOSP-SOUTH-05')
    assert res['success'] is True
    assert len(res['path']) >= 2
    assert res['total_time_hours'] > 0
    assert res['total_distance_km'] > 0

def test_dijkstra_vs_astar_equivalence():
    graph = MedicalTransitGraph()
    dijk = find_shortest_path_dijkstra(graph, 'HOSP-NORTH-02', 'HOSP-CENTRAL-04')
    astar = find_shortest_path_astar(graph, 'HOSP-NORTH-02', 'HOSP-CENTRAL-04')
    
    assert dijk['success'] is True
    assert astar['success'] is True
    # Both should discover optimal cost
    assert abs(dijk['total_time_hours'] - astar['total_time_hours']) < 0.05
