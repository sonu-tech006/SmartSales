export interface HistoricalPoint {
  date: string;
  actual: number;
}

export interface PredictionPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  isFuture: boolean;
  actual?: number;
}

export interface ForecastResult {
  modelType: 'holt_winters' | 'linear_seasonal' | 'moving_average';
  horizonDays: number;
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    trainCount: number;
    testCount: number;
    testDates: string[];
  };
  predictions: PredictionPoint[];
  historicalSummary: HistoricalPoint[];
}

// Helper: Format Date YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Add days to date
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

// Ordinary Least Squares Linear Regression
function olsRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += y[i];
    sumXY += i * y[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// Holt's Linear Exponential Smoothing (Level + Trend)
function holtLinearForecast(
  history: number[],
  alpha: number,
  beta: number,
  steps: number
): { fitted: number[]; future: number[] } {
  const n = history.length;
  if (n === 0) return { fitted: [], future: Array(steps).fill(0) };
  if (n === 1) return { fitted: [history[0]], future: Array(steps).fill(history[0]) };

  let level = history[0];
  let trend = history[1] - history[0];
  const fitted: number[] = [level];

  for (let t = 1; t < n; t++) {
    const prevLevel = level;
    const prevTrend = trend;
    level = alpha * history[t] + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    fitted.push(Math.max(0, prevLevel + prevTrend));
  }

  const future: number[] = [];
  for (let h = 1; h <= steps; h++) {
    const val = level + h * trend;
    future.push(Math.max(0, val));
  }

  return { fitted, future };
}

// Optimize Alpha and Beta via Grid Search on training portion
function optimizeHoltParameters(trainSeries: number[]): { alpha: number; beta: number } {
  let bestAlpha = 0.3;
  let bestBeta = 0.1;
  let minRmse = Infinity;

  // Grid search over standard parameter space
  const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  const betas = [0.05, 0.1, 0.15, 0.2, 0.3];

  for (const a of alphas) {
    for (const b of betas) {
      const { fitted } = holtLinearForecast(trainSeries, a, b, 1);
      let sse = 0;
      for (let i = 1; i < trainSeries.length; i++) {
        const err = trainSeries[i] - fitted[i];
        sse += err * err;
      }
      const rmse = Math.sqrt(sse / (trainSeries.length - 1));
      if (rmse < minRmse) {
        minRmse = rmse;
        bestAlpha = a;
        bestBeta = b;
      }
    }
  }

  return { alpha: bestAlpha, beta: bestBeta };
}

// Linear Trend with Day-of-Week Seasonality
function linearSeasonalForecast(
  history: { date: string; value: number }[],
  steps: number
): { fitted: number[]; future: number[] } {
  const y = history.map((h) => h.value);
  const n = y.length;
  const { slope, intercept } = olsRegression(y);

  // Compute 7-day cyclical offsets
  const dayResiduals: number[][] = [[], [], [], [], [], [], []];
  y.forEach((val, i) => {
    const trendVal = intercept + slope * i;
    const dayOfWeek = new Date(history[i].date + 'T00:00:00Z').getUTCDay();
    dayResiduals[dayOfWeek].push(val - trendVal);
  });

  const seasonalIndices = dayResiduals.map((residuals) => {
    if (residuals.length === 0) return 0;
    return residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
  });

  const fitted: number[] = [];
  for (let i = 0; i < n; i++) {
    const dayOfWeek = new Date(history[i].date + 'T00:00:00Z').getUTCDay();
    const est = Math.max(0, intercept + slope * i + seasonalIndices[dayOfWeek]);
    fitted.push(est);
  }

  const future: number[] = [];
  const lastDate = history[n - 1].date;
  for (let h = 1; h <= steps; h++) {
    const targetDateStr = addDays(lastDate, h);
    const dayOfWeek = new Date(targetDateStr + 'T00:00:00Z').getUTCDay();
    const est = Math.max(0, intercept + slope * (n - 1 + h) + seasonalIndices[dayOfWeek]);
    future.push(est);
  }

  return { fitted, future };
}

// Moving Average Baseline (7-day window)
function movingAverageForecast(
  history: number[],
  windowSize = 7,
  steps: number
): { fitted: number[]; future: number[] } {
  const n = history.length;
  const fitted: number[] = [];

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = history.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    fitted.push(avg);
  }

  const lastSlice = history.slice(Math.max(0, n - windowSize));
  const recentAvg = lastSlice.reduce((a, b) => a + b, 0) / Math.max(1, lastSlice.length);
  const future: number[] = Array(steps).fill(Math.max(0, recentAvg));

  return { fitted, future };
}

// Calculate Accuracy Metrics (MAE, RMSE, MAPE) on Holdout Test Set
export function computeMetrics(actuals: number[], predictions: number[]): { mae: number; rmse: number; mape: number } {
  if (actuals.length === 0 || predictions.length === 0) {
    return { mae: 0, rmse: 0, mape: 0 };
  }

  const count = Math.min(actuals.length, predictions.length);
  let totalAbsError = 0;
  let totalSqError = 0;
  let mapeSum = 0;
  let validMapeCount = 0;

  for (let i = 0; i < count; i++) {
    const actual = actuals[i];
    const pred = predictions[i];
    const absErr = Math.abs(actual - pred);

    totalAbsError += absErr;
    totalSqError += absErr * absErr;

    // Guard against division by zero in MAPE
    if (actual > 0.001) {
      mapeSum += (absErr / actual) * 100;
      validMapeCount++;
    }
  }

  const mae = Math.round((totalAbsError / count) * 100) / 100;
  const rmse = Math.round(Math.sqrt(totalSqError / count) * 100) / 100;
  const mape = validMapeCount > 0 ? Math.round((mapeSum / validMapeCount) * 100) / 100 : 0;

  return { mae, rmse, mape };
}

