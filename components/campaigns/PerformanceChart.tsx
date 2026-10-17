'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Table as TableIcon,
  LineChart as ChartIcon,
  Download,
  Maximize2,
  Minimize2,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import { Popover } from '@/components/ui/Popover';
import type { CampaignSummaryResponse, SummarySeriesItem } from '@/lib/types/campaign';

interface PerformanceChartProps {
  summary: CampaignSummaryResponse | null;
  loading?: boolean;
  campaignId?: number;
  onGranularityChange?: (granularity: 'daily' | 'weekly' | 'monthly') => void;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

type MetricKey =
  | 'spend'
  | 'sales'
  | 'orders'
  | 'impressions'
  | 'clicks'
  | 'acos'
  | 'roas'
  | 'cpc'
  | 'ctr'
  | 'cvr';

type ChartType = 'line' | 'bar';

interface MetricConfig {
  key: MetricKey;
  type: ChartType;
  color: string;
}

const METRIC_COLORS: Record<MetricKey, string> = {
  spend: '#e11d48', // rose-600
  sales: '#059669', // emerald-600
  orders: '#2563eb', // blue-600
  impressions: '#8b5cf6', // purple-500
  clicks: '#0284c7', // sky-600
  acos: '#d97706', // amber-600
  roas: '#10b981', // emerald-500
  cpc: '#f43f5e', // rose-500
  ctr: '#6366f1', // indigo-500
  cvr: '#14b8a6', // teal-500
};

const UNIT = {
  spend: 'money',
  sales: 'money',
  organic_sales: 'money',
  cpc: 'money',
  impressions: 'count',
  clicks: 'count',
  orders: 'count',
  acos: 'percent',
  ctr: 'percent',
  cvr: 'percent',
  tacos: 'percent',
  roas: 'ratio',
} as const;

export function PerformanceChart({
  summary,
  loading,
  campaignId,
  onGranularityChange,
  granularity = 'daily',
}: PerformanceChartProps) {
  const { rules } = useActiveAccount();
  const cardRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewDataLabels, setViewDataLabels] = useState(false);
  const [viewChanges, setViewChanges] = useState(false);
  const [metricAddOpen, setMetricAddOpen] = useState(false);

  const [activeMetrics, setActiveMetrics] = useState<MetricConfig[]>([
    { key: 'spend', type: 'line', color: METRIC_COLORS.spend },
    { key: 'sales', type: 'line', color: METRIC_COLORS.sales },
  ]);

