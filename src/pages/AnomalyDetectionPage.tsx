import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Download,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Dataset, AnalyticsSummary } from '../types';
import { api } from '../lib/api';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';
import { useToast } from '../components/common/Toast';

interface AnomalyDetectionPageProps {
  selectedDataset: Dataset | null;
  onNavigate: (route: string) => void;
}

export interface AnomalyIncident {
  date: string;
  actual: number;
  expected: number;
  zScore: number;
  type: 'surge' | 'drop' | 'zero';
  severity: 'high' | 'medium';
  action: string;
}

export const AnomalyDetectionPage: React.FC<AnomalyDetectionPageProps> = ({
  selectedDataset,
  onNavigate,
}) => {
  const { success: toastSuccess } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [sensitivity, setSensitivity] = useState<number>(2.0); // Z-Score threshold

  useEffect(() => {
    if (!selectedDataset) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getAnalytics(selectedDataset.id);
        setAnalytics(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedDataset]);

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select a dataset to scan for statistical revenue anomalies, drops, and unusual spikes."
        icon={Layers}
        actionText="Select Dataset"
        onAction={() => onNavigate('datasets')}
      />
    );
  }

  const trends = analytics?.dailyTrends || [];

  // Calculate Rolling Mean, Std Dev, and Z-Score Anomalies
  const windowSize = 14;
  const enrichedData: any[] = [];
  const anomalies: AnomalyIncident[] = [];

  for (let i = 0; i < trends.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = trends.slice(start, i + 1).map((t) => t.revenue);
    const mean = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;

    let variance = 0;
    for (const val of windowSlice) {
      variance += Math.pow(val - mean, 2);
    }
    const stdDev = Math.sqrt(variance / Math.max(1, windowSlice.length));

    const currentRevenue = trends[i].revenue;
    const zScore = stdDev > 0 ? (currentRevenue - mean) / stdDev : 0;

    let isAnomaly = false;
    let anomalyType: 'surge' | 'drop' | 'zero' = 'surge';

    if (currentRevenue === 0 && mean > 100) {
      isAnomaly = true;
      anomalyType = 'zero';
    } else if (Math.abs(zScore) >= sensitivity && i >= 5) {
      isAnomaly = true;
      anomalyType = zScore > 0 ? 'surge' : 'drop';
    }

    if (isAnomaly) {
      anomalies.push({
        date: trends[i].date,
        actual: currentRevenue,
        expected: Math.round(mean * 100) / 100,
        zScore: Math.round(zScore * 10) / 10,
        type: anomalyType,
        severity: Math.abs(zScore) >= 3.0 ? 'high' : 'medium',
        action:
          anomalyType === 'surge'
            ? 'Identify viral marketing driver or bulk commercial order'
            : anomalyType === 'zero'
            ? 'Verify payment gateway uptime and data sync logs'
            : 'Audit inventory stockout or pricing configuration glitch',
      });
    }

    enrichedData.push({
      date: trends[i].date,
      revenue: currentRevenue,
      expected: Math.round(mean * 100) / 100,
      anomalyRevenue: isAnomaly ? currentRevenue : null,
      isAnomaly,
      anomalyType,
    });
  }

  const handleExportCSV = () => {
    if (!anomalies.length) return;
    const headers = ['Date', 'Type', 'ActualRevenue', 'ExpectedBaseline', 'ZScore', 'Severity', 'RecommendedAction'];
    const rows = anomalies.map((a) => [
      a.date,
      a.type.toUpperCase(),
      a.actual,
      a.expected,
      a.zScore,
      a.severity,
      `"${a.action}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataset.name}_anomalies.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Anomaly audit log exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Statistical Anomaly & Outlier Scanner</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated Z-Score and volatility analysis across transaction history to uncover revenue spikes and drops
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={anomalies.length === 0}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Anomaly Log</span>
        </button>
      </div>

      {/* Sensitivity Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Scanner Sensitivity (Z-Score Threshold)
          </span>
          <p className="text-[11px] text-slate-500">
            Higher values flag only extreme statistical deviations ($Z \ge 2.5$)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1.8, 2.0, 2.5, 3.0].map((thresh) => (
            <button
              key={thresh}
              onClick={() => setSensitivity(thresh)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                sensitivity === thresh
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {thresh}σ ({thresh >= 2.5 ? 'Conservative' : 'Sensitive'})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={5} />
      ) : (
        <>
          {/* Anomaly Detection Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Revenue Volatility & Outlier Markers
                </h2>
                <p className="text-xs text-slate-500">
                  Showing actual sales against 14-day rolling statistical expectation band
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-indigo-600"></span>
                  <span className="text-slate-600 dark:text-slate-400">Daily Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Flagged Outlier</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedData.slice(-60)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
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
                    formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()}`, String(name || '')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    dot={false}
                    name="14D Rolling Mean"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={false}
                    name="Actual Sales"
                  />
                  <Scatter
                    dataKey="anomalyRevenue"
                    fill="#EF4444"
                    shape="circle"
                    name="Anomaly Outlier"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly Incident Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Detected Incident Ledger ({anomalies.length} Flagged Events)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Z-Score $\ge$ {sensitivity}σ
              </span>
            </div>

            {anomalies.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <span>No statistical anomalies detected under current threshold. Data is smooth and stable.</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Event Date</th>
                      <th className="py-2.5 px-4">Classification</th>
                      <th className="py-2.5 px-4 text-right">Actual Revenue</th>
                      <th className="py-2.5 px-4 text-right">Expected Baseline</th>
                      <th className="py-2.5 px-4 text-right">Z-Score</th>
                      <th className="py-2.5 px-4">Recommended Analyst Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                    {anomalies.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                          {a.date}
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          {a.type === 'surge' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded text-[11px]">
                              <ArrowUpRight className="w-3 h-3" />
                              SURGE SPIKE
                            </span>
                          ) : a.type === 'drop' ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded text-[11px]">
                              <ArrowDownRight className="w-3 h-3" />
                              REVENUE DROP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded text-[11px]">
                              ZERO-SALES OUTAGE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                          ${a.actual.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500">
                          ${a.expected.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                          {a.zScore > 0 ? `+${a.zScore}` : a.zScore}σ
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-300 text-[11px]">
                          {a.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
