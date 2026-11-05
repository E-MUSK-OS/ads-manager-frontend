'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Table as TableIcon,
  LineChart as ChartIcon,
  Download,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, compactMoney, pct, ratio, num } from '@/lib/format';
import type { CampaignSummaryResponse } from '@/lib/types/campaign';
import type { MetricKey } from './wizard/helpers';

export interface PerformanceChartProps {
  summary: CampaignSummaryResponse | null;
  loading?: boolean;
  campaignId?: number;
  onGranularityChange?: (granularity: 'daily' | 'weekly' | 'monthly') => void;
  granularity?: 'daily' | 'weekly' | 'monthly';
  selectedMetrics?: [MetricKey, MetricKey];
  endDate?: string;
  meta?: any;
}

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

export const UNIT = {
  spend: 'money',
  sales: 'money',
  cpc: 'money',
  impressions: 'count',
  clicks: 'count',
  orders: 'count',
  acos: 'percent',
  ctr: 'percent',
  cvr: 'percent',
  roas: 'ratio',
} as const;

// Pure math coordinate guards (Glitch 4)
export const getX = (index: number, total: number, plotWidth: number, padLeft: number): number => {
  if (total <= 1) return padLeft + plotWidth / 2;
  return padLeft + (index / (total - 1)) * plotWidth;
};

export const getY = (val: number, maxVal: number, plotHeight: number, padTop: number): number => {
  const safeMax = maxVal > 0 ? maxVal * 1.1 : 100;
  const clamped = Math.max(0, val);
  return padTop + plotHeight - (clamped / safeMax) * plotHeight;
};

const DEFAULT_SELECTED_METRICS: [MetricKey, MetricKey] = ['spend', 'sales'];