  const toggleFullscreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownloadCsv = () => {
    if (!summary?.series || summary.series.length === 0) return;
    const headers = ['Date / Bucket', ...activeMetrics.map((m) => m.key.toUpperCase())];
    const rows = summary.series.map((item) => [
      item.bucket || item.date || '',
      ...activeMetrics.map((m) => String((item as any)[m.key] ?? '')),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campaign_performance_${granularity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addMetric = (key: MetricKey) => {
    if (activeMetrics.some((m) => m.key === key) || activeMetrics.length >= 6) return;
    setActiveMetrics([...activeMetrics, { key, type: 'line', color: METRIC_COLORS[key] }]);
    setMetricAddOpen(false);
  };

  const removeMetric = (key: MetricKey) => {
    if (activeMetrics.length <= 1) return;
    setActiveMetrics(activeMetrics.filter((m) => m.key !== key));
  };

  const updateMetricType = (key: MetricKey, type: ChartType) => {
    setActiveMetrics(activeMetrics.map((m) => (m.key === key ? { ...m, type } : m)));
  };

  // Unit axis mapping: 1st unit -> left, 2nd unit -> right, rest -> hidden
  const unitOrder = useMemo(() => {
    const units: string[] = [];
    activeMetrics.forEach((m) => {
      const u = (UNIT as any)[m.key] || 'count';
      if (!units.includes(u)) units.push(u);
    });
    return units;
  }, [activeMetrics]);

  // Aligned chart data with previous series
  const chartData = useMemo(() => {
    if (!summary?.series) return [];
    const prevSeries = summary.previous_series || [];

    return summary.series.map((item, idx) => {
      const prev = prevSeries[idx] || null;
      const row: any = {
        ...item,
        bucket: item.bucket || item.date || '',
      };

      if (prev) {
        activeMetrics.forEach((m) => {
          row[`prev_${m.key}`] = (prev as any)[m.key];
        });
      }
      return row;
    });
  }, [summary, activeMetrics]);

  const hasData = chartData.some((d) =>
    activeMetrics.some((m) => d[m.key] !== null && d[m.key] !== undefined && d[m.key] > 0)
  );

  return (
    <div
      ref={cardRef}
      className={`bg-surface border border-border-dim rounded-md p-4 shadow-2xs flex flex-col ${
        isFullscreen ? 'p-6 fixed inset-0 z-50 bg-white' : ''
      }`}
    >
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border-dim pb-3">
        <div className="flex items-center gap-2">
          {/* Granularity pill */}
          <div className="inline-flex rounded-md border border-border-dim p-0.5 bg-slate-50 text-xs font-mono">
            {(['daily', 'weekly', 'monthly'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGranularityChange?.(g)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  granularity === g
                    ? 'bg-white shadow-2xs font-semibold text-text-main'
                    : 'text-slate-500 hover:text-text-main'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* View toggle (chart vs table) */}
          <div className="inline-flex rounded-md border border-border-dim p-0.5 bg-slate-50 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'chart'
                  ? 'bg-white shadow-2xs text-primary'
                  : 'text-slate-500 hover:text-text-main'
              }`}
              title="Chart view"
            >
              <ChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white shadow-2xs text-primary'
                  : 'text-slate-500 hover:text-text-main'
              }`}
              title="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={viewDataLabels}
              onChange={(e) => setViewDataLabels(e.target.checked)}
              className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>Data labels</span>
          </label>

          {summary?.previous_series && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={viewChanges}
                onChange={(e) => setViewChanges(e.target.checked)}
                className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>View changes</span>
            </label>
          )}

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="p-1 text-slate-500 hover:text-slate-700 rounded border border-border-dim hover:bg-slate-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 text-slate-500 hover:text-slate-700 rounded border border-border-dim hover:bg-slate-50"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area: Chart or Table */}
      {viewMode === 'chart' ? (
        <div className="w-full h-72">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded animate-pulse">
              <span className="font-mono text-xs text-slate-400">Loading chart...</span>
            </div>
          ) : !hasData ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <ChartIcon className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
              <span className="font-mono text-xs">No activity in this period</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  fontFamily="monospace"
                />

                {/* Y Axes mapped by unit */}
                {unitOrder.map((unit, idx) => {
                  const isVisible = idx <= 1;
                  const orientation = idx === 0 ? 'left' : 'right';
                  return (
                    <YAxis
                      key={unit}
                      yAxisId={unit}
                      orientation={orientation}
                      hide={!isVisible}
                      stroke="#94a3b8"
                      fontSize={11}
                      fontFamily="monospace"
                      tickFormatter={(v) => {
                        if (unit === 'money') return `${rules?.symbol || '$'}${v}`;
                        if (unit === 'percent') return `${v}%`;
                        if (unit === 'ratio') return `${v}x`;
                        return `${v}`;
                      }}
                    />
                  );
                })}

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-surface border border-border-dim shadow-md rounded p-2 text-xs font-mono">
                        <div className="font-semibold border-b border-border-dim pb-1 mb-1 text-slate-700">
                          {label}
                        </div>
                        {payload.map((entry: any) => {
                          const isPrev = entry.dataKey.startsWith('prev_');
                          const rawKey = isPrev
                            ? entry.dataKey.replace('prev_', '')
                            : entry.dataKey;
                          const u = (UNIT as any)[rawKey];
                          let valStr = String(entry.value ?? '—');
                          if (u === 'money') valStr = money(entry.value, rules);
                          else if (u === 'percent') valStr = pct(entry.value);
                          else if (u === 'ratio') valStr = ratio(entry.value);
                          else valStr = num(entry.value);

                          return (
                            <div
                              key={entry.dataKey}
                              className="flex items-center justify-between gap-4 py-0.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className={isPrev ? 'text-slate-400' : 'text-slate-600'}>
                                  {isPrev ? `Prev ${rawKey.toUpperCase()}` : rawKey.toUpperCase()}
                                </span>
                              </div>
                              <span className="font-bold text-text-main tabular-nums">
                                {valStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />

                {/* Plot Series */}
                {activeMetrics.map((m) => {
                  const yAxisId = (UNIT as any)[m.key] || 'count';

                  // Compare line if available
                  const prevLine = summary?.previous_series && (
                    <Line
                      key={`prev_${m.key}`}
                      yAxisId={yAxisId}
                      type="monotone"
                      dataKey={`prev_${m.key}`}
                      stroke={m.color}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                      dot={chartData.length === 1}
                      name={`Previous ${m.key}`}
                    />
                  );

                  return (
                    <React.Fragment key={m.key}>
                      {prevLine}
                      {m.type === 'bar' ? (
                        <Bar
                          yAxisId={yAxisId}
                          dataKey={m.key}
                          fill={m.color}
                          radius={[2, 2, 0, 0]}
                          maxBarSize={32}
                          name={m.key}
                        />
                      ) : (
                        <Line
                          yAxisId={yAxisId}
                          type="monotone"
                          dataKey={m.key}
                          stroke={m.color}
                          strokeWidth={2}
                          dot={chartData.length === 1}
                          name={m.key}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto max-h-72 border border-border-dim rounded-md">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-slate-50 border-b border-border-dim text-[11px] text-slate-500 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2 px-3">Date / Bucket</th>
                {activeMetrics.map((m) => (
                  <th key={m.key} className="py-2 px-3 text-right">
                    {m.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim bg-white">
              {summary?.series.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3 font-medium text-slate-700">
                    {row.bucket || row.date}
                  </td>
                  {activeMetrics.map((m) => {
                    const val = (row as any)[m.key];
                    const u = (UNIT as any)[m.key];
                    let text = '—';
                    if (u === 'money') text = money(val, rules);
                    else if (u === 'percent') text = pct(val);
                    else if (u === 'ratio') text = ratio(val);
                    else text = num(val);
                    return (
                      <td key={m.key} className="py-1.5 px-3 text-right tabular-nums">
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {summary?.totals && (
              <tfoot className="bg-slate-50 border-t-2 border-border-dim font-bold text-text-main">
                <tr>
                  <td className="py-2 px-3">Total</td>
                  {activeMetrics.map((m) => {
                    const val = summary.totals[m.key];
                    const u = (UNIT as any)[m.key];
                    let text = '—';
                    if (u === 'money') text = money(val, rules);
                    else if (u === 'percent') text = pct(val);
                    else if (u === 'ratio') text = ratio(val);
                    else text = num(val);
                    return (
                      <td key={m.key} className="py-2 px-3 text-right tabular-nums">
                        {text}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Metric chips under chart */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-dim">
        {activeMetrics.map((m) => (
          <div
            key={m.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-50 border border-border-dim"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="font-semibold uppercase text-slate-700">{m.key}</span>

            {/* Line / Bar dropdown */}
            <select
              value={m.type}
              onChange={(e) => updateMetricType(m.key, e.target.value as ChartType)}
              className="bg-transparent text-[11px] font-mono text-slate-500 border-none focus:ring-0 cursor-pointer ml-1"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>

            {activeMetrics.length > 1 && (
              <button
                type="button"
                onClick={() => removeMetric(m.key)}
                className="text-slate-400 hover:text-slate-600 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add metric dropdown */}
        {activeMetrics.length < 6 && (
          <Popover
            open={metricAddOpen}
            onOpenChange={setMetricAddOpen}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-600 hover:text-slate-900 border border-dashed border-border-dim rounded-md hover:bg-slate-50"
              >
                <Plus className="w-3 h-3" />
                <span>Add metric</span>
              </button>
            }
          >
            <div className="w-36 p-1.5 text-xs font-mono">
              {(Object.keys(METRIC_COLORS) as MetricKey[])
                .filter((k) => !activeMetrics.some((m) => m.key === k))
                .map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => addMetric(k)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 uppercase"
                  >
                    {k}
                  </button>
                ))}
            </div>
          </Popover>
        )}
      </div>
    </div>
  );
}
