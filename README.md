# AI-Driven Intelligent Organ Matching and Automated Transplant Coordination System

## An Explainable AI-Based Decision-Support Framework

This project is an academic research prototype for exploring organ-recipient compatibility filtering, model-assisted ranking, explainability, graph-based logistics, assignment optimization, scenario analysis, evaluation, fairness metrics, notifications, and professional review. It is decision support only. It does not make autonomous clinical allocation decisions or replace authorized healthcare professionals and applicable policies.

## Problem statement

Organ matching involves hard compatibility constraints as well as time-sensitive logistics and multiple candidate factors. This prototype demonstrates a transparent workflow that first applies deterministic filters and then scores only candidates that pass those filters. All bundled records and benchmark results are synthetic; they are not clinical validation.

## Architecture and technology

- **Frontend:** React 18, Vite, Recharts, and Lucide icons.
- **Backend:** FastAPI, Pydantic, SQLAlchemy 2.
- **Database:** SQLite by default (`organ_matching.db` in the project root). SQLAlchemy can use another configured URL if a matching driver is installed, but SQLite is the supported demo configuration.
- **Algorithms:** ABO/organ/status/preservation rules, Dijkstra, A*, and SciPy's linear-sum assignment (Hungarian/Kuhn–Munkres).
- **ML/XAI:** scikit-learn Logistic Regression and Random Forest, XGBoost, and SHAP TreeExplainer.
- **Data:** deterministic synthetic benchmark generator (`data/synthetic/generate_synthetic_data.py`) and a curated database demo seeder (`backend/seed_database.py`).

## Project structure

```text
backend/app/api/          FastAPI route handlers
backend/app/algorithms/   Compatibility, transit graph, shortest paths, assignment
backend/app/database/     SQLAlchemy models and session setup
backend/app/schemas/      API request and response models
backend/seed_database.py  Curated SQLite demonstration data
data/synthetic/           Synthetic ML dataset generator
data/processed/            Generated benchmark CSV
ml/training/               Model training, inference, evaluation
ml/explainability/         SHAP explanations
ml/saved_models/           Serialized models and evaluation metadata
frontend/src/              React application, pages, components, API client
tests/                      Backend, algorithm, and ML tests
```

## Setup and run

Commands below are run from the repository root in separate terminals. Python 3.10+ and Node.js 18+ are recommended.

### Backend and database

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m backend.seed_database
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8011
```

SQLite tables are created by the backend at startup. The seeder skips an already populated database by default. To intentionally recreate the complete demo dataset (deleting existing database records first), run:

```powershell
python -m backend.seed_database --reset
```

The reset recreates donor, organ, recipient, notification, and evaluation records with fresh retrieval times. Demo records include eligible matches and examples of ABO mismatch, organ mismatch, an ineligible recipient, an unavailable organ, and preservation/transit rejection.

### Synthetic benchmark data (optional)

The benchmark CSV and saved models are included. To regenerate the dataset:

```powershell
python data/synthetic/generate_synthetic_data.py
```

To retrain the models and replace model files/metrics, use the Model Evaluation page or run:

```powershell
python ml/training/train.py
```

Retraining changes the serialized models and reported synthetic benchmark metrics. It is not required to start the application.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to `http://127.0.0.1:8011`.

## Hosted demo (Render + Vercel)

- **Render backend:** create a Blueprint from the repository root and use `render.yaml`. It defines a Python Web Service, Python 3.11.9, build command `pip install -r requirements.txt && python -m backend.seed_database`, start command `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`, and health check `/health`. The seed step creates the synthetic demo database as part of each build.
- **Vercel frontend:** import the repository, set the project root directory to `frontend`, and set `VITE_API_BASE_URL=https://<render-service>.onrender.com/api` in the Production environment before deploying. `frontend/vercel.json` declares Vite, `npm run build`, `dist`, and SPA route fallback. Local development leaves this variable unset and keeps the Vite `/api` proxy.
- **SQLite lifecycle:** the Render service uses its local filesystem. Writes work for a running demo instance but are not durable across service replacement or rebuilds. Use managed PostgreSQL and set `DATABASE_URL` before relying on persistent user-created data. The bundled database and benchmark records are synthetic.
- **Render environment:** `PYTHON_VERSION=3.11.9`, `DATABASE_URL=sqlite:///./organ_matching.db`, `MODEL_DIR=ml/saved_models`, `DEFAULT_MODEL=xgboost`, and `CORS_ORIGINS=["https://<vercel-production-domain>"]`. The Blueprint prompts for `CORS_ORIGINS`; initially use `["http://localhost:5173"]`, then replace it with the actual Vercel production origin and redeploy the backend. Add custom frontend domains as more JSON array entries. Render supplies `PORT`; the start command binds `0.0.0.0`.

### Publishing this checkout

This folder may not yet have a Git remote. Create an empty **private** GitHub repository, then run these PowerShell commands from the project folder. `.gitignore` excludes `.env` variants, SQLite files, build output, dependencies, and Vercel local metadata while retaining `.env.example` and `frontend/.env.production.example`.

