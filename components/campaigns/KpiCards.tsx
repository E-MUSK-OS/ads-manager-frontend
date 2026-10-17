'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, X, Plus, ChevronDown } from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import { Popover } from '@/components/ui/Popover';
import type { CampaignSummaryResponse, ReportTotals } from '@/lib/types/campaign';

interface KpiCardsProps {
  summary: CampaignSummaryResponse | null;
  totals?: ReportTotals | null;
  loading?: boolean;
  campaignId?: number;
}

type MetricKey =
  | 'impressions'
  | 'spend'
  | 'orders'
  | 'sales'
  | 'acos'
  | 'roas'
  | 'clicks'
  | 'ctr'
  | 'cpc'
  | 'cvr'
  | 'tacos';

interface MetricMeta {
  key: MetricKey;
  label: string;
  format: (v: number | null | undefined, rules: any) => string;
  isInverse?: boolean; // If true, lower is better (e.g. spend, acos, cpc)
}

const METRICS_META: Record<MetricKey, MetricMeta> = {
  impressions: { key: 'impressions', label: 'Impressions', format: (v) => num(v) },
  spend: { key: 'spend', label: 'Spend', format: (v, r) => money(v, r), isInverse: true },
  orders: { key: 'orders', label: 'Orders', format: (v) => num(v) },
  sales: { key: 'sales', label: 'Sales', format: (v, r) => money(v, r) },
  acos: { key: 'acos', label: 'ACOS', format: (v) => pct(v), isInverse: true },
  roas: { key: 'roas', label: 'ROAS', format: (v) => ratio(v) },
  clicks: { key: 'clicks', label: 'Clicks', format: (v) => num(v) },
  ctr: { key: 'ctr', label: 'CTR', format: (v) => pct(v) },
  cpc: { key: 'cpc', label: 'CPC', format: (v, r) => money(v, r), isInverse: true },
  cvr: { key: 'cvr', label: 'CVR', format: (v) => pct(v) },
  tacos: { key: 'tacos', label: 'TACoS', format: (v) => pct(v), isInverse: true },
};

const DEFAULT_METRICS: MetricKey[] = ['impressions', 'spend', 'orders', 'sales'];
const STORAGE_KEY = 'ads_manager_kpi_selection';

export function KpiCards({ summary, totals, loading, campaignId }: KpiCardsProps) {
  const { rules } = useActiveAccount();
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(DEFAULT_METRICS);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MetricKey[];
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 6) {
          setSelectedMetrics(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveMetrics = (metrics: MetricKey[]) => {
    setSelectedMetrics(metrics);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    } catch {
      // ignore
    }
  };

  const removeMetric = (key: MetricKey) => {
    if (selectedMetrics.length <= 1) return;
    const next = selectedMetrics.filter((m) => m !== key);
    saveMetrics(next);
  };

  const toggleMetric = (key: MetricKey) => {
    if (selectedMetrics.includes(key)) {
      if (selectedMetrics.length > 1) {
        saveMetrics(selectedMetrics.filter((m) => m !== key));
      }
    } else {
      if (selectedMetrics.length < 6) {
        saveMetrics([...selectedMetrics, key]);
      }
    }
  };

  // Compute current vs previous totals
  const currentTotals = summary?.totals || totals || {};

  // Compute sum of previous series if compare is active
  const previousTotals: Record<string, number | null> = {};
  if (summary?.previous_series && summary.previous_series.length > 0) {
    const ps = summary.previous_series;
    let imp = 0, clk = 0, sp = 0, sl = 0, ord = 0;
    ps.forEach((p) => {
      imp += p.impressions || 0;
      clk += p.clicks || 0;
      sp += p.spend || 0;
      sl += p.sales || 0;
      ord += p.orders || 0;
    });
    previousTotals.impressions = imp;
    previousTotals.clicks = clk;
    previousTotals.spend = sp;
    previousTotals.sales = sl;
    previousTotals.orders = ord;
    previousTotals.ctr = imp > 0 ? (clk / imp) * 100 : null;
    previousTotals.cpc = clk > 0 ? sp / clk : null;
    previousTotals.cvr = clk > 0 ? (ord / clk) * 100 : null;
    previousTotals.acos = sl > 0 ? (sp / sl) * 100 : null;
    previousTotals.roas = sp > 0 ? sl / sp : null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {selectedMetrics.map((key) => {
        const meta = METRICS_META[key];
        const val = (currentTotals as any)[key];
        const prevVal = previousTotals[key];

        // Delta calculation
        let delta: number | null = null;
        if (
          val !== null &&
          val !== undefined &&
          prevVal !== null &&
          prevVal !== undefined &&
          prevVal > 0
        ) {
          delta = ((val - prevVal) / prevVal) * 100;
        }

        const isAcosWithoutSales =
          key === 'acos' &&
          val === null &&
          Number((currentTotals as any).spend) > 0;

        return (
          <div
            key={key}
            className="group relative bg-surface border border-border-dim rounded-md p-3 flex flex-col justify-between shadow-2xs transition-all hover:border-slate-300"
          >
            {/* Remove Card Button */}
            {selectedMetrics.length > 1 && (
              <button
                type="button"
                onClick={() => removeMetric(key)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-0.5 rounded"
                title="Remove metric"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-slate-500 block">
                {meta.label}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                {loading ? (
                  <div className="h-7 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                  <span className="font-mono text-2xl font-bold tabular-nums text-text-main">
                    {meta.format(val, rules)}
                  </span>
                )}
              </div>
            </div>

            {/* Delta / Note footer */}
            <div className="mt-2 min-h-[18px] flex items-center gap-1.5 text-xs font-mono">
              {isAcosWithoutSales ? (
                <span className="text-spend text-[11px] font-medium">No sales</span>
              ) : delta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                    meta.isInverse
                      ? delta > 0
                        ? 'text-spend'
                        : 'text-sales'
                      : delta > 0
                      ? 'text-sales'
                      : 'text-spend'
                  }`}
                >
                  {delta > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(delta).toFixed(1)}%
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">—</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Metric Card */}
      {selectedMetrics.length < 6 && (
        <Popover
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          trigger={
            <button
              type="button"
              className="h-full min-h-[96px] border border-dashed border-border-dim rounded-md p-3 flex flex-col items-center justify-center gap-1.5 hover:border-slate-400 hover:bg-slate-50/50 transition-colors text-slate-500"
            >
              <Plus className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-wider">
                Add metric {selectedMetrics.length}/6
              </span>
            </button>
          }
        >
          <div className="w-48 p-2 text-xs font-mono">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 px-2 py-1 font-medium">
              Choose Metrics (max 6)
            </span>
            {(Object.keys(METRICS_META) as MetricKey[]).map((mk) => {
              const checked = selectedMetrics.includes(mk);
              const disabled = !checked && selectedMetrics.length >= 6;
              return (
                <label
                  key={mk}
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
                    disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleMetric(mk)}
                    className="rounded border-border-dim text-primary focus:ring-primary"
                  />
                  <span>{METRICS_META[mk].label}</span>
                </label>
              );
            })}
          </div>
        </Popover>
      )}
    </div>
  );
}