export function PerformanceChart({
  summary,
  loading = false,
  campaignId,
  onGranularityChange,
  granularity = 'daily',
  selectedMetrics = DEFAULT_SELECTED_METRICS,
  endDate,
  meta,
}: PerformanceChartProps) {
  const { rules } = useActiveAccount();
  const cardRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewDataLabels, setViewDataLabels] = useState(false);
  const [viewChanges, setViewChanges] = useState(true);

  const selMetric0 = selectedMetrics?.[0] || 'spend';
  const selMetric1 = selectedMetrics?.[1] || 'sales';

  // Synchronize activeMetrics with selectedMetrics from KPI ribbon
  const [activeMetrics, setActiveMetrics] = useState<MetricConfig[]>([
    { key: selMetric0, type: 'line', color: METRIC_COLORS[selMetric0] || '#e11d48' },
    { key: selMetric1, type: 'line', color: METRIC_COLORS[selMetric1] || '#059669' },
  ]);

  useEffect(() => {
    setActiveMetrics([
      { key: selMetric0, type: 'line', color: METRIC_COLORS[selMetric0] || '#e11d48' },
      { key: selMetric0 === selMetric1 ? 'sales' : selMetric1, type: 'line', color: METRIC_COLORS[selMetric1] || '#059669' },
    ]);
  }, [selMetric0, selMetric1]);

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

  const isSingleDay = chartData.length === 1;

  // Attribution lag banner
  const todayStr = meta?.today || new Date().toISOString().split('T')[0];
  const showAttributionLag = Boolean(endDate && endDate >= todayStr);

  const formatAxisTick = (val: number, metricKey: MetricKey): string => {
    const unit = (UNIT as any)[metricKey] || 'count';
    if (unit === 'money') return compactMoney(val, rules?.symbol || '₹');
    if (unit === 'percent') return pct(val, 0);
    if (unit === 'ratio') return ratio(val, 1);
    return num(val);
  };

  const metric1 = activeMetrics[0]?.key || 'spend';
  const metric2 = activeMetrics[1]?.key || 'sales';

  return (
    <div
      ref={cardRef}
      className={`bg-surface border border-border-dim rounded-md p-4 shadow-2xs flex flex-col ${
        isFullscreen ? 'p-6 fixed inset-0 z-50 bg-white' : ''
      }`}
    >
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-border-dim pb-3">
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
          {summary?.previous_series && summary.previous_series.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={viewChanges}
                onChange={(e) => setViewChanges(e.target.checked)}
                className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>Compare previous</span>
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
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Attribution Lag Notice */}
      {showAttributionLag && (
        <div className="mb-2 px-2.5 py-1.5 bg-amber-50/70 border border-amber-200/80 rounded flex items-center gap-2 text-[11px] font-mono text-amber-800">
          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Recent days may be incomplete — orders are attributed later by Amazon Ads.</span>
        </div>
      )}

      {/* Main Content Area: Chart or Table */}
      {viewMode === 'chart' ? (
        <div className="w-full h-72">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded animate-pulse">
              <span className="font-mono text-xs text-slate-400">Loading chart...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <ChartIcon className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
              <span className="font-mono text-xs">No activity in this period</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  fontFamily="monospace"
                />

                {/* Left Y-Axis (Metric 1) */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke={METRIC_COLORS[metric1] || '#94a3b8'}
                  fontSize={11}
                  fontFamily="monospace"
                  tickFormatter={(v) => formatAxisTick(v, metric1)}
                  domain={[0, 'auto']}
                />

                {/* Right Y-Axis (Metric 2) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={METRIC_COLORS[metric2] || '#94a3b8'}
                  fontSize={11}
                  fontFamily="monospace"
                  tickFormatter={(v) => formatAxisTick(v, metric2)}
                  domain={[0, 'auto']}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-surface border border-border-dim shadow-md rounded p-2 text-xs font-mono">
                        <div className="font-semibold border-b border-border-dim pb-1 mb-1 text-slate-700">
                          {label}
                        </div>
                        {payload.map((entry: any) => {
                          const isPrev = entry.dataKey?.startsWith('prev_');
                          const rawKey = (isPrev ? entry.dataKey.replace('prev_', '') : entry.dataKey) as MetricKey;
                          const u = (UNIT as any)[rawKey] || 'count';
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
                              <span className="font-bold text-text-main tabular-nums font-mono">
                                {valStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />

                {/* If single day range (Today / Yesterday), plot reference lines so SVG never has NaN */}
                {isSingleDay && (
                  <ReferenceLine
                    yAxisId="left"
                    y={chartData[0]?.[metric1] || 0}
                    stroke={METRIC_COLORS[metric1] || '#94a3b8'}
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
                  />
                )}

                {/* Left Metric Line */}
                {viewChanges && summary?.previous_series && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={`prev_${metric1}`}
                    stroke={METRIC_COLORS[metric1]}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                    dot={isSingleDay ? { r: 5 } : false}
                    name={`Previous ${metric1}`}
                  />
                )}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={metric1}
                  stroke={METRIC_COLORS[metric1]}
                  strokeWidth={2}
                  dot={isSingleDay ? { r: 5, fill: METRIC_COLORS[metric1] } : false}
                  name={metric1}
                />

                {/* Right Metric Line */}
                {viewChanges && summary?.previous_series && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={`prev_${metric2}`}
                    stroke={METRIC_COLORS[metric2]}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                    dot={isSingleDay ? { r: 5 } : false}
                    name={`Previous ${metric2}`}
                  />
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={metric2}
                  stroke={METRIC_COLORS[metric2]}
                  strokeWidth={2}
                  dot={isSingleDay ? { r: 5, fill: METRIC_COLORS[metric2] } : false}
                  name={metric2}
                />
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

      {/* Metric legend pill indicators */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border-dim text-xs font-mono">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border-dim bg-primary/5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[metric1] }} />
          <span className="font-semibold uppercase text-slate-800">{metric1}</span>
          <span className="text-[10px] text-slate-400 font-normal">(Left Y-Axis)</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border-dim bg-emerald-50/50">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[metric2] }} />
          <span className="font-semibold uppercase text-slate-800">{metric2}</span>
          <span className="text-[10px] text-slate-400 font-normal">(Right Y-Axis)</span>
        </div>
        <span className="text-[11px] text-slate-400 ml-auto">
          Click any 2 KPI cards above to rebind chart axes
        </span>
      </div>
    </div>
  );
}
