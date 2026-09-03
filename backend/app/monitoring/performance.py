def summarize_model_performance(forecast: dict) -> dict:
    return {
        "selected_model": forecast["model"],
        "models": forecast["models"],
        "selection_metric": "WAPE",
    }
