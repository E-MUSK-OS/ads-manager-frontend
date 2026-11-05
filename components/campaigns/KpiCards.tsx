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
    if (val === null || val === undefined) {
      if (key === 'acos' && (current.acos_is_infinite || (Number(current.spend) > 0 && Number(current.sales) === 0))) {
        return (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-mono font-bold bg-red-50 text-spend border border-red-200"
            title={`${money(current.spend, rules)} spent with 0 sales`}
          >
            INF
          </span>
        );
      }
      return '—';
    }

    switch (key) {
      case 'spend':
      case 'sales':
      case 'cpc':
        return money(val, rules);
      case 'acos':
        if (current.acos_is_infinite || (Number(current.spend) > 0 && Number(current.sales) === 0)) {
          return (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-mono font-bold bg-red-50 text-spend border border-red-200"
              title={`${money(current.spend, rules)} spent with 0 sales`}
            >
              INF
            </span>
          );
        }
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
            className={`relative bg-surface border rounded-md p-2.5 flex flex-col justify-between shadow-2xs transition-all cursor-pointer select-none ${
              isPrimary
                ? 'border-t-2 border-t-primary border-slate-300 bg-primary/5 ring-1 ring-primary/20'
                : isSecondary
                ? 'border-t-2 border-t-emerald-600 border-slate-300 bg-emerald-50/30 ring-1 ring-emerald-500/20'
                : 'border-border-dim hover:border-slate-300'
            }`}
          >
            {/* Header: Label + (Eighth Card Switcher / Axis Indicator) */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                {getMetricLabel(key)}
              </span>

              {isEighth ? (
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
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center gap-0.5"
                      title="Switch metric"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  }
                >
                  <div className="w-28 p-1 text-xs font-mono">
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
                        className={`w-full text-left px-2 py-1 rounded hover:bg-slate-100 uppercase ${
                          eighthCardMetric === m ? 'font-bold text-primary' : 'text-slate-700'
                        }`}
                      >
                        {getMetricLabel(m)}
                      </button>
                    ))}
                  </div>
                </Popover>
              ) : isPrimary ? (
                <span className="w-2 h-2 rounded-full bg-primary" title="Primary Axis (Left)" />
              ) : isSecondary ? (
                <span className="w-2 h-2 rounded-full bg-emerald-600" title="Secondary Axis (Right)" />
              ) : null}
            </div>

            {/* Metric Value */}
            <div className="mt-1 flex items-baseline">
              {loading ? (
                <div className="h-6 w-20 bg-slate-100 animate-pulse rounded" />
              ) : (
                <span className="font-mono text-lg font-bold tabular-nums text-text-main">
                  {formatValue(key, val)}
                </span>
              )}
            </div>

            {/* Delta badge */}
            <div className="mt-1.5 min-h-[16px] flex items-center gap-1 font-mono text-[10px]">
              {isInfiniteAcos ? (
                <span className="text-spend font-medium">Spend with 0 sales</span>
              ) : delta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium ${
                    favorable ? 'text-sales' : 'text-spend'
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
                <span className="text-slate-400">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
