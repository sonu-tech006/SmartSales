"""
SmartSales - Automated Data Engineering Pipeline (Python / Pandas / NumPy)
Extracts, validates, cleans, and transforms raw CSV transactions.
"""

import io
import time
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np


class SalesETLPipeline:
    """
    Production-grade ETL pipeline for sales data ingestion.
    Supports multi-format date normalization, schema validation, outlier checks,
    and aggregate metric extraction.
    """

    def __init__(self, raw_csv_text: str, column_mappings: Dict[str, str]):
        self.raw_text = raw_csv_text
        self.mappings = column_mappings
        self.warnings: List[str] = []
        self.rejected_records: List[Dict[str, Any]] = []

    def run(self) -> Dict[str, Any]:
        start_time = time.time()

        # 1. EXTRACT: Parse raw CSV text safely
        try:
            df = pd.read_csv(io.StringIO(self.raw_text), skipinitialspace=True)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV document: {str(e)}")

        initial_row_count = len(df)
        if initial_row_count == 0:
            raise ValueError("CSV dataset contains zero records.")

        # 2. VALIDATE: Check presence of mapped date and sales columns
        date_col = self.mappings.get("date")
        sales_col = self.mappings.get("sales")
        if not date_col or date_col not in df.columns:
            raise KeyError(f"Mapped date column '{date_col}' not found in CSV headers.")
        if not sales_col or sales_col not in df.columns:
            raise KeyError(f"Mapped sales column '{sales_col}' not found in CSV headers.")

        # 3. TRANSFORM: Date normalization
        df["_clean_date"] = pd.to_datetime(df[date_col], errors="coerce")
        invalid_dates = df["_clean_date"].isna()
        if invalid_dates.any():
            for idx in df[invalid_dates].index[:10]:
                self.rejected_records.append({
                    "row_index": int(idx) + 2,
                    "reason": f"Unparseable date: {df.loc[idx, date_col]}"
                })
            df = df[~invalid_dates].copy()

        # Clean numeric sales
        if df[sales_col].dtype == object:
            df["_clean_sales"] = (
                df[sales_col]
                .astype(str)
                .str.replace(r"[$,€£%]", "", regex=True)
                .str.strip()
            )
            df["_clean_sales"] = pd.to_numeric(df["_clean_sales"], errors="coerce")
        else:
            df["_clean_sales"] = pd.to_numeric(df[sales_col], errors="coerce")

        invalid_sales = df["_clean_sales"].isna()
        if invalid_sales.any():
            for idx in df[invalid_sales].index[:10]:
                self.rejected_records.append({
                    "row_index": int(idx) + 2,
                    "reason": f"Non-numeric sales value: {df.loc[idx, sales_col]}"
                })
            df = df[~invalid_sales].copy()

        # Check negative sales
        neg_count = (df["_clean_sales"] < 0).sum()
        if neg_count > 0:
            self.warnings.append(f"Observed {neg_count} transactions with negative revenue (returns/refunds).")

        # 4. LOAD & AGGREGATE
        df["date_str"] = df["_clean_date"].dt.strftime("%Y-%m-%d")
        df_sorted = df.sort_values("date_str")

        total_revenue = float(df["_clean_sales"].sum())
        total_valid = len(df)
        total_rejected = initial_row_count - total_valid

        # Extract Category and Product aggregates if mapped
        product_col = self.mappings.get("product")
        category_col = self.mappings.get("category")

        categories_count = int(df[category_col].nunique()) if category_col and category_col in df.columns else 1
        products_count = int(df[product_col].nunique()) if product_col and product_col in df.columns else 1

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "status": "SUCCESS" if total_rejected == 0 else "WARNING",
            "total_rows": initial_row_count,
            "valid_rows": total_valid,
            "rejected_rows": total_rejected,
            "duration_ms": elapsed_ms,
            "warnings": self.warnings,
            "summary_stats": {
                "total_revenue": round(total_revenue, 2),
                "total_orders": total_valid,
                "start_date": df_sorted["date_str"].iloc[0] if total_valid > 0 else "",
                "end_date": df_sorted["date_str"].iloc[-1] if total_valid > 0 else "",
                "categories_count": categories_count,
                "products_count": products_count,
            }
        }
