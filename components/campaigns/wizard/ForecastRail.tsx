'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ShoppingBag, Target, ShieldBan, Info } from 'lucide-react';
import { getCampaignForecast } from '@/lib/api-client';
import type { CampaignDraft, ForecastResponse, MarketplaceRules } from '@/lib/types/campaign';
import { money, num } from '@/lib/format';

interface ForecastRailProps {
  draft: CampaignDraft;
  rules: MarketplaceRules;
  countryName: string;
}

export function ForecastRail({ draft, rules, countryName }: ForecastRailProps) {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced forecast API call
  useEffect(() => {
    const productIds = draft.products.selected.map((p) => p.id);
    const targetCount =
      draft.details.targetingType === 'AUTO'
        ? draft.targeting.autoGroups.filter((g) => g.enabled).length
        : draft.targeting.keywords.length + draft.targeting.targets.length;

    const defaultBid =
      draft.details.targetingType === 'AUTO' && draft.targeting.bidMode === 'BY_GROUP'
        ? Math.min(...draft.targeting.autoGroups.filter((g) => g.enabled).map((g) => g.bid ?? 0))
        : draft.targeting.defaultBid;

    // Check if required inputs are present
    if (productIds.length === 0 || !draft.details.dailyBudget || !defaultBid || targetCount === 0) {
      setForecast(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getCampaignForecast(
          {
            ads_account_id: draft.accountId,
            product_ids: productIds,
            daily_budget: draft.details.dailyBudget,
            default_bid: defaultBid,
            targeting_type: draft.details.targetingType,
            target_count: targetCount,
          },
          controller.signal
        );
        setForecast(res);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setForecast(null);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [
    draft.accountId,
    draft.products.selected,
    draft.details.dailyBudget,
    draft.details.targetingType,
    draft.targeting.bidMode,
    draft.targeting.defaultBid,
    draft.targeting.autoGroups,
    draft.targeting.keywords,
    draft.targeting.targets,
  ]);

  const targetCount =
    draft.details.targetingType === 'AUTO'
      ? draft.targeting.autoGroups.filter((g) => g.enabled).length
      : draft.targeting.keywords.length + draft.targeting.targets.length;

  const negativeCount =
    draft.negatives.keywords.length +
    draft.negatives.brands.length +
    draft.negatives.asins.length;

  return (
    <div className="space-y-4 font-mono text-xs text-text-main">
      {/* Live Summary Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-3">
        <span className="font-bold uppercase tracking-wider text-slate-800 block text-[11px] pb-2 border-b border-border-dim">
          Campaign Summary
        </span>

        <div className="space-y-2">
          <div>
            <span className="text-[10px] uppercase text-slate-400 block">Name</span>
            <span className="font-semibold text-slate-900 block truncate" title={draft.details.name}>
              {draft.details.name || 'Untitled Campaign'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Country</span>
              <span className="text-slate-800 font-medium">{countryName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Daily Budget</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {draft.details.dailyBudget ? money(draft.details.dailyBudget, rules) : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Start Date</span>
              <span className="text-slate-700">{draft.details.startDate || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">End Date</span>
              <span className="text-slate-700">{draft.details.endDate || 'No end date'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border-dim space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-500">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                <span>Featured Products</span>
              </span>
              <span className="font-bold text-slate-900">{draft.products.selected.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-500">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>{draft.details.targetingType === 'AUTO' ? 'Auto Groups' : 'Targets'}</span>
              </span>
              <span className="font-bold text-slate-900">{targetCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldBan className="w-3.5 h-3.5 text-slate-400" />
                <span>Excluded Targets</span>
              </span>
              <span className="font-bold text-slate-900">{negativeCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Forecast Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-dim">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold uppercase tracking-wider text-slate-800 text-[11px]">
              Forecast (Beta)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Weekly</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">
            <span className="inline-block animate-pulse">Calculating forecast...</span>
          </div>
        ) : !forecast || !forecast.clicks || !forecast.orders || !forecast.spend ? (
          <div className="py-6 text-center text-slate-400">
            <Info className="w-6 h-6 stroke-[1.5] mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600 text-xs">No forecast yet</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans px-2">
              To see a forecast: choose products, add targets, enter a bid.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">
                Est. Weekly Clicks
              </span>
              <span className="font-bold text-lg text-slate-900 tabular-nums">
                {num(forecast.clicks.low)} – {num(forecast.clicks.high)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">
                Est. Weekly Orders
              </span>
              <span className="font-bold text-lg text-emerald-700 tabular-nums">
                {num(forecast.orders.low)} – {num(forecast.orders.high)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">
                Est. Weekly Spend
              </span>
              <span className="font-bold text-lg text-slate-900 tabular-nums">
                {money(forecast.spend.low, rules)} – {money(forecast.spend.high, rules)}
              </span>
            </div>

            <div className="pt-2 border-t border-border-dim text-[10px] text-slate-500 font-sans leading-tight">
              {forecast.basis === 'history'
                ? 'Estimate based on your account’s last 30 days.'
                : 'Based on typical performance — no historical account data yet.'}
            </div>
          </div>
        )}

        <p className="text-[9px] text-slate-400 pt-1 border-t border-border-dim font-sans">
          Heuristic weekly projection. Actual performance will vary depending on marketplace competition and demand.
        </p>
      </div>
    </div>
  );
}
