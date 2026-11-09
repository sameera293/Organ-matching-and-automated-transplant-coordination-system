"""
Medical Transit Graph Network.
Represents interconnected transplant centers, regional hospitals, and aviation hubs.
Provides geographical coordinates, transit modalities, and road/air edge connections.
"""

import math
from typing import Dict, List, Tuple, Any

# Haversine formula for spherical distance between two (lat, lon) coordinates
def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

# Synthetic Hospital Nodes with realistic geolocations
HOSPITAL_NODES: Dict[str, Dict[str, Any]] = {
    'HOSP-METRO-01': {
        'id': 'HOSP-METRO-01',
        'name': 'Metro Health University Medical Center',
        'city': 'Metro City',
        'coords': (40.7128, -74.0060),
        'has_helipad': True,
        'type': 'Level 1 Trauma & Comprehensive Transplant Center'
    },
    'HOSP-NORTH-02': {
        'id': 'HOSP-NORTH-02',
        'name': 'Northern Regional Organ Retrieval Center',
        'city': 'North Haven',
        'coords': (41.3083, -72.9279),
        'has_helipad': True,
        'type': 'Regional Transplant Retrieval Center'
    },
    'HOSP-EAST-03': {
        'id': 'HOSP-EAST-03',
        'name': 'Eastern Memorial General Hospital',
        'city': 'Eastport',
        'coords': (41.8240, -71.4128),
        'has_helipad': False,
        'type': 'General Hospital & Donor Care Facility'
    },
    'HOSP-CENTRAL-04': {
        'id': 'HOSP-CENTRAL-04',
        'name': 'Central Apex Specialty Hospital',
        'city': 'Midland',
        'coords': (40.4406, -79.9959),
        'has_helipad': True,
        'type': 'Specialized Cardiac & Hepatic Center'
    },
    'HOSP-SOUTH-05': {
        'id': 'HOSP-SOUTH-05',
        'name': 'Southern Cross Medical Pavilion',
        'city': 'Southfield',
        'coords': (39.9526, -75.1652),
        'has_helipad': True,
        'type': 'University Transplant Institute'
    },
    'HUB-AIR-01': {
        'id': 'HUB-AIR-01',
        'name': 'Tri-State Medical Aviation Dispatch Hub',
        'city': 'Aero Valley',
        'coords': (40.6895, -74.1745),
        'has_helipad': True,
        'type': 'Emergency Aviation Transit Corridor'
    },
    'HOSP-WEST-06': {
        'id': 'HOSP-WEST-06',
        'name': 'Western Heights Medical Institute',
        'city': 'Westfall',
        'coords': (41.4993, -81.6944),
        'has_helipad': True,
        'type': 'Regional Renal Transplant Center'
    },
    'HOSP-VALLEY-07': {
        'id': 'HOSP-VALLEY-07',
        'name': 'Green Valley Community Hospital',
        'city': 'Green Valley',
        'coords': (40.0583, -74.4057),
        'has_helipad': False,
        'type': 'Community Donor Recovery Center'
    }
}

# Graph Edges (Inter-hospital transit segments)
TRANSIT_EDGES = [
    ('HOSP-METRO-01', 'HUB-AIR-01', 25.0, 0.45, 'Ground/Rapid Transfer'),
    ('HOSP-METRO-01', 'HOSP-VALLEY-07', 75.0, 1.15, 'Interstate Corridor'),
    ('HOSP-METRO-01', 'HOSP-NORTH-02', 125.0, 1.75, 'Expressway'),
    ('HOSP-NORTH-02', 'HOSP-EAST-03', 140.0, 1.90, 'Coastal Route'),
    ('HUB-AIR-01', 'HOSP-SOUTH-05', 130.0, 1.10, 'Aviation / High-Speed Corridor'),
    ('HOSP-VALLEY-07', 'HOSP-SOUTH-05', 85.0, 1.30, 'State Highway'),
    ('HOSP-SOUTH-05', 'HOSP-CENTRAL-04', 490.0, 3.20, 'Air Ambulance Corridor'),
    ('HUB-AIR-01', 'HOSP-CENTRAL-04', 510.0, 2.80, 'Fixed-Wing Flight Corridor'),
    ('HOSP-CENTRAL-04', 'HOSP-WEST-06', 215.0, 1.80, 'Air/Express Transit'),
    ('HOSP-NORTH-02', 'HUB-AIR-01', 115.0, 1.35, 'Helicopter Transfer Link'),
    ('HOSP-EAST-03', 'HOSP-WEST-06', 820.0, 4.50, 'Long-Range Air Corridor')
]

class MedicalTransitGraph:
    def __init__(self):
        self.nodes = HOSPITAL_NODES
        self.adjacency: Dict[str, List[Dict[str, Any]]] = {k: [] for k in self.nodes}
        self._build_graph()

    def _build_graph(self):
        for u, v, dist, hours, route_type in TRANSIT_EDGES:
            if u in self.adjacency and v in self.adjacency:
                self.adjacency[u].append({
                    'target': v,
                    'distance_km': dist,
                    'time_hours': hours,
                    'route_type': route_type
                })
                # Bi-directional transit
                self.adjacency[v].append({
                    'target': u,
                    'distance_km': dist,
                    'time_hours': hours,
                    'route_type': route_type
                })

    def get_neighbors(self, node_id: str) -> List[Dict[str, Any]]:
        return self.adjacency.get(node_id, [])

    def get_node(self, node_id: str) -> Dict[str, Any]:
        return self.nodes.get(node_id, {})

    def resolve_nearest_node(self, location_name: str) -> str:
        """
        Maps a location string or hospital name to the nearest graph node ID.
        """
        clean = location_name.strip().lower()
        for nid, info in self.nodes.items():
            if nid.lower() in clean or info['city'].lower() in clean or info['name'].lower() in clean:
                return nid
        # Default fallback to primary metropolitan hub
        return 'HOSP-METRO-01'
