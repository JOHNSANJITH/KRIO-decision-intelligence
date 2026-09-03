import math
import numpy as np
import pandas as pd


def _estimate_monthly_growth(frame: pd.DataFrame) -> float:
    values = frame.sort_values("month")["revenue"].astype(float).clip(lower=1.0).to_numpy()
    if len(values) < 3:
        return 0.0
    x = np.arange(len(values), dtype=float)
    slope = float(np.polyfit(x, np.log(values), 1)[0])
    return float(np.clip(math.exp(slope) - 1.0, -0.02, 0.08))


def _marketing_response(change: float) -> float:
    c = float(change)
    response = 1.0 + 0.9 * c - 1.4 * (c ** 2)
    return float(max(0.55, response))


def _scenario_projection(
    frame: pd.DataFrame,
    change: float,
    planning_months: int,
) -> dict:
    latest = frame.sort_values("month").iloc[-1]
    base_revenue = float(latest["revenue"])
    base_marketing = float(latest["marketing_spend"])
    base_opex = float(latest["operating_costs"])
    cash = float(latest["cash_balance"])
    customers = float(latest["new_customers"])
    monthly_growth = _estimate_monthly_growth(frame)
    marketing = base_marketing * (1.0 + change)
    response = _marketing_response(change)
    horizon_revenue = 0.0
    horizon_profit = 0.0
    min_cash = cash
    path = []
    for month_idx in range(1, planning_months + 1):
        organic = (1.0 + monthly_growth) ** month_idx
        revenue = base_revenue * organic * response
        opex = base_opex * (1.01 ** (month_idx - 1))
        profit = revenue - opex - marketing
        cash += profit
        min_cash = min(min_cash, cash)
        horizon_revenue += revenue
        horizon_profit += profit
        path.append({
            "month_offset": month_idx,
            "revenue": round(revenue, 2),
            "marketing_spend": round(marketing, 2),
            "operating_costs": round(opex, 2),
            "profit": round(profit, 2),
            "cash_balance": round(cash, 2),
        })

    monthly_burn = max(0.0, base_opex + marketing - (base_revenue * response))
    runway = None if monthly_burn <= 0 else round(cash / monthly_burn, 2)
    current_month_profit = path[0]["profit"] if path else 0.0
    current_month_revenue = path[0]["revenue"] if path else 0.0
    return {
        "change_percent": int(round(change * 100)),
        "marketing_spend": round(marketing, 2),
        "expected_customers": int(round(customers * response)),
        "expected_revenue": round(current_month_revenue, 2),
        "expected_profit": round(current_month_profit, 2),
        "horizon_revenue": round(horizon_revenue, 2),
        "horizon_profit": round(horizon_profit, 2),
        "ending_cash": round(cash, 2),
        "minimum_cash": round(min_cash, 2),
        "runway_months": runway,
        "assumption": "Revenue uses observed trend plus a diminishing marketing-response curve; future cost growth is fixed at 1% per month.",
        "path": path,
    }


def simulate_marketing_scenarios(
    df: pd.DataFrame,
    changes: list[float] | None = None,
    planning_months: int = 6,
    min_runway_months: float = 0.0,
) -> dict:
    frame = df.sort_values("month").copy()
    changes = changes if changes is not None else [-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3]
    latest = frame.iloc[-1]
    if float(latest["new_customers"]) <= 0 or float(latest["marketing_spend"]) <= 0:
        return {"scenarios": [], "warnings": ["Scenario simulation requires positive latest marketing spend and customer acquisition"]}

    warnings = []
    rows = [_scenario_projection(frame, float(change), planning_months) for change in changes]
    reserve_gap = [
        max(0.0, min_runway_months * (float(latest["operating_costs"]) + row["marketing_spend"]) - row["ending_cash"])
        for row in rows
    ]
    if any(gap > 0 for gap in reserve_gap):
        warnings.append(f"Some scenarios do not retain the selected {min_runway_months:.0f}-month cash buffer over the {planning_months}-month planning horizon")
    return {
        "scenarios": rows,
        "warnings": warnings,
        "planning_months": int(planning_months),
        "min_runway_months": float(min_runway_months),
    }
