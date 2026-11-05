'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import { isDeltaFavorable, type MetricKey } from './wizard/helpers';
import { Popover } from '@/components/ui/Popover';

interface KpiCardsProps {
  summary: any;
  totals?: any;
  loading?: boolean;
  campaignId?: number;
  selectedChartMetrics?: [MetricKey, MetricKey];
  onSelectMetric?: (metric: MetricKey) => void;
}

export function KpiCards({
  summary,
  totals,
  loading = false,
  selectedChartMetrics = ['spend', 'sales'],
  onSelectMetric,
}: KpiCardsProps) {
  const { rules } = useActiveAccount();
  const [eighthCardMetric, setEighthCardMetric] = useState<'cpc' | 'orders' | 'cvr'>('cpc');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Extract current, previous, deltas from server-computed summary
  const current = summary?.current || summary?.totals || totals || {};
  const previous = summary?.previous || {};
  const deltas = summary?.deltas || {};

  // Standard 8 card slots:
  // 1: Spend, 2: Sales, 3: ACOS, 4: ROAS, 5: Impressions, 6: Clicks, 7: CTR, 8: Dynamic (CPC / Orders / CVR)
  const cardKeys: MetricKey[] = [
    'spend',
    'sales',
    'acos',
    'roas',
    'impressions',
    'clicks',
    'ctr',
    eighthCardMetric,
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
      return '—';
    }

    switch (key) {
      case 'spend':
      case 'sales':
      case 'cpc':
        return money(val, rules);
      case 'acos':
        return pct(val, 2);
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

  const getDeltaValue = (key: MetricKey): number | null => {
    const deltaKey = `${key}_delta_pct` in deltas ? `${key}_delta_pct` : `${key}_delta_pts`;
    if (deltaKey in deltas && deltas[deltaKey] !== null && deltas[deltaKey] !== undefined) {
      return Number(deltas[deltaKey]);
    }

    const curVal = current[key];
    const prevVal = previous[key];
    if (curVal !== undefined && prevVal !== undefined && prevVal !== null && prevVal > 0) {
      if (key === 'acos' || key === 'ctr' || key === 'cvr') {
        return roundDelta(curVal - prevVal);
      }
      return roundDelta(((curVal - prevVal) / prevVal) * 100);
    }
    return null;
  };

  const roundDelta = (val: number) => Number(val.toFixed(1));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
      {cardKeys.map((key, idx) => {
        const isEighth = idx === 7;
        const isPrimary = selectedChartMetrics[0] === key;
        const isSecondary = selectedChartMetrics[1] === key;
        const val = current[key];
        const delta = getDeltaValue(key);
        const favorable = delta !== null ? isDeltaFavorable(key, delta) : true;

        const isInfiniteAcos =
          key === 'acos' &&
          (current.acos_is_infinite || (Number(current.spend) > 0 && Number(current.sales) === 0));

        return (
          <div
            key={`${key}-${idx}`}
            onClick={() => onSelectMetric && onSelectMetric(key)}
            className={`relative rounded-md p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-colors select-none ${
              isPrimary
                ? 'bg-indigo-50/90 border-2 border-indigo-600 text-slate-950 shadow-xs'
                : isSecondary
                ? 'bg-emerald-50/90 border-2 border-emerald-600 text-slate-950 shadow-xs'
                : 'bg-white border border-slate-300 hover:border-indigo-500 hover:bg-slate-50/80 text-slate-900'
            }`}
          >
            {/* Header: Label + (Eighth Card Switcher / Axis Indicator Badge) */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {getMetricLabel(key)}
              </span>

              <div className="flex items-center gap-1">
                {isEighth && (
                  <Popover
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                    trigger={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(!dropdownOpen);
                        }}
                        className="p-1 rounded text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center"
                        title="Switch metric"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    }
                  >
                    <div className="w-28 p-1 text-xs font-mono bg-white">
                      {(['cpc', 'orders', 'cvr'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEighthCardMetric(m);
                            setDropdownOpen(false);
                            if (onSelectMetric) onSelectMetric(m);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 uppercase font-semibold ${
                            eighthCardMetric === m ? 'text-indigo-600 bg-indigo-50' : 'text-slate-800'
                          }`}
                        >
                          {getMetricLabel(m)}
                        </button>
                      ))}
                    </div>
                  </Popover>
                )}

                {isPrimary ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-600 text-white shadow-2xs">
                    Axis 1
                  </span>
                ) : isSecondary ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white shadow-2xs">
                    Axis 2
                  </span>
                ) : null}
              </div>
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

            {/* Delta badge */}
            <div className="mt-2 min-h-[22px] flex items-center gap-1 font-mono text-[11px]">
              {isInfiniteAcos ? (
                <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  0 Sales
                </span>
              ) : delta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    favorable
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {delta > 0 ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  ) : delta < 0 ? (
                    <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                  ) : null}
                  {Math.abs(delta).toFixed(1)}
                  {key === 'acos' || key === 'ctr' || key === 'cvr' ? ' pts' : '%'}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
