import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingUp,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  Layers,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Dataset, Forecast } from '../types';
import { api } from '../lib/api';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';
import { useToast } from '../components/common/Toast';

interface SimulationPageProps {
  selectedDataset: Dataset | null;
  onNavigate: (route: string) => void;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  selectedDataset,
  onNavigate,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [baselineForecast, setBaselineForecast] = useState<Forecast | null>(null);

  // Simulation Levers
  const [marketingBoost, setMarketingBoost] = useState<number>(15); // %
  const [priceChange, setPriceChange] = useState<number>(0); // %
  const [seasonalityMultiplier, setSeasonalityMultiplier] = useState<number>(1.0); // 0.8x to 1.5x
  const [conversionLift, setConversionLift] = useState<number>(5); // %

  useEffect(() => {
    if (!selectedDataset) return;

    const loadBaseline = async () => {
      setLoading(true);
      try {
        const res = await api.generateForecast(selectedDataset.id, {
          modelType: 'holt_winters',
          horizonDays: 30,
        });
        setBaselineForecast(res.forecast);
      } catch (err: any) {
        toastError('Failed to load baseline forecast: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBaseline();
  }, [selectedDataset]);

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select an active dataset to perform what-if revenue simulations and stress testing."
        icon={Layers}
        actionText="Select Dataset"
        onAction={() => onNavigate('datasets')}
      />
    );
  }

  // Calculate Net Multiplier
  // Revenue = Baseline * (1 + marketingBoost/100) * (1 + priceChange/100 * elasticity) * seasonality * (1 + conversionLift/100)
  // Assuming moderate price elasticity of -1.2
  const priceElasticityImpact = (1 + (priceChange / 100)) * (1 - (priceChange * 1.2 / 100));
  const effectivePriceMultiplier = Math.max(0.6, priceElasticityImpact);
  const totalMultiplier =
    (1 + marketingBoost / 100) *
    effectivePriceMultiplier *
    seasonalityMultiplier *
    (1 + conversionLift / 100);

  const futurePoints = baselineForecast?.predictions.filter((p) => p.isFuture) || [];

  const simulatedChartData = futurePoints.map((p) => {
    const simulatedRevenue = Math.round(p.predicted * totalMultiplier * 100) / 100;
    return {
      date: p.date,
      baseline: p.predicted,
      simulated: simulatedRevenue,
      delta: Math.round((simulatedRevenue - p.predicted) * 100) / 100,
    };
  });

  const baselineTotalRevenue = futurePoints.reduce((acc, p) => acc + p.predicted, 0);
  const simulatedTotalRevenue = simulatedChartData.reduce((acc, p) => acc + p.simulated, 0);
  const netDelta = simulatedTotalRevenue - baselineTotalRevenue;
  const percentageDelta = baselineTotalRevenue > 0 ? (netDelta / baselineTotalRevenue) * 100 : 0;

  // Presets
  const applyPreset = (preset: 'holiday' | 'recession' | 'expansion' | 'reset') => {
    if (preset === 'holiday') {
      setMarketingBoost(35);
      setPriceChange(5);
      setSeasonalityMultiplier(1.25);
      setConversionLift(12);
      toastSuccess('Applied "Q4 Holiday Acceleration" scenario');
    } else if (preset === 'recession') {
      setMarketingBoost(-10);
      setPriceChange(-5);
      setSeasonalityMultiplier(0.85);
      setConversionLift(-8);
      toastSuccess('Applied "Macroeconomic Downturn" scenario');
    } else if (preset === 'expansion') {
      setMarketingBoost(50);
      setPriceChange(0);
      setSeasonalityMultiplier(1.1);
      setConversionLift(15);
      toastSuccess('Applied "Aggressive Market Share Expansion" scenario');
    } else {
      setMarketingBoost(0);
      setPriceChange(0);
      setSeasonalityMultiplier(1.0);
      setConversionLift(0);
      toastSuccess('Reset levers to baseline');
    }
  };

  const handleExportCSV = () => {
    if (!simulatedChartData.length) return;
    const headers = ['Date', 'BaselineRevenue', 'SimulatedRevenue', 'DollarVariance'];
    const rows = simulatedChartData.map((d) => [d.date, d.baseline, d.simulated, d.delta]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataset.name}_whatif_simulation.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Simulation scenario exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>What-If Sales Simulation & Stress Testing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Model forward 30-day revenue under dynamic pricing, marketing investment, and macroeconomic shifts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => applyPreset('reset')}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Scenario CSV</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mr-1">
          Scenario Presets:
        </span>
        <button
          onClick={() => applyPreset('holiday')}
          className="px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-medium transition-colors"
        >
          Holiday Surge (+35% mktg, +25% seasonal)
        </button>
        <button
          onClick={() => applyPreset('expansion')}
          className="px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
        >
          Market Expansion (+50% mktg, +15% conversion)
        </button>
        <button
          onClick={() => applyPreset('recession')}
          className="px-3 py-1 rounded-md bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-medium transition-colors"
        >
          Downturn Defense (-10% mktg, -5% price)
        </button>
      </div>

      {/* Interactive Controls & Scenario KPI Strips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Simulation Levers
          </h2>

          {/* Marketing Boost */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Marketing Boost</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {marketingBoost > 0 ? `+${marketingBoost}%` : `${marketingBoost}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="80"
              value={marketingBoost}
              onChange={(e) => setMarketingBoost(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Price Change */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Price Adjustment</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">Assumes price elasticity of -1.2</span>
          </div>

          {/* Seasonality Multiplier */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Seasonality Factor</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {seasonalityMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.6"
              step="0.05"
              value={seasonalityMultiplier}
              onChange={(e) => setSeasonalityMultiplier(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Conversion Lift */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Conversion Rate Lift</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {conversionLift > 0 ? `+${conversionLift}%` : `${conversionLift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              value={conversionLift}
              onChange={(e) => setConversionLift(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Visual Charts & Comparison Strip */}
        <div className="lg:col-span-3 space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Baseline 30D Forecast</span>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                ${Math.round(baselineTotalRevenue).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Holt-Winters unadjusted</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Simulated 30D Revenue</span>
              <div className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                ${Math.round(simulatedTotalRevenue).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">With active lever inputs</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Projected Impact</span>
              <div
                className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
                  netDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {netDelta >= 0 ? '+' : ''}${Math.round(netDelta).toLocaleString()}
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {netDelta >= 0 ? '↑' : '↓'} {percentageDelta.toFixed(1)}% vs baseline
              </span>
            </div>
          </div>

          {/* Main Comparison Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Trajectory Comparison: Baseline vs Simulated Strategy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily projected revenue over next 30 days based on active parameter multipliers
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-slate-400"></span>
                  <span className="text-slate-600 dark:text-slate-400">Baseline Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-600"></span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Simulated Revenue</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              {loading ? (
                <SkeletonLoader rows={4} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={simulatedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      dataKey="baseline"
                      stroke="#94A3B8"
                      strokeWidth={1.8}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Baseline Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="simulated"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      dot={false}
                      name="Simulated Revenue"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
