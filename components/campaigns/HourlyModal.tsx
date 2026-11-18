'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  RotateCw,
  X,
  Radio,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import {
  getHourlyStatus,
  getHourlySummary,
  getHourlyTrends,
  getHourlyMatrix,
} from '@/lib/api-client';
import type {
  HourlyStatusResponse,
  HourlySummaryResponse,
  HourlyTrendsResponse,
  HourlyMatrixResponse,
} from '@/lib/types/campaign';
import { DateRangePicker, DateRangeState } from '@/components/campaigns/DateRangePicker';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface HourlyModalProps {
  open: boolean;
  onClose: () => void;
  campaignId?: number;
  campaignName?: string;
}

type MetricType = 'sales' | 'orders' | 'spend' | 'clicks' | 'impressions' | 'roas' | 'acos' | 'ctr' | 'cpc';

const METRIC_CONFIG: Record<
  MetricType,
  { label: string; color: string; format: (v: number | null | undefined) => string }
> = {
  sales: { label: 'Sales', color: '#059669', format: (v) => money(v) },
  orders: { label: 'Orders', color: '#2563eb', format: (v) => num(v) },
  spend: { label: 'Spend', color: '#e11d48', format: (v) => money(v) },
  clicks: { label: 'Clicks', color: '#0284c7', format: (v) => num(v) },
  impressions: { label: 'Impressions', color: '#8b5cf6', format: (v) => num(v) },
  roas: { label: 'ROAS', color: '#10b981', format: (v) => ratio(v) },
  acos: { label: 'ACOS', color: '#d97706', format: (v) => pct(v) },
  ctr: { label: 'CTR', color: '#6366f1', format: (v) => pct(v) },
  cpc: { label: 'CPC', color: '#f43f5e', format: (v) => money(v) },
};

