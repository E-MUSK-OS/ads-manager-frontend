import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Sparkles, Info, Lightbulb, AlertTriangle, History } from 'lucide-react';
import { previewRule } from '@/lib/recommendations-api';
import type { RuleDraft, RulePreviewResponse, Meta } from '@/lib/types/recommendation';

interface RulePreviewProps {
  adsAccountId: number | null;
  ruleDraft: RuleDraft;
  meta?: Meta | null;
  currencySymbol: string;
}

export function RulePreview({
  adsAccountId,
  ruleDraft,
  currencySymbol,
}: RulePreviewProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<RulePreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if draft has at least one valid condition and action
  const hasValidCondition =
    ruleDraft.conditions.length > 0 &&
    ruleDraft.conditions.some((c) => c.metric && c.op && c.value !== null && c.value !== undefined);

  const hasValidAction =
    ruleDraft.actions.length > 0 &&
    ruleDraft.actions.some((a) => Boolean(a.type));

  const isPreviewable = Boolean(adsAccountId) && hasValidCondition && hasValidAction;

  const campaignIdsKey = JSON.stringify(ruleDraft.campaign_ids);
  const conditionsKey = JSON.stringify(ruleDraft.conditions);
  const actionsKey = JSON.stringify(ruleDraft.actions);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      if (!isPreviewable || !adsAccountId) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await previewRule(adsAccountId, ruleDraft);
        setData(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Preview unavailable';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }, isPreviewable ? 500 : 0);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    adsAccountId,
    isPreviewable,
    ruleDraft,
    campaignIdsKey,
    conditionsKey,
    actionsKey,
  ]);

  if (!isPreviewable) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 border border-border-dim text-xs text-text-muted">
        <Info className="size-4 shrink-0 text-slate-400" />
        <span>Add a condition and an action to see a live preview.</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-md bg-slate-50/70 border border-border-dim flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
          <Sparkles className="size-3.5 text-primary" />
          <span>Live Rule Preview</span>
          {loading && <Loader2 className="size-3 animate-spin text-text-muted" />}
        </div>
        {data && (
          <span className={`text-xs font-mono font-medium ${data.match_count > 0 ? 'text-primary' : 'text-text-muted'}`}>
            {data.match_count > 0
              ? `Would match ${data.match_count} item${data.match_count === 1 ? '' : 's'} right now`
              : '0 items match right now'}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Contradiction & Overlap Warnings (Q14) */}
      {data && data.warnings && data.warnings.length > 0 && (
        <div className="flex flex-col gap-1 p-2.5 rounded bg-amber-50/90 border border-amber-300 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
            <span>Rule Warnings</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Backtest (Q16) */}
      {data && data.backtest && data.backtest.eligible && (
        <div className="flex flex-col gap-1 p-2.5 rounded bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
            <History className="size-3.5 text-emerald-600 shrink-0" />
            <span>Backtest (If Run 7 Days Ago)</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
            If run 7 days ago: <strong className="font-semibold">{data.backtest.matched_count} item{data.backtest.matched_count === 1 ? '' : 's'}</strong> matched. Over the next 7 days, they spent{' '}
            <strong className="font-semibold">{currencySymbol}{data.backtest.next_7d_spend.toFixed(2)}</strong> with{' '}
            <strong className="font-semibold">{data.backtest.next_7d_orders} purchase{data.backtest.next_7d_orders === 1 ? '' : 's'}</strong>.
          </p>
        </div>
      )}

      {/* Funnel explanation / "Why no results?" summary */}
      {data && data.funnel && (
        <div className="flex flex-col gap-2 pt-1">
          {data.funnel.summary_text && (
            <div className="text-xs text-text-main leading-relaxed bg-surface/80 p-2.5 rounded border border-border-dim/60">
              {data.funnel.summary_text}
            </div>
          )}

          {/* Plain tip based on the first condition that removes the most items */}
          {data.funnel.tip && data.match_count === 0 && (
            <div className="flex items-start gap-2 p-2 rounded bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800">
              <Lightbulb className="size-3.5 shrink-0 text-amber-600 mt-0.5" />
              <span>{data.funnel.tip}</span>
            </div>
          )}
        </div>
      )}

      {/* Sample matched items */}
      {data && data.sample && data.sample.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Sample matched items (up to {data.sample.length}):
          </div>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {data.sample.map((item, idx) => {
              const label = (item.label || item.entity_label || item.search_term || item.keyword_text || item.campaign_name || `Item #${idx + 1}`) as string;
              const spend = item.spend !== undefined ? `${currencySymbol}${item.spend}` : null;
              const clicks = item.clicks !== undefined ? `${item.clicks} clicks` : null;
              const orders = item.orders !== undefined ? `${item.orders} orders` : null;
              const stats = [spend, clicks, orders].filter(Boolean).join(' · ');

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-surface border border-border-dim/60 font-mono"
                >
                  <span className="truncate max-w-[280px] font-sans font-medium text-text-main">
                    {label}
                  </span>
                  {stats && <span className="text-[11px] text-text-muted shrink-0 ml-2">{stats}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data && (!data.funnel || !data.funnel.summary_text) && data.sample && data.sample.length === 0 && !loading && (
        <p className="text-xs text-text-muted italic">
          No current entities in your account match these conditions right now.
        </p>
      )}
    </div>
  );
}
