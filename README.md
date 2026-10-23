# SmartSales — Sales Forecasting & Analytics Platform

An enterprise-grade, end-to-end sales forecasting and analytics platform built for data engineers, machine learning engineers, and revenue analysts.

Features an automated CSV ETL ingestion pipeline, schema profiling, real-time sales aggregation, and genuine statistical time-series forecasting (Holt-Winters Double Exponential Smoothing and Linear Trend with Cyclical Seasonality) with strict chronological holdout test validation (MAE, RMSE, MAPE) and 95% confidence intervals.

---

## 1. System Architecture

```
[ Client: React + TypeScript + Vite + Tailwind CSS + Recharts ]
                            │
                       HTTP / REST
                            │
                            ▼
    [ Express Server (server.ts) / FastAPI (backend/app.py) ]
      ├── Ingestion & ETL Pipeline (server/etl.ts | etl_pipeline.py)
      │     └── CSV Sniffing, Type Inference, Schema Normalization, Validation
      ├── Time-Series Forecasting (server/forecaster.ts | forecaster.py)
      │     └── Holt's Linear, Grid Search (α, β), OLS Trend + Seasonality, MAE/RMSE/MAPE
      └── Central Storage Layer (server/db.ts)
            └── Persistent File Store (.data/db.json) with MongoDB Atlas Adapter
```

---

## 2. Implemented Features

1. **Authentication & Identity Management**
   - Full user registration, login, and token session authorization.
   - Passwords hashed with PBKDF2 using SHA-512 and unique salt.
   - Profile management, password modification, and forgot-password reset workflow.
   - Built-in 1-Click "Demo Analyst" account pre-seeded with 12 months of transactions.

2. **Automated CSV Data Ingestion & ETL Pipeline**
   - File drag-and-drop or file system browse.
   - Automated delimiter sniffing, header extraction, and column data type inference (`date`, `number`, `string`).
   - Interactive schema mapping: Date, Sales/Revenue, Product, Category, Units Sold, and Order ID.
   - Quality audit report: Detects unparseable dates, negative revenue, duplicate records, and calculates ingestion runtime in milliseconds.

3. **Grounded Sales Analytics**
   - Real-time aggregation of ingested sales transactions.
   - Total volume, transaction count, average order value (AOV), and departmental revenue breakdown.
   - Daily sales trends with 7-day rolling moving average.
   - Day-of-week cyclical distribution analysis.
   - Exportable analytics tables in CSV format.

4. **Statistical Machine Learning Forecasting**
   - **Holt-Winters (Double Exponential Smoothing)**: Dynamically estimates level ($\ell_t$) and trend ($b_t$) with optimal parameter tuning ($\alpha, \beta$) via grid search on training RMSE.
   - **Linear Trend with 7-Day Seasonality**: Fits Ordinary Least Squares (OLS) secular trend plus day-of-week cyclical residuals.
   - **7-Day Moving Average Baseline**: Trailing benchmark comparison.
   - **Chronological Train/Test Holdout Split**: 20% holdout split avoiding data leakage or lookahead bias.
   - **Real Metrics**: Genuine Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Absolute Percentage Error (MAPE).
   - **Uncertainty Intervals**: Expanding 95% confidence bounds ($\pm 1.96 \cdot \sigma \cdot \sqrt{h}$) derived from model residual variance.
   - **Downloadable Forecast Schedules**: Export full future predictions and historical fitted values to CSV.

5. **Product & SKU Performance**
   - SKU-level revenue, units shipped, order count, and average unit price realization.
   - Instant search and multi-column sorting (by revenue, units, or order volume).
   - Export product catalog metrics directly to CSV.

6. **Executive Performance Reports & Audit History**
   - Generates executive audit reports synthesized from actual transaction distributions.
   - Audit trail of previous forecast runs with historical model accuracy benchmarks.
   - Print-to-PDF ready views.

7. **Theme & User Interface**
   - Clean, professional white background default with deep indigo/blue hierarchy.
   - Dark slate mode support with persistent preference in `localStorage`.
   - Adheres to the 3-Zone Top Bar Contract and Zero-Pill typography discipline.
   - Tabular figures (`tabular-nums`) across all numbers, metrics, and data tables.

---

## 3. Quick Start & Run Commands

### Development Server (Full-Stack Express + React Vite)

```bash
# 1. Install all dependencies
npm install

# 2. Run dev server (Express backend + Vite client on port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
npm start
```

### Python Companion Microservice (Optional)

If running the Python FastAPI / Statsmodels backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

FastAPI OpenAPI interactive documentation will be available at `http://localhost:8000/docs`.

---

## 4. Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Web server port | `3000` |
| `SECRET_KEY` | Cryptographic secret for tokens | Random 64-char hex string |
| `MONGODB_URI` | MongoDB connection URI (optional) | `mongodb+srv://...` |
| `MONGODB_DATABASE` | Database name | `smartsales` |
| `CORS_ORIGINS` | Allowed origins | `*` |
| `MODEL_DIR` | Saved model artifacts path | `./models` |

---

## 5. MongoDB Atlas Setup Instructions

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user and generate a secure password.
3. Under **Network Access**, add IP `0.0.0.0/0` (or your host IP address).
4. Click **Connect** → **Drivers** and copy your connection string.
5. In `.env`, set:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartsales?retryWrites=true&w=majority"
   MONGODB_DATABASE="smartsales"
   ```
6. The application will connect directly to MongoDB collections (`users`, `datasets`, `sales_records`, `forecasts`, `etl_logs`, `reports`). If `MONGODB_URI` is omitted, the app gracefully uses the high-performance persistent local JSON store at `.data/smartsales_db.json`.

---

## 6. Pre-Loaded Demonstration Data

For quick exploration without preparing a CSV:
- **Email**: `analyst@smartsales.io`
- **Password**: `SalesDemo2026!`
- Or simply click the **"Sign in as Demo Analyst (1-Click)"** button on the Login screen!
- Pre-loaded with **365 days of omnichannel retail transactions** across 10 products and 4 core departments.
