import pandas as pd

from app.core.data_loader import load_demo_frame
from app.core.metrics import compute_metrics
from app.scenarios.simulator import simulate_marketing_scenarios
from app.forecasting.pipeline import run_forecast
from app.optimization.engine import optimize_marketing
from app.decision.policy import decide_marketing_action
from app.explainability.explanations import explain_decision
from app.monitoring.drift import calculate_drift


def build_decision_snapshot(df: pd.DataFrame | None = None, optimization_request: dict | None = None) -> dict:
    frame = df if df is not None else load_demo_frame()
    metrics = compute_metrics(frame)
    forecast = run_forecast(frame)
    optimization_request = optimization_request or {}
    planning_months = int(optimization_request.get("planning_months", 6))
    min_runway_months = float(optimization_request.get("min_runway_months", 6.0))
    min_change = float(optimization_request.get("min_change", -0.3))
    max_change = float(optimization_request.get("max_change", 0.3))

    latest = frame.sort_values("month").iloc[-1]
    opt = optimize_marketing(
        frame=frame,
        min_runway_months=min_runway_months,
        planning_months=planning_months,
        min_change=min_change,
        max_change=max_change,
    )
    current = float(latest["marketing_spend"])
    opt_dict = {
        "marketing_spend": round(opt.marketing_spend, 2),
        "expected_customers": round(opt.expected_customers, 2),
        "expected_revenue": round(opt.expected_revenue, 2),
        "expected_profit": round(opt.expected_profit, 2),
        "horizon_revenue": round(opt.horizon_revenue, 2),
        "horizon_profit": round(opt.horizon_profit, 2),
        "ending_cash": round(opt.ending_cash, 2),
        "runway_months": round(opt.runway_months, 2) if opt.runway_months is not None else None,
        "feasible": opt.feasible,
        "constraint_violations": opt.constraint_violations,
        "planning_months": planning_months,
        "min_runway_months": min_runway_months,
    }
    opt_dict["recommended_change_percent"] = round((opt.marketing_spend / current - 1) * 100, 2) if current else 0.0
    decision = decide_marketing_action(metrics, opt_dict)
    explanation = explain_decision(metrics, decision, opt_dict)
    monitoring = calculate_drift(frame)
    scenarios = simulate_marketing_scenarios(
        frame,
        planning_months=planning_months,
        min_runway_months=min_runway_months,
    )
    return {
        "project": "Krio",
        "use_case": "SaaS growth and marketing allocation",
        "metrics": metrics,
        "forecast": forecast,
        "scenarios": scenarios["scenarios"],
        "scenario_warnings": scenarios["warnings"],
        "optimization": opt_dict,
        "decision": decision,
        "explanation": explanation,
        "monitoring": monitoring,
        "planning_months": planning_months,
        "min_runway_months": min_runway_months,
    }
