"""
Dijkstra's Algorithm for Medical Transit Optimization.
Computes mathematically optimal shortest path between donor hospital
and recipient transplant center across road and air networks.
"""

import heapq
from typing import Dict, Any, List, Optional
from backend.app.algorithms.graph_network import MedicalTransitGraph

def find_shortest_path_dijkstra(
    graph: MedicalTransitGraph,
    source: str,
    destination: str,
    weight_metric: str = 'time_hours'
) -> Dict[str, Any]:
    """
    Computes shortest path between source and destination using Dijkstra's algorithm.
    """
    if source not in graph.nodes or destination not in graph.nodes:
        return {
            'success': False,
            'error': f"Source '{source}' or destination '{destination}' not in transit network.",
            'path': [],
            'total_distance_km': 0.0,
            'total_time_hours': 0.0
        }

    if source == destination:
        node_info = graph.get_node(source)
        return {
            'success': True,
            'algorithm': 'Dijkstra',
            'source': source,
            'destination': destination,
            'path': [source],
            'path_nodes': [node_info],
            'total_distance_km': 0.0,
            'total_time_hours': 0.0,
            'segments': [],
            'nodes_explored_count': 1
        }

    # Priority queue: (cost, current_node, path, distance_accum, time_accum, segments)
    queue = [(0.0, source, [source], 0.0, 0.0, [])]
    visited = set()
    nodes_explored = 0

    while queue:
        cost, current, path, dist_acc, time_acc, segments = heapq.heappop(queue)

        if current in visited:
            continue
        visited.add(current)
        nodes_explored += 1

        if current == destination:
            path_nodes = [graph.get_node(n) for n in path]
            return {
                'success': True,
                'algorithm': 'Dijkstra',
                'source': source,
                'destination': destination,
                'path': path,
                'path_nodes': path_nodes,
                'total_distance_km': round(dist_acc, 1),
                'total_time_hours': round(time_acc, 2),
                'segments': segments,
                'nodes_explored_count': nodes_explored,
                'metric_optimized': weight_metric
            }

        for edge in graph.get_neighbors(current):
            nxt = edge['target']
            if nxt in visited:
                continue

            edge_cost = edge['time_hours'] if weight_metric == 'time_hours' else edge['distance_km']
            new_dist = dist_acc + edge['distance_km']
            new_time = time_acc + edge['time_hours']
            segment_info = {
                'from_node': current,
                'from_name': graph.get_node(current)['name'],
                'to_node': nxt,
                'to_name': graph.get_node(nxt)['name'],
                'distance_km': edge['distance_km'],
                'time_hours': edge['time_hours'],
                'route_type': edge['route_type']
            }

            heapq.heappush(queue, (
                cost + edge_cost,
                nxt,
                path + [nxt],
                new_dist,
                new_time,
                segments + [segment_info]
            ))

    return {
        'success': False,
        'error': f"No connected route found between '{source}' and '{destination}'.",
        'path': [],
        'total_distance_km': 0.0,
        'total_time_hours': 0.0,
        'nodes_explored_count': nodes_explored
    }
