<div align="center">

# 🚀 SmartSales — Sales Forecasting & Analytics Platform
### *Enterprise ML-Powered Sales Forecasting, ETL Ingestion & Automated Anomaly Detection*

[![Live Demo](https://img.shields.io/badge/Live_App-https%3A%2F%2Fsmartsales.ai.studio-4F46E5?style=for-the-badge&logo=googlecloud&logoColor=white)](https://smartsales.ai.studio.)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

**🌐 Production Deployment URL:** [https://smartsales.ai.studio.](https://smartsales.ai.studio.)

</div>

---

## 📌 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack & Logos](#-tech-stack--technologies)
- [System Architecture & Flowchart](#-system-architecture--project-flow)
- [Machine Learning & Mathematical Forecasting](#-machine-learning--mathematical-forecasting)
- [ETL Data Pipeline](#-etl-data-engineering-pipeline)
- [Installation & Quick Start](#-installation--quick-start)
- [API Reference](#-api-endpoints)
- [License](#-license)
- [Author & Connect](#-author--connect)

---

## 🌟 Overview

**SmartSales** is an end-to-end, full-stack sales forecasting and data intelligence platform designed for **Data Scientists, Machine Learning Engineers, and Revenue Analysts**. 

Unlike mock dashboard demos, SmartSales implements **genuine statistical time-series algorithms** (Holt-Winters Double Exponential Smoothing, Linear Trend with Day-of-Week Seasonality, and Moving Average Baselines), strict chronological train/test holdout validation ($MAE$, $RMSE$, $MAPE$), a resilient automated CSV ingestion ETL pipeline with live schema profiling, What-If simulation stress testing, and real-time statistical outlier detection.

---

## 🎯 Key Features

- **Automated CSV Ingestion & ETL Pipeline**: Delimiter sniffing, type inference (`date`, `number`, `string`), schema auto-mapping, and interactive **First 10 Sample Records Preview** table with mapped signal indicators.
- **Statistical Time-Series Forecasting**:
  - *Holt-Winters Double Exponential Smoothing* with grid-search hyperparameter optimization ($\alpha, \beta$).
  - *Linear Trend + Day-of-Week Cyclical Seasonality* using Ordinary Least Squares (OLS).
  - *Moving Average Baseline* for benchmark comparisons.
  - Strict **20% chronological holdout test set** with real Mean Absolute Error ($MAE$), Root Mean Squared Error ($RMSE$), and Mean Absolute Percentage Error ($MAPE$).
  - Expanding 95% Confidence Intervals ($\pm 1.96 \cdot \sigma \cdot \sqrt{h}$).
- **Interactive What-If Sales Simulator**: Live stress-testing levers for marketing budget changes, price elasticity, seasonality, and conversion rate lifts with dual trajectory charts.
- **Statistical Anomaly & Outlier Scanner**: Automated rolling 14-day Z-Score analysis ($Z \ge 2.0\sigma$) detecting revenue surges, drops, and zero-sales outages with incident ledgers.
- **Product & Category Analytics**: Ingested transaction aggregations, departmental revenue shares, top/declining SKUs, and tabular CSV exports.
- **Multi-Theme Canvas**: Instant switching between *Pure Crisp White*, *Slate Charcoal*, and *Midnight Indigo* modes.
- **Enterprise Security**: PBKDF2 with SHA-512 cryptographic password hashing, HMAC-SHA256 signed session tokens, and cross-user data isolation.

---

## 🛠 Tech Stack & Technologies

### Frontend
| Technology | Badge / Logo | Purpose |
|---|---|---|
| **React 19** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | Dynamic UI component architecture & hooks |
| **TypeScript** | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) | End-to-end type safety & data contracts |
| **Vite 8** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Blazing-fast build tool & dev middleware |
| **Tailwind CSS v4** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Modern utility styling with dark variant support |
| **Recharts** | ![Recharts](https://img.shields.io/badge/Recharts-22c55e?style=flat-square&logo=chartdotjs&logoColor=white) | Composed charts, confidence bands, & tooltips |
| **Lucide Icons** | ![Lucide](https://img.shields.io/badge/Lucide_Icons-F97316?style=flat-square&logo=feather&logoColor=white) | Crisp accessible iconography |

### Backend & Data Engineering
| Technology | Badge / Logo | Purpose |
|---|---|---|
| **Node.js & Express** | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) | High-performance full-stack API server |
| **Python 3.11** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) | Companion data science & ML microservice |
| **FastAPI** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) | OpenAPI documented REST microservice |
| **Pandas & NumPy** | ![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white) ![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white) | High-throughput data frames & matrix algebra |
| **Statsmodels** | ![Statsmodels](https://img.shields.io/badge/Statsmodels-1A5276?style=flat-square&logo=scipy&logoColor=white) | Exponential smoothing & time-series analysis |
| **Scikit-learn** | ![Scikit-learn](https://img.shields.io/badge/scikit_learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white) | Linear regression & model evaluation metrics |
| **MongoDB / File DB** | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white) | Persistent document storage with local fallback |

---

## 📐 System Architecture & Project Flow

```mermaid
flowchart TD
    subgraph Client["🖥️ Frontend Client (React 19 + TypeScript + Tailwind)"]
        UI["App Shell & Navigation"]
        Dash["Dashboard Overview & Analytics"]
        ETL_UI["CSV Import & 10-Row Dense Preview"]
        FC_UI["Forecasting Lab & What-If Simulator"]
        Anomaly_UI["Anomaly & Outlier Scanner"]
    end

    subgraph Server["⚙️ Server & Business Logic Layer (server.ts / Express)"]
        Auth["Auth & PBKDF2 Crypto (JWT / Tokens)"]
        ETL_Eng["ETL Pipeline (Type Sniffer & Normalizer)"]
        FC_Eng["Time-Series Forecaster (Holt-Winters & OLS)"]
        Sim_Eng["Scenario Simulation Engine"]
        Anom_Eng["Z-Score Statistical Anomaly Detector"]
    end

    subgraph Storage["💾 Persistence Layer"]
        DB[(JSON File Store / MongoDB Atlas)]
        SampleStore["Pre-loaded 12-Month Retail Data"]
    end

    subgraph PythonBackend["🐍 Python ML Companion (backend/)"]
        FastAPI_App["FastAPI Microservice (app.py)"]
        Pandas_ETL["Pandas Pipeline (etl_pipeline.py)"]
        Stats_FC["Statsmodels Holt-Winters (forecaster.py)"]
    end

    UI --> Auth
    ETL_UI -->|Upload CSV Text| ETL_Eng
    ETL_Eng -->|Sanitize & Validate| DB
    Dash -->|Fetch Aggregates| DB
    FC_UI -->|Run Horizon 7D/30D/90D| FC_Eng
    FC_Eng -->|Chronological Train/Test Split| DB
    FC_Eng -->|Store Model Run| DB
    Sim_Eng --> FC_UI
    Anom_Eng --> Anomaly_UI
    SampleStore --> DB
    FastAPI_App -.->|Alternative Endpoint| Pandas_ETL
    Pandas_ETL -.-> Stats_FC
```

---

## 📊 Machine Learning & Mathematical Forecasting

### 1. Holt-Winters Double Exponential Smoothing (Level + Trend)
$$\ell_t = \alpha y_t + (1 - \alpha)(\ell_{t-1} + b_{t-1})$$
$$b_t = \beta(\ell_t - \ell_{t-1}) + (1 - \beta)b_{t-1}$$
$$\hat{y}_{t+h} = \ell_t + h \cdot b_t$$
*Parameters $\alpha \in [0.1, 0.9]$ and $\beta \in [0.05, 0.3]$ are dynamically selected through a training grid search minimizing root-mean-squared error.*

### 2. Chronological Holdout Validation Metrics
- **Mean Absolute Error (MAE)**:
  $$MAE = \frac{1}{N} \sum_{i=1}^{N} |y_i - \hat{y}_i|$$
- **Root Mean Squared Error (RMSE)**:
  $$RMSE = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2}$$
- **Mean Absolute Percentage Error (MAPE)**:
  $$MAPE = \frac{1}{K} \sum_{y_i \ne 0} \frac{|y_i - \hat{y}_i|}{|y_i|} \times 100\%$$

### 3. Expanding 95% Confidence Bands
$$\text{Interval} = \hat{y}_{t+h} \pm 1.96 \cdot \sigma_{\text{residuals}} \cdot \sqrt{1 + \frac{h}{10}}$$

---

## ⚡ ETL Data Engineering Pipeline

```
[Raw CSV Text] ──► [PapaParse / Sniffer] ──► [Type Inference (Date / Number)] 
       │
       ▼
[Column Mapping (Date, Sales, Product, Category, Qty)]
       │
       ▼
[Date Standardization (ISO YYYY-MM-DD)] ──► [Outlier & Negative Detection]
       │
       ▼
[First 10 Sample Records Preview Table] ──► [Validation Log & Ingestion DB]
```

---

## 🚀 Installation & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smartsales.git
cd smartsales
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Provide `MONGODB_URI` for MongoDB Atlas; defaults to persistent file storage at `.data/smartsales_db.json`).*

### 4. Run Development Server
```bash
npm run dev
```
Visit **`http://localhost:3000`** in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

### 6. (Optional) Run Python FastAPI Microservice
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*Interactive Swagger docs available at `http://localhost:8000/docs`.*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new analyst account |
| `POST` | `/api/auth/login` | Sign in & receive session token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/datasets/upload/profile` | Sniff CSV headers & infer types |
| `POST` | `/api/datasets/upload/import` | Validate & persist dataset via ETL |
| `GET` | `/api/datasets/:id/analytics` | Fetch sales time-series & category aggregates |
| `POST` | `/api/datasets/:id/forecast` | Run Holt-Winters / Linear model with holdout split |
| `GET` | `/api/forecasts/:id/export` | Export forecast schedule as CSV |
| `POST` | `/api/reports` | Compile executive audit report |
| `GET` | `/api/samples/download` | Download 12-month raw CSV template |
| `GET` | `/api/health` | Service health status check |

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

---

## 👨‍💻 Author & Connect

<div align="left">

**Sonu Kumar**  
*Full-Stack Engineer & Data/ML Enthusiast*

- 🌐 **Live Platform Application**: [https://smartsales.ai.studio.](https://smartsales.ai.studio.)
- 💼 **Personal Portfolio**: [https://animated-portfolio-pro.vercel.app/](https://animated-portfolio-pro.vercel.app/)
- 🔗 **LinkedIn Profile**: [https://www.linkedin.com/in/sonu-kumar-3234bb344/](https://www.linkedin.com/in/sonu-kumar-3234bb344/)
- 📧 **Direct Email**: [sonukr7435@gmail.com](mailto:sonukr7435@gmail.com)

</div>

---
<div align="center">
  <sub>Built with ❤️ by Sonu Kumar · SmartSales Enterprise Forecasting & Analytics Platform</sub>
</div>
