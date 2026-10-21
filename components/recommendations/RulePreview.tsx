import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Sparkles, Info } from 'lucide-react';
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
    }, isPreviewable ? 600 : 0);

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
    <div className="p-3.5 rounded-md bg-slate-50/70 border border-border-dim flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
          <Sparkles className="size-3.5 text-primary" />
          <span>Live Rule Preview</span>
          {loading && <Loader2 className="size-3 animate-spin text-text-muted" />}
        </div>
        {data && (
          <span className="text-xs font-mono font-medium text-primary">
            Would match {data.match_count} item{data.match_count === 1 ? '' : 's'} right now
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

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

      {data && data.sample && data.sample.length === 0 && !loading && (
        <p className="text-xs text-text-muted italic">
          No current entities in your account match these conditions right now.
        </p>
      )}
    </div>
  );
}
