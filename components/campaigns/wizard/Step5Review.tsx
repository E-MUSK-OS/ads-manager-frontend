'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit2,
  RotateCw,
  ShoppingBag,
  Target,
  ShieldBan,
  Layers,
} from 'lucide-react';
import { validateCampaign } from '@/lib/api-client';
import type {
  CampaignDraft,
  MarketplaceRules,
} from '@/lib/types/campaign';
import { money } from '@/lib/format';
import { toPayload, STEP_OF } from './helpers';

interface Step5ReviewProps {
  draft: CampaignDraft;
  rules: MarketplaceRules;
  countryName: string;
  onGoToStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  onLaunch: (state: 'ENABLED' | 'PAUSED') => void;
  onSaveDraft: () => void;
  submitting: boolean;
}

export function Step5Review({
  draft,
  rules,
  countryName,
  onGoToStep,
  onLaunch,
  onSaveDraft,
  submitting,
}: Step5ReviewProps) {
  const [validating, setValidating] = useState(true);
  const [serverErrors, setServerErrors] = useState<Array<{ field?: string; message: string }>>([]);
  const [serverWarnings, setServerWarnings] = useState<Array<{ field?: string; message: string }>>([]);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setValidating(true);
    const payload = toPayload(draft, rules);

    validateCampaign(payload)
      .then((res) => {
        if (!cancelled) {
          setServerErrors(res.errors || []);
          setServerWarnings(res.warnings || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err?.fields && err.fields.length > 0) {
            setServerErrors(err.fields);
          } else {
            setServerErrors([{ message: err?.message || 'Validation failed' }]);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [draft, rules]);

  const hasBlockingErrors = serverErrors.length > 0;
  const allWarningsAcknowledged = serverWarnings.every((_, idx) => acknowledgedWarnings[idx]);

  const canLaunch = !hasBlockingErrors && (serverWarnings.length === 0 || allWarningsAcknowledged);

  return (
    <div className="space-y-5 font-mono text-xs text-text-main">
      {/* Title */}
      <div className="bg-surface border border-border-dim rounded-md p-4 shadow-2xs">
        <span className="font-bold uppercase tracking-wider text-slate-800 text-sm block">
          Review & Launch Campaign
        </span>
        <p className="text-slate-500 text-xs mt-0.5">
          Review all campaign details, targeting criteria, and budget limits before launching your campaign to Amazon Ads.
        </p>
      </div>

      {/* Validation status banners */}
      {validating ? (
        <div className="p-4 rounded border border-border-dim bg-slate-50 text-slate-500 flex items-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-primary" />
          <span>Validating campaign parameters against Amazon Ads rules...</span>
        </div>
      ) : hasBlockingErrors ? (
        <div className="p-4 rounded border border-rose-300 bg-rose-50 space-y-2">
          <div className="flex items-center gap-2 text-spend font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Please resolve {serverErrors.length} issue(s) before launching:</span>
          </div>
          <div className="space-y-1.5 pl-6">
            {serverErrors.map((err, idx) => {
              const stepTarget = err.field ? STEP_OF(err.field) : 1;
              return (
                <div key={idx} className="flex items-center justify-between text-[11px] text-rose-800">
                  <span>• {err.message}</span>
                  <button
                    type="button"
                    onClick={() => onGoToStep(stepTarget)}
                    className="text-primary hover:underline font-semibold ml-2 shrink-0"
                  >
                    Fix in Step {stepTarget} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded border border-emerald-300 bg-emerald-50/70 flex items-center gap-2 text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Ready for launch! All Amazon Ads parameters and limits validated successfully.</span>
        </div>
      )}

      {/* Server Warnings (amber, with acknowledge checkbox) */}
      {serverWarnings.length > 0 && (
        <div className="p-4 rounded border border-amber-300 bg-amber-50 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Optimization Warnings ({serverWarnings.length}):</span>
          </div>
          <div className="space-y-2 pl-6">
            {serverWarnings.map((warn, idx) => (
              <label key={idx} className="flex items-start gap-2 cursor-pointer text-[11px] text-amber-900">
                <input
                  type="checkbox"
                  checked={!!acknowledgedWarnings[idx]}
                  onChange={(e) =>
                    setAcknowledgedWarnings({
                      ...acknowledgedWarnings,
                      [idx]: e.target.checked,
                    })
                  }
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 mt-0.5"
                />
                <span>
                  {warn.message}{' '}
                  <span className="font-semibold text-amber-700">(I understand)</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 Review Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-dim pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
              1. Campaign Details
            </span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Name</span>
            <span className="font-semibold text-slate-900 truncate block">{draft.details.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Daily Budget</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {draft.details.dailyBudget ? money(draft.details.dailyBudget, rules) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Dates</span>
            <span className="text-slate-900">
              {draft.details.startDate} – {draft.details.endDate || 'No end date'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Strategy</span>
            <span className="text-slate-900 truncate block">{draft.details.strategy}</span>
          </div>
        </div>
      </div>

      {/* Step 2 Review Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-dim pb-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
              2. Featured Products ({draft.products.selected.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {draft.products.selected.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="p-2 border border-border-dim rounded bg-white flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-slate-900 block truncate text-[11px]" title={p.title}>
                  {p.title}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {p.asin} • {money(p.price, rules)}
                </span>
              </div>
            </div>
          ))}
        </div>
        {draft.products.selected.length > 6 && (
          <span className="text-[11px] text-slate-400 block">
            + {draft.products.selected.length - 6} more products
          </span>
        )}
      </div>

      {/* Step 3 Review Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-dim pb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
              3. Targeting ({draft.details.targetingType})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {draft.details.targetingType === 'AUTO' ? (
          <div className="text-[11px]">
            <span className="text-slate-500 block mb-1">
              Bidding Mode: {draft.targeting.bidMode === 'DEFAULT' ? 'Single Default Bid' : 'By Group'}
            </span>
            <div className="flex flex-wrap gap-2">
              {draft.targeting.autoGroups.filter((g) => g.enabled).map((g) => (
                <span
                  key={g.key}
                  className="px-2 py-0.5 rounded bg-slate-100 border border-border-dim text-slate-800"
                >
                  {g.key}: {money(g.bid, rules)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-[11px]">
            <span className="text-slate-500 block">
              Default Bid: {money(draft.targeting.defaultBid, rules)} • {draft.targeting.keywords.length} keywords • {draft.targeting.targets.length} product targets
            </span>
            <div className="flex flex-wrap gap-1">
              {draft.targeting.keywords.slice(0, 8).map((kw) => (
                <span
                  key={kw.id}
                  className="px-2 py-0.5 rounded bg-slate-100 border border-border-dim text-slate-800"
                >
                  {kw.text} ({kw.match})
                </span>
              ))}
              {draft.targeting.keywords.length > 8 && (
                <span className="px-2 py-0.5 text-slate-400">
                  +{draft.targeting.keywords.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 4 Review Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-dim pb-2">
          <div className="flex items-center gap-2">
            <ShieldBan className="w-4 h-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
              4. Negative Targeting
            </span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-600 flex items-center gap-4">
          <span>{draft.negatives.keywords.length} negative keywords</span>
          <span>•</span>
          <span>{draft.negatives.brands.length} excluded brands</span>
          <span>•</span>
          <span>{draft.negatives.asins.length} excluded products</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border-dim flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          className="px-3.5 py-2 border border-border-dim rounded hover:bg-slate-50 text-slate-700 font-medium"
        >
          Save as draft
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canLaunch || submitting}
            onClick={() => onLaunch('PAUSED')}
            className="px-4 py-2 border border-border-dim rounded hover:bg-slate-50 font-medium text-slate-800 disabled:opacity-40"
          >
            Launch as paused
          </button>
          <button
            type="button"
            disabled={!canLaunch || submitting}
            onClick={() => onLaunch('ENABLED')}
            className="px-6 py-2 bg-primary text-white rounded font-bold shadow-xs hover:bg-indigo-800 disabled:opacity-40 flex items-center gap-2"
          >
            {submitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Launch campaign</span>
          </button>
        </div>
      </div>
    </div>
  );
}
