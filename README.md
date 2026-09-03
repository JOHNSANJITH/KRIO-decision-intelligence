<div align="center">

# Krio

### Applied Decision Intelligence

Krio is an end-to-end decision-support system that turns business data into forecasts, what-if scenarios, constrained recommendations, and explainable actions.

<p>
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111111" alt="React">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="scikit-learn">
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<p>
  <a href="https://github.com/JOHNSANJITH/krio-decision-intelligence">Repository</a> |
  <a href="#architecture">Architecture</a> |
  <a href="#forecasting">Forecasting</a> |
  <a href="#scenarios-and-optimization">Scenarios</a> |
  <a href="#api">API</a>
</p>

</div>

---

## Overview

Krio is designed around a practical decision loop:

```text
Business Data
    |
    v
Data Quality
    |
    v
Feature Engineering
    |
    +----------------------+
    |                      |
    v                      v
Forecasting          Business Metrics
    |                      |
    +----------+-----------+
               |
               v
        Scenario Engine
               |
               v
        Optimization Engine
               |
               v
         Decision Policy
               |
          +----+----+
          |         |
          v         v
   Explainability  Monitoring
          |
          v
        FastAPI
          |
          v
    React Dashboard
```

The first implementation focuses on **SaaS growth and marketing allocation** using a synthetic monthly dataset. The engine is structured so additional decision domains can be added later without replacing the core pipeline.

---

## Core Features

| Area | Capability |
| --- | --- |
| Data Quality | Schema checks, missing values, duplicates, invalid values, outlier reporting |
| Metrics | Revenue growth, CAC, burn, cash, customer growth |
| Forecasting | Time-aware model comparison using Linear Regression and Random Forest |
| Scenarios | Marketing-spend what-if analysis across a configurable planning horizon |
| Optimization | Profit-oriented constrained search with a configurable liquidity buffer |
| Decision Policy | Deterministic increase/hold/decrease recommendation |
| Explainability | Decision drivers, assumptions, and constraint state |
| Monitoring | Lightweight recent-vs-baseline data-shift checks |
| API | Typed FastAPI endpoints with OpenAPI documentation |
| Frontend | Responsive glassmorphism dashboard with interactive workspaces |

---

## Architecture

```text
                         KRIO
              Applied Decision Intelligence
                              |
                              v
                     +------------------+
                     | Data Ingestion   |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     | Data Quality     |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     | Feature Engine   |
                     +--------+---------+
                              |
                 +------------+------------+
                 |                         |
                 v                         v
        +----------------+        +----------------+
        | Forecasting    |        | Business       |
        | Models         |        | Metrics        |
        +--------+-------+        +--------+-------+
                 |                         |
                 +------------+------------+
                              |
                              v
                     +------------------+
                     | Scenario Engine  |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     | Optimization     |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     | Decision Policy  |
                     +--------+---------+
                              |
                 +------------+------------+
                 |                         |
                 v                         v
        +----------------+        +----------------+
        | Explainability |        | Monitoring     |
        +--------+-------+        +----------------+
                 |
                 v
              FastAPI
                 |
                 v
          React Dashboard
```

---

## Forecasting

Krio uses chronological validation so future observations do not leak into the training set.

Current models:

1. Linear Regression with feature scaling
2. Random Forest Regression

Metrics:

- MAE
- RMSE
- WAPE

The best model is selected by holdout WAPE. Because the bundled dataset is intentionally small and synthetic, the forecast results are a technical demonstration rather than a production benchmark.

---

## Scenarios and Optimization

Krio separates scenario simulation from optimization.

### Scenario engine

The current SaaS use case models how a change in marketing spend can affect customers and revenue over a configurable planning horizon.

The projection uses:

- the observed revenue trend
- a diminishing marketing-response curve
- a fixed short-term operating-cost growth assumption

These are explicit planning assumptions, not causal estimates.

### Optimization engine

The optimizer evaluates marketing-spend candidates between the configured minimum and maximum change.

It scores each candidate using projected horizon profit and a penalty for violating the selected liquidity buffer.

