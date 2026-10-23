import React, { useState, useEffect } from 'react';
import { Search, Download, Package, Layers, ArrowUpDown } from 'lucide-react';
import { Dataset, ProductItem } from '../types';
import { api } from '../lib/api';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';
import { useToast } from '../components/common/Toast';

interface ProductPerformancePageProps {
  selectedDataset: Dataset | null;
  onNavigate: (route: string) => void;
}

export const ProductPerformancePage: React.FC<ProductPerformancePageProps> = ({
  selectedDataset,
  onNavigate,
}) => {
  const { success: toastSuccess } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<'revenue' | 'units' | 'orders'>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!selectedDataset) return;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await api.getProductPerformance(selectedDataset.id, search);
        setProducts(res.products);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedDataset, search]);

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select or import a dataset to analyze individual SKU and product performance metrics."
        icon={Layers}
        actionText="Select Dataset"
        onAction={() => onNavigate('datasets')}
      />
    );
  }

  const sortedProducts = [...products].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'revenue' | 'units' | 'orders') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    if (!products.length) return;
    const headers = ['Product', 'Category', 'TotalRevenue', 'UnitsSold', 'OrderCount', 'AvgPricePerUnit', 'ActiveSpan'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      `"${p.category}"`,
      p.revenue,
      p.units,
      p.orders,
      p.avgPricePerUnit,
      `"${p.activeSpan}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataset.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_products.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Product performance exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Product Performance & SKUs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit sales, average price realization, and transaction metrics across catalog
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Product CSV</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product or category..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-900">{sortedProducts.length}</span> active SKUs
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th
                    onClick={() => toggleSort('revenue')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Total Revenue</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('units')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Units Sold</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('orders')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Orders</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Avg Unit Price</th>
                  <th className="py-3 px-4">Sales Span</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {sortedProducts.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      ${p.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{p.units.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{p.orders.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                      ${p.avgPricePerUnit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">{p.activeSpan}</td>
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
