import React, { useState, useEffect } from 'react';
import { History, Download, Trash2, Eye, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { Forecast } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';

interface ForecastHistoryPageProps {
  onNavigate: (route: string) => void;
}

export const ForecastHistoryPage: React.FC<ForecastHistoryPageProps> = ({ onNavigate }) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getForecasts();
      setForecasts(res.forecasts);
    } catch (err: any) {
      toastError('Could not load forecast history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this forecast record?')) return;
    try {
      await api.deleteForecast(id);
      toastSuccess('Forecast deleted');
      setForecasts((prev) => prev.filter((f) => f.id !== id));
      if (selectedForecast?.id === id) setSelectedForecast(null);
    } catch (err: any) {
      toastError(err.message || 'Delete failed');
    }
  };

  const handleExportCSV = (forecast: Forecast) => {
    const headers = ['Date', 'Type', 'PredictedRevenue', 'LowerBound95', 'UpperBound95', 'ActualRevenue'];
    const rows = forecast.predictions.map((p) => [
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
    link.setAttribute('download', `${forecast.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Forecast CSV downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Forecast Audit History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of historical time-series model runs, validation benchmarks, and generated predictions
          </p>
        </div>

        <button
          onClick={() => onNavigate('forecasting')}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>New Forecast</span>
        </button>
      </div>

      {loading ? (
        <SkeletonLoader rows={5} />
      ) : forecasts.length === 0 ? (
        <EmptyState
          title="No Forecasts Run Yet"
          description="Configure and execute an exponential smoothing or linear seasonal forecast to populate the history ledger."
          icon={History}
          actionText="Run First Forecast"
          onAction={() => onNavigate('forecasting')}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Forecast Run Name</th>
                  <th className="py-3 px-4">Model Type</th>
                  <th className="py-3 px-4">Horizon</th>
                  <th className="py-3 px-4 text-right">Holdout MAE</th>
                  <th className="py-3 px-4 text-right">Holdout RMSE</th>
                  <th className="py-3 px-4 text-right">Holdout MAPE</th>
                  <th className="py-3 px-4">Run Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {forecasts.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">{f.name}</td>
                    <td className="py-3 px-4 font-sans text-indigo-700 font-medium">
                      {f.modelType.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{f.horizonDays} Days</td>
                    <td className="py-3 px-4 text-right text-slate-900 font-semibold">
                      ${f.metrics.mae.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      ${f.metrics.rmse.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      {f.metrics.mape}%
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleExportCSV(f)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                          title="Download CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Delete Forecast"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
