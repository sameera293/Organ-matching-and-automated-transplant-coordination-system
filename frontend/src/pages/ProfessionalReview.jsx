import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock,
  Flag,
  RefreshCw,
  Save,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { api } from "../services/api";

export default function ProfessionalReview() {
  const [organs, setOrgans] = useState([]);
  const [selectedOrgan, setSelectedOrgan] = useState("");

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrgans, setLoadingOrgans] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reviewStatus, setReviewStatus] =
    useState("Reviewed");
  const [reviewNotes, setReviewNotes] = useState("");
  const reviewRef = useRef(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrgans();
  }, []);

  useEffect(() => {
    if (selectedOrgan) {
      loadMatches(selectedOrgan);
    } else {
      setMatches([]);
    }
  }, [selectedOrgan]);

  const loadOrgans = async () => {
    try {
      setLoadingOrgans(true);
      setError("");

      const data = await api.getOrgans();

      const list = Array.isArray(data)
        ? data
        : data.items || data.data || [];

      setOrgans(list);

      if (list.length > 0) {
        setSelectedOrgan(list[0].organ_id);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to load registered organs."
      );
    } finally {
      setLoadingOrgans(false);
    }
  };

  const loadMatches = async (organId) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data =
        await api.getMatchHistory(organId);

      const list = Array.isArray(data)
        ? data
        : data.items || data.data || [];

      setMatches(list);

      if (selectedMatch) {
        const updated = list.find(
          (item) =>
            item.match_id ===
            selectedMatch.match_id
        );

        if (updated) {
          setSelectedMatch(updated);
          setReviewStatus(
            updated.review_status ||
              "Pending Review"
          );
          setReviewNotes(
            updated.review_notes || ""
          );
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to load match history."
      );
    } finally {
      setLoading(false);
    }
  };

  const openReview = (match) => {
    setSelectedMatch(match);

    setReviewStatus(
        match.review_status ||
        "Pending Review"
    );

    setReviewNotes(
        match.review_notes || ""
    );

    setMessage("");
    setError("");

    // Scroll to the review section
    setTimeout(() => {
        reviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        });
    }, 100);
    };

  const saveReview = async () => {
    if (!selectedMatch) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await api.updateMatchReview(
        selectedMatch.match_id,
        {
          review_status: reviewStatus,
          review_notes:
            reviewNotes.trim() || null,
        }
      );

      setMessage(
        `Review for ${selectedMatch.match_id} updated successfully.`
      );

      await loadMatches(selectedOrgan);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to save professional review."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Reviewed":
        return "badge-success";

      case "Forwarded for Review":
        return "badge-info";

      case "Flagged":
        return "badge-danger";

      default:
        return "badge-warning";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Reviewed":
        return <CheckCircle2 size={15} />;

      case "Flagged":
        return <Flag size={15} />;

      case "Forwarded for Review":
        return <UserCheck size={15} />;

      default:
        return <Clock size={15} />;
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Professional Review
          </h1>

          <p className="page-subtitle">
            Review AI-assisted match results before
            any authorized professional decision.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() =>
            selectedOrgan &&
            loadMatches(selectedOrgan)
          }
          disabled={
            loading ||
            !selectedOrgan
          }
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* SAFETY / PURPOSE */}
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
          <ShieldCheck
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
              Human-in-the-Loop Review
            </h3>

            <p
              style={{
                marginTop: "7px",
                lineHeight: "1.55",
                color:
                  "var(--text-secondary)",
              }}
            >
              AI-generated match results are presented
              for research and decision-support purposes.
              An authorized healthcare professional must
              review the information before any final
              medical or allocation decision.
            </p>
          </div>
        </div>
      </div>

      {/* ORGAN SELECTOR */}
      <div
        className="card"
        style={{
          marginBottom: "20px",
        }}
      >
        <label className="form-label">
          Select Organ
        </label>

        <select
          className="form-control"
          value={selectedOrgan}
          onChange={(e) => {
            setSelectedOrgan(
              e.target.value
            );
            setSelectedMatch(null);
            setMessage("");
            setError("");
          }}
          disabled={loadingOrgans}
        >
          <option value="">
            Select an organ
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

      {/* MESSAGES */}
      {message && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            borderLeft:
              "4px solid #059669",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          <strong>{message}</strong>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            borderLeft:
              "4px solid #dc2626",
            background: "#fff7f7",
            color: "#b91c1c",
          }}
        >
          <strong>{error}</strong>
        </div>
      )}

      {/* MATCH HISTORY */}
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
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.15rem",
              }}
            >
              Match Review Queue
            </h2>

            <p
              style={{
                marginTop: "5px",
                color:
                  "var(--text-secondary)",
              }}
            >
              {matches.length} match record
              {matches.length !== 1
                ? "s"
                : ""}{" "}
              available for review
            </p>
          </div>

          <div className="badge badge-info">
            {matches.filter(
              (m) =>
                !m.review_status ||
                m.review_status ===
                  "Pending Review"
            ).length}{" "}
            Pending
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color:
                "var(--text-secondary)",
            }}
          >
            <RefreshCw
              size={30}
              style={{
                marginBottom: "10px",
              }}
            />

            <p>
              Loading review records...
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color:
                "var(--text-secondary)",
              background:
                "#f8fafc",
              borderRadius: "8px",
            }}
          >
            <ShieldCheck
              size={35}
              style={{
                marginBottom: "10px",
              }}
            />

            <h3>
              No Match Records
            </h3>

            <p
              style={{
                marginTop: "6px",
              }}
            >
              Run the Matching Engine for this
              organ to create records for
              professional review.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Recipient</th>
                  <th>AI Score</th>
                  <th>Rank</th>
                  <th>Compatibility</th>
                  <th>Review Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {matches.map((match) => {
                  const status =
                    match.review_status ||
                    "Pending Review";

                  return (
                    <tr
                      key={
                        match.match_id
                      }
                    >
                      <td>
                        <strong>
                          {match.match_id}
                        </strong>
                      </td>

                      <td>
                        <strong>{match.recipient_name || match.recipient_id}</strong>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          {match.recipient_id}
                        </div>
                      </td>

                      <td>
                        {match.ai_score !==
                        null &&
                        match.ai_score !==
                          undefined
                          ? `${(
                              Number(
                                match.ai_score
                              ) * 100
                            ).toFixed(1)}%`
                          : "—"}
                      </td>

                      <td>
                        {match.rank
                          ? `#${match.rank}`
                          : "—"}
                      </td>

                      <td>
                        <span className="badge badge-success">
                          {
                            match.compatibility_status
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${getStatusClass(
                            status
                          )}`}
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: "5px",
                          }}
                        >
                          {getStatusIcon(
                            status
                          )}

                          {status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            openReview(
                              match
                            )
                          }
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REVIEW PANEL */}
      {selectedMatch && (
        <div
            ref={reviewRef}
            className="card"
          style={{
            marginBottom: "20px",
            borderTop:
              "3px solid var(--primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.2rem",
                }}
              >
                Professional Review
              </h2>

              <p
                style={{
                  marginTop: "6px",
                  color:
                    "var(--text-secondary)",
                }}
              >
                Match ID:{" "}
                <strong>
                  {selectedMatch.match_id}
                </strong>
              </p>
            </div>

            <span
              className={`badge ${getStatusClass(
                selectedMatch.review_status ||
                  "Pending Review"
              )}`}
            >
              {selectedMatch.review_status ||
                "Pending Review"}
            </span>
          </div>

          {/* MATCH DETAILS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "15px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <small>
                Recipient
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {selectedMatch.recipient_name || selectedMatch.recipient_id}
              </strong>
              <small style={{ display: "block", marginTop: "4px" }}>
                {selectedMatch.recipient_id} · {selectedMatch.recipient_age ?? "—"} yrs · {selectedMatch.recipient_blood_group || "—"}
              </small>
              <small style={{ display: "block", marginTop: "4px" }}>
                {selectedMatch.recipient_hospital || "Hospital unavailable"}
              </small>
            </div>

            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <small>
                AI Suitability
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  color:
                    "var(--primary)",
                }}
              >
                {selectedMatch.ai_score !==
                null &&
                selectedMatch.ai_score !==
                  undefined
                  ? `${(
                      Number(
                        selectedMatch.ai_score
                      ) * 100
                    ).toFixed(1)}%`
                  : "—"}
              </strong>
            </div>

            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <small>
                Rank
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {selectedMatch.rank
                  ? `#${selectedMatch.rank}`
                  : "—"}
              </strong>
            </div>

            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <small>
                Compatibility
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {
                  selectedMatch.compatibility_status
                }
              </strong>
            </div>
          </div>

          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>Match explanation</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Suitability score recorded from {selectedMatch.explanation?.model_name || "the selected model"}; rank #{selectedMatch.rank ?? "—"} among candidates passing deterministic hard filters.
            </p>
            <ul style={{ margin: "10px 0 0 20px", color: "var(--text-secondary)" }}>
              {(selectedMatch.explanation?.reasons || []).map((reason, index) => (
                <li key={index} style={{ marginTop: "4px" }}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* REVIEW STATUS */}
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label className="form-label">
              Review Decision
            </label>

            <select
              className="form-control"
              value={reviewStatus}
              onChange={(e) =>
                setReviewStatus(
                  e.target.value
                )
              }
            >
              <option value="Pending Review">
                Pending Review
              </option>

              <option value="Reviewed">
                Reviewed
              </option>

              <option value="Forwarded for Review">
                Forwarded for Review
              </option>

              <option value="Flagged">
                Flagged
              </option>
            </select>
          </div>

          {/* NOTES */}
          <div>
            <label className="form-label">
              Professional Review Notes
            </label>

            <textarea
              className="form-control"
              rows="5"
              placeholder="Enter review notes..."
              value={reviewNotes}
              onChange={(e) =>
                setReviewNotes(
                  e.target.value
                )
              }
            />
          </div>

          {/* SAVE */}
          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() =>
                setSelectedMatch(null)
              }
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={saveReview}
              disabled={loading}
            >
              <Save size={17} />

              {loading
                ? "Saving..."
                : "Save Review"}
            </button>
          </div>
        </div>
      )}

      {/* FINAL NOTICE */}
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
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <ShieldCheck
            size={20}
            color="#d97706"
          />

          <div>
            <strong
              style={{
                color: "#92400e",
              }}
            >
              Decision-Support Notice
            </strong>

            <p
              style={{
                marginTop: "6px",
                color: "#92400e",
                lineHeight: "1.5",
              }}
            >
              This module records professional review
              of research-oriented AI outputs. It does
              not make or authorize a medical allocation
              decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
