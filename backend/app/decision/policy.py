def decide_marketing_action(metrics: dict, optimization: dict) -> dict:
    risks = []
    runway = metrics.get("runway_months")
    trend = metrics.get("revenue_trend")
    current_spend = float(metrics.get("latest_marketing_spend", 0.0))
    recommended_spend = float(optimization.get("marketing_spend", current_spend))
    change = 0.0 if not current_spend else (recommended_spend / current_spend - 1) * 100

    if not optimization.get("feasible", False):
        risks.extend(optimization.get("constraint_violations", []))
        recommendation = "HOLD" if abs(change) <= 5 else ("DECREASE" if change < 0 else "HOLD")
    elif runway is not None and runway < 3:
        recommendation = "DECREASE"
        risks.append("Current burn-based runway is below 3 months")
    elif runway is not None and runway < 6:
        recommendation = "HOLD"
        risks.append("Current burn-based runway is below 6 months")
    elif change > 2 and trend == "positive":
        recommendation = "INCREASE"
    elif change < -2:
        recommendation = "DECREASE"
    else:
        recommendation = "HOLD"

    return {
        "recommendation": recommendation,
        "recommended_spend_change_percent": round(change, 2),
        "risks": risks,
    }
