import pandas as pd

FEATURE_COLUMNS = [
    "revenue",
    "marketing_spend",
    "new_customers",
    "operating_costs",
    "cash_balance",
    "revenue_lag_1",
    "revenue_lag_2",
    "customers_lag_1",
    "marketing_lag_1",
    "revenue_ma_3",
    "customers_ma_3",
    "marketing_growth",
    "month_num",
]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.sort_values("month").copy()
    frame["month_num"] = frame["month"].dt.month
    frame["revenue_lag_1"] = frame["revenue"].shift(1)
    frame["revenue_lag_2"] = frame["revenue"].shift(2)
    frame["customers_lag_1"] = frame["new_customers"].shift(1)
    frame["marketing_lag_1"] = frame["marketing_spend"].shift(1)
    frame["revenue_ma_3"] = frame["revenue"].rolling(3).mean()
    frame["customers_ma_3"] = frame["new_customers"].rolling(3).mean()
    frame["marketing_growth"] = frame["marketing_spend"].pct_change().replace([float("inf"), float("-inf")], 0).fillna(0)
    return frame
