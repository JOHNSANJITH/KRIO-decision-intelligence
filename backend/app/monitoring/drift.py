import numpy as np
import pandas as pd


def calculate_drift(df: pd.DataFrame) -> dict:
    if len(df) < 6:
        return {"status": "insufficient_data", "features": {}}
    recent = df.tail(3)
    baseline = df.iloc[:-3]
    features = {}
    for column in ["revenue", "marketing_spend", "new_customers", "operating_costs"]:
        base_mean = float(baseline[column].mean())
        recent_mean = float(recent[column].mean())
        shift = 0.0 if base_mean == 0 else abs(recent_mean - base_mean) / abs(base_mean)
        status = "high" if shift > 0.25 else "moderate" if shift > 0.10 else "low"
        features[column] = {"relative_shift": round(shift, 4), "status": status}
    overall = "high" if any(v["status"] == "high" for v in features.values()) else "moderate" if any(v["status"] == "moderate" for v in features.values()) else "low"
    return {"status": overall, "features": features}
