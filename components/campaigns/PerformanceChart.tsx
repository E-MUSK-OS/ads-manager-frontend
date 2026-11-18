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
  Maximize2,
  Minimize2,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, moneyWhole, compactMoney, pct, ratio, num } from '@/lib/format';
import type { CampaignSummaryResponse } from '@/lib/types/campaign';
import type { MetricKey } from './wizard/helpers';
import { Popover } from '@/components/ui/Popover';

export interface PerformanceChartProps {
  summary: CampaignSummaryResponse | null;
  loading?: boolean;
  campaignId?: number;
  onGranularityChange?: (granularity: 'daily' | 'weekly' | 'monthly') => void;
  granularity?: 'daily' | 'weekly' | 'monthly';
  selectedMetrics?: MetricKey[];
  onSelectMetric?: (metric: MetricKey) => void;
  endDate?: string;
  meta?: any;
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

// Bars for Spend, Purchases (Orders), Impressions, Clicks
// Lines for Sales, ACOS, ROAS, CPC, CTR, CVR
const BAR_METRICS: MetricKey[] = ['spend', 'orders', 'impressions', 'clicks'];

// Coordinate helper guards
export const getX = (index: number, total: number, plotWidth: number, padLeft: number): number => {
  if (total <= 1) return padLeft + plotWidth / 2;
  return padLeft + (index / (total - 1)) * plotWidth;
};

export const getY = (val: number, maxVal: number, plotHeight: number, padTop: number): number => {
  const safeMax = maxVal > 0 ? maxVal * 1.1 : 100;
  const clamped = Math.max(0, val);
  return padTop + plotHeight - (clamped / safeMax) * plotHeight;
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

const AVAILABLE_METRICS: { key: MetricKey; label: string }[] = [
  { key: 'spend', label: 'Spend' },
  { key: 'sales', label: 'Sales' },
  { key: 'orders', label: 'Orders' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'acos', label: 'ACOS' },
  { key: 'roas', label: 'ROAS' },
  { key: 'cpc', label: 'CPC' },
  { key: 'ctr', label: 'CTR' },
];

export function formatDataLabelValue(val: number, metricKey: MetricKey, rules?: any): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const unit = (UNIT as any)[metricKey] || 'count';
  if (unit === 'money') {
    if (Math.abs(val) >= 100000) {
      return compactMoney(val, rules?.symbol || '₹');
    }
    if (Number.isInteger(val) || Math.abs(val) >= 100) {
      return moneyWhole(val);
    }
    return money(val, rules);
  }
  if (unit === 'percent') return pct(val, 1);
  if (unit === 'ratio') return ratio(val, 2);
  return num(val);
}

export function computePointChange(
  data: any[],
  metricKey: MetricKey,
  index: number
): { diff: number; pctChange: number; symbol: string; text: string; color: string } | null {
  if (!data || index <= 0 || index >= data.length) {
    return null;
  }
  const currentVal = Number(data[index]?.[metricKey]);
  const prevVal = Number(data[index - 1]?.[metricKey]);

  if (isNaN(currentVal) || isNaN(prevVal)) {
    return null;
  }

  const diff = currentVal - prevVal;

  if (prevVal === 0) {
    if (currentVal > 0) {
      return { diff, pctChange: 100, symbol: '▲', text: '▲ +100%', color: '#16a34a' };
    } else if (currentVal < 0) {
      return { diff, pctChange: -100, symbol: '▼', text: '▼ -100%', color: '#dc2626' };
    } else {
      return { diff: 0, pctChange: 0, symbol: '—', text: '0%', color: '#64748b' };
    }
  }

  const pctChange = (diff / Math.abs(prevVal)) * 100;

  if (diff > 0.001) {
    return {
      diff,
      pctChange,
      symbol: '▲',
      text: `▲ +${pctChange.toFixed(1)}%`,
      color: '#16a34a', // green up (by direction only per D6)
    };
  } else if (diff < -0.001) {
    return {
      diff,
      pctChange,
      symbol: '▼',
      text: `▼ ${pctChange.toFixed(1)}%`,
      color: '#dc2626', // red down (by direction only per D6)
    };
  } else {
    return {
      diff: 0,
      pctChange: 0,
      symbol: '—',
      text: '0%',
      color: '#64748b',
    };
  }
}

interface CustomChartLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  index?: number;
  metric: MetricKey;
  data: any[];
  showDataLabels: boolean;
  showChanges: boolean;
  color: string;
  rules?: any;
  isBar?: boolean;
}

