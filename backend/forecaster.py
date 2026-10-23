"""
SmartSales - Machine Learning Forecasting Engine (Python / Statsmodels / Scikit-learn)
Provides Holt's Linear Exponential Smoothing and Linear Seasonal Regression.
"""

from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import Holt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error


def evaluate_forecast_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate MAE, RMSE, and MAPE avoiding zero division."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

    # Guarded MAPE
    non_zeros = y_true > 1e-4
    if np.sum(non_zeros) > 0:
        mape = float(np.mean(np.abs((y_true[non_zeros] - y_pred[non_zeros]) / y_true[non_zeros])) * 100)
    else:
        mape = 0.0

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2)
    }


def run_holt_forecast(daily_series: pd.Series, horizon_days: int = 30) -> Dict[str, Any]:
    """
    Fit Double Exponential Smoothing (Holt's Linear) with strict chronological holdout split.
    """
    total_len = len(daily_series)
    test_size = max(3, min(30, int(total_len * 0.2)))
    train_size = total_len - test_size

    train = daily_series.iloc[:train_size]
    test = daily_series.iloc[train_size:]

    # 1. Holdout Model Evaluation
    model_eval = Holt(train, initialization_method="estimated").fit(optimized=True)
    test_preds = model_eval.forecast(test_size)
    metrics = evaluate_forecast_metrics(test.values, test_preds.values)

    # 2. Complete Model Forecast
    full_model = Holt(daily_series, initialization_method="estimated").fit(optimized=True)
    future_preds = full_model.forecast(horizon_days)

    # 3. Residual Confidence Intervals
    residuals = daily_series.values - full_model.fittedvalues.values
    std_err = float(np.std(residuals))

    future_dates = pd.date_range(start=daily_series.index[-1] + pd.Timedelta(days=1), periods=horizon_days)

    predictions = []
    for step, (dt, val) in enumerate(zip(future_dates, future_preds), start=1):
        band = 1.96 * std_err * np.sqrt(1 + step / 10)
        predictions.append({
            "date": dt.strftime("%Y-%m-%d"),
            "predicted": round(float(val), 2),
            "lower_bound": round(max(0.0, float(val) - band), 2),
            "upper_bound": round(float(val) + band, 2),
            "is_future": True
        })

    return {
        "model_type": "holt_winters",
        "horizon_days": horizon_days,
        "metrics": {
            **metrics,
            "train_count": train_size,
            "test_count": test_size,
        },
        "predictions": predictions
    }
