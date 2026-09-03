import math
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from app.core.data_loader import load_demo_data, load_demo_frame, validate_frame
from app.core.metrics import compute_metrics
from app.scenarios.simulator import simulate_marketing_scenarios
from app.forecasting.pipeline import run_forecast
from app.services.engine import build_decision_snapshot
from app.models.schemas import OptimizationRequest, ScenarioRequest

router = APIRouter()


def json_safe(value):
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    return value


def clean(obj):
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(v) for v in obj]
    return json_safe(obj)


@router.get("/")
def root():
    return {"name": "Krio", "description": "Applied Decision Intelligence", "version": "1.1.0", "docs": "/docs", "health": "/api/health"}


@router.get("/")
def root():
    return {"service": "Krio", "description": "Applied Decision Intelligence", "version": "1.2.1", "docs": "/docs", "health": "/api/health"}


@router.get("/api/health")
def health():
    return {"status": "ok", "service": "Krio", "version": "1.1.0"}


@router.get("/api/demo/data")
def demo_data():
    return clean(load_demo_data())


@router.post("/api/data/validate")
def validate_data():
    df = load_demo_frame()
    return validate_frame(df)


@router.get("/api/metrics")
def metrics():
    return clean(compute_metrics(load_demo_frame()))


@router.get("/api/forecast")
def forecast():
    try:
        return clean(run_forecast(load_demo_frame()))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/api/scenario")
def scenario(request: ScenarioRequest):
    return clean(
        simulate_marketing_scenarios(
            load_demo_frame(),
            request.changes,
            planning_months=request.planning_months,
        )
    )


@router.post("/api/optimize")
def optimize(request: OptimizationRequest):
    return clean(build_decision_snapshot(optimization_request=request.model_dump())["optimization"])


@router.post("/api/decision")
def decision(request: OptimizationRequest | None = None):
    payload = request.model_dump() if request else {}
    return clean(build_decision_snapshot(optimization_request=payload))


@router.get("/api/monitoring")
def monitoring():
    return clean(build_decision_snapshot()["monitoring"])
