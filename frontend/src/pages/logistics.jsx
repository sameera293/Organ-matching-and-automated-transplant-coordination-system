import React, { useEffect, useState } from "react";
import {
  Navigation,
  RefreshCw,
  Play,
  Route,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Hospital,
} from "lucide-react";

import { api } from "../services/api";

export default function Logistics() {
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [algorithm, setAlgorithm] = useState("Dijkstra");
  const [organType, setOrganType] = useState("Kidney");
  const [preservationLimit, setPreservationLimit] = useState(24);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingNetwork, setLoadingNetwork] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      setLoadingNetwork(true);
      setError("");

      const data = await api.getTransitNetwork();

      setNodes(data?.nodes || []);

      if (data?.nodes?.length >= 2) {
        setSource(data.nodes[0].id);
        setDestination(data.nodes[1].id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load transit network.");
    } finally {
      setLoadingNetwork(false);
    }
  };

  const calculateRoute = async () => {
    if (!source || !destination) {
      setError("Please select both source and destination.");
      return;
    }

    if (source === destination) {
      setError("Source and destination must be different.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const sourceNode = nodes.find((node) => node.id === source);
      const destinationNode = nodes.find(
        (node) => node.id === destination
      );

      const data = await api.calculateRoute({
        source_location: sourceNode?.name || source,
        destination_location:
          destinationNode?.name || destination,
        algorithm,
        organ_type: organType,
        preservation_limit_hours: Number(preservationLimit),
      });

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to calculate route.");
    } finally {
      setLoading(false);
    }
  };

  const getNodeName = (id) => {
    const node = nodes.find((item) => item.id === id);
    return node ? node.name : id;
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Logistics & Routes</h1>

          <p className="page-subtitle">
            Analyze simulated medical transportation routes using
            Dijkstra or A* shortest-path algorithms.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadNetwork}
          disabled={loadingNetwork}
        >
          <RefreshCw size={16} />
          Refresh Network
        </button>
      </div>

      {/* ROUTE CONTROLS */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 170px 150px auto",
            gap: "14px",
            alignItems: "end",
          }}
        >
          {/* SOURCE */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Source / Donor Center</label>

            <select
              className="form-control"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setResult(null);
              }}
              disabled={loadingNetwork || loading}
            >
              <option value="">Select source</option>

              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} — {node.city}
                </option>
              ))}
            </select>
          </div>

          {/* DESTINATION */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Destination / Transplant Center
            </label>

            <select
              className="form-control"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setResult(null);
              }}
              disabled={loadingNetwork || loading}
            >
              <option value="">Select destination</option>

              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} — {node.city}
                </option>
              ))}
            </select>
          </div>

          {/* ALGORITHM */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Algorithm</label>

            <select
              className="form-control"
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value);
                setResult(null);
              }}
              disabled={loading}
            >
              <option value="Dijkstra">Dijkstra</option>
              <option value="A*">A*</option>
            </select>
          </div>

          {/* ORGAN */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Organ</label>

            <select
              className="form-control"
              value={organType}
              onChange={(e) => {
                setOrganType(e.target.value);
                setResult(null);
              }}
              disabled={loading}
            >
              <option value="Kidney">Kidney</option>
              <option value="Liver">Liver</option>
              <option value="Heart">Heart</option>
              <option value="Lung">Lung</option>
              <option value="Pancreas">Pancreas</option>
            </select>
          </div>

          {/* RUN */}
          <button
            className="btn btn-primary"
            onClick={calculateRoute}
            disabled={loading || loadingNetwork}
            style={{ height: "42px" }}
          >
            {loading ? (
              "Calculating..."
            ) : (
              <>
                <Play size={16} />
                Calculate
              </>
            )}
          </button>
        </div>

        {/* PRESERVATION LIMIT */}
        <div
          style={{
            marginTop: "18px",
            maxWidth: "300px",
          }}
        >
          <label className="form-label">
            Preservation Limit (hours)
          </label>

          <input
            type="number"
            min="1"
            step="0.5"
            className="form-control"
            value={preservationLimit}
            onChange={(e) => {
              setPreservationLimit(e.target.value);
              setResult(null);
            }}
            disabled={loading}
          />
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
              alignItems: "center",
              gap: "9px",
              color: "#b91c1c",
            }}
          >
            <AlertTriangle size={20} />
            <strong>Route Calculation Error</strong>
          </div>

          <p style={{ marginTop: "8px" }}>{error}</p>
        </div>
      )}

      {/* NETWORK SUMMARY */}
      {!result && !loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
            marginBottom: "20px",
          }}
        >
          <div className="card">
            <Hospital
              size={24}
              style={{ color: "var(--primary)" }}
            />

            <div
              style={{
                marginTop: "10px",
                color: "var(--text-secondary)",
              }}
            >
              Transit Nodes
            </div>

            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                marginTop: "3px",
              }}
            >
              {nodes.length}
            </div>
          </div>

          <div className="card">
            <Route
              size={24}
              style={{ color: "var(--primary)" }}
            />

            <div
              style={{
                marginTop: "10px",
                color: "var(--text-secondary)",
              }}
            >
              Routing Algorithms
            </div>

            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                marginTop: "3px",
              }}
            >
              2
            </div>
          </div>

          <div className="card">
            <Plane
              size={24}
              style={{ color: "var(--primary)" }}
            />

            <div
              style={{
                marginTop: "10px",
                color: "var(--text-secondary)",
              }}
            >
              Logistics Analysis
            </div>

            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: "600",
                marginTop: "8px",
              }}
            >
              Research Simulation
            </div>
          </div>
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
          <Navigation
            size={42}
            style={{
              color: "var(--primary)",
              marginBottom: "15px",
            }}
          />

          <h3>Calculating Shortest Route...</h3>

          <p
            style={{
              marginTop: "8px",
              color: "var(--text-secondary)",
            }}
          >
            Running {algorithm} across the medical transit network.
          </p>
        </div>
      )}

      {/* RESULT */}
      {result && !loading && (
        <>
          {/* ROUTE SUMMARY */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem" }}>
                  Route Analysis
                </h2>

                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <MapPin size={16} />

                  <strong style={{ color: "var(--text-primary)" }}>
                    {getNodeName(source)}
                  </strong>

                  <span>→</span>

                  <strong style={{ color: "var(--text-primary)" }}>
                    {getNodeName(destination)}
                  </strong>
                </div>

                <p
                  style={{
                    marginTop: "8px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Algorithm:{" "}
                  <strong>{result.algorithm_used}</strong>
                </p>
              </div>

              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background:
                    result.feasibility_status === "FEASIBLE"
                      ? "#ecfdf5"
                      : "#fff7ed",
                  color:
                    result.feasibility_status === "FEASIBLE"
                      ? "#047857"
                      : "#c2410c",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                {result.feasibility_status === "FEASIBLE" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}

                {result.feasibility_status}
              </div>
            </div>
          </div>

          {/* METRICS */}
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
                Total Distance
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "6px",
                }}
              >
                {Number(result.total_distance_km).toFixed(1)}
                <span
                  style={{
                    fontSize: "0.9rem",
                    marginLeft: "4px",
                    fontWeight: "500",
                  }}
                >
                  km
                </span>
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Transit Time
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

                {Number(result.total_time_hours).toFixed(2)}
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  hrs
                </span>
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Nodes Explored
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "6px",
                }}
              >
                {result.nodes_explored_count}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Preservation Margin
              </div>

              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginTop: "6px",
                  color:
                    result.preservation_margin_hours >= 0
                      ? "#059669"
                      : "#dc2626",
                }}
              >
                {Number(
                  result.preservation_margin_hours
                ).toFixed(2)}
                <span
                  style={{
                    fontSize: "0.9rem",
                    marginLeft: "4px",
                    fontWeight: "500",
                  }}
                >
                  hrs
                </span>
              </div>
            </div>
          </div>

          {/* PATH */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "18px",
              }}
            >
              Shortest Path
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {result.path_nodes?.map((node, index) => (
                <React.Fragment key={node.id || index}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #dbe3ec",
                      background: "#f8fafc",
                    }}
                  >
                    <strong>{node.name}</strong>

                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        marginTop: "3px",
                      }}
                    >
                      {node.city}
                    </div>
                  </div>

                  {index < result.path_nodes.length - 1 && (
                    <span
                      style={{
                        color: "var(--primary)",
                        fontWeight: "700",
                        fontSize: "1.2rem",
                      }}
                    >
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* SEGMENTS */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "16px",
              }}
            >
              Route Segments
            </h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Distance</th>
                    <th>Time</th>
                    <th>Transit Type</th>
                  </tr>
                </thead>

                <tbody>
                  {result.segments?.map((segment, index) => (
                    <tr key={index}>
                      <td>{segment.from_name}</td>
                      <td>{segment.to_name}</td>

                      <td>
                        {Number(segment.distance_km).toFixed(1)} km
                      </td>

                      <td>
                        {Number(segment.time_hours).toFixed(2)} hrs
                      </td>

                      <td>
                        {segment.route_type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRESERVATION */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                marginBottom: "16px",
              }}
            >
              Organ Preservation Analysis
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  Preservation Limit
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "1.25rem",
                  }}
                >
                  {result.preservation_limit_hours} hrs
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  Estimated Transit
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "1.25rem",
                  }}
                >
                  {Number(result.total_time_hours).toFixed(2)} hrs
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  Remaining Margin
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "1.25rem",
                    color:
                      result.preservation_margin_hours >= 0
                        ? "#059669"
                        : "#dc2626",
                  }}
                >
                  {Number(
                    result.preservation_margin_hours
                  ).toFixed(2)}{" "}
                  hrs
                </strong>
              </div>
            </div>
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
                  Logistics Research Notice
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