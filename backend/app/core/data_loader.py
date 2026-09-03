from pathlib import Path
import pandas as pd

from app.core.config import DATA_FILE

REQUIRED_COLUMNS = {
    "month",
    "revenue",
    "marketing_spend",
    "new_customers",
    "operating_costs",
    "cash_balance",
}

NUMERIC_COLUMNS = [
    "revenue",
    "marketing_spend",
    "new_customers",
    "operating_costs",
    "cash_balance",
]


def load_demo_frame(path: Path | None = None) -> pd.DataFrame:
    target = path or DATA_FILE
    if not target.exists():
        raise FileNotFoundError(f"Data file not found: {target}")
    df = pd.read_csv(target)
    if missing := REQUIRED_COLUMNS.difference(df.columns):
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    df["month"] = pd.to_datetime(df["month"], errors="coerce")
    for column in NUMERIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    return df.sort_values("month").reset_index(drop=True)


def load_demo_data() -> dict:
    df = load_demo_frame()
    report = validate_frame(df)
    return {
        "company": "Demo B2B SaaS Startup",
        "currency": "USD",
        "period": "monthly",
        "data": df.assign(month=df["month"].dt.strftime("%Y-%m")).to_dict(orient="records"),
        "data_quality": report,
    }


def validate_frame(df: pd.DataFrame) -> dict:
    missing_columns = sorted(REQUIRED_COLUMNS.difference(df.columns))
    duplicate_rows = int(df.duplicated().sum())
    invalid_dates = int(df["month"].isna().sum()) if "month" in df else 0
    missing_values = int(df.isna().sum().sum())
    negative_rows = 0
    if all(column in df.columns for column in ["revenue", "marketing_spend", "new_customers", "operating_costs", "cash_balance"]):
        negative_rows = int((df[NUMERIC_COLUMNS] < 0).any(axis=1).sum())
    outlier_rows = 0
    numeric = df[NUMERIC_COLUMNS].dropna()
    if not numeric.empty:
        for column in NUMERIC_COLUMNS:
            q1 = numeric[column].quantile(0.25)
            q3 = numeric[column].quantile(0.75)
            iqr = q3 - q1
            if iqr == 0:
                continue
            low = q1 - 1.5 * iqr
            high = q3 + 1.5 * iqr
            outlier_rows += int(((numeric[column] < low) | (numeric[column] > high)).sum())
    outlier_rate = float(outlier_rows / max(len(df) * max(len(NUMERIC_COLUMNS), 1), 1))
    penalties = [
        min(missing_values / max(df.size, 1), 1.0) * 40,
        min(duplicate_rows / max(len(df), 1), 1.0) * 20,
        min(invalid_dates / max(len(df), 1), 1.0) * 20,
        min(negative_rows / max(len(df), 1), 1.0) * 10,
        min(outlier_rate, 1.0) * 10,
    ]
    score = max(0.0, round(100 - sum(penalties) - len(missing_columns) * 20, 1))
    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "invalid_dates": invalid_dates,
        "negative_value_rows": negative_rows,
        "outlier_rate": round(outlier_rate, 4),
        "missing_columns": missing_columns,
        "quality_score": score,
    }