export function CustomChartPointLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
  index = 0,
  metric,
  data,
  showDataLabels,
  showChanges,
  color,
  rules,
  isBar = false,
}: CustomChartLabelProps) {
  if (!showDataLabels && !showChanges) return null;

  const rawVal = value !== undefined ? Number(value) : Number(data?.[index]?.[metric]);
  if (isNaN(rawVal)) return null;

  const posX = isBar ? x + width / 2 : x;
  const posY = Math.max(16, y);

  const formattedVal = formatDataLabelValue(rawVal, metric, rules);
  const change = showChanges ? computePointChange(data, metric, index) : null;

  if (showDataLabels && !showChanges) {
    return (
      <text
        x={posX}
        y={posY}
        dy={-6}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontFamily="monospace"
        fontWeight="700"
        paintOrder="stroke"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="select-none pointer-events-none"
      >
        {formattedVal}
      </text>
    );
  }

  if (!showDataLabels && showChanges) {
    if (!change) return null;
    return (
      <text
        x={posX}
        y={posY}
        dy={-6}
        textAnchor="middle"
        fill={change.color}
        fontSize={10}
        fontFamily="monospace"
        fontWeight="700"
        paintOrder="stroke"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="select-none pointer-events-none"
      >
        {change.text}
      </text>
    );
  }

  return (
    <text
      x={posX}
      y={posY}
      textAnchor="middle"
      fontSize={9}
      fontFamily="monospace"
      paintOrder="stroke"
      stroke="#ffffff"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="select-none pointer-events-none"
    >
      <tspan x={posX} dy={-13} fill={color} fontWeight="700">
        {formattedVal}
      </tspan>
      {change ? (
        <tspan x={posX} dy={11} fill={change.color} fontWeight="700">
          {change.text}
        </tspan>
      ) : null}
    </text>
  );
}

