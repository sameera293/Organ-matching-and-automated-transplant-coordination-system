"""
A* (A-Star) Search Algorithm for Medical Route Optimization.
Uses Haversine distance heuristic to guide transit search towards destination,
reducing the number of explored nodes compared to unguided Dijkstra search.
"""

import heapq
from typing import Dict, Any, List
from backend.app.algorithms.graph_network import MedicalTransitGraph, haversine_distance

def heuristic_time_estimate(graph: MedicalTransitGraph, current_node: str, dest_node: str) -> float:
    """
    Admissible heuristic: assumes straight-line flight at maximum emergency air transit speed (500 km/h).
    Never overestimates true travel time, guaranteeing optimal path discovery.
    """
    curr_info = graph.get_node(current_node)
    dest_info = graph.get_node(dest_node)
    if not curr_info or not dest_info:
        return 0.0
    direct_km = haversine_distance(curr_info['coords'], dest_info['coords'])
    return direct_km / 500.0

def find_shortest_path_astar(
    graph: MedicalTransitGraph,
    source: str,
    destination: str,
    weight_metric: str = 'time_hours'
) -> Dict[str, Any]:
    """
    Finds optimal shortest path using A* search with Haversine distance heuristic.
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
            'algorithm': 'A*',
            'source': source,
            'destination': destination,
            'path': [source],
            'path_nodes': [node_info],
            'total_distance_km': 0.0,
            'total_time_hours': 0.0,
            'segments': [],
            'nodes_explored_count': 1
        }

    # Priority queue: (f_score, g_cost, current_node, path, distance_accum, time_accum, segments)
    h_start = heuristic_time_estimate(graph, source, destination)
    queue = [(h_start, 0.0, source, [source], 0.0, 0.0, [])]
    visited = set()
    nodes_explored = 0

    while queue:
        f_score, g_cost, current, path, dist_acc, time_acc, segments = heapq.heappop(queue)

        if current in visited:
            continue
        visited.add(current)
        nodes_explored += 1

        if current == destination:
            path_nodes = [graph.get_node(n) for n in path]
            return {
                'success': True,
                'algorithm': 'A*',
                'source': source,
                'destination': destination,
                'path': path,
                'path_nodes': path_nodes,
                'total_distance_km': round(dist_acc, 1),
                'total_time_hours': round(time_acc, 2),
                'segments': segments,
                'nodes_explored_count': nodes_explored,
                'heuristic_used': 'Haversine Admissible Air Velocity Heuristic'
            }

        for edge in graph.get_neighbors(current):
            nxt = edge['target']
            if nxt in visited:
                continue

            edge_cost = edge['time_hours'] if weight_metric == 'time_hours' else edge['distance_km']
            new_g = g_cost + edge_cost
            h_cost = heuristic_time_estimate(graph, nxt, destination)
            new_f = new_g + h_cost

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
                new_f,
                new_g,
                nxt,
                path + [nxt],
                new_dist,
                new_time,
                segments + [segment_info]
            ))

    return {
        'success': False,
        'error': f"No route found between '{source}' and '{destination}'.",
        'path': [],
        'total_distance_km': 0.0,
        'total_time_hours': 0.0,
        'nodes_explored_count': nodes_explored
    }
