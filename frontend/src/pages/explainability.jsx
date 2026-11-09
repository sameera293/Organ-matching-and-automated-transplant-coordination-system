import React, { useEffect, useState } from "react";
import {
  Brain,
  RefreshCw,
  Play,
  TrendingUp,
  TrendingDown,
  Info,
  AlertTriangle,
} from "lucide-react";

import { api } from "../services/api";

export default function Explainability() {
  const [organs, setOrgans] = useState([]);
  const [recipients, setRecipients] = useState([]);

  const [organId, setOrganId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [model, setModel] = useState("xgboost");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError("");

      const [organData, recipientData] = await Promise.all([
        api.getOrgans(),
        api.getRecipients(),
      ]);

      setOrgans(organData || []);
      setRecipients(recipientData || []);
      setOrganId("");
      setRecipientId("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load organs and recipients.");
    } finally {
      setLoadingData(false);
    }
  };

  const generateExplanation = async () => {
    if (!organId || !recipientId) {
      setError("Please select both an organ and a recipient.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await api.explainMatch({
        organ_id: organId,
        recipient_id: recipientId,
        model_name: model,
      });

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to generate SHAP explanation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Explainable AI</h1>

          <p className="page-subtitle">
            SHAP-based explanation of factors influencing the AI-assisted
            suitability score.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadData}
          disabled={loadingData}
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
            gridTemplateColumns: "1fr 1fr 180px auto",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Organ</label>

            <select
              className="form-control"
              value={organId}
              onChange={(e) => {
                setOrganId(e.target.value);
                setResult(null);
              }}
              disabled={loadingData || loading}
            >
              <option value="">Select organ</option>

              {organs.map((organ) => (
                <option key={organ.organ_id} value={organ.organ_id}>
                  {organ.organ_id} — {organ.organ_type} —{" "}
                  {organ.blood_group}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Recipient</label>

            <select
              className="form-control"
              value={recipientId}
              onChange={(e) => {
                setRecipientId(e.target.value);
                setResult(null);
              }}
              disabled={loadingData || loading}
            >
              <option value="">Select recipient</option>

              {recipients.map((recipient) => (
                <option
                  key={recipient.recipient_id}
                  value={recipient.recipient_id}
                >
                  {recipient.recipient_id} — {recipient.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Model</label>

            <select
              className="form-control"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setResult(null);
              }}
              disabled={loading}
            >
              <option value="xgboost">XGBoost</option>
              <option value="random_forest">Random Forest</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={generateExplanation}
            disabled={loading || !organId || !recipientId}
            style={{ height: "42px" }}
          >
            {loading ? (
              <>
                <Brain size={16} />
                Analyzing...
              </>
            ) : (
              <>
                <Play size={16} />
                Explain
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
            borderLeft: "4px solid #dc2626",
            background: "#fff7f7",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              color: "#b91c1c",
            }}
          >
            <AlertTriangle size={20} />
            <strong>Explanation Error</strong>
          </div>

          <p style={{ marginTop: "8px" }}>{error}</p>
        </div>
      )}

      {/* INITIAL STATE */}
      {!result && !loading && !error && (
        <div
          className="card"
          style={{
            padding: "55px 30px",
            textAlign: "center",
          }}
        >
          <Brain
            size={52}
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h2>Generate an AI Explanation</h2>

          <p
            style={{
              maxWidth: "650px",
              margin: "10px auto 0",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
            }}
          >
            Choose an organ and recipient that appear as eligible in the
            Matching Engine. This page explains only pairs that pass organ
            type, blood group, status, eligibility and preservation rules.
          </p>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div
          className="card"
          style={{
            padding: "55px",
            textAlign: "center",
          }}
        >
          <Brain
            size={42}
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h3>Generating SHAP Explanation...</h3>

          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: "8px",
            }}
          >
            Analyzing the contribution of each model feature.
          </p>
        </div>
      )}

      {/* RESULTS */}
      {result && !loading && (
        <>
          {/* CANDIDATE SUMMARY */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem" }}>
                  Candidate Explanation
                </h2>

                <p
                  style={{
                    marginTop: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Recipient:{" "}
                  <strong>
                    {result.recipient_details?.name ||
                      result.candidate_id}
                  </strong>{" "}
                  · {result.candidate_id}
                </p>

                <p
                  style={{
                    marginTop: "4px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Organ:{" "}
                  <strong>{result.organ_details?.organ_id}</strong> ·{" "}
                  {result.organ_details?.organ_type} ·{" "}
                  {result.organ_details?.blood_group}
                </p>
              </div>

              <div
                style={{
                  textAlign: "center",
                  minWidth: "130px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Hybrid AI Suitability Score
                </div>

                <div
                  style={{
                    fontSize: "2.1rem",
                    fontWeight: "700",
                    color: "var(--primary)",
                    marginTop: "3px",
                  }}
                >
                  {result.ai_suitability_score == null
                    ? "—"
                    : `${(Number(result.ai_suitability_score) * 100).toFixed(1)}%`}
                </div>
                <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  SHAP explains {result.model_evaluated} probability: {result.ai_score == null ? "—" : `${(Number(result.ai_score) * 100).toFixed(1)}%`}
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div
            className="card"
            style={{
              marginBottom: "20px",
              borderLeft: "4px solid var(--primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <Info size={21} />

              <div>
                <h3 style={{ fontSize: "1rem" }}>
                  Model Explanation Summary
                </h3>

                <p
                  style={{
                    marginTop: "7px",
                    lineHeight: "1.6",
                    color: "var(--text-secondary)",
                  }}
                >
                  {result.explanation_summary}
                </p>
              </div>
            </div>
          </div>

          {/* POSITIVE + NEGATIVE FACTORS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* POSITIVE */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <TrendingUp size={20} color="#059669" />

                <h2 style={{ fontSize: "1.1rem" }}>
                  Positive Factors
                </h2>
              </div>

              {result.top_positive_factors?.length > 0 ? (
                result.top_positive_factors.map((factor) => (
                  <div
                    key={factor.feature_key}
                    style={{
                      padding: "13px",
                      border: "1px solid #d1fae5",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      background: "#f0fdf4",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <strong>{factor.feature_name}</strong>

                      <strong style={{ color: "#059669" }}>
                        +{Number(factor.shap_value).toFixed(4)}
                      </strong>
                    </div>

                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginTop: "5px",
                      }}
                    >
                      Value: {factor.actual_value}
                    </div>

                    <p
                      style={{
                        fontSize: "0.85rem",
                        marginTop: "7px",
                        lineHeight: "1.45",
                      }}
                    >
                      {factor.interpretation}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>
                  No significant positive factors identified.
                </p>
              )}
            </div>

            {/* NEGATIVE */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <TrendingDown size={20} color="#dc2626" />

                <h2 style={{ fontSize: "1.1rem" }}>
                  Negative Factors
                </h2>
              </div>

              {result.top_negative_factors?.length > 0 ? (
                result.top_negative_factors.map((factor) => (
                  <div
                    key={factor.feature_key}
                    style={{
                      padding: "13px",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      background: "#fef2f2",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <strong>{factor.feature_name}</strong>

                      <strong style={{ color: "#dc2626" }}>
                        {Number(factor.shap_value).toFixed(4)}
                      </strong>
                    </div>

                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginTop: "5px",
                      }}
                    >
                      Value: {factor.actual_value}
                    </div>

                    <p
                      style={{
                        fontSize: "0.85rem",
                        marginTop: "7px",
                        lineHeight: "1.45",
                      }}
                    >
                      {factor.interpretation}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>
                  No significant negative factors identified.
                </p>
              )}
            </div>
          </div>

          {/* FULL SHAP TABLE */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "16px",
              }}
            >
              Feature Contribution Analysis
            </h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Actual Value</th>
                    <th>SHAP Value</th>
                    <th>Impact</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>

                <tbody>
                  {result.waterfall_data?.map((item) => (
                    <tr key={item.feature_key}>
                      <td>
                        <strong>{item.feature_name}</strong>
                      </td>

                      <td>{item.actual_value}</td>

                      <td>
                        <strong
                          style={{
                            color:
                              item.shap_value >= 0
                                ? "#059669"
                                : "#dc2626",
                          }}
                        >
                          {item.shap_value >= 0 ? "+" : ""}
                          {Number(item.shap_value).toFixed(4)}
                        </strong>
                      </td>

                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            background:
                              item.impact === "positive"
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              item.impact === "positive"
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {item.impact}
                        </span>
                      </td>

                      <td
                        style={{
                          maxWidth: "450px",
                          lineHeight: "1.45",
                        }}
                      >
                        {item.interpretation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BASE VALUE */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1rem" }}>Model Baseline</h3>

            <p
              style={{
                marginTop: "7px",
                color: "var(--text-secondary)",
              }}
            >
              Base model value:{" "}
              <strong>{Number(result.base_value).toFixed(4)}</strong>
            </p>

            <p
              style={{
                marginTop: "4px",
                color: "var(--text-secondary)",
              }}
            >
              Model evaluated:{" "}
              <strong>{result.model_evaluated}</strong>
            </p>
          </div>

          {/* DISCLAIMER */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid #f59e0b",
              background: "#fffbeb",
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
                  Explainability Notice
                </strong>

                <p
                  style={{
                    marginTop: "6px",
                    color: "#92400e",
                    lineHeight: "1.5",
                  }}
                >
                  {result.clinical_disclaimer}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
