import pandas as pd


def compute_metrics(df: pd.DataFrame) -> dict:
    df = df.sort_values("month").copy()
    latest = df.iloc[-1]
    total_marketing = float(df["marketing_spend"].sum())
    total_customers = float(df["new_customers"].sum())
    cac = round(total_marketing / total_customers, 2) if total_customers else None
    burn = float(latest["operating_costs"] + latest["marketing_spend"] - latest["revenue"])
    last_three = df.tail(3)
    burn_series = last_three["operating_costs"] + last_three["marketing_spend"] - last_three["revenue"]
    average_burn = float(burn_series.mean())
    runway = None if average_burn <= 0 else round(float(latest["cash_balance"] / average_burn), 2)
    first_revenue = float(df.iloc[0]["revenue"])
    last_revenue = float(latest["revenue"])
    revenue_growth = None if first_revenue == 0 else round((last_revenue / first_revenue - 1) * 100, 2)
    trend = "positive" if last_revenue > first_revenue else "negative" if last_revenue < first_revenue else "flat"
    recent_customer_growth = None
    if len(df) >= 4:
        prior = float(df.iloc[-4]["new_customers"])
        recent = float(latest["new_customers"])
        recent_customer_growth = None if prior == 0 else round((recent / prior - 1) * 100, 2)
    return {
        "revenue_trend": trend,
        "revenue_growth_percent": revenue_growth,
        "cac": cac,
        "burn_rate": round(burn, 2),
        "average_burn_3m": round(average_burn, 2),
        "runway_months": runway,
        "latest_revenue": round(last_revenue, 2),
        "latest_marketing_spend": round(float(latest["marketing_spend"]), 2),
        "latest_customers": int(latest["new_customers"]),
        "recent_customer_growth_percent": recent_customer_growth,
        "cash_balance": round(float(latest["cash_balance"]), 2),
    }
