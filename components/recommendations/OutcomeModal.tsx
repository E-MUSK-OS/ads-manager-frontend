'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { getRecommendationOutcome } from '@/lib/recommendations-api';
import type { RecommendationOutcome } from '@/lib/types/recommendation';
import { formatDateIN } from '@/lib/format';

interface OutcomeModalProps {
  open: boolean;
  onClose: () => void;
  recommendationId: number | null;
  currencySymbol: string;
}

export function OutcomeModal({
  open,
  onClose,
  recommendationId,
  currencySymbol,
}: OutcomeModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<RecommendationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !recommendationId) {
      setOutcome(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getRecommendationOutcome(recommendationId)
      .then((data) => {
        if (active) {
          setOutcome(data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load outcome tracking data');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, recommendationId]);

  const renderDelta = (delta: number, isPercent: boolean = false, invertGoodBad: boolean = false) => {
    if (delta === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-text-muted font-mono font-medium">
          <Minus className="size-3" />
          <span>0{isPercent ? '%' : ''}</span>
        </span>
      );
    }
    const isPositive = delta > 0;
    // For Spend / ACOS, increase is usually red/warning, decrease is green.
    // For Sales / Orders, increase is green, decrease is red.
    const isGood = invertGoodBad ? !isPositive : isPositive;
    const colorClass = isGood ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const sign = isPositive ? '+' : '';

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${colorClass}`}>
        <Icon className="size-3" />
        <span>
          {sign}
          {isPercent ? `${(delta * 100).toFixed(1)}%` : isPercent === false && delta % 1 === 0 ? delta : delta.toFixed(2)}
        </span>
      </span>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Performance Outcome (7d Before vs 7d After)"
      size="lg"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs">Computing 7-day before vs after actual performance…</span>
        </div>
      ) : error ? (
        <div className="p-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
          {error}
        </div>
      ) : outcome ? (
        <div className="flex flex-col gap-4 text-xs">
          {/* Header Info */}
          <div className="p-3 bg-surface rounded-lg border border-border-dim flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-text-muted text-[11px]">Recommendation:</span>
              <div className="font-semibold text-text-main text-sm">
                #{outcome.recommendation_id}
              </div>
            </div>
            <div className="text-right">
              <span className="text-text-muted text-[11px]">Applied On:</span>
              <div className="font-mono text-text-main font-medium">
                {outcome.applied_at ? formatDateIN(outcome.applied_at) : 'Recently'}
              </div>
            </div>
          </div>

          {/* Windows description */}
          <div className="grid grid-cols-2 gap-3 text-center text-[11px]">
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <div className="font-semibold text-slate-700">Pre-Period (7 Days Before)</div>
              <div className="font-mono text-slate-500 mt-0.5">
                {outcome.before_window ? `${outcome.before_window.start} → ${outcome.before_window.end}` : '7 days prior'}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <div className="font-semibold text-slate-700">Post-Period (7 Days After)</div>
              <div className="font-mono text-slate-500 mt-0.5">
                {outcome.after_window ? `${outcome.after_window.start} → ${outcome.after_window.end}` : '7 days after'}
              </div>
            </div>
          </div>

          {/* Metrics Comparison Table */}
          <div className="border border-border-dim rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-elevated border-b border-border-dim text-[11px] font-semibold text-text-dim">
                <tr>
                  <th className="p-2.5">Metric</th>
                  <th className="p-2.5 text-right">7d Before</th>
                  <th className="p-2.5 text-right">7d After</th>
                  <th className="p-2.5 text-right">Difference (Delta)</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border-dim font-mono text-[11px]">
                {/* Spend */}
                <tr>
                  <td className="p-2.5 font-sans font-medium text-text-main">Spend</td>
                  <td className="p-2.5 text-right text-text-muted">
                    {currencySymbol}{outcome.before?.spend.toFixed(2) ?? '0.00'}
                  </td>
                  <td className="p-2.5 text-right text-text-main font-semibold">
                    {currencySymbol}{outcome.after?.spend.toFixed(2) ?? '0.00'}
                  </td>
                  <td className="p-2.5 text-right">
                    {renderDelta(outcome.delta?.spend_diff ?? 0, false, true)}
                  </td>
                </tr>

                {/* Purchases (7d) */}
                <tr>
                  <td className="p-2.5 font-sans font-medium text-text-main">Purchases (7d)</td>
                  <td className="p-2.5 text-right text-text-muted">
                    {outcome.before?.orders ?? 0}
                  </td>
                  <td className="p-2.5 text-right text-text-main font-semibold">
                    {outcome.after?.orders ?? 0}
                  </td>
                  <td className="p-2.5 text-right">
                    {renderDelta(outcome.delta?.orders_diff ?? 0, false, false)}
                  </td>
                </tr>

                {/* Sales (7d) */}
                <tr>
                  <td className="p-2.5 font-sans font-medium text-text-main">Sales (7d)</td>
                  <td className="p-2.5 text-right text-text-muted">
                    {currencySymbol}{outcome.before?.sales.toFixed(2) ?? '0.00'}
                  </td>
                  <td className="p-2.5 text-right text-text-main font-semibold">
                    {currencySymbol}{outcome.after?.sales.toFixed(2) ?? '0.00'}
                  </td>
                  <td className="p-2.5 text-right">
                    {renderDelta(outcome.delta?.sales_diff ?? 0, false, false)}
                  </td>
                </tr>

                {/* ACOS */}
                <tr>
                  <td className="p-2.5 font-sans font-medium text-text-main">ACOS</td>
                  <td className="p-2.5 text-right text-text-muted">
                    {outcome.before?.acos !== null && outcome.before?.acos !== undefined && isFinite(outcome.before.acos)
                      ? `${outcome.before.acos.toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="p-2.5 text-right text-text-main font-semibold">
                    {outcome.after?.acos !== null && outcome.after?.acos !== undefined && isFinite(outcome.after.acos)
                      ? `${outcome.after.acos.toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="p-2.5 text-right">
                    {outcome.delta?.acos_diff !== null && outcome.delta?.acos_diff !== undefined
                      ? renderDelta(outcome.delta.acos_diff, true, true)
                      : <span className="text-text-muted">—</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mandatory Disclaimer Note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2">
            <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Note: </span>
              <span>{outcome.disclaimer || 'Before/after comparison, not proof of cause.'}</span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end pt-2 border-t border-border-dim">
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