export function HourlyModal({ open, onClose, campaignId, campaignName }: HourlyModalProps) {
  const { account, todayInTz } = useActiveAccount();

  const today = todayInTz();
  const defaultStartDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, [today]);

  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: 'last_7_days',
    start: defaultStartDate,
    end: today,
    compare: false,
  });

  // State
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<HourlyStatusResponse | null>(null);
  const [summary, setSummary] = useState<HourlySummaryResponse | null>(null);
  const [trends, setTrends] = useState<HourlyTrendsResponse | null>(null);
  const [matrix, setMatrix] = useState<HourlyMatrixResponse | null>(null);

  // Selected chart metric chips (allow selecting all)
  const [selectedChartMetrics, setSelectedChartMetrics] = useState<MetricType[]>(['sales', 'spend']);

  // Selected heatmap metric
  const [heatmapMetric, setHeatmapMetric] = useState<MetricType>('sales');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleChartMetric = (metric: MetricType) => {
    setSelectedChartMetrics((prev) => {
      if (prev.includes(metric)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric]; // Allow selecting all metrics
    });
  };

  const loadAllHourlyData = useCallback(async () => {
    if (!account?.id) return;
    setLoading(true);
    try {
      const [st, sum, tr, mat] = await Promise.all([
        getHourlyStatus(account.id),
        getHourlySummary({
          ads_account_id: account.id,
          campaign_id: campaignId,
          start: dateRange.start,
          end: dateRange.end,
        }),
        getHourlyTrends({
          ads_account_id: account.id,
          campaign_id: campaignId,
          start: dateRange.start,
          end: dateRange.end,
        }),
        getHourlyMatrix({
          ads_account_id: account.id,
          campaign_id: campaignId,
          start: dateRange.start,
          end: dateRange.end,
          metric: heatmapMetric,
        }),
      ]);
      setStatus(st);
      setSummary(sum);
      setTrends(tr);
      setMatrix(mat);
    } catch (err) {
      console.error('Failed to load hourly data:', err);
    } finally {
      setLoading(false);
    }
  }, [account?.id, campaignId, dateRange.start, dateRange.end, heatmapMetric]);

  useEffect(() => {
    if (open) {
      loadAllHourlyData();
    }
  }, [open, loadAllHourlyData]);

  if (!open || !mounted) return null;

  const isConnected = status?.is_connected === true;
  const hasData = summary?.has_data === true;
  const totals = summary?.totals || {};

  // Heatmap intensity calculation
  const minVal = matrix?.min_value || 0;
  const maxVal = matrix?.max_value || 1;

  const getHeatmapColor = (val: number) => {
    if (val === 0 || val === null || val === undefined) return 'bg-slate-50 text-slate-400';
    if (maxVal === minVal) return 'bg-indigo-100 text-indigo-900';
    const ratioVal = Math.min(1, Math.max(0, (val - minVal) / (maxVal - minVal || 1)));
    if (ratioVal < 0.25) return 'bg-indigo-50 text-indigo-900 font-medium';
    if (ratioVal < 0.5) return 'bg-indigo-100 text-indigo-950 font-medium';
    if (ratioVal < 0.75) return 'bg-indigo-200 text-indigo-950 font-semibold';
    return 'bg-indigo-300 text-indigo-950 font-bold';
  };

  // Primary charted metric peak & low facts
  const primaryMetric = selectedChartMetrics[0] || 'sales';
  const peakLowFact = trends?.peaks_and_lows?.[primaryMetric];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hourly-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="hourly-modal-title" className="text-base font-bold text-slate-900 tracking-tight">
                  Hourly Performance Tracking
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-700 font-mono">
                  ₹ INR
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium block">
                {campaignName ? `${campaignName}` : 'All Sponsored Products Campaigns'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Date Range Picker */}
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadAllHourlyData}
              disabled={loading}
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh hourly data"
              aria-label="Refresh hourly data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              <RotateCw className="w-6 h-6 mx-auto mb-2.5 animate-spin text-indigo-600" />
              Loading hourly stream metrics...
            </div>
          ) : !isConnected ? (
            /* Honest Empty State: Stream Not Connected */
            <div className="py-16 px-6 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Radio className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Hourly data is not connected yet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hourly intra-day tracking requires a live <strong>Amazon Marketing Stream (AMS)</strong> subscription delivering traffic and conversion events to AWS SQS.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] leading-relaxed text-left">
                <p className="font-semibold text-slate-800 mb-1">How AMS Works:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Amazon streams hourly events as they occur; data starts accumulating from subscription time.</li>
                  <li>Conversions use 7-day attribution and are attributed to the exact hour of the ad click.</li>
                  <li>Per project guidelines, hourly metrics are never derived, fabricated, or estimated from daily totals.</li>
                </ul>
              </div>
            </div>
          ) : !hasData ? (
            /* Honest Empty State: Connected but No Data in Period */
            <div className="py-16 px-6 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No hourly data for this period
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No hourly traffic or conversion events were recorded for the selected date range. Try expanding your date range.
              </p>
            </div>
          ) : (
            /* Full Connected View */
            <>
              {/* KPI Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                {[
                  { key: 'impressions', label: 'Impressions', raw: totals.impressions, val: num(totals.impressions) },
                  { key: 'clicks', label: 'Clicks', raw: totals.clicks, val: num(totals.clicks) },
                  { key: 'spend', label: 'Spend', raw: totals.spend, val: money(totals.spend) },
                  { key: 'orders', label: 'Orders', raw: totals.orders, val: num(totals.orders) },
                  { key: 'sales', label: 'Sales', raw: totals.sales, val: money(totals.sales) },
                  { key: 'ctr', label: 'CTR', raw: totals.ctr, val: pct(totals.ctr) },
                  { key: 'cpc', label: 'CPC', raw: totals.cpc, val: money(totals.cpc) },
                  { key: 'roas', label: 'ROAS', raw: totals.roas, val: ratio(totals.roas) },
                  { key: 'acos', label: 'ACOS', raw: totals.acos, val: pct(totals.acos) },
                ].map((kpi) => (
                  <div
                    key={kpi.key}
                    title={kpi.raw === null || kpi.raw === undefined ? 'No data recorded for this metric' : undefined}
                    className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono mt-1">
                      {kpi.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* SECTION 1: Hourly Performance Trends (Line Chart 00-23) */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Hourly Performance Trends (00:00 – 23:00)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Aggregated performance by hour of the day over the selected date range
                    </p>
                  </div>

                  {/* Peak and Low Plain Facts Badges */}
                  {peakLowFact && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-semibold">
                        Peak: {peakLowFact.peak_label} ({METRIC_CONFIG[primaryMetric].format(peakLowFact.peak_value)})
                      </span>
                      <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded">
                        Low: {peakLowFact.low_label} ({METRIC_CONFIG[primaryMetric].format(peakLowFact.low_value)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Metric Selection Chips (Max 4) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-medium text-slate-500 mr-1">Metrics:</span>
                  {(Object.keys(METRIC_CONFIG) as MetricType[]).map((key) => {
                    const cfg = METRIC_CONFIG[key];
                    const isSelected = selectedChartMetrics.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleToggleChartMetric(key)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Recharts 24-Hour Line Chart */}
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends?.series || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        stroke="#cbd5e1"
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-xl border border-slate-800 space-y-1">
                              <span className="font-bold block border-b border-slate-800 pb-1 text-slate-300 font-mono">
                                Hour: {label}
                              </span>
                              {payload.map((p) => {
                                const mKey = p.dataKey as MetricType;
                                const cfg = METRIC_CONFIG[mKey];
                                return (
                                  <div key={mKey} className="flex items-center justify-between gap-4 font-mono">
                                    <span style={{ color: p.color }}>{cfg?.label || mKey}:</span>
                                    <span className="font-bold">{cfg ? cfg.format(Number(p.value)) : String(p.value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />
                      {selectedChartMetrics.map((key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={METRIC_CONFIG[key].label}
                          stroke={METRIC_CONFIG[key].color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: METRIC_CONFIG[key].color }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SECTION 2: Date x Hour Heatmap */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Date × Hour Matrix Heatmap
                    </h3>
                    <p className="text-xs text-slate-400">
                      Day-by-hour distribution with daily totals and hourly aggregation
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Metric Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Metric:</span>
                      <select
                        value={heatmapMetric}
                        onChange={(e) => setHeatmapMetric(e.target.value as MetricType)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        {(Object.keys(METRIC_CONFIG) as MetricType[]).map((k) => (
                          <option key={k} value={k}>
                            {METRIC_CONFIG[k].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Simple Intensity Legend */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <span>Lower</span>
                      <div className="flex h-3.5 w-16 rounded overflow-hidden border border-slate-200">
                        <span className="flex-1 bg-indigo-50" />
                        <span className="flex-1 bg-indigo-100" />
                        <span className="flex-1 bg-indigo-200" />
                        <span className="flex-1 bg-indigo-300" />
                      </div>
                      <span>Higher</span>
                    </div>
                  </div>
                </div>

                {/* Heatmap Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] font-mono">
                      <tr>
                        <th className="px-3 py-2 text-left bg-slate-100 sticky left-0 z-10">Date</th>
                        {Array.from({ length: 24 }).map((_, h) => (
                          <th key={h} className="px-1.5 py-2 w-10">
                            {String(h).padStart(2, '0')}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right bg-slate-100 font-bold">Daily Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {matrix?.rows.map((r) => (
                        <tr key={r.date} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-left font-medium text-slate-800 bg-white sticky left-0 z-10 border-r border-slate-200">
                            {r.date}
                          </td>
                          {Array.from({ length: 24 }).map((_, h) => {
                            const val = r.hours[String(h)] ?? 0;
                            return (
                              <td
                                key={h}
                                className={`px-1 py-1.5 transition-colors cursor-default ${getHeatmapColor(val)}`}
                                title={`${r.date} at ${String(h).padStart(2, '0')}:00\n${METRIC_CONFIG[heatmapMetric].label}: ${METRIC_CONFIG[heatmapMetric].format(val)}`}
                              >
                                {val > 0 ? (
                                  heatmapMetric === 'sales' || heatmapMetric === 'spend'
                                    ? Math.round(val)
                                    : Number(val.toFixed(1))
                                ) : (
                                  '·'
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50/50 border-l border-slate-200">
                            {METRIC_CONFIG[heatmapMetric].format(r.daily_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {matrix?.summary_row && (
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 font-mono text-[11px]">
                        <tr>
                          <td className="px-3 py-2 text-left sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                            Total
                          </td>
                          {Array.from({ length: 24 }).map((_, h) => {
                            const val = matrix.summary_row.hours[String(h)] ?? 0;
                            return (
                              <td key={h} className="px-1 py-2">
                                {val > 0 ? (
                                  heatmapMetric === 'sales' || heatmapMetric === 'spend'
                                    ? Math.round(val)
                                    : Number(val.toFixed(1))
                                ) : (
                                  '0'
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right text-indigo-700 border-l border-slate-200">
                            {METRIC_CONFIG[heatmapMetric].format(matrix.summary_row.daily_total)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Footer Note */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Hourly data collected since subscription time. Orders use Amazon 7-day attribution and count in the exact hour of the ad click.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
