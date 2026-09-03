from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.features.engineering import FEATURE_COLUMNS, build_features


@dataclass
class ForecastResult:
    model_name: str
    prediction: float
    train_size: int
    holdout_mae: float | None
    holdout_rmse: float | None
    holdout_wape: float | None


def _wape(actual: np.ndarray, predicted: np.ndarray) -> float:
    denominator = np.abs(actual).sum()
    return float(np.abs(actual - predicted).sum() / denominator) if denominator else 0.0


def _prepare(df: pd.DataFrame):
    frame = build_features(df).dropna(subset=FEATURE_COLUMNS + ["revenue"]).copy()
    X = frame[FEATURE_COLUMNS]
    y = frame["revenue"]
    return frame, X, y


def _models() -> dict:
    return {
        "linear_regression": Pipeline([
            ("scale", StandardScaler()),
            ("model", LinearRegression()),
        ]),
        "random_forest": RandomForestRegressor(
            n_estimators=250,
            max_depth=5,
            random_state=42,
            min_samples_leaf=1,
        ),
    }


def evaluate_forecasters(df: pd.DataFrame) -> tuple[list[ForecastResult], str]:
    frame, X, y = _prepare(df)
    if len(frame) < 6:
        raise ValueError("At least 6 rows with complete features are required for forecasting")
    holdout = max(2, min(3, len(frame) // 3))
    split = len(frame) - holdout
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]
    results = []
    models = _models()
    for name, model in models.items():
        model.fit(X_train, y_train)
        predicted = np.asarray(model.predict(X_test), dtype=float)
        actual = y_test.to_numpy(dtype=float)
        mae = float(np.mean(np.abs(actual - predicted)))
        rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
        wape = _wape(actual, predicted)
        model.fit(X, y)
        future_features = build_features(df).iloc[[-1]][FEATURE_COLUMNS]
        prediction = float(model.predict(future_features)[0])
        results.append(ForecastResult(name, prediction, split, mae, rmse, wape))
    best = min(results, key=lambda r: r.holdout_wape if r.holdout_wape is not None else float("inf"))
    return results, best.model_name


def naive_forecast(df: pd.DataFrame) -> float:
    return float(df.sort_values("month")["revenue"].iloc[-1])