// Main Time-Series Forecasting Execution
export function generateForecast(
  rawPoints: { date: string; revenue: number }[],
  modelType: 'holt_winters' | 'linear_seasonal' | 'moving_average' = 'holt_winters',
  horizonDays: number = 30
): ForecastResult {
  if (rawPoints.length === 0) {
    throw new Error('Cannot generate forecast: No data points provided');
  }

  // 1. Daily Aggregation
  const dailyMap = new Map<string, number>();
  for (const pt of rawPoints) {
    dailyMap.set(pt.date, (dailyMap.get(pt.date) || 0) + pt.revenue);
  }

  const sortedDates = Array.from(dailyMap.keys()).sort();
  if (sortedDates.length < 5) {
    throw new Error(
      `Insufficient distinct dates (${sortedDates.length}). A minimum of 5 distinct chronological dates is required for valid statistical modeling.`
    );
  }

  // 2. Build Continuous Daily Time Series
  const continuousSeries: { date: string; value: number }[] = [];
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  let curr = minDate;
  while (curr <= maxDate) {
    continuousSeries.push({
      date: curr,
      value: dailyMap.get(curr) || 0,
    });
    curr = addDays(curr, 1);
  }

  const allValues = continuousSeries.map((s) => s.value);
  const totalPoints = continuousSeries.length;

  // 3. Chronological Train / Test Split
  // Use last 20% (minimum 3, max 30) as holdout test set to evaluate real accuracy
  const testSize = Math.max(3, Math.min(30, Math.floor(totalPoints * 0.2)));
  const trainSize = totalPoints - testSize;

  const trainSeries = continuousSeries.slice(0, trainSize);
  const testSeries = continuousSeries.slice(trainSize);

  const trainValues = trainSeries.map((s) => s.value);
  const testValues = testSeries.map((s) => s.value);

  // 4. Fit Model on Training Data to evaluate on Holdout Test Set
  let testPredictions: number[] = [];

  if (modelType === 'holt_winters') {
    const { alpha, beta } = optimizeHoltParameters(trainValues);
    const evalForecast = holtLinearForecast(trainValues, alpha, beta, testSize);
    testPredictions = evalForecast.future;
  } else if (modelType === 'linear_seasonal') {
    const evalForecast = linearSeasonalForecast(trainSeries, testSize);
    testPredictions = evalForecast.future;
  } else {
    const evalForecast = movingAverageForecast(trainValues, 7, testSize);
    testPredictions = evalForecast.future;
  }

  const metrics = computeMetrics(testValues, testPredictions);
  const holdoutMetrics = {
    ...metrics,
    trainCount: trainSize,
    testCount: testSize,
    testDates: testSeries.map((s) => s.date),
  };

  // 5. Fit Model on Complete Historical Series for Out-of-Sample Future Predictions
  let futureValues: number[] = [];
  let fullFitted: number[] = [];

  if (modelType === 'holt_winters') {
    const { alpha, beta } = optimizeHoltParameters(allValues);
    const finalFit = holtLinearForecast(allValues, alpha, beta, horizonDays);
    fullFitted = finalFit.fitted;
    futureValues = finalFit.future;
  } else if (modelType === 'linear_seasonal') {
    const finalFit = linearSeasonalForecast(continuousSeries, horizonDays);
    fullFitted = finalFit.fitted;
    futureValues = finalFit.future;
  } else {
    const finalFit = movingAverageForecast(allValues, 7, horizonDays);
    fullFitted = finalFit.fitted;
    futureValues = finalFit.future;
  }

  // 6. Calculate Residual Variance & 95% Prediction Confidence Intervals
  let residualSumSq = 0;
  for (let i = 0; i < totalPoints; i++) {
    const err = allValues[i] - fullFitted[i];
    residualSumSq += err * err;
  }
  const residualStdDev = Math.sqrt(residualSumSq / Math.max(1, totalPoints - 2));

  // 7. Assemble Structured Predictions List
  const predictions: PredictionPoint[] = [];

  // Historical fitted points (last 30 points for context)
  const contextSliceStart = Math.max(0, totalPoints - 30);
  for (let i = contextSliceStart; i < totalPoints; i++) {
    predictions.push({
      date: continuousSeries[i].date,
      predicted: Math.round(fullFitted[i] * 100) / 100,
      actual: Math.round(allValues[i] * 100) / 100,
      lowerBound: Math.max(0, Math.round((fullFitted[i] - 1.96 * residualStdDev) * 100) / 100),
      upperBound: Math.round((fullFitted[i] + 1.96 * residualStdDev) * 100) / 100,
      isFuture: false,
    });
  }

  // Future predicted points with expanding confidence interval
  for (let h = 1; h <= horizonDays; h++) {
    const futureDate = addDays(maxDate, h);
    const predVal = Math.round(futureValues[h - 1] * 100) / 100;
    // Standard error widens with root of horizon step
    const intervalDelta = 1.96 * residualStdDev * Math.sqrt(1 + h / 10);

    predictions.push({
      date: futureDate,
      predicted: predVal,
      lowerBound: Math.max(0, Math.round((predVal - intervalDelta) * 100) / 100),
      upperBound: Math.round((predVal + intervalDelta) * 100) / 100,
      isFuture: true,
    });
  }

  const historicalSummary: HistoricalPoint[] = continuousSeries.slice(-60).map((s) => ({
    date: s.date,
    actual: Math.round(s.value * 100) / 100,
  }));

  return {
    modelType,
    horizonDays,
    metrics: holdoutMetrics,
    predictions,
    historicalSummary,
  };
}
