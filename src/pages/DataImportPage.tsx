import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  Download,
  Info,
  Calendar,
  DollarSign,
  Tag,
  Package,
  Hash,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { Dataset } from '../types';

interface DataImportPageProps {
  onImportSuccess: (dataset: Dataset) => void;
  onNavigate: (route: string) => void;
}

export const DataImportPage: React.FC<DataImportPageProps> = ({
  onImportSuccess,
  onNavigate,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [profileData, setProfileData] = useState<any | null>(null);

  // Column Mappings
  const [dateCol, setDateCol] = useState('');
  const [salesCol, setSalesCol] = useState('');
  const [productCol, setProductCol] = useState('');
  const [categoryCol, setCategoryCol] = useState('');
  const [qtyCol, setQtyCol] = useState('');
  const [orderIdCol, setOrderIdCol] = useState('');

  const [profiling, setProfiling] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [previewLimit, setPreviewLimit] = useState<number>(10);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toastError('Please select a valid .csv file');
      return;
    }

    setFileName(file.name);
    setDatasetName(file.name.replace('.csv', '').replace(/[-_]/g, ' '));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      await profileCSVContent(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = async (sampleType: 'retail' | 'tech' = 'retail') => {
    setProfiling(true);
    try {
      const res = await fetch('/api/samples/download');
      if (!res.ok) throw new Error('Could not fetch sample dataset');
      const text = await res.text();
      setFileName('global_retail_sales.csv');
      setDatasetName('Global Enterprise Retail 2025-2026');
      setDescription('12-month verified retail transactions with multi-department sales');
      setCsvContent(text);
      await profileCSVContent(text);
      toastSuccess('Sample retail dataset loaded for inspection');
    } catch (err: any) {
      toastError(err.message || 'Failed to load sample');
    } finally {
      setProfiling(false);
    }
  };

  const profileCSVContent = async (content: string) => {
    setProfiling(true);
    try {
      const profile = await api.profileCSV(content);
      setProfileData(profile);

      // Auto-assign mappings
      if (profile.detectedMappings) {
        if (profile.detectedMappings.date) setDateCol(profile.detectedMappings.date);
        if (profile.detectedMappings.sales) setSalesCol(profile.detectedMappings.sales);
        if (profile.detectedMappings.product) setProductCol(profile.detectedMappings.product);
        if (profile.detectedMappings.category) setCategoryCol(profile.detectedMappings.category);
        if (profile.detectedMappings.quantity) setQtyCol(profile.detectedMappings.quantity);
        if (profile.detectedMappings.orderId) setOrderIdCol(profile.detectedMappings.orderId);
      }
    } catch (err: any) {
      toastError('Profiling failed: ' + err.message);
    } finally {
      setProfiling(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!datasetName.trim()) {
      toastError('Please enter a dataset name');
      return;
    }

    if (!dateCol || !salesCol) {
      toastError('Both Date and Sales columns must be mapped');
      return;
    }

    setImporting(true);
    try {
      const mappings: Record<string, string> = {
        date: dateCol,
        sales: salesCol,
      };
      if (productCol) mappings.product = productCol;
      if (categoryCol) mappings.category = categoryCol;
      if (qtyCol) mappings.quantity = qtyCol;
      if (orderIdCol) mappings.orderId = orderIdCol;

      const res = await api.importDataset({
        name: datasetName,
        description,
        filename: fileName || 'uploaded_data.csv',
        csvContent,
        columnMappings: mappings,
      });

      setImportResult(res);
      toastSuccess(`ETL pipeline completed: ${res.dataset.validRowCount.toLocaleString()} rows ingested`);
      onImportSuccess(res.dataset);
    } catch (err: any) {
      toastError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Helper to determine mapping badge for a header
  const getHeaderBadge = (headerName: string) => {
    if (headerName === dateCol) {
      return (
        <span className="ml-1.5 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          DATE
        </span>
      );
    }
    if (headerName === salesCol) {
      return (
        <span className="ml-1.5 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
          REVENUE
        </span>
      );
    }
    if (headerName === productCol) {
      return (
        <span className="ml-1.5 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          PRODUCT
        </span>
      );
    }
    if (headerName === categoryCol) {
      return (
        <span className="ml-1.5 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
          CATEGORY
        </span>
      );
    }
    if (headerName === qtyCol) {
      return (
        <span className="ml-1.5 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          QTY
        </span>
      );
    }
    if (headerName === orderIdCol) {
      return (
        <span className="ml-1.5 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          ORDER_ID
        </span>
      );
    }
    return null;
  };

  const displayedPreviewRows = profileData?.previewRows
    ? profileData.previewRows.slice(0, previewLimit)
    : [];

  return (
    <div className="space-y-5">
      {/* Dense Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>CSV Data Ingestion & ETL Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sniff schema, verify field types, map columns, and inspect First 10 Sample Records before ingestion
          </p>
        </div>

        {profileData && !importResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setProfileData(null);
                setCsvContent('');
                setFileName('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={importing || !dateCol || !salesCol}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <span>{importing ? 'Processing ETL...' : 'Confirm & Ingest Data'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* STEP 1: Upload or Load Sample (When no file is uploaded yet) */}
      {!profileData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-8 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-center max-w-xl mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Drop your sales CSV file here, or browse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Extracts headers, inspects the First 10 rows, and auto-detects date and revenue signals.
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              Select CSV File
            </button>
          </div>

          {/* Quick Pre-loaded Samples */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Or Instant Pre-Configured Datasets
            </span>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleLoadSample('retail')}
                disabled={profiling}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{profiling ? 'Loading...' : 'Load Retail Sales Sample CSV'}</span>
              </button>
              <a
                href="/api/samples/download"
                download="global_retail_sales.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Dense Profile & Mapping Interface */}
      {profileData && !importResult && (
        <div className="space-y-4">
          {/* Quick Ingestion Status Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{fileName}</span>
                <span className="text-slate-400 ml-2">
                  ({profileData.totalRows.toLocaleString()} rows · {profileData.headers.length} headers)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-600 dark:text-slate-300">
                Status:{' '}
                <strong className={dateCol && salesCol ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                  {dateCol && salesCol ? 'Ready to Ingest' : 'Requires Date & Sales Mapping'}
                </strong>
              </span>
            </div>
          </div>

          {/* Compact 2-Column Grid: Metadata & Column Mappings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Box: Dataset Title & Information */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Dataset Identification</span>
              </h2>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dataset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Q4 Omnichannel Transactions"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reporting period, store IDs, or market context"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Quick Summary Pill Strip */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Detected Columns:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    {profileData.headers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>File Ingestion Size:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    {Math.round(csvContent.length / 1024)} KB
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box (2 Cols Wide): Schema Column Mapping */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Column Schema Mappings</span>
                </h2>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Auto-mapped from headers
                </span>
              </div>

              {/* 2 Mandatory Columns Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/40 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Transaction Date Column *</span>
                  </label>
                  <select
                    value={dateCol}
                    onChange={(e) => setDateCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Date Column...</option>
                    {profileData.headers.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sales */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sales / Revenue Target Column *</span>
                  </label>
                  <select
                    value={salesCol}
                    onChange={(e) => setSalesCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Sales / Revenue Column...</option>
                    {profileData.headers.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 Optional Dimensions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Product / SKU
                  </label>
                  <select
                    value={productCol}
                    onChange={(e) => setProductCol(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300"
                  >
                    <option value="">(None)</option>
                    {profileData.headers.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={categoryCol}
                    onChange={(e) => setCategoryCol(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300"
                  >
                    <option value="">(None)</option>
                    {profileData.headers.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Quantity / Units
                  </label>
                  <select
                    value={qtyCol}
                    onChange={(e) => setQtyCol(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300"
                  >
                    <option value="">(None)</option>
                    {profileData.headers.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Order Ref ID
                  </label>
                  <select
                    value={orderIdCol}
                    onChange={(e) => setOrderIdCol(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300"
                  >
                    <option value="">(None)</option>
                    {profileData.headers.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: First 10 Sample Records Preview (Dense & High-Density) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  First 10 Sample Records Preview
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  (Showing {displayedPreviewRows.length} of {profileData.totalRows.toLocaleString()} rows)
                </span>
              </div>

              {/* Row display selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400">Rows:</span>
                <button
                  type="button"
                  onClick={() => setPreviewLimit(10)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                    previewLimit === 10
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  10
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLimit(15)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                    previewLimit === 15
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  15
                </button>
              </div>
            </div>

            {/* Dense Data Table */}
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 text-center text-slate-400 w-12 border-r border-slate-200 dark:border-slate-700">
                      #
                    </th>
                    {profileData.headers.map((h: string) => (
                      <th
                        key={h}
                        className={`py-2 px-3 whitespace-nowrap border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                          h === dateCol
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                            : h === salesCol
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                            : ''
                        }`}
                      >
                        <div className="inline-flex items-center">
                          <span>{h}</span>
                          {getHeaderBadge(h)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                  {displayedPreviewRows.map((row: any, rIdx: number) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-1.5 px-3 text-center text-slate-400 dark:text-slate-500 font-sans border-r border-slate-100 dark:border-slate-800 text-[10px]">
                        {rIdx + 1}
                      </td>
                      {profileData.headers.map((h: string) => {
                        const cellVal = row[h];
                        const isDate = h === dateCol;
                        const isSales = h === salesCol;

                        return (
                          <td
                            key={h}
                            className={`py-1.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${
                              isDate
                                ? 'bg-emerald-50/20 dark:bg-emerald-950/10 font-medium text-emerald-800 dark:text-emerald-300'
                                : isSales
                                ? 'bg-indigo-50/20 dark:bg-indigo-950/10 font-semibold text-indigo-700 dark:text-indigo-300'
                                : ''
                            }`}
                          >
                            {cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== ''
                              ? String(cellVal)
                              : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dense Legend Footer */}
            <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                  <span>Date Signal ({dateCol || 'Not mapped'})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block"></span>
                  <span>Target Revenue ({salesCol || 'Not mapped'})</span>
                </span>
              </div>
              <span className="font-mono text-[10px]">Ready for chronological holdout split & Holt-Winters modeling</span>
            </div>
          </div>

          {/* Confirm Button Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setProfileData(null);
                setCsvContent('');
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
            >
              Cancel & Pick Another File
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={importing || !dateCol || !salesCol}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <span>{importing ? 'Validating & Ingesting Records...' : 'Execute Ingestion & Save Dataset'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Summary Display */}
      {importResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                ETL Ingestion Completed Successfully
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Processed in <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{importResult.etlLog.durationMs}ms</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Valid Rows Ingested</span>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {importResult.dataset.validRowCount.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Rejected Rows</span>
              <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
                {importResult.dataset.rejectedRowCount}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Revenue Calculated</span>
              <div className="mt-1 text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                ${importResult.dataset.summaryStats.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setImportResult(null);
                setProfileData(null);
                setCsvContent('');
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Import Another File
            </button>
            <button
              onClick={() => onNavigate('forecasting')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <span>Proceed to Forecasting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
