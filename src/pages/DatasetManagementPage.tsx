import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Dataset } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { SkeletonLoader, EmptyState } from '../components/common/UIComponents';

interface DatasetManagementPageProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (d: Dataset) => void;
  refreshDatasets: () => Promise<void>;
  onNavigate: (route: string) => void;
}

export const DatasetManagementPage: React.FC<DatasetManagementPageProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  refreshDatasets,
  onNavigate,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [viewingDataset, setViewingDataset] = useState<Dataset | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenPreview = async (dataset: Dataset, page = 1) => {
    setViewingDataset(dataset);
    setPreviewPage(page);
    setLoadingPreview(true);
    try {
      const res = await api.getDatasetPreview(dataset.id, page, 15);
      setPreviewRows(res.rows);
      setPreviewTotal(res.total);
    } catch (err: any) {
      toastError('Could not load data preview: ' + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async (dataset: Dataset) => {
    if (dataset.id === 'ds_retail_sample_2026') {
      toastError('Demonstration dataset is protected and cannot be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${dataset.name}" and all associated forecasts?`)) {
      return;
    }

    setDeletingId(dataset.id);
    try {
      await api.deleteDataset(dataset.id);
      toastSuccess(`Dataset "${dataset.name}" deleted`);
      await refreshDatasets();
      if (viewingDataset?.id === dataset.id) {
        setViewingDataset(null);
      }
    } catch (err: any) {
      toastError('Deletion failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dataset Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit ingested tables, inspect raw records, and configure active forecasting schemas
          </p>
        </div>

        <button
          onClick={() => onNavigate('import')}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import New CSV</span>
        </button>
      </div>

      {/* Dataset Grid */}
      {datasets.length === 0 ? (
        <EmptyState
          title="No Datasets Ingested"
          description="Upload a sales CSV file to begin running analytics and forecasts."
          icon={Layers}
          actionText="Import CSV"
          onAction={() => onNavigate('import')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map((d) => {
            const isSelected = selectedDataset?.id === d.id;
            const isSample = d.id === 'ds_retail_sample_2026';

            return (
              <div
                key={d.id}
                className={`bg-white border rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{d.name}</h3>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {d.description || `Ingested from ${d.filename}`}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 font-mono tabular-nums mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Valid Rows:</span>
                      <span className="font-semibold text-slate-900">{d.validRowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Total Revenue:</span>
                      <span className="font-semibold text-indigo-600">
                        ${d.summaryStats.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Time Range:</span>
                      <span className="text-[11px] text-slate-700">
                        {d.summaryStats.startDate} to {d.summaryStats.endDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenPreview(d)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                      title="Inspect Records"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    {!isSelected && (
                      <button
                        onClick={() => {
                          onSelectDataset(d);
                          toastSuccess(`Activated "${d.name}"`);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                  </div>

                  {!isSample && (
                    <button
                      onClick={() => handleDelete(d)}
                      disabled={deletingId === d.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Dataset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raw Data Viewer Modal / Panel */}
      {viewingDataset && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs mt-6">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Raw Record Inspector: {viewingDataset.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Mapped to Date: <span className="font-mono text-slate-700">{viewingDataset.columnMappings.date}</span>, Sales: <span className="font-mono text-slate-700">{viewingDataset.columnMappings.sales}</span>
              </p>
            </div>

            <button
              onClick={() => setViewingDataset(null)}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium"
            >
              Close Inspector
            </button>
          </div>

          {loadingPreview ? (
            <div className="p-6">
              <SkeletonLoader rows={4} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4 text-right">Revenue</th>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Units</th>
                      <th className="py-2.5 px-4">Order ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {previewRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 text-slate-900 font-sans">{r.date}</td>
                        <td className="py-2 px-4 text-right font-semibold text-indigo-600">
                          ${r.revenue.toLocaleString()}
                        </td>
                        <td className="py-2 px-4 font-sans text-slate-700">{r.product || '—'}</td>
                        <td className="py-2 px-4 font-sans text-slate-600">{r.category || '—'}</td>
                        <td className="py-2 px-4 text-right text-slate-600">{r.quantity || '—'}</td>
                        <td className="py-2 px-4 text-slate-400 text-[11px]">{r.orderId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {previewPage} of {Math.ceil(previewTotal / 15)} ({previewTotal.toLocaleString()} total rows)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPreview(viewingDataset, previewPage - 1)}
                    disabled={previewPage <= 1}
                    className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenPreview(viewingDataset, previewPage + 1)}
                    disabled={previewPage >= Math.ceil(previewTotal / 15)}
                    className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
