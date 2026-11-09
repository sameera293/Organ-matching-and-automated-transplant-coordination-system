import React, { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  Brain,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import { api } from "../services/api";

export default function ModelEvaluation() {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getModelEvaluations();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load model evaluation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluation();
  }, []);

  const handleRetraining = async () => {
    try {
      setRetraining(true);
      setError("");
      setMessage("");

      const result = await api.triggerRetraining();

      setMessage(
        result.message || "Models successfully retrained."
      );

      await loadEvaluation();
    } catch (err) {
      console.error(err);
      setError(err.message || "Model retraining failed.");
    } finally {
      setRetraining(false);
    }
  };

  const formatPercent = (value) =>
    `${(Number(value) * 100).toFixed(2)}%`;

  const getBestModel = () => {
    if (!evaluation?.metrics) return null;

    return Object.entries(evaluation.metrics).reduce(
      (best, current) => {
        if (!best || current[1].f1_score > best[1].f1_score) {
          return current;
        }
        return best;
      },
      null
    );
  };

  const bestModel = getBestModel();

  if (loading) {
    return (
      <div className="page-content">
        <div className="card">
          <h2>Loading Model Evaluation...</h2>
          <p>Fetching evaluation results from the backend.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="card">
          <h2>Model Evaluation</h2>

          <div
            style={{
              padding: "18px",
              marginTop: "20px",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#be123c",
            }}
          >
            <strong>Unable to load evaluation results.</strong>
            <p>{error}</p>
          </div>

          <button
            className="btn btn-primary"
            onClick={loadEvaluation}
            style={{ marginTop: "18px" }}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          <h1>Model Evaluation</h1>
          <p>
            Comparative evaluation of machine-learning models used
            for AI-assisted candidate suitability analysis.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-secondary"
            onClick={loadEvaluation}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="btn btn-primary"
            onClick={handleRetraining}
            disabled={retraining}
          >
            <Play size={16} />
            {retraining ? "Retraining..." : "Retrain Models"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#ecfdf5",
            color: "#047857",
            border: "1px solid #a7f3d0",
          }}
        >
          <CheckCircle2
            size={17}
            style={{ verticalAlign: "middle", marginRight: "8px" }}
          />
          {message}
        </div>
      )}

      {/* Overview Cards */}
      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div className="card">
          <div style={{ display: "flex", gap: "12px" }}>
            <Database size={24} />
            <div>
              <p>Training Samples</p>
              <h2>
                {evaluation?.sample_size_train?.toLocaleString() ||
                  "—"}
              </h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: "12px" }}>
            <BarChart3 size={24} />
            <div>
              <p>Test Samples</p>
              <h2>
                {evaluation?.sample_size_test?.toLocaleString() ||
                  "—"}
              </h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: "12px" }}>
            <Brain size={24} />
            <div>
              <p>Models Evaluated</p>
              <h2>
                {evaluation?.metrics
                  ? Object.keys(evaluation.metrics).length
                  : 0}
              </h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: "12px" }}>
            <CheckCircle2 size={24} />
            <div>
              <p>Best F1 Model</p>
              <h2 style={{ fontSize: "22px" }}>
                {bestModel ? bestModel[0] : "—"}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Model Comparison */}
      <div className="card" style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <BarChart3 size={22} />
          <div>
            <h2>Model Performance Comparison</h2>
            <p>
              Evaluation on the synthetic research test dataset.
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC-AUC</th>
                <th>Test Samples</th>
              </tr>
            </thead>

            <tbody>
              {evaluation?.metrics &&
                Object.entries(evaluation.metrics).map(
                  ([modelName, metrics]) => (
                    <tr key={modelName}>
                      <td>
                        <strong>{modelName}</strong>
                      </td>

                      <td>
                        {formatPercent(metrics.accuracy)}
                      </td>

                      <td>
                        {formatPercent(metrics.precision)}
                      </td>

                      <td>
                        {formatPercent(metrics.recall)}
                      </td>

                      <td>
                        <strong>
                          {formatPercent(metrics.f1_score)}
                        </strong>
                      </td>

                      <td>
                        {formatPercent(metrics.roc_auc)}
                      </td>

                      <td>{metrics.test_samples}</td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Model */}
      {bestModel && (
        <div
          className="card"
          style={{
            marginBottom: "22px",
            borderLeft: "4px solid #0ea5e9",
          }}
        >
          <h2>Best Performing Model</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "18px",
              marginTop: "18px",
            }}
          >
            <div>
              <p>Model</p>
              <h3>{bestModel[0]}</h3>
            </div>

            <div>
              <p>Accuracy</p>
              <h3>{formatPercent(bestModel[1].accuracy)}</h3>
            </div>

            <div>
              <p>F1 Score</p>
              <h3>{formatPercent(bestModel[1].f1_score)}</h3>
            </div>

            <div>
              <p>ROC-AUC</p>
              <h3>{formatPercent(bestModel[1].roc_auc)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Disclaimer */}
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
          <AlertTriangle size={22} />

          <div>
            <h2>Evaluation Disclaimer</h2>

            <p>
              {evaluation?.dataset_disclaimer ||
                "Evaluation results are based on a synthetic research dataset and are not clinical validation."}
            </p>

            <p style={{ marginTop: "10px" }}>
              These metrics evaluate model performance for the
              prototype's AI-assisted suitability analysis. They
              should not be interpreted as evidence of clinical
              effectiveness or as a replacement for authorized
              medical and allocation decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}