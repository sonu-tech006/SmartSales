import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Layers,
  TrendingUp,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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

interface SalesAnalyticsPageProps {
  selectedDataset: Dataset | null;
  onNavigate: (route: string) => void;
}

export const SalesAnalyticsPage: React.FC<SalesAnalyticsPageProps> = ({
  selectedDataset,
  onNavigate,
}) => {
  const { success: toastSuccess } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'category'>('daily');

  useEffect(() => {
    if (!selectedDataset) return;

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.getAnalytics(selectedDataset.id);
        setAnalytics(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedDataset]);

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select an ingested sales dataset to explore historical revenue distributions, seasonality, and product metrics."
        icon={Layers}
        actionText="Select Dataset"
        onAction={() => onNavigate('datasets')}
      />
    );
  }

  if (loading) {
    return <SkeletonLoader rows={6} />;
  }

  const dailyTrends = analytics?.dailyTrends || [];
  const categories = analytics?.categoryBreakdown || [];

  const handleExportCSV = () => {
    if (!dailyTrends.length) return;
    const headers = ['Date', 'Revenue', 'Orders', 'Units', 'Rolling7DayAvg'];
    const rows = dailyTrends.map((d) => [
      d.date,
      d.revenue,
      d.orders,
      d.units,
      d.rolling7 || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataset.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Analytics table exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sales & Trend Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical sales decomposition across {selectedDataset.summaryStats.startDate} to {selectedDataset.summaryStats.endDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'daily' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Daily Time Series
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'category' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Categories
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Analytics Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {viewMode === 'daily' ? 'Daily Ingested Sales & 7-Day Moving Baseline' : 'Departmental Revenue Share'}
            </h2>
            <p className="text-xs text-slate-500">
              {viewMode === 'daily'
                ? 'Chronological transaction aggregation showing raw volume alongside trend line'
                : 'Aggregated volume and unit density by department'}
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          {viewMode === 'daily' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyTrends.slice(-60)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  formatter={(val: any, name?: any) => [`$${Number(val).toLocaleString()}`, String(name || '')]}
                />
                <Bar dataKey="revenue" fill="#818CF8" opacity={0.6} radius={[2, 2, 0, 0]} name="Daily Sales" />
                <Line
                  type="monotone"
                  dataKey="rolling7"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={false}
                  name="7-Day Moving Avg"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={categories} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 11 }}
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
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Analytics Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <span>Category Performance Summary</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {categories.length} Categories Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Department / Category</th>
                <th className="py-2.5 px-4 text-right">Total Ingested Revenue</th>
                <th className="py-2.5 px-4 text-right">Units Shipped</th>
                <th className="py-2.5 px-4 text-right">Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {categories.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{cat.category}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    ${cat.revenue.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">
                    {cat.units.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-indigo-600 font-semibold">
                    {cat.sharePercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