export function PerformanceChart({
  summary,
  loading = false,
  campaignId,
  onGranularityChange,
  granularity = 'daily',
  selectedMetrics = ['spend', 'sales'],
  onSelectMetric,
  endDate,
  meta,
}: PerformanceChartProps) {
  const { rules } = useActiveAccount();
  const cardRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewDataLabels, setViewDataLabels] = useState(false);
  const [viewChanges, setViewChanges] = useState(false);
  const [addMetricOpen, setAddMetricOpen] = useState(false);

  // Allow selecting any/all metrics
  const activeMetrics = useMemo(() => {
    if (!selectedMetrics || selectedMetrics.length === 0) return ['spend' as MetricKey];
    return selectedMetrics;
  }, [selectedMetrics]);

  const toggleFullscreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
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
          row[`prev_${m}`] = (prev as any)[m];
        });
      }
      return row;
    });
  }, [summary, activeMetrics]);

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

  // Primary metric (left axis), Secondary metric (right axis)
  const leftMetric = activeMetrics[0] || 'spend';
  const rightMetric = activeMetrics[1] || (activeMetrics.length > 1 ? activeMetrics[1] : undefined);

  return (
    <div
      ref={cardRef}
      className={`bg-white border border-slate-300 rounded-md p-4 shadow-2xs flex flex-col font-mono text-xs ${
        isFullscreen ? 'p-6 fixed inset-0 z-50 bg-white' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
        {/* Left: Granularity & View Switcher */}
        <div className="flex items-center gap-2">
          {/* Granularity Switcher */}
          <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-md border border-slate-300 text-xs font-mono">
            {(['daily', 'weekly', 'monthly'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGranularityChange?.(g)}
                className={`px-2.5 py-1 text-xs rounded uppercase transition-colors ${
                  granularity === g
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 font-medium'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* View as Chart / View as Table Switcher (D5) */}
          <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-md border border-slate-300 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'chart'
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
              }`}
              title="View as chart"
            >
              <ChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
              }`}
              title="View as table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Right: Data Labels, Changes, Fullscreen */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-800 select-none">
            <input
              type="checkbox"
              checked={viewDataLabels}
              onChange={(e) => setViewDataLabels(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>View Data Labels</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-800 select-none">
            <input
              type="checkbox"
              checked={viewChanges}
              onChange={(e) => setViewChanges(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>View Changes</span>
          </label>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-700 hover:text-slate-900 rounded border border-slate-300 bg-white hover:bg-slate-100"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metric Selector Chips Row: Add Metrics */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
          Metrics ({activeMetrics.length}/{AVAILABLE_METRICS.length}):
        </span>
        {activeMetrics.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border shadow-2xs"
            style={{
              borderColor: METRIC_COLORS[m],
              backgroundColor: `${METRIC_COLORS[m]}15`,
              color: METRIC_COLORS[m],
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: METRIC_COLORS[m] }}
            />
            <span className="uppercase">{m}</span>
            {activeMetrics.length > 1 && onSelectMetric && (
              <button
                type="button"
                onClick={() => onSelectMetric(m)}
                className="hover:opacity-75 ml-0.5"
                title={`Remove ${m}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {activeMetrics.length < AVAILABLE_METRICS.length && onSelectMetric && (
          <Popover
            open={addMetricOpen}
            onOpenChange={setAddMetricOpen}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Add Metric</span>
              </button>
            }
          >
            <div className="w-40 p-1.5 text-xs font-mono bg-white">
              {AVAILABLE_METRICS.filter((am) => !activeMetrics.includes(am.key)).map((am) => (
                <button
                  key={am.key}
                  type="button"
                  onClick={() => {
                    onSelectMetric(am.key);
                    setAddMetricOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 uppercase font-medium text-slate-800"
                >
                  {am.label}
                </button>
              ))}
            </div>
          </Popover>
        )}
      </div>

      {/* Attribution Lag Notice */}
      {showAttributionLag && (
        <div className="mb-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded flex items-center gap-2 text-[11px] font-mono text-amber-800">
          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Recent days may be incomplete — orders are attributed later by Amazon Ads.</span>
        </div>
      )}

      {/* Main Content Area: Chart or Table */}
      {viewMode === 'chart' ? (
        <div className="w-full h-80">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded animate-pulse">
              <span className="font-mono text-xs text-slate-400">Loading performance chart...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <ChartIcon className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
              <span className="font-mono text-xs">No performance data in this period</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: viewDataLabels || viewChanges ? 32 : 12, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />

                {/* Left Y-Axis */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke={METRIC_COLORS[leftMetric] || '#64748b'}
                  fontSize={11}
                  fontFamily="monospace"
                  tickFormatter={(v) => formatAxisTick(v, leftMetric)}
                  domain={[0, 'auto']}
                />

                {/* Right Y-Axis (if 2nd metric present) */}
                {rightMetric && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={METRIC_COLORS[rightMetric] || '#64748b'}
                    fontSize={11}
                    fontFamily="monospace"
                    tickFormatter={(v) => formatAxisTick(v, rightMetric)}
                    domain={[0, 'auto']}
                  />
                )}

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-slate-300 shadow-md rounded p-2.5 text-xs font-mono">
                        <div className="font-bold border-b border-slate-200 pb-1 mb-1.5 text-slate-800">
                          {label}
                        </div>
                        {payload.map((entry: any) => {
                          const mKey = entry.dataKey as MetricKey;
                          const u = (UNIT as any)[mKey] || 'count';
                          let valStr = String(entry.value ?? '—');
                          if (u === 'money') valStr = money(entry.value, rules);
                          else if (u === 'percent') valStr = pct(entry.value);
                          else if (u === 'ratio') valStr = ratio(entry.value);
                          else valStr = num(entry.value);

                          const pointIndex = chartData.findIndex((d: any) => d.bucket === label);
                          const change = computePointChange(chartData, mKey, pointIndex);

                          return (
                            <div key={mKey} className="flex items-center justify-between gap-4 py-0.5">
                              <span className="flex items-center gap-1.5 text-slate-600 font-semibold uppercase">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {mKey}:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {valStr}
                                </span>
                                {change && (
                                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: change.color }}>
                                    {change.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />

                {/* Render active metrics: Bars vs Lines */}
                {activeMetrics.map((m, idx) => {
                  const isBar = BAR_METRICS.includes(m);
                  const axisId = idx === 0 ? 'left' : 'right';
                  const color = METRIC_COLORS[m] || '#6366f1';

                  if (isBar) {
                    return (
                      <Bar
                        key={m}
                        yAxisId={axisId}
                        dataKey={m}
                        fill={color}
                        opacity={0.8}
                        radius={[3, 3, 0, 0]}
                        label={
                          viewDataLabels || viewChanges
                            ? (props: any) => (
                                <CustomChartPointLabel
                                  {...props}
                                  metric={m}
                                  data={chartData}
                                  showDataLabels={viewDataLabels}
                                  showChanges={viewChanges}
                                  color={color}
                                  rules={rules}
                                  isBar={true}
                                />
                              )
                            : false
                        }
                      />
                    );
                  }

                  return (
                    <Line
                      key={m}
                      yAxisId={axisId}
                      type="monotone"
                      dataKey={m}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: color }}
                      activeDot={{ r: 5 }}
                      label={
                        viewDataLabels || viewChanges
                          ? (props: any) => (
                              <CustomChartPointLabel
                                {...props}
                                metric={m}
                                data={chartData}
                                showDataLabels={viewDataLabels}
                                showChanges={viewChanges}
                                color={color}
                                rules={rules}
                                isBar={false}
                              />
                            )
                          : false
                      }
                    />
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        /* Data Table View (D5) */
        <div className="w-full overflow-x-auto max-h-80 border border-slate-300 rounded">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-slate-100 border-b border-slate-300 sticky top-0 z-10 text-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2 px-3">Date / Bucket</th>
                {activeMetrics.map((m) => (
                  <th key={m} className="py-2 px-3 text-right uppercase">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {chartData.length === 0 ? (
                <tr>
                  <td colSpan={activeMetrics.length + 1} className="py-6 text-center text-slate-400">
                    No data available for this range
                  </td>
                </tr>
              ) : (
                chartData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{row.bucket}</td>
                    {activeMetrics.map((m) => {
                      const u = (UNIT as any)[m] || 'count';
                      const v = row[m];
                      let display = '—';
                      if (v !== undefined && v !== null) {
                        if (u === 'money') display = money(v, rules);
                        else if (u === 'percent') display = pct(v);
                        else if (u === 'ratio') display = ratio(v);
                        else display = num(v);
                      }
                      const change = computePointChange(chartData, m, i);
                      return (
                        <td key={m} className="py-2 px-3 text-right tabular-nums text-slate-800">
                          <div>{display}</div>
                          {viewChanges && change && (
                            <div className="text-[10px] font-semibold tracking-tight" style={{ color: change.color }}>
                              {change.text}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
