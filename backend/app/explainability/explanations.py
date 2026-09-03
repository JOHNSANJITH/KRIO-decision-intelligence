def explain_decision(metrics: dict, decision: dict, optimization: dict) -> dict:
    drivers = []
    trend = metrics.get("revenue_trend")
    if trend == "positive":
        drivers.append("Revenue is trending upward across the available period")
    elif trend == "negative":
        drivers.append("Revenue is trending downward across the available period")
    if metrics.get("cac") is not None:
        drivers.append(f"Latest aggregate CAC is ${metrics['cac']:.2f}")
    drivers.append(
        f"The optimizer targets a {optimization.get('recommended_change_percent', decision.get('recommended_spend_change_percent', 0)):.1f}% marketing-spend change"
    )
    drivers.append(
        f"The plan is evaluated across a {optimization.get('planning_months', 6)}-month horizon with a {optimization.get('min_runway_months', 0):.0f}-month liquidity buffer"
    )
    if not optimization.get("feasible", False):
        drivers.append("The selected plan is below the requested liquidity buffer and is flagged for review")

    return {
        "summary": (
            f"Krio recommends {decision['recommendation'].lower()}ing marketing spend after comparing projected profit, "
            f"revenue trend, and the selected liquidity guardrail over {optimization.get('planning_months', 6)} months."
        ),
        "drivers": drivers,
        "assumptions": [
            "The scenario model applies the observed revenue trend to the planning horizon.",
            "Marketing response follows a diminishing-return planning curve rather than a linear response.",
            "Operating costs grow by 1% per projected month in the demo model.",
            "The decision engine is a transparent decision-support policy, not a causal inference model.",
        ],
    }
