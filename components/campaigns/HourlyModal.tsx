'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  RotateCw,
  X,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import {
  getHourlyStatus,
  getHourlySummary,
  getHourlyMatrix,
} from '@/lib/api-client';
import type {
  HourlyStatusResponse,
  HourlySummaryResponse,
  HourlyMatrixResponse,
} from '@/lib/types/campaign';
import { DateRangePicker, DateRangeState } from '@/components/campaigns/DateRangePicker';

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
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [status, setStatus] = useState<HourlyStatusResponse | null>(null);
  const [summary, setSummary] = useState<HourlySummaryResponse | null>(null);
  const [matrix, setMatrix] = useState<HourlyMatrixResponse | null>(null);

  // Selected heatmap metric (driven directly by clicking top KPI cards)
  const [heatmapMetric, setHeatmapMetric] = useState<MetricType>('sales');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMatrixData = useCallback(async (metric: MetricType) => {
    if (!account?.id) return;
    setMatrixLoading(true);
    try {
      const mat = await getHourlyMatrix({
        ads_account_id: account.id,
        campaign_id: campaignId,
        start: dateRange.start,
        end: dateRange.end,
        metric,
      });
      setMatrix(mat);
    } catch (err) {
      console.error('Failed to load matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  }, [account?.id, campaignId, dateRange.start, dateRange.end]);

  const handleSelectMetric = (metric: MetricType) => {
    if (metric === heatmapMetric) return;
    setHeatmapMetric(metric);
    loadMatrixData(metric);
  };

  const loadAllHourlyData = useCallback(async () => {
    if (!account?.id) return;
    setLoading(true);
    try {
      const [st, sum, mat] = await Promise.all([
        getHourlyStatus(account.id),
        getHourlySummary({
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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hourly-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5"
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
            /* Full Connected View: Metric Selector Cards + Heatmap */
            <>
              {/* Top KPI Cards acting as Metric Selection Buttons for Heatmap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Select a metric below to display in the Date × Hour Heatmap:</span>
                  <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                    Active: {METRIC_CONFIG[heatmapMetric].label}
                  </span>
                </div>
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
                  ].map((kpi) => {
                    const mKey = kpi.key as MetricType;
                    const cfg = METRIC_CONFIG[mKey];
                    const isSelected = heatmapMetric === mKey;

                    return (
                      <button
                        key={kpi.key}
                        type="button"
                        onClick={() => handleSelectMetric(mKey)}
                        title={
                          kpi.raw === null || kpi.raw === undefined
                            ? 'No data recorded for this metric'
                            : `Display ${kpi.label} heatmap`
                        }
                        className={`p-3 rounded-lg flex flex-col justify-between text-left transition-all cursor-pointer select-none shadow-2xs relative ${
                          isSelected
                            ? 'bg-indigo-50/90 border-2 border-indigo-600 shadow-xs ring-1 ring-indigo-500/20'
                            : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span
                            className={`text-[10px] uppercase tracking-wider ${
                              isSelected ? 'text-indigo-900 font-bold' : 'text-slate-500 font-semibold'
                            }`}
                          >
                            {kpi.label}
                          </span>
                          {/* Metric Color Dot */}
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                              isSelected ? 'opacity-100 ring-2 ring-white shadow-2xs scale-110' : 'opacity-40'
                            }`}
                            style={{ backgroundColor: cfg?.color || '#6366f1' }}
                          />
                        </div>
                        <div className="flex items-baseline justify-between mt-1.5 gap-1">
                          <span
                            className={`text-sm font-mono truncate ${
                              isSelected ? 'text-indigo-950 font-extrabold' : 'text-slate-900 font-bold'
                            }`}
                          >
                            {kpi.val}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-indigo-600 text-white rounded font-bold uppercase shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date × Hour Matrix Heatmap */}
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
                    {/* Active Metric Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Metric:</span>
                      <span className="px-2.5 py-1 text-xs rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold flex items-center gap-1.5 font-mono shadow-2xs">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: METRIC_CONFIG[heatmapMetric]?.color || '#059669' }}
                        />
                        {METRIC_CONFIG[heatmapMetric]?.label || 'Sales'}
                        {matrixLoading && <RotateCw className="w-3 h-3 animate-spin text-indigo-600 ml-1" />}
                      </span>
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
