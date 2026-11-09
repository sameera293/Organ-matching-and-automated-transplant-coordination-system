"""
Automated integration tests for FastAPI REST Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "safety_disclaimer" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert data["stats"]["available_organs"] > 0
    assert data["stats"]["active_recipients"] > 0
    assert "organ_distribution" in data
    assert "safety_disclaimer" in data

def test_donors_api():
    # List donors
    response = client.get("/api/donors")
    assert response.status_code == 200
    donors = response.json()
    assert len(donors) >= 10

def test_organs_api():
    # List organs
    response = client.get("/api/organs")
    assert response.status_code == 200
    organs = response.json()
    assert len(organs) >= 10
    assert "preservation_remaining_hours" in organs[0]

def test_recipients_api():
    # List recipients
    response = client.get("/api/recipients")
    assert response.status_code == 200
    recipients = response.json()
    assert len(recipients) >= 20

def test_matching_pipeline_api():
    # Run matching for an available Kidney
    response = client.post("/api/matching/run", json={
        "organ_id": "ORG-KID-201",
        "model_name": "xgboost"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["organ_id"] == "ORG-KID-201"
    assert data["total_candidates_evaluated"] >= 20
    assert len(data["ranked_eligible_candidates"]) > 0
    assert len(data["ineligible_candidates"]) > 0
    assert "disclaimer" in data

def test_professional_review_save_and_retrieve():
    matched = client.post("/api/matching/run", json={
        "organ_id": "ORG-KID-201",
        "model_name": "xgboost"
    })
    assert matched.status_code == 200

    history = client.get("/api/matching/ORG-KID-201")
    assert history.status_code == 200
    records = history.json()
    assert records
    record = records[0]
    assert record["recipient_name"]
    assert record["compatibility_status"] == "COMPATIBLE"
    assert record["ai_score"] is not None
    assert record["rank"] is not None
    assert record["explanation"]["model_name"] == "xgboost"
    assert record["explanation"]["reasons"]

    review = client.put(f"/api/matching/review/{record['match_id']}", json={
        "review_status": "Reviewed",
        "review_notes": "Review save and retrieval verification"
    })
    assert review.status_code == 200
    saved = next(item for item in client.get("/api/matching/ORG-KID-201").json() if item["match_id"] == record["match_id"])
    assert saved["review_status"] == "Reviewed"
    assert saved["review_notes"] == "Review save and retrieval verification"

def test_explain_api():
    response = client.post("/api/explain", json={
        "organ_id": "ORG-KID-201",
        "recipient_id": "REC-301",
        "model_name": "xgboost"
    })
    assert response.status_code == 200
    data = response.json()
    assert "ai_score" in data
    assert "waterfall_data" in data
    assert "top_positive_factors" in data

def test_logistics_route_api():
    response = client.post("/api/logistics/route", json={
        "source_location": "Metro City",
        "destination_location": "Southfield",
        "algorithm": "Dijkstra",
        "organ_type": "Kidney",
        "preservation_limit_hours": 30.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_time_hours"] > 0
    assert data["feasibility_status"] in ["FEASIBLE", "FEASIBILITY_CONCERN"]

def test_hungarian_optimization_api():
    response = client.post("/api/optimization/run", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_assignments"] > 0
    assert "matrix_table" in data

def test_scenario_analysis_api():
    response = client.post("/api/scenario/run", json={
        "organ_id": "ORG-KID-201",
        "recipient_id": "REC-301",
        "travel_time_delay_hours": 2.5,
        "urgency_shift": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert "baseline_score" in data
    assert "scenario_score" in data
    assert "score_delta" in data

def test_notifications_api():
    response = client.get("/api/notifications")
    assert response.status_code == 200
    notifs = response.json()
    assert len(notifs) >= 5

def test_notification_filters_and_read_actions():
    unread = client.get("/api/notifications", params={"status": "UNREAD"})
    assert unread.status_code == 200
    unread_records = unread.json()
    assert unread_records

    notification = unread_records[0]
    read = client.post(f"/api/notifications/{notification['notification_id']}/read")
    assert read.status_code == 200
    assert read.json()["status"] == "READ"

    filtered = client.get("/api/notifications", params={
        "status": "READ",
        "severity": notification["severity"]
    })
    assert filtered.status_code == 200
    assert any(item["notification_id"] == notification["notification_id"] for item in filtered.json())

    all_read = client.post("/api/notifications/read-all")
    assert all_read.status_code == 200
    remaining = client.get("/api/notifications", params={"status": "UNREAD"})
    assert remaining.status_code == 200
    assert remaining.json() == []

def test_ml_evaluation_api():
    response = client.get("/api/ml/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "XGBoost" in data["metrics"]

def test_fairness_api():
    response = client.get("/api/fairness/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "overall_metrics" in data
    assert "age_group_analysis" in data
    assert "blood_group_analysis" in data