```powershell
Set-Location "C:\Users\samee\Desktop\organ donor"
git init -b main
git add -A
git status --short
git commit -m "Prepare organ matching demo for deployment"
git remote add origin https://github.com/<YOUR-USER>/<YOUR-REPO>.git
git push -u origin main
```

### Deployment order

1. In Render, create a new Blueprint from the pushed repository and apply `render.yaml`. When prompted for `CORS_ORIGINS`, use `["http://localhost:5173"]` temporarily. Wait for `/health` to pass and copy the service URL.
2. In Vercel, import the same repository. Set **Root Directory** to `frontend`, **Framework Preset** to Vite, **Build Command** to `npm run build`, **Output Directory** to `dist`, and the Production environment variable `VITE_API_BASE_URL` to `https://<render-service>.onrender.com/api`. Deploy and copy the production `https://...vercel.app` domain.
3. In Render, replace `CORS_ORIGINS` with `["https://<vercel-production-domain>"]` (include `https://`) and redeploy. If you use a custom domain, include both origins, e.g. `["https://project.vercel.app","https://demo.example.org"]`.
4. Verify `https://<render-service>.onrender.com/health`, `https://<render-service>.onrender.com/api/dashboard/summary`, and `https://<vercel-production-domain>/`. In the frontend, check a data page and a route calculation to confirm API communication. Use the logistics route POST endpoint for a non-mutating POST check.

## Configuration

`.env` is ignored by Git. `.env.example` documents non-secret local defaults; the application reads overrides from process environment variables and does not automatically load `.env`. `DATABASE_URL` defaults to `sqlite:///./organ_matching.db`; `HOST` and `PORT` default to `127.0.0.1` and `8011`. Keep credentials and machine-specific settings out of committed files.

## Workflow and API overview

The frontend dashboard links the following modules:

1. Donors, organs, and recipients: `/api/donors`, `/api/organs`, `/api/recipients`.
2. Matching run and saved review queue: `POST /api/matching/run`, `GET /api/matching/{organ_id}`, `PUT /api/matching/review/{match_id}`.
3. SHAP explanation: `POST /api/explain` (for hard-rule eligible candidates).
4. Prototype graph routes: `GET /api/logistics/network`, `POST /api/logistics/route`.
5. Multi-organ optimization: `POST /api/optimization/run`.
6. What-if simulation: `POST /api/scenario/run`.
7. Synthetic model metrics and subgroup assessment: `GET /api/ml/evaluation`, `GET /api/fairness/evaluation`; optional retraining: `POST /api/ml/train`.
8. Notifications: `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`.

Interactive API documentation is available at `http://127.0.0.1:8011/docs`.

## Matching and explanation methods

The matching endpoint applies deterministic hard rules for organ type, ABO compatibility, organ availability, recipient eligibility, and remaining preservation window versus estimated transit. Rejected candidates receive transparent failure codes and do not enter the ranking model. Candidates passing all rules receive a reproducible model-assisted suitability score and deterministic ordering by score.

SHAP TreeExplainer computes per-candidate attributions for the selected tree model. Its SHAP values explain that model's probability output. The displayed hybrid suitability score also combines the model probability and a continuous research index, so it is shown separately from the SHAP target. Candidate-specific HLA mismatch and PRA are not stored in the present database; the current prototype uses fixed assumptions (2 mismatches and 10% PRA), clearly disclosed in the explanation. These fields are not measured recipient data.

## Logistics and optimization

Routes use the project's simulated, bidirectional graph with Dijkstra or A* and return path, distance, transit estimate, and preservation feasibility. The graph does not provide GPS, live traffic, or operational dispatch guidance.

The Hungarian module builds an organ-recipient utility matrix, marks hard-rule failures as invalid, and uses SciPy's linear-sum assignment to produce one-to-one assignments. Where no model score is supplied, the current multi-organ prototype uses a disclosed deterministic baseline utility formula; this is not the individual matching model's predicted score.

## Model evaluation and fairness

Logistic Regression, Random Forest, and XGBoost metrics are computed on a held-out split of a synthetic generated dataset and include accuracy, precision, recall, F1, and ROC-AUC. The fairness page computes subgroup metrics on the bundled synthetic benchmark data. The displayed sample count reflects that evaluation dataset. **Synthetic benchmark — not clinical validation.** These metrics do not establish clinical fairness or performance.

## Limitations

- The system is an academic prototype, not a clinical allocation tool.
- Demo records and model benchmark labels are synthetic.
- The graph and route estimates are simulated and do not represent live transport conditions.
- HLA mismatch and PRA use disclosed fixed assumptions because the current data model does not store them.
- The multi-organ optimizer's default utility is a research baseline formula, not a trained clinical prediction.
- Professional review records reviewer status and notes; it does not authorize clinical decisions.

## Future scope

Potential research extensions include obtaining ethically governed, validated datasets; adding audited candidate-level clinical features with appropriate data governance; validating routing assumptions with approved operational data; and conducting independent evaluation with qualified transplant professionals and applicable oversight. These are future work, not existing capabilities.
