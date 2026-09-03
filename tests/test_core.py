from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.data_loader import load_demo_frame, validate_frame
from app.core.metrics import compute_metrics
from app.forecasting.pipeline import run_forecast
from app.scenarios.simulator import simulate_marketing_scenarios
from app.optimization.engine import optimize_marketing
from app.decision.policy import decide_marketing_action


def test_demo_data_quality_is_high():
    df = load_demo_frame()
    report = validate_frame(df)
    assert report["rows"] == 12
    assert report["missing_columns"] == []
    assert report["quality_score"] >= 90


def test_metrics_are_calculated():
    metrics = compute_metrics(load_demo_frame())
    assert metrics["cac"] > 0
    assert metrics["latest_revenue"] == 192000.0
    assert metrics["revenue_trend"] == "positive"


def test_forecast_returns_model_comparison():
    result = run_forecast(load_demo_frame())
    assert result["model"] in {"linear_regression", "random_forest"}
    assert len(result["models"]) == 2
    assert all(row["mae"] is not None for row in result["models"])


def test_scenarios_are_monotonic_under_baseline_assumption():
    rows = simulate_marketing_scenarios(load_demo_frame())["scenarios"]
    revenues = [row["expected_revenue"] for row in rows]
    assert revenues == sorted(revenues)


def test_optimizer_responds_to_liquidity_guardrail():
    df = load_demo_frame()
    relaxed = optimize_marketing(frame=df, min_runway_months=3, planning_months=6)
    tighter = optimize_marketing(frame=df, min_runway_months=12, planning_months=6)
    assert relaxed.marketing_spend >= tighter.marketing_spend
    assert relaxed.horizon_profit >= 0
    assert tighter.horizon_profit >= 0


def test_optimizer_responds_to_planning_horizon():
    df = load_demo_frame()
    short = optimize_marketing(frame=df, min_runway_months=6, planning_months=3)
    long = optimize_marketing(frame=df, min_runway_months=6, planning_months=12)
    assert short.horizon_revenue != long.horizon_revenue
    assert short.horizon_profit != long.horizon_profit


def test_policy_returns_valid_action():
    df = load_demo_frame()
    metrics = compute_metrics(df)
    optimization = optimize_marketing(frame=df, min_runway_months=6, planning_months=6)
    decision = decide_marketing_action(metrics, {
        "marketing_spend": optimization.marketing_spend,
        "feasible": optimization.feasible,
        "constraint_violations": optimization.constraint_violations,
    })
    assert decision["recommendation"] in {"INCREASE", "HOLD", "DECREASE"}
