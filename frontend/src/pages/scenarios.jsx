import React, { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Play,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { api } from "../services/api";

export default function Scenarios() {
  const [organs, setOrgans] = useState([]);
  const [recipients, setRecipients] = useState([]);

  const [organId, setOrganId] = useState("");
  const [recipientId, setRecipientId] = useState("");

  const [travelDelay, setTravelDelay] = useState(0);
  const [urgencyShift, setUrgencyShift] = useState(0);
  const [waitingShift, setWaitingShift] = useState(0);
  const [preservationOverride, setPreservationOverride] =
    useState("");

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

      const [organData, recipientData] =
        await Promise.all([
          api.getOrgans(),
          api.getRecipients(),
        ]);

      const organList =
        Array.isArray(organData)
          ? organData
          : organData.items || organData.data || [];

      const recipientList =
        Array.isArray(recipientData)
          ? recipientData
          : recipientData.items ||
            recipientData.data ||
            [];

      setOrgans(organList);
      setRecipients(recipientList);

      if (organList.length > 0) {
        setOrganId(organList[0].organ_id);
      }

      if (recipientList.length > 0) {
        setRecipientId(
          recipientList[0].recipient_id
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to load organs and recipients."
      );
    } finally {
      setLoadingData(false);
    }
  };

  const runScenario = async () => {
    if (!organId || !recipientId) {
      setError(
        "Please select both an organ and a recipient."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data =
        await api.runScenarioSimulation({
          organ_id: organId,
          recipient_id: recipientId,
          travel_time_delay_hours:
            Number(travelDelay) || 0,
          urgency_shift:
            Number(urgencyShift) || 0,
          waiting_time_shift_days:
            Number(waitingShift) || 0,
          preservation_limit_override_hours:
            preservationOverride === ""
              ? null
              : Number(preservationOverride),
        });

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to run scenario simulation."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = () => {
    setTravelDelay(0);
    setUrgencyShift(0);
    setWaitingShift(0);
    setPreservationOverride("");
    setResult(null);
    setError("");
  };

  const scorePercent = (score) =>
    `${(Number(score) * 100).toFixed(1)}%`;

  const deltaPercent = (delta) => {
    const value = Number(delta) * 100;

    return `${value >= 0 ? "+" : ""}${value.toFixed(
      2
    )}%`;
  };

  const getDeltaColor = (delta) => {
    if (Number(delta) > 0) return "#059669";
    if (Number(delta) < 0) return "#dc2626";
    return "#64748b";
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            What-If Scenario Analysis
          </h1>

          <p className="page-subtitle">
            Simulate changes in medical and logistics
            conditions and compare the resulting analysis.
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

      {/* INTRO */}
      <div
        className="card"
        style={{
          marginBottom: "20px",
          borderLeft:
            "4px solid var(--primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <SlidersHorizontal
            size={24}
            style={{
              color: "var(--primary)",
              marginTop: "2px",
            }}
          />

          <div>
            <h3
              style={{
                fontSize: "1.05rem",
              }}
            >
              Scenario-Based Analysis
            </h3>

            <p
              style={{
                marginTop: "7px",
                lineHeight: "1.55",
                color:
                  "var(--text-secondary)",
              }}
            >
              Change selected parameters to observe how
              the research-oriented suitability score,
              simulated ranking, transit time and
              preservation feasibility change.
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            borderLeft:
              "4px solid #dc2626",
            background: "#fff7f7",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "9px",
              alignItems: "center",
              color: "#b91c1c",
            }}
          >
            <AlertTriangle size={20} />

            <strong>
              Scenario Error
            </strong>
          </div>

          <p style={{ marginTop: "8px" }}>
            {error}
          </p>
        </div>
      )}

      {/* CONFIGURATION */}
      <div
        className="card"
        style={{ marginBottom: "20px" }}
      >
        <h2
          style={{
            fontSize: "1.15rem",
            marginBottom: "18px",
          }}
        >
          Scenario Configuration
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "18px",
          }}
        >
          {/* ORGAN */}
          <div>
            <label className="form-label">
              Organ
            </label>

            <select
              className="form-control"
              value={organId}
              onChange={(e) =>
                setOrganId(e.target.value)
              }
              disabled={loadingData}
            >
              <option value="">
                Select organ
              </option>

              {organs.map((organ) => (
                <option
                  key={organ.organ_id}
                  value={organ.organ_id}
                >
                  {organ.organ_id} —{" "}
                  {organ.organ_type} —{" "}
                  {organ.blood_group}
                </option>
              ))}
            </select>
          </div>

          {/* RECIPIENT */}
          <div>
            <label className="form-label">
              Recipient
            </label>

            <select
              className="form-control"
              value={recipientId}
              onChange={(e) =>
                setRecipientId(e.target.value)
              }
              disabled={loadingData}
            >
              <option value="">
                Select recipient
              </option>

              {recipients.map(
                (recipient) => (
                  <option
                    key={
                      recipient.recipient_id
                    }
                    value={
                      recipient.recipient_id
                    }
                  >
                    {recipient.recipient_id} —{" "}
                    {recipient.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* PARAMETERS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginTop: "22px",
          }}
        >
          {/* TRAVEL */}
          <div>
            <label className="form-label">
              Travel Delay (hours)
            </label>

            <input
              className="form-control"
              type="number"
              step="0.5"
              min="0"
              value={travelDelay}
              onChange={(e) =>
                setTravelDelay(
                  e.target.value
                )
              }
            />

            <small
              style={{
                color:
                  "var(--text-secondary)",
              }}
            >
              Additional transit time
            </small>
          </div>

          {/* URGENCY */}
          <div>
            <label className="form-label">
              Urgency Shift
            </label>

            <input
              className="form-control"
              type="number"
              step="1"
              min="-4"
              max="4"
              value={urgencyShift}
              onChange={(e) =>
                setUrgencyShift(
                  e.target.value
                )
              }
            />

            <small
              style={{
                color:
                  "var(--text-secondary)",
              }}
            >
              Range: -4 to +4
            </small>
          </div>

          {/* WAITING */}
          <div>
            <label className="form-label">
              Waiting-Time Shift (days)
            </label>

            <input
              className="form-control"
              type="number"
              step="1"
              value={waitingShift}
              onChange={(e) =>
                setWaitingShift(
                  e.target.value
                )
              }
            />

            <small
              style={{
                color:
                  "var(--text-secondary)",
              }}
            >
              Increase or decrease
            </small>
          </div>

          {/* PRESERVATION */}
          <div>
            <label className="form-label">
              Preservation Limit Override
            </label>

            <input
              className="form-control"
              type="number"
              step="0.5"
              min="0"
              placeholder="Default"
              value={preservationOverride}
              onChange={(e) =>
                setPreservationOverride(
                  e.target.value
                )
              }
            />

            <small
              style={{
                color:
                  "var(--text-secondary)",
              }}
            >
              Leave empty for default
            </small>
          </div>
        </div>

        {/* ACTIONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "22px",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={resetScenario}
            disabled={loading}
          >
            Reset
          </button>

          <button
            className="btn btn-primary"
            onClick={runScenario}
            disabled={
              loading ||
              loadingData ||
              !organId ||
              !recipientId
            }
          >
            <Play size={17} />

            {loading
              ? "Running..."
              : "Run Scenario"}
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div
          className="card"
          style={{
            padding: "45px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <SlidersHorizontal
            size={42}
            style={{
              color:
                "var(--primary)",
              marginBottom: "12px",
            }}
          />

          <h3>
            Simulating Scenario...
          </h3>

          <p
            style={{
              marginTop: "7px",
              color:
                "var(--text-secondary)",
            }}
          >
            Comparing the baseline with the
            modified parameters.
          </p>
        </div>
      )}

      {/* RESULTS */}
      {result && !loading && (
        <>
          {/* RESULT HEADER */}
          <div
            className="card"
            style={{
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize:
                      "1.2rem",
                  }}
                >
                  Scenario Comparison
                </h2>

                <p
                  style={{
                    marginTop: "6px",
                    color:
                      "var(--text-secondary)",
                  }}
                >
                  Candidate:{" "}
                  <strong>
                    {result.candidate_id}
                  </strong>
                </p>
              </div>

              <div
                style={{
                  padding:
                    "8px 13px",
                  borderRadius:
                    "999px",
                  background:
                    result.feasibility_status ===
                    "FEASIBLE"
                      ? "#dcfce7"
                      : "#fee2e2",
                  color:
                    result.feasibility_status ===
                    "FEASIBLE"
                      ? "#166534"
                      : "#b91c1c",
                  fontWeight:
                    "700",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "7px",
                }}
              >
                {result.feasibility_status ===
                "FEASIBLE" ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertTriangle size={17} />
                )}

                {result.feasibility_status}
              </div>
            </div>
          </div>

          {/* SCORE COMPARISON */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr",
              gap: "18px",
              marginBottom: "20px",
            }}
          >
            <div className="card">
              <div
                style={{
                  color:
                    "var(--text-secondary)",
                  fontSize:
                    "0.85rem",
                }}
              >
                Baseline AI Score
              </div>

              <div
                style={{
                  fontSize:
                    "2rem",
                  fontWeight:
                    "700",
                  marginTop:
                    "7px",
                }}
              >
                {scorePercent(
                  result.baseline_score
                )}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color:
                    "var(--text-secondary)",
                  fontSize:
                    "0.85rem",
                }}
              >
                Scenario AI Score
              </div>

              <div
                style={{
                  fontSize:
                    "2rem",
                  fontWeight:
                    "700",
                  marginTop:
                    "7px",
                }}
              >
                {result.scenario_score == null
                  ? "Not scored"
                  : scorePercent(result.scenario_score)}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color:
                    "var(--text-secondary)",
                  fontSize:
                    "0.85rem",
                }}
              >
                Score Change
              </div>

              <div
                style={{
                  fontSize:
                    "2rem",
                  fontWeight:
                    "700",
                  marginTop:
                    "7px",
                  color:
                    getDeltaColor(
                      result.score_delta
                    ),
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "6px",
                }}
              >
                {Number(
                  result.score_delta
                ) > 0 ? (
                  <TrendingUp size={25} />
                ) : Number(
                    result.score_delta
                  ) < 0 ? (
                  <TrendingDown
                    size={25}
                  />
                ) : null}

                {result.score_delta == null
                  ? "—"
                  : deltaPercent(result.score_delta)}
              </div>
            </div>
          </div>

          {/* RANK + TRANSIT */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* RANK */}
            <div className="card">
              <h3
                style={{
                  fontSize:
                    "1rem",
                  marginBottom:
                    "18px",
                }}
              >
                Simulated Ranking
              </h3>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-around",
                  textAlign:
                    "center",
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        "var(--text-secondary)",
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Baseline
                  </div>

                  <div
                    style={{
                      fontSize:
                        "2rem",
                      fontWeight:
                        "700",
                    }}
                  >
                    {result.baseline_rank == null ? "Not calculated" : `#${result.baseline_rank}`}
                  </div>
                </div>

                <div
                  style={{
                    fontSize:
                      "1.4rem",
                    color:
                      "var(--primary)",
                  }}
                >
                  →
                </div>

                <div>
                  <div
                    style={{
                      color:
                        "var(--text-secondary)",
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Scenario
                  </div>

                  <div
                    style={{
                      fontSize:
                        "2rem",
                      fontWeight:
                        "700",
                    }}
                  >
                    {result.scenario_rank == null ? "Not calculated" : `#${result.scenario_rank}`}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "15px",
                  textAlign:
                    "center",
                  padding:
                    "8px",
                  borderRadius:
                    "7px",
                  background:
                    "#f8fafc",
                }}
              >
                Rank change:{" "}
                <strong>
                  {result.rank_delta == null
                    ? "Not calculated; full-pool reranking is not implemented."
                    : result.rank_delta > 0
                      ? `+${result.rank_delta}`
                      : result.rank_delta}
                </strong>
              </div>
            </div>

            {/* TRANSIT */}
            <div className="card">
              <h3
                style={{
                  fontSize:
                    "1rem",
                  marginBottom:
                    "18px",
                }}
              >
                Transit-Time Comparison
              </h3>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-around",
                  textAlign:
                    "center",
                }}
              >
                <div>
                  <Clock
                    size={21}
                    style={{
                      color:
                        "var(--primary)",
                    }}
                  />

                  <div
                    style={{
                      color:
                        "var(--text-secondary)",
                      fontSize:
                        "0.8rem",
                      marginTop:
                        "5px",
                    }}
                  >
                    Baseline
                  </div>

                  <div
                    style={{
                      fontSize:
                        "1.7rem",
                      fontWeight:
                        "700",
                    }}
                  >
                    {
                      result.baseline_transit_hours
                    }{" "}
                    hrs
                  </div>
                </div>

                <div
                  style={{
                    fontSize:
                      "1.4rem",
                    color:
                      "var(--primary)",
                  }}
                >
                  →
                </div>

                <div>
                  <Clock
                    size={21}
                    style={{
                      color:
                        "#d97706",
                    }}
                  />

                  <div
                    style={{
                      color:
                        "var(--text-secondary)",
                      fontSize:
                        "0.8rem",
                      marginTop:
                        "5px",
                    }}
                  >
                    Scenario
                  </div>

                  <div
                    style={{
                      fontSize:
                        "1.7rem",
                      fontWeight:
                        "700",
                    }}
                  >
                    {
                      result.scenario_transit_hours
                    }{" "}
                    hrs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EXPLANATION */}
          <div
            className="card"
            style={{
              marginBottom:
                "20px",
              borderLeft:
                "4px solid var(--primary)",
            }}
          >
            <h3
              style={{
                fontSize:
                  "1rem",
                marginBottom:
                  "10px",
              }}
            >
              Scenario Explanation
            </h3>

            <p
              style={{
                lineHeight:
                  "1.6",
                color:
                  "var(--text-secondary)",
              }}
            >
              {result.explanation_delta}
            </p>
          </div>

          {/* DISCLAIMER */}
          <div
            className="card"
            style={{
              borderLeft:
                "4px solid #f59e0b",
              background:
                "#fffbeb",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                gap: "10px",
                alignItems:
                  "flex-start",
              }}
            >
              <AlertTriangle
                size={20}
                color="#d97706"
              />

              <div>
                <strong
                  style={{
                    color:
                      "#92400e",
                  }}
                >
                  Research Simulation Notice
                </strong>

                <p
                  style={{
                    marginTop:
                      "6px",
                    color:
                      "#92400e",
                    lineHeight:
                      "1.5",
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
