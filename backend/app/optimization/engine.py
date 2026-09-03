from dataclasses import dataclass
import numpy as np
import pandas as pd

from app.scenarios.simulator import _scenario_projection


@dataclass
class OptimizationResult:
    marketing_spend: float
    expected_customers: float
    expected_revenue: float
    expected_profit: float
    horizon_revenue: float
    horizon_profit: float
    ending_cash: float
    runway_months: float | None
    feasible: bool
    constraint_violations: list[str]


def optimize_marketing(
    frame: pd.DataFrame,
    min_runway_months: float = 6.0,
    planning_months: int = 6,
    min_change: float = -0.3,
    max_change: float = 0.3,
    step: float = 0.01,
) -> OptimizationResult:
    latest = frame.sort_values("month").iloc[-1]
    latest_marketing = float(latest["marketing_spend"])
    latest_customers = float(latest["new_customers"])
    latest_opex = float(latest["operating_costs"])
    if latest_customers <= 0 or latest_marketing <= 0:
        raise ValueError("Optimization requires positive latest marketing spend and customer acquisition")

    best = None
    for change in np.arange(min_change, max_change + step / 2, step):
        projection = _scenario_projection(frame, float(change), planning_months)
        reserve_required = min_runway_months * (latest_opex + projection["marketing_spend"])
        reserve_gap = max(0.0, reserve_required - projection["ending_cash"])
        penalty = (reserve_gap / 10000.0) ** 2 * 250.0
        score = projection["horizon_profit"] - penalty
        candidate = (score, projection, reserve_gap)
        if best is None or score > best[0]:
            best = candidate

    assert best is not None
    _, projection, reserve_gap = best
    violations = []
    if reserve_gap > 0:
        violations.append(f"Selected plan misses the {min_runway_months:.0f}-month cash buffer by ${reserve_gap:,.0f}")

    return OptimizationResult(
        marketing_spend=projection["marketing_spend"],
        expected_customers=projection["expected_customers"],
        expected_revenue=projection["expected_revenue"],
        expected_profit=projection["expected_profit"],
        horizon_revenue=projection["horizon_revenue"],
        horizon_profit=projection["horizon_profit"],
        ending_cash=projection["ending_cash"],
        runway_months=projection["runway_months"],
        feasible=reserve_gap <= 0,
        constraint_violations=violations,
    )
