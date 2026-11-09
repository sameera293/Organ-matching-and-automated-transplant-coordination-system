import React, { useEffect, useState } from "react";
import {
  Cpu,
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { api } from "../services/api";
import Badge from "../components/Badge";

export default function Matching({ selectedOrganId }) {
  const [organs, setOrgans] = useState([]);
  const [selectedOrgan, setSelectedOrgan] = useState(selectedOrganId || "");
  const [model, setModel] = useState("xgboost");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrgans, setLoadingOrgans] = useState(true);
  const [error, setError] = useState("");

  const fetchOrgans = async () => {
    try {
      setLoadingOrgans(true);
      setError("");

      const data = await api.getOrgans({
        status: "Available",
      });

      setOrgans(data || []);

      if (selectedOrganId) {
        const exists = data?.some(
          (organ) => organ.organ_id === selectedOrganId
        );

        if (exists) {
          setSelectedOrgan(selectedOrganId);
        }
      } else if (data && data.length > 0 && !selectedOrgan) {
        setSelectedOrgan(data[0].organ_id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load available organs.");
    } finally {
      setLoadingOrgans(false);
    }
  };

  useEffect(() => {
    fetchOrgans();
  }, [selectedOrganId]);

  const runMatching = async () => {
    if (!selectedOrgan) {
      setError("Please select an available organ first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await api.runMatching({
        organ_id: selectedOrgan,
        model_name: model,
      });

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Matching engine failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Matching Engine</h1>
          <p className="page-subtitle">
            Rule-based compatibility filtering followed by AI-assisted
            candidate analysis and ranking.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchOrgans}
          disabled={loadingOrgans}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* CONTROL PANEL */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Available Organ</label>

            <select
              className="form-control"
              value={selectedOrgan}
              onChange={(e) => {
                setSelectedOrgan(e.target.value);
                setResult(null);
              }}
              disabled={loadingOrgans || loading}
            >
              <option value="">Select an organ</option>

              {organs.map((organ) => (
                <option key={organ.organ_id} value={organ.organ_id}>
                  {organ.organ_id} — {organ.organ_type} —{" "}
                  {organ.blood_group}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">AI Model</label>

            <select
              className="form-control"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              <option value="xgboost">XGBoost</option>
              <option value="random_forest">Random Forest</option>
              <option value="logistic_regression">
                Logistic Regression
              </option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={runMatching}
            disabled={loading || !selectedOrgan}
            style={{ height: "42px" }}
          >
            {loading ? (
              <>
                <Activity size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Matching
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            borderLeft: "4px solid var(--danger)",
            background: "#fff7f7",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              color: "var(--danger)",
            }}
          >
            <AlertTriangle size={20} />
            <strong>Matching Error</strong>
          </div>

          <p style={{ marginTop: "8px" }}>{error}</p>
        </div>
      )}

      {/* INITIAL STATE */}
      {!result && !loading && !error && (
        <div
          className="card"
          style={{
            padding: "50px 30px",
            textAlign: "center",
          }}
        >
          <Cpu
            size={48}
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h2>Ready to Run Matching</h2>

          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: "8px",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Select an available organ and AI model. The system will first
            apply compatibility rules and then perform AI-assisted analysis
            of potentially eligible recipients.
          </p>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div
          className="card"
          style={{
            padding: "50px",
            textAlign: "center",
          }}
        >
          <Activity
            size={38}
            className="animate-spin"
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h3>Running Matching Pipeline...</h3>

          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: "8px",
            }}
          >
            Applying compatibility rules, AI analysis and logistics
            evaluation.
          </p>
        </div>
      )}

      {/* RESULTS */}
      {result && !loading && (
        <>
          {/* ORGAN SUMMARY */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    marginBottom: "8px",
                  }}
                >
                  Matching Results
                </h2>

                <p style={{ color: "var(--text-secondary)" }}>
                  <strong>{result.organ_id}</strong> ·{" "}
                  {result.organ_type} · {result.blood_group}
                </p>

                <p
                  style={{
                    color: "var(--text-secondary)",
                    marginTop: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <MapPin size={14} />
                  {result.current_location}
                </p>
              </div>

              <Badge variant="info">
                Model: {result.model_used}
              </Badge>
            </div>
          </div>

          {/* STAT CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Candidates Evaluated
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "6px",
                }}
              >
                {result.total_candidates_evaluated}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Eligible Candidates
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  color: "#059669",
                  marginTop: "6px",
                }}
              >
                {result.eligible_candidates_count}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Ineligible Candidates
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  color: "#dc2626",
                  marginTop: "6px",
                }}
              >
                {result.ineligible_candidates_count}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Preservation Remaining
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Clock size={20} />
                {Number(result.preservation_remaining_hours).toFixed(1)} hrs
              </div>
            </div>
          </div>

          {/* ELIGIBLE CANDIDATES */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <CheckCircle2 size={20} color="#059669" />

              <h2 style={{ fontSize: "1.15rem" }}>
                Ranked Eligible Candidates
              </h2>
            </div>

            {result.ranked_eligible_candidates?.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                }}
              >
                No potentially eligible candidates were identified.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Recipient</th>
                      <th>Blood</th>
                      <th>Urgency</th>
                      <th>Waiting</th>
                      <th>AI Score</th>
                      <th>Distance</th>
                      <th>Transit</th>
                      <th>Preservation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.ranked_eligible_candidates.map((candidate) => (
                      <tr key={candidate.recipient_id}>
                        <td>
                          <strong>#{candidate.rank}</strong>
                        </td>

                        <td>
                          <strong>{candidate.recipient_name}</strong>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {candidate.recipient_id}
                          </div>
                        </td>

                        <td>
                          <Badge variant="info">
                            {candidate.blood_group}
                          </Badge>
                        </td>

                        <td>{candidate.medical_urgency}</td>

                        <td>{candidate.waiting_time_days} days</td>

                        <td>
                          <strong>
                            {Number(
                              candidate.ai_suitability_score || 0
                            ).toFixed(2)}
                          </strong>
                        </td>

                        <td>
                          {candidate.distance_km != null
                            ? `${Number(candidate.distance_km).toFixed(1)} km`
                            : "-"}
                        </td>

                        <td>
                          {candidate.estimated_transit_hours != null
                            ? `${Number(
                                candidate.estimated_transit_hours
                              ).toFixed(1)} hrs`
                            : "-"}
                        </td>

                        <td>
                          <Badge
                            variant={
                              candidate.preservation_feasibility ===
                              "FEASIBLE"
                                ? "success"
                                : "warning"
                            }
                          >
                            {candidate.preservation_feasibility}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INELIGIBLE CANDIDATES */}
          {result.ineligible_candidates?.length > 0 && (
            <div className="card" style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <XCircle size={20} color="#dc2626" />

                <h2 style={{ fontSize: "1.15rem" }}>
                  Filtered Candidates
                </h2>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Blood Group</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.ineligible_candidates.map((candidate) => (
                      <tr key={candidate.recipient_id}>
                        <td>
                          <strong>{candidate.recipient_name}</strong>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {candidate.recipient_id}
                          </div>
                        </td>

                        <td>
                          <Badge variant="secondary">
                            {candidate.blood_group}
                          </Badge>
                        </td>

                        <td>{candidate.medical_urgency}</td>

                        <td>
                          <Badge variant="danger">
                            {candidate.compatibility_status}
                          </Badge>
                        </td>

                        <td>
                          <div style={{ maxWidth: "350px" }}>
                            {candidate.reasons?.length > 0
                              ? candidate.reasons.join(", ")
                              : candidate.failed_rules?.join(", ") ||
                                "Compatibility rule failed"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DISCLAIMER */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid #f59e0b",
              background: "#fffbeb",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle size={20} color="#d97706" />

              <div>
                <strong style={{ color: "#92400e" }}>
                  Decision-Support Notice
                </strong>

                <p
                  style={{
                    marginTop: "5px",
                    color: "#92400e",
                    lineHeight: "1.5",
                  }}
                >
                  {result.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}