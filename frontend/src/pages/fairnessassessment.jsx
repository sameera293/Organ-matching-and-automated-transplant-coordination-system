import React, { useEffect, useState } from "react";
import {
  Scale,
  RefreshCw,
  Users,
  MapPin,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../services/api";

export default function FairnessAssessment() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFairness = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.getFairnessEvaluation();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to load fairness assessment."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFairness();
  }, []);

  const percent = (value) =>
    `${(Number(value) * 100).toFixed(2)}%`;

  const ratio = (value) =>
    Number(value).toFixed(3);

  const renderGroupTable = (title, rows) => {
    if (!rows || rows.length === 0) {
      return (
        <div className="card">
          <h2>{title}</h2>
          <p>No subgroup data available.</p>
        </div>
      );
    }

    return (
      <div className="card" style={{ marginBottom: "22px" }}>
        <h2>{title}</h2>

        <div style={{ overflowX: "auto", marginTop: "18px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Samples</th>
                <th>Share</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>Selection Rate</th>
                <th>Disparate Impact</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.group_name}>
                  <td>
                    <strong>{row.group_name}</strong>
                  </td>

                  <td>{row.sample_count}</td>

                  <td>
                    {row.sample_share_percent}%
                  </td>

                  <td>
                    {percent(row.accuracy)}
                  </td>

                  <td>
                    {percent(row.precision)}
                  </td>

                  <td>
                    {percent(row.recall)}
                  </td>

                  <td>
                    {percent(row.selection_rate)}
                  </td>

                  <td>
                    <strong>
                      {ratio(row.disparate_impact_ratio)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="card">
          <h2>Loading Fairness Assessment...</h2>
          <p>
            Evaluating model behavior across different
            subgroups.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="card">
          <h1>Fairness Assessment</h1>

          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#be123c",
            }}
          >
            <strong>
              Unable to load fairness results.
            </strong>

            <p>{error}</p>
          </div>

          <button
            className="btn btn-primary"
            onClick={loadFairness}
            style={{ marginTop: "18px" }}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overall = data?.overall_metrics;

  return (
    <div className="page-content">

      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div>
          <h1>Fairness Assessment</h1>

          <p>
            Research-oriented assessment of model behavior
            across recipient and logistics subgroups.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadFairness}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="card" style={{ marginBottom: "20px", borderLeft: "4px solid #d97706" }}>
        <strong>{data?.benchmark_label || "Synthetic benchmark — not clinical validation."}</strong>
        <p style={{ marginTop: "5px", color: "var(--text-secondary)" }}>
          Subgroup metrics describe model behavior on generated data; they do not establish clinical fairness.
        </p>
      </div>

      {/* Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div className="card">
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <Users size={24} />

            <div>
              <p>Total Samples</p>
              <h2>
                {overall?.total_samples?.toLocaleString() ||
                  "—"}
              </h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <CheckCircle2 size={24} />

            <div>
              <p>Overall Accuracy</p>
              <h2>
                {overall
                  ? percent(overall.accuracy)
                  : "—"}
              </h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <Scale size={24} />

            <div>
              <p>Overall Precision</p>
              <h2>
                {overall
                  ? percent(overall.precision)
                  : "—"}
              </h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <HeartPulse size={24} />

            <div>
              <p>Overall Recall</p>
              <h2>
                {overall
                  ? percent(overall.recall)
                  : "—"}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="card"
        style={{
          marginBottom: "22px",
          borderLeft: "4px solid #0ea5e9",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <Scale size={24} />

          <div>
            <h2>What is being assessed?</h2>

            <p>
              The system evaluates whether model behavior
              differs across recipient age groups, blood-group
              categories and geographic distance tiers.
            </p>

            <p style={{ marginTop: "10px" }}>
              Selection rate and disparate-impact ratio are
              included to identify differences in predicted
              suitability across subgroups.
            </p>
          </div>
        </div>
      </div>

      {/* Age */}
      {renderGroupTable(
        "Recipient Age Group Analysis",
        data?.age_group_analysis
      )}

      {/* Blood */}
      {renderGroupTable(
        "Blood Group Analysis",
        data?.blood_group_analysis
      )}

      {/* Geographic */}
      {renderGroupTable(
        "Geographic Distance Analysis",
        data?.geographic_distance_analysis
      )}

      {/* Interpretation */}
      <div
        className="card"
        style={{
          marginBottom: "22px",
          borderLeft: "4px solid #10b981",
        }}
      >
        <h2>Fairness Metric Interpretation</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginTop: "18px",
          }}
        >
          <div>
            <h3>Accuracy</h3>
            <p>
              Measures the proportion of predictions that
              correctly classify suitability.
            </p>
          </div>

          <div>
            <h3>Recall</h3>
            <p>
              Measures how many suitable cases are correctly
              identified by the model.
            </p>
          </div>

          <div>
            <h3>Selection Rate</h3>
            <p>
              Represents the proportion of cases predicted as
              suitable within a subgroup.
            </p>
          </div>

          <div>
            <h3>Disparate Impact Ratio</h3>
            <p>
              Compares a subgroup's selection rate with the
              overall selection rate. A value closer to 1
              indicates greater parity with the overall rate.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations */}
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
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={24} />

          <div>
            <h2>Limitations & Disclaimers</h2>

            <ul style={{ paddingLeft: "20px" }}>
              {data?.limitations_and_disclaimers?.map(
                (item, index) => (
                  <li
                    key={index}
                    style={{ marginBottom: "8px" }}
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
