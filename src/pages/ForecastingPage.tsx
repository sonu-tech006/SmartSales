import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  Table,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Dataset, Forecast } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';

interface ForecastingPageProps {
  selectedDataset: Dataset | null;
  onNavigate: (route: string) => void;
}

export const ForecastingPage: React.FC<ForecastingPageProps> = ({
  selectedDataset,
  onNavigate,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [modelType, setModelType] = useState<'holt_winters' | 'linear_seasonal' | 'moving_average'>('holt_winters');
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [forecastName, setForecastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentForecast, setCurrentForecast] = useState<Forecast | null>(null);

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select or import a sales dataset to configure statistical time series models."
        icon={Layers}
        actionText="Go to Datasets"
        onAction={() => onNavigate('datasets')}
      />
    );
  }

  const handleRunForecast = async () => {
    setLoading(true);
    try {
      const res = await api.generateForecast(selectedDataset.id, {
        modelType,
        horizonDays,
        forecastName: forecastName.trim() || undefined,
      });
      setCurrentForecast(res.forecast);
      toastSuccess(`Forecast generated using ${modelType.replace('_', ' ')}`);
    } catch (err: any) {
      toastError(err.message || 'Forecast generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!currentForecast) return;
    const headers = ['Date', 'Type', 'PredictedRevenue', 'LowerBound95', 'UpperBound95', 'ActualRevenue'];
    const rows = currentForecast.predictions.map((p) => [
      p.date,
      p.isFuture ? 'Forecast' : 'Historical_Fitted',
      p.predicted,
      p.lowerBound,
      p.upperBound,
      p.actual !== undefined ? p.actual : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentForecast.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Forecast CSV downloaded');
  };

  // Prepare chart data combining predictions and bounds
  const chartData = currentForecast
    ? currentForecast.predictions.map((p) => ({
        date: p.date,
        actual: p.actual !== undefined ? p.actual : null,
        predicted: p.predicted,
        lowerBound: p.isFuture ? p.lowerBound : null,
        upperBound: p.isFuture ? p.upperBound : null,
        isFuture: p.isFuture,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sales Forecasting Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical time series forecasting with holdout test validation and 95% confidence intervals
          </p>
        </div>

        {currentForecast && (
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Forecast CSV</span>
          </button>
        )}
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Model Configuration</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Metric</label>
            <input
              type="text"
              readOnly
              value={`${selectedDataset.columnMappings.sales} (Revenue)`}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            />
          </div>

          {/* Model Algorithm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Forecasting Model</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="holt_winters">Holt-Winters (Double Exp Smoothing)</option>
              <option value="linear_seasonal">Linear Trend + Day-of-Week Seasonality</option>
              <option value="moving_average">7-Day Moving Average Baseline</option>
            </select>
          </div>

          {/* Horizon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Forecast Horizon</label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {[7, 30, 90].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizonDays(h)}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                    horizonDays === h
                      ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleRunForecast}
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{loading ? 'Executing Model...' : 'Run Forecast Model'}</span>
            </button>
          </div>
        </div>

        {/* Model Explanation */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {modelType === 'holt_winters' && (
              <>
                <strong>Holt's Linear Exponential Smoothing</strong> updates level ($\ell_t$) and trend ($b_t$) simultaneously.
                Smoothing parameters ($\alpha, \beta$) are dynamically optimized using grid search against historical RMSE.
              </>
            )}
            {modelType === 'linear_seasonal' && (
              <>
                <strong>Linear Trend with 7-Day Seasonality</strong> computes an Ordinary Least Squares (OLS) secular trend line, then applies additive day-of-week cyclical offsets to capture recurring weekly business patterns.
              </>
            )}
            {modelType === 'moving_average' && (
              <>
                <strong>7-Day Moving Average Baseline</strong> provides a benchmark standard using a trailing rolling window average.
              </>
            )}
          </span>
        </div>
      </div>

      {loading && <SkeletonLoader rows={5} />}

      {/* Forecast Output */}
      {currentForecast && (
        <>
          {/* Model Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Holdout Test MAE
              </span>
              <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                ${currentForecast.metrics.mae.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Mean Absolute Error on test points</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Holdout Test RMSE
              </span>
              <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                ${currentForecast.metrics.rmse.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Root Mean Squared Error</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Holdout Test MAPE
              </span>
              <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {currentForecast.metrics.mape}%
              </div>
              <span className="text-[11px] text-slate-400">Mean Absolute Percentage Error</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Validation Sample
              </span>
              <div className="mt-1 text-lg font-bold text-slate-900 font-mono tabular-nums">
                {currentForecast.metrics.trainCount} Train / {currentForecast.metrics.testCount} Test
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Strict chronological split</span>
            </div>
          </div>

          {/* Main Forecast Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Historical vs Out-of-Sample Forecast</h2>
                <p className="text-xs text-slate-500">
                  Showing historical context alongside {currentForecast.horizonDays}-day projections with 95% confidence intervals
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  <span className="text-slate-600">Historical Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-indigo-600 border-t border-indigo-600"></span>
                  <span className="text-slate-600">Model Prediction</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-indigo-100 rounded-xs"></span>
                  <span className="text-slate-600">95% Confidence Band</span>
                </div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name?: any) => {
                      if (val === null || val === undefined) return ['—', String(name || '')];
                      return [`$${Number(val).toLocaleString()}`, String(name || '')];
                    }}
                  />
                  {/* Confidence Interval Area */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="#EEF2FF"
                    name="Upper Bound (95%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="#FFFFFF"
                    name="Lower Bound (95%)"
                  />
                  {/* Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={false}
                    name="Predicted Sales"
                  />
                  {/* Historical Line */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#0F172A"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#0F172A' }}
                    name="Actual Sales"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-600" />
                <span>Future Projections Schedule ({currentForecast.horizonDays} Days Ahead)</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {currentForecast.predictions.filter((p) => p.isFuture).length} daily points
              </span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Projected Revenue</th>
                    <th className="py-2.5 px-4 text-right">Lower Bound (95%)</th>
                    <th className="py-2.5 px-4 text-right">Upper Bound (95%)</th>
                    <th className="py-2.5 px-4 text-right">Interval Width</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {currentForecast.predictions
                    .filter((p) => p.isFuture)
                    .map((point) => (
                      <tr key={point.date} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 font-sans font-medium text-slate-800">{point.date}</td>
                        <td className="py-2 px-4 text-right font-semibold text-indigo-600">
                          ${point.predicted.toLocaleString()}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-500">
                          ${point.lowerBound.toLocaleString()}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-500">
                          ${point.upperBound.toLocaleString()}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          ${Math.round(point.upperBound - point.lowerBound).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
