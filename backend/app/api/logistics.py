from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from backend.app.schemas.logistics import RouteCalculationRequest, RouteCalculationResponse, RouteSegment
from backend.app.algorithms.graph_network import MedicalTransitGraph, TRANSIT_EDGES
from backend.app.algorithms.dijkstra import find_shortest_path_dijkstra
from backend.app.algorithms.astar import find_shortest_path_astar

router = APIRouter(prefix="/logistics", tags=["Logistics"])

graph = MedicalTransitGraph()

@router.get("/network")
def get_transit_network():
    """
    Returns full graph topology: nodes (hospitals and hubs with coordinates)
    and transit corridors for interactive frontend map/graph visualization.
    """
    nodes_list = [
        {
            'id': nid,
            'name': data['name'],
            'city': data['city'],
            'latitude': data['coords'][0],
            'longitude': data['coords'][1],
            'has_helipad': data['has_helipad'],
            'type': data['type']
        }
        for nid, data in graph.nodes.items()
    ]

    edges_list = [
        {
            'source': u,
            'target': v,
            'distance_km': dist,
            'time_hours': hrs,
            'route_type': rtype
        }
        for u, v, dist, hrs, rtype in TRANSIT_EDGES
    ]

    return {
        'nodes': nodes_list,
        'edges': edges_list
    }

@router.post("/route", response_model=RouteCalculationResponse)
def calculate_route(req: RouteCalculationRequest):
    s_node = graph.resolve_nearest_node(req.source_location)
    d_node = graph.resolve_nearest_node(req.destination_location)

    algo = req.algorithm.strip().lower() if req.algorithm else "dijkstra"

    if algo in ["a*", "astar"]:
        route_res = find_shortest_path_astar(graph, s_node, d_node)
        used_algo = "A* Search (Haversine Heuristic)"
    else:
        route_res = find_shortest_path_dijkstra(graph, s_node, d_node)
        used_algo = "Dijkstra Shortest Path"

    if not route_res['success']:
        raise HTTPException(status_code=400, detail=route_res.get('error', 'Route computation failed.'))

    total_time = route_res['total_time_hours']
    pres_limit = req.preservation_limit_hours or 24.0
    pres_remaining = pres_limit
    pres_margin = round(pres_remaining - total_time, 2)

    feasibility = "FEASIBLE" if pres_margin >= 0 else "FEASIBILITY_CONCERN"

    segments = [
        RouteSegment(
            from_node=seg['from_node'],
            from_name=seg['from_name'],
            to_node=seg['to_node'],
            to_name=seg['to_name'],
            distance_km=seg['distance_km'],
            time_hours=seg['time_hours'],
            route_type=seg['route_type']
        )
        for seg in route_res['segments']
    ]

    return RouteCalculationResponse(
        success=True,
        algorithm_used=used_algo,
        source=s_node,
        destination=d_node,
        path=route_res['path'],
        path_nodes=route_res['path_nodes'],
        total_distance_km=route_res['total_distance_km'],
        total_time_hours=total_time,
        segments=segments,
        nodes_explored_count=route_res['nodes_explored_count'],
        preservation_limit_hours=pres_limit,
        preservation_time_remaining_hours=pres_remaining,
        preservation_margin_hours=pres_margin,
        feasibility_status=feasibility,
        research_disclaimer="Logistics transit estimates are research-oriented approximations and do not constitute real-time emergency aviation or vehicular routing."
    )
