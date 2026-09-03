import pandas as pd
from app.forecasting.models import evaluate_forecasters


def run_forecast(df: pd.DataFrame) -> dict:
    results, best_name = evaluate_forecasters(df)
    best = next(result for result in results if result.model_name == best_name)
    return {
        "model": best_name,
        "prediction": round(best.prediction, 2),
        "train_size": best.train_size,
        "models": [
            {
                "model": result.model_name,
                "prediction": round(result.prediction, 2),
                "mae": round(result.holdout_mae, 2) if result.holdout_mae is not None else None,
                "rmse": round(result.holdout_rmse, 2) if result.holdout_rmse is not None else None,
                "wape": round(result.holdout_wape * 100, 2) if result.holdout_wape is not None else None,
            }
            for result in results
        ],
    }
