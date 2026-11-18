'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import type { MetricKey } from './wizard/helpers';

interface KpiCardsProps {
  summary: any;
  totals?: any;
  loading?: boolean;
  campaignId?: number;
  selectedChartMetrics?: MetricKey[];
  onSelectMetric?: (metric: MetricKey) => void;
}

// Direction rule per stock-market style:
// For cost/efficiency metrics (ACOS, CPC, Spend): DOWN is favorable (green), UP is unfavorable (red).
// For growth/volume metrics (Sales, ROAS, Impressions, Clicks, CTR, Orders, CVR): UP is favorable (green), DOWN is unfavorable (red).
function isMetricFavorable(key: MetricKey, delta: number): boolean {
  if (key === 'acos' || key === 'cpc' || key === 'spend') {
    return delta <= 0;
  }
  return delta >= 0;
}

export function KpiCards({
  summary,
  totals,
  loading = false,
  selectedChartMetrics = ['spend', 'sales'],
  onSelectMetric,
}: KpiCardsProps) {
  const { rules } = useActiveAccount();

  // Extract current, previous, deltas from server-computed summary
  const current = summary?.current || summary?.totals || totals || {};
  const previous = summary?.previous || {};
  const deltas = summary?.deltas || {};

  // Standard KPI cards: Spend, Sales, ACOS, ROAS, Impressions, Clicks, CTR, CPC, Orders
  const cardKeys: MetricKey[] = [
    'spend',
    'sales',
    'acos',
    'roas',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
  ];

  const getMetricLabel = (key: MetricKey): string => {
    switch (key) {
      case 'spend': return 'Spend';
      case 'sales': return 'Sales';
      case 'acos': return 'ACOS';
      case 'roas': return 'ROAS';
      case 'impressions': return 'Impressions';
      case 'clicks': return 'Clicks';
      case 'ctr': return 'CTR';
      case 'cpc': return 'CPC';
      case 'orders': return 'Orders';
      case 'cvr': return 'CVR';
      default: return key;
    }
  };

  const formatValue = (key: MetricKey, val: any): React.ReactNode => {
    const isInfinite =
      key === 'acos' &&
      (current.acos_is_infinite || (Number(current.spend) > 0 && Number(current.sales) === 0));

    if (isInfinite) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 font-mono font-bold">
          INF <span className="text-[10px] font-sans font-semibold px-1 py-0.5 bg-red-100 text-red-800 rounded">0 Sales</span>
        </span>
      );
    }

    if (val === null || val === undefined) {
      return (
        <span className="text-slate-400 font-medium" title="No data for this period">
          —
        </span>
      );
    }

    switch (key) {
      case 'spend':
      case 'sales':
      case 'cpc':
        return money(val, rules);
      case 'acos':
      case 'ctr':
      case 'cvr':
        return pct(val, 2);
      case 'roas':
        return ratio(val, 2);
      case 'impressions':
      case 'clicks':
      case 'orders':
        return num(val);
      default:
        return String(val);
    }
  };

  const getDeltaPct = (key: MetricKey): number | null => {
    const deltaKey = `${key}_delta_pct` in deltas ? `${key}_delta_pct` : `${key}_delta_pts`;
    if (deltaKey in deltas && deltas[deltaKey] !== null && deltas[deltaKey] !== undefined) {
      return Number(deltas[deltaKey]);
    }

    const curVal = Number(current[key]);
    const prevVal = Number(previous[key]);
    if (!isNaN(curVal) && !isNaN(prevVal) && prevVal > 0) {
      if (key === 'acos' || key === 'ctr' || key === 'cvr') {
        return Number((curVal - prevVal).toFixed(2));
      }
      return Number((((curVal - prevVal) / prevVal) * 100).toFixed(1));
    }
    return null;
  };

  const getDeltaAbs = (key: MetricKey): number | null => {
    const curVal = Number(current[key]);
    const prevVal = Number(previous[key]);
    if (!isNaN(curVal) && !isNaN(prevVal) && previous[key] !== undefined && previous[key] !== null) {
      return curVal - prevVal;
    }
    return null;
  };

  const formatDeltaAbs = (key: MetricKey, absVal: number): string => {
    const sign = absVal > 0 ? '+' : '';
    switch (key) {
      case 'spend':
      case 'sales':
      case 'cpc':
        return `${sign}₹${Math.abs(absVal).toFixed(2)}`;
      case 'acos':
      case 'ctr':
      case 'cvr':
        return `${sign}${absVal.toFixed(2)} pts`;
      case 'roas':
        return `${sign}${absVal.toFixed(2)}x`;
      case 'impressions':
      case 'clicks':
      case 'orders':
        return `${sign}${num(absVal)}`;
      default:
        return `${sign}${absVal}`;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
      {cardKeys.map((key) => {
        const isSelected = selectedChartMetrics.includes(key);
        const val = current[key];
        const deltaPct = getDeltaPct(key);
        const deltaAbs = getDeltaAbs(key);
        const favorable = deltaPct !== null ? isMetricFavorable(key, deltaPct) : true;

        const isInfiniteAcos =
          key === 'acos' &&
          (current.acos_is_infinite || (Number(current.spend) > 0 && Number(current.sales) === 0));

        return (
          <div
            key={key}
            onClick={() => onSelectMetric && onSelectMetric(key)}
            className={`relative rounded-md p-3 flex flex-col justify-between shadow-2xs select-none transition-all ${
              onSelectMetric ? 'cursor-pointer hover:border-indigo-400 hover:bg-slate-50/80' : 'cursor-default'
            } ${
              isSelected
                ? 'bg-indigo-50/90 border-2 border-indigo-600 text-slate-950 shadow-xs'
                : 'bg-white border border-slate-300 text-slate-900'
            }`}
            title={onSelectMetric ? `Click to toggle ${getMetricLabel(key)} on the performance chart` : undefined}
          >
            {/* Header: Label + Selected indicator */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {getMetricLabel(key)}
              </span>

              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 shadow-2xs" title="Active on chart" />
              )}
            </div>

            {/* Metric Value */}
            <div className="mt-1 flex items-baseline">
              {loading ? (
                <div className="h-6 w-20 bg-slate-200 animate-pulse rounded" />
              ) : (
                <span className="font-mono tabular-nums text-lg font-bold text-slate-950">
                  {formatValue(key, val)}
                </span>
              )}
            </div>

            {/* Delta badge: % and absolute change vs previous period */}
            <div className="mt-2 min-h-[22px] flex items-center gap-1 font-mono text-[11px]">
              {isInfiniteAcos ? (
                <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  0 Sales
                </span>
              ) : deltaPct !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    favorable
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                  title={deltaAbs !== null ? `Absolute change: ${formatDeltaAbs(key, deltaAbs)}` : undefined}
                >
                  {deltaPct > 0 ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  ) : deltaPct < 0 ? (
                    <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                  ) : null}
                  {Math.abs(deltaPct).toFixed(1)}
                  {key === 'acos' || key === 'ctr' || key === 'cvr' ? ' pts' : '%'}
                  {deltaAbs !== null && (
                    <span className="text-[10px] opacity-80 ml-0.5 hidden 2xl:inline">
                      ({formatDeltaAbs(key, deltaAbs)})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 font-medium" title="No previous period data">
                  —
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