The model returns:

- recommended marketing spend
- expected next-period revenue
- expected horizon revenue
- expected horizon profit
- ending cash
- estimated burn-based runway when applicable
- feasibility state
- constraint violations

The UI exposes two controls:

- planning horizon: 1 to 18 months
- minimum liquidity buffer: 0 to 18 months

Changing either control changes the optimization search and the returned decision snapshot.

---

## Decision Policy

The core decision is deterministic and auditable.

Forecasting estimates outcomes.

Scenario simulation evaluates alternatives.

Optimization searches the decision surface.

The decision policy converts the resulting state into:

```text
INCREASE
HOLD
DECREASE
```

The project does not require an LLM to make the business decision. This keeps the policy layer testable and traceable.

---

## Explainability

Krio explains a recommendation using the values that actually drive the policy, including:

- revenue trend
- CAC
- optimization change
- liquidity guardrail
- feasibility state
- planning assumptions

No synthetic confidence score is generated.

---

## Monitoring

The monitoring layer compares recent observations with the earlier part of the dataset and reports relative shifts for:

- revenue
- marketing spend
- new customers
- operating costs

This is a lightweight development signal rather than a replacement for a production observability platform.

---

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Service metadata |
| GET | `/api/health` | Service health |
| GET | `/api/demo/data` | Demo dataset and validation report |
| POST | `/api/data/validate` | Run data validation |
| GET | `/api/metrics` | Business metrics |
| GET | `/api/forecast` | Forecast model comparison and prediction |
| POST | `/api/scenario` | Run custom scenario projections |
| POST | `/api/optimize` | Run constrained optimization |
| POST | `/api/decision` | Run the complete decision pipeline |
| GET | `/api/monitoring` | Return monitoring indicators |

FastAPI's interactive documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

## Interactive Dashboard

The dashboard is organized into five interactive workspaces:

- Overview
- Forecast
- Scenarios
- Decision
- Monitoring

Scenario controls are connected to the FastAPI backend. Changing the planning horizon or liquidity guardrail recalculates the optimization, while custom marketing-spend scenarios return refreshed projections.

---

## Project Structure

```text
krio-decision-intelligence/
|
+-- backend/
|   +-- app/
|   |   +-- api/
|   |   +-- core/
|   |   +-- decision/
|   |   +-- explainability/
|   |   +-- features/
|   |   +-- forecasting/
|   |   +-- models/
|   |   +-- monitoring/
|   |   +-- optimization/
|   |   +-- scenarios/
|   |   +-- services/
|   |   +-- main.py
|   |
|   +-- data/
|       +-- demo_monthly_data.csv
|       +-- README.md
|   +-- requirements.txt
|
+-- frontend/
|   +-- src/
|   +-- package.json
|
+-- tests/
+-- scripts/
+-- docs/
+-- artifacts/
+-- Dockerfile
+-- pyproject.toml
+-- .env.example
+-- README.md
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```powershell
.venv\\Scripts\\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

---

## Validation

Run backend tests from the repository root:

```bash
pytest -q
```

Run frontend linting/build:

```bash
cd frontend
npm run lint
npm run build
```

---

## Docker

Build:

```bash
docker build -t krio .
```

Run:

```bash
docker run -p 8000:8000 krio
```

---

## Limitations

The bundled dataset is synthetic and intentionally small.

The marketing response model is a planning assumption, not a causal estimate of advertising effectiveness.

The optimization layer is designed for transparent decision support rather than autonomous business execution.

The monitoring layer is intentionally lightweight.

---

## Roadmap

- [ ] Better probabilistic forecasting
- [ ] Prediction intervals and uncertainty tracking
- [ ] Retail pricing adapter
- [ ] Inventory and supply-chain adapter
- [ ] Industrial maintenance adapter
- [ ] Stronger optimization methods
- [ ] Experiment tracking
- [ ] Persistent database-backed runs
- [ ] Authentication and multi-user workspaces
- [ ] Production observability

---

## Author

**John**

GitHub: https://github.com/JOHNSANJITH

---

## License

MIT License.
