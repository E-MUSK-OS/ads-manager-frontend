'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  KeyRound,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  X,
} from 'lucide-react';
import { getBidSuggestions, apiClient } from '@/lib/api-client';
import type {
  CampaignDraft,
  MarketplaceRules,
  Match,
  BidSuggestionsResponse,
} from '@/lib/types/campaign';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { FieldError } from '@/components/ui/FieldError';

interface Step3TargetingProps {
  draft: CampaignDraft;
  onChange: (updated: Partial<CampaignDraft['targeting']>) => void;
  onGoToStep1: () => void;
  rules: MarketplaceRules;
  errors: Record<string, string>;
  warnings: string[];
}

const AUTO_GROUP_INFO = {
  CLOSE_MATCH: {
    label: 'Close match',
    description: 'Ads appear when shoppers use search terms closely related to your products.',
  },
  LOOSE_MATCH: {
    label: 'Loose match',
    description: 'Ads appear when shoppers use search terms broadly related to your products.',
  },
  SUBSTITUTES: {
    label: 'Substitutes',
    description: 'Ads appear on product detail pages of products similar to yours.',
  },
  COMPLEMENTS: {
    label: 'Complements',
    description: 'Ads appear on product detail pages of products that complement yours.',
  },
};

export function Step3Targeting({
  draft,
  onChange,
  onGoToStep1,
  rules,
  errors,
  warnings,
}: Step3TargetingProps) {
  const isAuto = draft.details.targetingType === 'AUTO';
  const t = draft.targeting;

  // Manual tab: Keywords vs Product targeting
  const [keywordTextarea, setKeywordTextarea] = useState('');
  const [matchTypes, setMatchTypes] = useState<Record<Match, boolean>>({
    BROAD: true,
    PHRASE: true,
    EXACT: true,
  });

  // Product targeting textarea
  const [targetAsinText, setTargetAsinText] = useState('');

  // Suggested keywords from advertised products
  const [suggestedKwChips, setSuggestedKwChips] = useState<string[]>([]);
  const [bidSuggestions, setBidSuggestions] = useState<BidSuggestionsResponse | null>(null);

  // Fetch bid suggestions & suggested keywords from advertised products
  useEffect(() => {
    const productIds = draft.products.selected.map((p) => p.id);
    if (!draft.accountId || productIds.length === 0) return;

    // Fetch product suggested keywords
    if (!isAuto && productIds[0]) {
      apiClient<Array<{ keyword_text: string }>>(`/products/${productIds[0]}/keywords`)
        .then((items) => {
          if (Array.isArray(items)) {
            setSuggestedKwChips(items.map((k) => k.keyword_text).slice(0, 20));
          }
        })
        .catch(() => {});
    }

    // Fetch bid suggestions
    getBidSuggestions({
      ads_account_id: draft.accountId,
      product_ids: productIds,
      keywords: t.keywords.map((k) => ({ keyword_text: k.text, match_type: k.match })),
    })
      .then((res) => {
        setBidSuggestions(res);
        // Pre-fill auto groups if available
        if (isAuto && res.auto_groups) {
          const updatedGroups = t.autoGroups.map((g) => {
            const sug = res.auto_groups[g.key];
            if (sug && (g.bid === null || g.bid === undefined)) {
              return { ...g, bid: sug.median };
            }
            return g;
          });
          onChange({ autoGroups: updatedGroups });
        }
      })
      .catch(() => {});
  }, [draft.accountId, draft.products.selected, isAuto]);

  // Clean keyword text
  const cleanKeyword = (text: string) => {
    return text.trim().replace(/\s+/g, ' ');
  };

  // Add keywords from textarea
  const handleAddKeywords = () => {
    const lines = keywordTextarea
      .split('\n')
      .map(cleanKeyword)
      .filter((s) => s.length > 0 && s.length <= 80 && s.split(' ').length <= 10);

    const activeMatches: Match[] = (['BROAD', 'PHRASE', 'EXACT'] as Match[]).filter(
      (m) => matchTypes[m]
    );

    if (lines.length === 0 || activeMatches.length === 0) return;

    const newKeywords = [...t.keywords];
    const defaultBid = t.defaultBid || rules.min_bid;

    for (const line of lines) {
      for (const m of activeMatches) {
        // Prevent duplicates
        const exists = newKeywords.some(
          (k) => k.text.toLowerCase() === line.toLowerCase() && k.match === m
        );
        if (!exists) {
          newKeywords.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            text: line,
            match: m,
            bid: defaultBid,
          });
        }
      }
    }

    onChange({ keywords: newKeywords });
    setKeywordTextarea('');
  };

  const handleAddSuggestedChip = (text: string) => {
    const defaultBid = t.defaultBid || rules.min_bid;
    const exists = t.keywords.some(
      (k) => k.text.toLowerCase() === text.toLowerCase() && k.match === 'EXACT'
    );
    if (!exists) {
      onChange({
        keywords: [
          ...t.keywords,
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            text,
            match: 'EXACT',
            bid: defaultBid,
          },
        ],
      });
    }
  };

  // Add Product Target (ASINs)
  const handleAddProductTargets = () => {
    const lines = targetAsinText
      .split('\n')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z0-9]{10}$/.test(s));

    if (lines.length === 0) return;
    const newTargets = [...t.targets];
    const defaultBid = t.defaultBid || rules.min_bid;

    for (const asin of lines) {
      if (!newTargets.some((target) => target.value === asin)) {
        newTargets.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          kind: 'ASIN',
          value: asin,
          bid: defaultBid,
        });
      }
    }

    onChange({ targets: newTargets });
    setTargetAsinText('');
  };

  return (
    <div className="space-y-5 font-mono text-xs text-text-main">
      {/* Targeting Mode Banner */}
      <div className="bg-surface border border-border-dim rounded-md p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-slate-800 text-sm">
            Targeting: {isAuto ? 'Automatic' : 'Manual'}
          </span>
          <span className="text-[11px] text-slate-500 font-sans">
            ({isAuto ? 'Amazon targets keywords and products' : 'Custom keywords & product targets'})
          </span>
        </div>
        <button
          type="button"
          onClick={onGoToStep1}
          className="text-primary hover:underline text-[11px] font-medium"
        >
          Change in Step 1
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="p-3 rounded border border-amber-200 bg-amber-50/50 space-y-1 text-amber-800 text-[11px]">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* AUTOMATIC TARGETING MODE */}
      {isAuto ? (
        <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-5">
          <div className="space-y-3">
            <span className="font-bold uppercase tracking-wider text-slate-800 block text-xs">
              Automatic Bidding Mode
            </span>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bid_mode"
                  checked={t.bidMode === 'DEFAULT'}
                  onChange={() => onChange({ bidMode: 'DEFAULT' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="font-medium text-slate-800">Set single default bid</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bid_mode"
                  checked={t.bidMode === 'BY_GROUP'}
                  onChange={() => onChange({ bidMode: 'BY_GROUP' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="font-medium text-slate-800">Set bids by targeting group</span>
              </label>
            </div>
          </div>

          {/* Mode 1: Default Bid */}
          {t.bidMode === 'DEFAULT' ? (
            <div className="max-w-sm space-y-2 border-t border-border-dim pt-4">
              <label htmlFor="auto-default-bid" className="block text-slate-600 uppercase text-[11px] font-medium">
                Default Bid ({rules.symbol}) <span className="text-spend">*</span>
              </label>
              <MoneyInput
                id="auto-default-bid"
                value={t.defaultBid}
                onChange={(val) => onChange({ defaultBid: val })}
                currencySymbol={rules.symbol}
                min={rules.min_bid}
                max={rules.max_bid}
                className={errors.default_bid ? 'border-spend' : ''}
              />
              <FieldError error={errors.default_bid} />
              <span className="text-[10px] text-slate-400 block font-sans">
                Applied to all customer search terms and placements unless adjusted.
              </span>
            </div>
          ) : (
            /* Mode 2: By Group */
            <div className="space-y-3 border-t border-border-dim pt-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Targeting Groups & Individual Bids
              </span>
              <FieldError error={errors.auto_groups} />

              <div className="divide-y divide-border-dim border border-border-dim rounded bg-white">
                {t.autoGroups.map((group) => {
                  const info = (AUTO_GROUP_INFO as any)[group.key];
                  const sug = bidSuggestions?.auto_groups?.[group.key];

                  return (
                    <div
                      key={group.key}
                      className={`p-3 flex flex-wrap items-center justify-between gap-4 transition-colors ${
                        !group.enabled ? 'bg-slate-50 opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 max-w-md">
                        <input
                          type="checkbox"
                          checked={group.enabled}
                          onChange={(e) => {
                            const updated = t.autoGroups.map((g) =>
                              g.key === group.key ? { ...g, enabled: e.target.checked } : g
                            );
                            onChange({ autoGroups: updated });
                          }}
                          className="rounded border-border-dim text-primary focus:ring-primary h-4 w-4 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{info.label}</span>
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                            {info.description}
                          </p>
                        </div>
                      </div>

                      {/* Bid input */}
                      <div className="w-36">
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">
                          Group Bid
                        </label>
                        <MoneyInput
                          disabled={!group.enabled}
                          value={group.bid}
                          onChange={(val) => {
                            const updated = t.autoGroups.map((g) =>
                              g.key === group.key ? { ...g, bid: val } : g
                            );
                            onChange({ autoGroups: updated });
                          }}
                          currencySymbol={rules.symbol}
                          min={rules.min_bid}
                          max={rules.max_bid}
                        />
                        {sug && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Suggested: {rules.symbol}{sug.low} – {rules.symbol}{sug.high}
                          </span>
                        )}
                        <FieldError error={errors[`auto_group_${group.key}`]} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MANUAL TARGETING MODE */
        <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-5">
          {/* Default Bid */}
          <div className="max-w-sm">
            <label htmlFor="manual-default-bid" className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Default Target Bid ({rules.symbol}) <span className="text-spend">*</span>
            </label>
            <MoneyInput
              id="manual-default-bid"
              value={t.defaultBid}
              onChange={(val) => onChange({ defaultBid: val })}
              currencySymbol={rules.symbol}
              min={rules.min_bid}
              max={rules.max_bid}
              className={errors.default_bid ? 'border-spend' : ''}
            />
            <FieldError error={errors.default_bid} />
            <span className="text-[10px] text-slate-400 block mt-1 font-sans">
              Base bid applied to added targets that do not specify a custom bid.
            </span>
          </div>

          {/* Sub-tabs: Keywords vs Products */}
          <div className="border-t border-border-dim pt-4 space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ manualTab: 'KEYWORDS' })}
                className={`px-3 py-1.5 rounded font-medium text-xs transition-colors inline-flex items-center gap-1.5 ${
                  t.manualTab === 'KEYWORDS'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Keyword Targeting ({t.keywords.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ manualTab: 'PRODUCTS' })}
                className={`px-3 py-1.5 rounded font-medium text-xs transition-colors inline-flex items-center gap-1.5 ${
                  t.manualTab === 'PRODUCTS'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Product Targeting ({t.targets.length})</span>
              </button>
            </div>

            {/* Keyword Targeting Tab */}
            {t.manualTab === 'KEYWORDS' ? (
              <div className="space-y-4">
                {/* Match Type Toggles */}
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-slate-500 font-semibold">Match Types:</span>
                  {(['BROAD', 'PHRASE', 'EXACT'] as Match[]).map((m) => (
                    <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchTypes[m]}
                        onChange={(e) =>
                          setMatchTypes({ ...matchTypes, [m]: e.target.checked })
                        }
                        className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>

                {/* Textarea */}
                <div>
                  <label className="block text-slate-600 text-[11px] uppercase mb-1 font-medium">
                    Enter keywords (separated by new line)
                  </label>
                  <textarea
                    rows={4}
                    value={keywordTextarea}
                    onChange={(e) => setKeywordTextarea(e.target.value)}
                    placeholder="running shoes&#10;trail runner&#10;marathon gear"
                    className="w-full p-2.5 border border-border-dim rounded bg-white font-mono text-xs focus:outline-hidden focus:border-primary"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-400">
                      Up to 80 characters and 10 words per line.
                    </span>
                    <button
                      type="button"
                      onClick={handleAddKeywords}
                      disabled={!keywordTextarea.trim()}
                      className="px-3 py-1 bg-primary text-white rounded font-medium disabled:opacity-50 hover:bg-indigo-800"
                    >
                      Add keywords
                    </button>
                  </div>
                </div>

                {/* Suggested keyword chips */}
                {suggestedKwChips.length > 0 && (
                  <div className="p-3 rounded border border-border-dim bg-slate-50 space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                      Suggested for your products (click to add as EXACT):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedKwChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleAddSuggestedChip(chip)}
                          className="px-2 py-0.5 rounded-full border border-border-dim bg-white text-[11px] text-slate-700 hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">
                      Targeted Keywords ({t.keywords.length})
                    </span>
                    {t.keywords.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onChange({ keywords: [] })}
                        className="text-spend hover:underline"
                      >
                        Remove all
                      </button>
                    )}
                  </div>
                  <FieldError error={errors.targeting} />

                  {t.keywords.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 border border-border-dim rounded bg-slate-50/50">
                      No keywords added yet. Enter keywords above or click suggested chips.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border-dim rounded bg-white">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                          <tr>
                            <th className="py-2 px-3">Keyword</th>
                            <th className="py-2 px-3">Match</th>
                            <th className="py-2 px-3">Suggested Bid</th>
                            <th className="py-2 px-3 text-right">Your Bid</th>
                            <th className="py-2 px-3 w-10 text-center" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dim">
                          {t.keywords.map((kw) => {
                            const sug = bidSuggestions?.items?.find(
                              (i) => i.keyword_text.toLowerCase() === kw.text.toLowerCase() && i.match_type === kw.match
                            );

                            return (
                              <tr key={kw.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-medium text-slate-900">{kw.text}</td>
                                <td className="py-2 px-3 text-slate-600">{kw.match}</td>
                                <td className="py-2 px-3 text-slate-400 tabular-nums">
                                  {sug ? (
                                    <span>
                                      {rules.symbol}{sug.low} – {rules.symbol}{sug.high}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <input
                                    type="number"
                                    step="any"
                                    min={rules.min_bid}
                                    max={rules.max_bid}
                                    value={kw.bid ?? ''}
                                    onChange={(e) => {
                                      const updated = t.keywords.map((k) =>
                                        k.id === kw.id
                                          ? { ...k, bid: e.target.value === '' ? null : Number(e.target.value) }
                                          : k
                                      );
                                      onChange({ keywords: updated });
                                    }}
                                    className="w-20 px-1.5 py-0.5 border border-border-dim rounded text-right font-mono"
                                  />
                                  <FieldError error={errors[`kw_${kw.id}`]} />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onChange({ keywords: t.keywords.filter((k) => k.id !== kw.id) })
                                    }
                                    className="text-slate-400 hover:text-spend p-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Product Targeting Tab */
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-[11px] uppercase mb-1 font-medium">
                    Target competitor ASINs (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={targetAsinText}
                    onChange={(e) => setTargetAsinText(e.target.value)}
                    placeholder="B0791TX5P5&#10;B084DWG2VQ"
                    className="w-full p-2.5 border border-border-dim rounded bg-white font-mono text-xs focus:outline-hidden focus:border-primary"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-400">
                      10-character alphanumeric ASINs.
                    </span>
                    <button
                      type="button"
                      onClick={handleAddProductTargets}
                      disabled={!targetAsinText.trim()}
                      className="px-3 py-1 bg-primary text-white rounded font-medium disabled:opacity-50 hover:bg-indigo-800"
                    >
                      Add ASIN targets
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Targeted Products ({t.targets.length})
                  </span>
                  <FieldError error={errors.targeting} />

                  {t.targets.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 border border-border-dim rounded bg-slate-50/50">
                      No product targets added yet.
                    </div>
                  ) : (
                    <div className="border border-border-dim rounded bg-white divide-y divide-border-dim">
                      {t.targets.map((tgt) => (
                        <div key={tgt.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900 block">{tgt.value}</span>
                            <span className="text-[10px] text-slate-400">Product Target (ASIN)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="any"
                              value={tgt.bid ?? ''}
                              onChange={(e) => {
                                const updated = t.targets.map((item) =>
                                  item.id === tgt.id
                                    ? { ...item, bid: e.target.value === '' ? null : Number(e.target.value) }
                                    : item
                                );
                                onChange({ targets: updated });
                              }}
                              className="w-20 px-1.5 py-0.5 border border-border-dim rounded text-right font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onChange({ targets: t.targets.filter((item) => item.id !== tgt.id) })
                              }
                              className="text-slate-400 hover:text-spend p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
