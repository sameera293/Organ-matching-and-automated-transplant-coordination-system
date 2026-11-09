import React, { useState } from "react";
import {
  Network,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Users,
  HeartHandshake,
  Target,
} from "lucide-react";

import { api } from "../services/api";

export default function Optimization() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runOptimization = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await api.runHungarianOptimization({});

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to run Hungarian optimization."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "-";
    }

    return `${(number * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score) => {
    const value = Number(score);

    if (value >= 0.8) return "#059669";
    if (value >= 0.6) return "#d97706";

    return "#dc2626";
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Multi-Organ Optimization
          </h1>

          <p className="page-subtitle">
            Global organ-recipient assignment using the
            Hungarian optimization algorithm.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={runOptimization}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Re-run
        </button>
      </div>

      {/* INTRO */}
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
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <Network
            size={24}
            style={{ color: "var(--primary)", marginTop: "2px" }}
          />

          <div>
            <h3 style={{ fontSize: "1.05rem" }}>
              Global Assignment Optimization
            </h3>

            <p
              style={{
                marginTop: "7px",
                lineHeight: "1.55",
                color: "var(--text-secondary)",
              }}
            >
              Instead of evaluating one organ-recipient pair at
              a time, this module considers multiple available
              organs and eligible recipients simultaneously and
              searches for a globally optimized one-to-one
              assignment.
            </p>
          </div>
        </div>
      </div>

      {/* RUN BUTTON */}
      {!result && !loading && !error && (
        <div
          className="card"
          style={{
            padding: "55px 30px",
            textAlign: "center",
          }}
        >
          <Network
            size={52}
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h2>Run Multi-Organ Optimization</h2>

          <p
            style={{
              maxWidth: "650px",
              margin: "10px auto 22px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
            }}
          >
            The system will evaluate available organs and
            eligible recipients, construct a utility matrix,
            and use the Hungarian Algorithm to identify the
            highest-utility assignment combination.
          </p>

          <button
            className="btn btn-primary"
            onClick={runOptimization}
          >
            <Play size={17} />
            Run Hungarian Optimization
          </button>
        </div>
      )}

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
              alignItems: "center",
              gap: "9px",
              color: "#b91c1c",
            }}
          >
            <AlertTriangle size={20} />

            <strong>
              Optimization Error
            </strong>
          </div>

          <p style={{ marginTop: "8px" }}>
            {error}
          </p>

          <button
            className="btn btn-primary"
            style={{ marginTop: "15px" }}
            onClick={runOptimization}
          >
            Try Again
          </button>
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
          <Network
            size={44}
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h3>
            Running Hungarian Optimization...
          </h3>

          <p
            style={{
              marginTop: "8px",
              color: "var(--text-secondary)",
            }}
          >
            Building the organ-recipient utility matrix and
            calculating the globally optimized assignments.
          </p>
        </div>
      )}

      {/* RESULTS */}
      {result && !loading && (
        <>
          {/* RESULT HEADER */}
          <div
            className="card"
            style={{ marginBottom: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem" }}>
                  Optimization Results
                </h2>

                <p
                  style={{
                    marginTop: "7px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Algorithm:{" "}
                  <strong>{result.algorithm}</strong>
                </p>
              </div>

              <div
                style={{
                  padding: "9px 15px",
                  borderRadius: "8px",
                  background: "#ecfdf5",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontWeight: "700",
                }}
              >
                <CheckCircle2 size={18} />

                Optimization Completed
              </div>
            </div>
          </div>

          {/* METRICS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div className="card">
              <Users
                size={23}
                style={{ color: "var(--primary)" }}
              />

              <div
                style={{
                  marginTop: "9px",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Organs Evaluated
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "4px",
                }}
              >
                {result.num_organs_evaluated}
              </div>
            </div>

            <div className="card">
              <Users
                size={23}
                style={{ color: "var(--primary)" }}
              />

              <div
                style={{
                  marginTop: "9px",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Recipients Evaluated
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "4px",
                }}
              >
                {result.num_recipients_evaluated}
              </div>
            </div>

            <div className="card">
              <Target
                size={23}
                style={{ color: "#059669" }}
              />

              <div
                style={{
                  marginTop: "9px",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Optimized Assignments
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "4px",
                  color: "#059669",
                }}
              >
                {result.total_assignments}
              </div>
            </div>

            <div className="card">
              <HeartHandshake
                size={23}
                style={{ color: "var(--primary)" }}
              />

              <div
                style={{
                  marginTop: "9px",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Total System Utility
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "4px",
                }}
              >
                {Number(
                  result.total_system_utility
                ).toFixed(2)}
              </div>
            </div>
          </div>

          {/* ASSIGNMENTS */}
          <div
            className="card"
            style={{ marginBottom: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "1.1rem" }}>
                Optimized Assignments
              </h2>

              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                }}
              >
                {result.total_assignments} global matches
              </span>
            </div>

            {result.assignments?.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Organ</th>
                      <th>Type</th>
                      <th>Blood Group</th>
                      <th>Recipient</th>
                      <th>Hospital</th>
                      <th>Urgency</th>
                      <th>AI Score</th>
                      <th>Utility</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.assignments.map(
                      (assignment) => (
                        <tr
                          key={`${assignment.organ_id}-${assignment.recipient_id}`}
                        >
                          <td>
                            <strong>
                              {assignment.organ_id}
                            </strong>
                          </td>

                          <td>
                            {assignment.organ_type}
                          </td>

                          <td>
                            {assignment.organ_blood_group}
                          </td>

                          <td>
                            <strong>
                              {assignment.recipient_name}
                            </strong>

                            <div
                              style={{
                                fontSize: "0.75rem",
                                color:
                                  "var(--text-secondary)",
                                marginTop: "2px",
                              }}
                            >
                              {assignment.recipient_id}
                            </div>
                          </td>

                          <td>
                            {assignment.recipient_hospital}
                          </td>

                          <td>
                            {assignment.medical_urgency}
                          </td>

                          <td>
                            <strong
                              style={{
                                color: getScoreColor(
                                  assignment.ai_suitability_score
                                ),
                              }}
                            >
                              {formatScore(
                                assignment.ai_suitability_score
                              )}
                            </strong>
                          </td>

                          <td>
                            {Number(
                              assignment.computed_utility
                            ).toFixed(2)}
                          </td>

                          <td>
                            <span
                              style={{
                                padding: "5px 9px",
                                borderRadius: "999px",
                                background:
                                  "#dcfce7",
                                color:
                                  "#166534",
                                fontSize:
                                  "0.72rem",
                                fontWeight: "700",
                              }}
                            >
                              {assignment.assignment_status}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                No optimized assignments were produced.
              </p>
            )}
          </div>

          {/* MATRIX */}
          <div
            className="card"
            style={{ marginBottom: "20px" }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "8px",
              }}
            >
              Organ–Recipient Utility Matrix
            </h2>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "16px",
              }}
            >
              Each cell represents the suitability and utility
              calculated for an organ-recipient pair.
            </p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Organ</th>
                    <th>Type</th>
                    <th>Blood</th>
                    <th>Recipient Scores</th>
                  </tr>
                </thead>

                <tbody>
                  {result.matrix_table?.map(
                    (row) => (
                      <tr key={row.organ_id}>
                        <td>
                          <strong>
                            {row.organ_id}
                          </strong>
                        </td>

                        <td>{row.organ_type}</td>

                        <td>{row.blood_group}</td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {row.scores?.map(
                              (score) => (
                                <div
                                  key={
                                    score.recipient_id
                                  }
                                  style={{
                                    minWidth:
                                      "155px",
                                    padding:
                                      "9px 10px",
                                    borderRadius:
                                      "8px",
                                    border:
                                      score.eligible
                                        ? "1px solid #dbe3ec"
                                        : "1px solid #fecaca",
                                    background:
                                      score.eligible
                                        ? "#f8fafc"
                                        : "#fef2f2",
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      gap: "8px",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize:
                                          "0.78rem",
                                      }}
                                    >
                                      {
                                        score.recipient_id
                                      }
                                    </strong>

                                    <strong
                                      style={{
                                        color:
                                          score.eligible
                                            ? getScoreColor(
                                                score.ai_score
                                              )
                                            : "#dc2626",
                                      }}
                                    >
                                      {score.eligible
                                        ? formatScore(
                                            score.ai_score
                                          )
                                        : "N/A"}
                                    </strong>
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        "0.72rem",
                                      marginTop:
                                        "4px",
                                      color:
                                        "var(--text-secondary)",
                                    }}
                                  >
                                    {
                                      score.recipient_name
                                    }
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        "0.7rem",
                                      marginTop:
                                        "5px",
                                      color:
                                        score.eligible
                                          ? "#047857"
                                          : "#b91c1c",
                                    }}
                                  >
                                    {
                                      score.note
                                    }
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* UNMATCHED */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div className="card">
              <h3
                style={{
                  fontSize: "1rem",
                  marginBottom: "12px",
                }}
              >
                Unmatched Organs
              </h3>

              {result.unmatched_organs?.length >
              0 ? (
                result.unmatched_organs.map(
                  (organId) => (
                    <div
                      key={organId}
                      style={{
                        padding: "9px 11px",
                        marginBottom: "7px",
                        borderRadius: "7px",
                        background: "#fff7ed",
                        color: "#9a3412",
                      }}
                    >
                      {organId}
                    </div>
                  )
                )
              ) : (
                <p
                  style={{
                    color: "#047857",
                  }}
                >
                  All evaluated organs were assigned.
                </p>
              )}
            </div>

            <div className="card">
              <h3
                style={{
                  fontSize: "1rem",
                  marginBottom: "12px",
                }}
              >
                Unmatched Recipients
              </h3>

              {result.unmatched_recipients?.length >
              0 ? (
                result.unmatched_recipients.map(
                  (recipientId) => (
                    <div
                      key={recipientId}
                      style={{
                        padding: "9px 11px",
                        marginBottom: "7px",
                        borderRadius: "7px",
                        background: "#fff7ed",
                        color: "#9a3412",
                      }}
                    >
                      {recipientId}
                    </div>
                  )
                )
              ) : (
                <p
                  style={{
                    color: "#047857",
                  }}
                >
                  All evaluated recipients received
                  an assignment.
                </p>
              )}
            </div>
          </div>

          {/* FLOW */}
          <div
            className="card"
            style={{ marginBottom: "20px" }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "18px",
              }}
            >
              Optimization Process
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {[
                "Available Organs",
                "Eligible Recipients",
                "Utility Matrix",
                "Hungarian Algorithm",
                "Global Assignment",
              ].map((step, index, array) => (
                <React.Fragment key={step}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      border:
                        "1px solid #dbe3ec",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    {step}
                  </div>

                  {index <
                    array.length - 1 && (
                    <ArrowRight
                      size={17}
                      style={{
                        color:
                          "var(--primary)",
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* DISCLAIMER */}
          <div
            className="card"
            style={{
              borderLeft:
                "4px solid #f59e0b",
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
              <AlertTriangle
                size={20}
                color="#d97706"
              />

              <div>
                <strong
                  style={{
                    color: "#92400e",
                  }}
                >
                  Optimization Research Notice
                </strong>

                <p
                  style={{
                    marginTop: "6px",
                    color: "#92400e",
                    lineHeight: "1.5",
                  }}
                >
                  {result.research_disclaimer}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}