"""
SmartSales - FastAPI Microservice & Companion Backend
Exposes OpenAPI documented REST endpoints for ETL ingestion, time-series forecasting,
and sales analytics.
"""

import os
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from etl_pipeline import SalesETLPipeline
from forecaster import run_holt_forecast
import pandas as pd

app = FastAPI(
    title="SmartSales ML & Analytics API",
    description="Enterprise Sales Forecasting & Data Engineering API powered by FastAPI, Pandas, and Statsmodels.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IngestRequest(BaseModel):
    name: str
    csv_content: str
    column_mappings: Dict[str, str] = Field(..., example={"date": "OrderDate", "sales": "TotalRevenue"})


class ForecastRequest(BaseModel):
    model_type: str = "holt_winters"
    horizon_days: int = 30
    daily_records: List[Dict[str, Any]] = Field(..., example=[{"date": "2025-01-01", "revenue": 1250.5}])


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI / Statsmodels / Pandas",
        "mongodb_ready": bool(os.getenv("MONGODB_URI")),
    }


@app.post("/api/etl/validate-and-ingest")
def validate_and_ingest(payload: IngestRequest):
    try:
        pipeline = SalesETLPipeline(payload.csv_content, payload.column_mappings)
        result = pipeline.run()
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/forecast/generate")
def generate_forecast(payload: ForecastRequest):
    try:
        df = pd.DataFrame(payload.daily_records)
        df["date"] = pd.to_datetime(df["date"])
        df_daily = df.groupby("date")["revenue"].sum().asfreq("D", fill_value=0)

        if len(df_daily) < 5:
            raise ValueError("Minimum 5 daily observation points required.")

        result = run_holt_forecast(df_daily, payload.horizon_days)
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
