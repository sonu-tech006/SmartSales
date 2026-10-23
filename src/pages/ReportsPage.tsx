import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Printer, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { Dataset, Report, AnalyticsSummary } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';

interface ReportsPageProps {
  selectedDataset: Dataset | null;
  onNavigate: (route: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ selectedDataset, onNavigate }) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports();
      setReports(res.reports);
    } catch (err: any) {
      toastError('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedDataset) return;

    setGenerating(true);
    try {
      const res = await api.createReport({
        datasetId: selectedDataset.id,
        title: reportTitle.trim() || `${selectedDataset.name} Executive Audit`,
      });
      setReports((prev) => [res.report, ...prev]);
      setReportTitle('');
      toastSuccess('Executive report generated successfully');
    } catch (err: any) {
      toastError(err.message || 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select a dataset to compile an executive performance report."
        icon={Layers}
        actionText="Select Dataset"
        onAction={() => onNavigate('datasets')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Executive Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured business audits synthesizing transaction velocity, volume, and department drivers
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Generator Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Generate New Executive Audit</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder={`e.g., Q3 Comprehensive Performance Audit (${selectedDataset.name})`}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{generating ? 'Compiling Audit...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Generated Reports"
          description="Click 'Generate Report' above to assemble an executive performance summary."
          icon={FileSpreadsheet}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Coverage: {rep.dateRange.start} to {rep.dateRange.end} · Generated{' '}
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Volume</span>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono tabular-nums">
                    ${rep.metrics.totalRevenue.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Order Count</span>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono tabular-nums">
                    {rep.metrics.orderCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Top Department</span>
                  <div className="mt-1 text-xs font-semibold text-indigo-700 truncate">
                    {rep.metrics.topCategory}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Top SKU</span>
                  <div className="mt-1 text-xs font-semibold text-slate-800 truncate">
                    {rep.metrics.topProduct}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                {rep.summaryText}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
