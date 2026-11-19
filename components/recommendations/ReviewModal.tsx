'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  History,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Recommendation } from '@/lib/types/recommendation';
import { describeRecommendationAction } from './describe';

interface ApplyResultItem {
  id: number;
  status?: string;
  success: boolean;
  error?: string;
  changes?: Array<{ field: string; from: unknown; to: unknown }>;
  recommendation?: Recommendation;
}

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  selectedRecs: Recommendation[];
  currencySymbol: string;
  onApply: (ids: number[]) => Promise<any>;
  isApplying: boolean;
}

export function ReviewModal({
  open,
  onClose,
  selectedRecs,
  currencySymbol,
  onApply,
  isApplying,
}: ReviewModalProps) {
  const [activeIds, setActiveIds] = useState<Set<number>>(() => new Set(selectedRecs.map((r) => r.id)));
  const [showConfirmApply, setShowConfirmApply] = useState(false);
  const [batchResults, setBatchResults] = useState<ApplyResultItem[] | null>(null);

  const handleClose = () => {
    setBatchResults(null);
    onClose();
  };

  // Sync activeIds when selectedRecs changes
  React.useEffect(() => {
    setActiveIds(new Set(selectedRecs.map((r) => r.id)));
  }, [selectedRecs]);

  const toggleItem = (id: number) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const activeRecs = useMemo(
    () => selectedRecs.filter((r) => activeIds.has(r.id)),
    [selectedRecs, activeIds]
  );

  // Check for mutual conflicts among currently active items
  const activeConflicts = useMemo(() => {
    const conflicts: Array<{ r1: Recommendation; r2: Recommendation }> = [];
    for (let i = 0; i < activeRecs.length; i++) {
      for (let j = i + 1; j < activeRecs.length; j++) {
        const r1 = activeRecs[i];
        const r2 = activeRecs[j];
        if (
          r1.conflicts_with &&
          r1.conflicts_with.includes(r2.id)
        ) {
          conflicts.push({ r1, r2 });
        }
      }
    }
    return conflicts;
  }, [activeRecs]);

  const hasConflicts = activeConflicts.length > 0;

  const handleApplyClick = () => {
    if (activeRecs.length === 0 || hasConflicts) return;
    setShowConfirmApply(true);
  };

  const handleConfirmApply = async () => {
    setShowConfirmApply(false);
    try {
      const res = await onApply(Array.from(activeIds));
      if (Array.isArray(res) && res.length > 0) {
        setBatchResults(res as ApplyResultItem[]);
      } else {
        handleClose();
      }
    } catch {
      // Toast displayed by useRecommendations
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={
          batchResults ? (
            <div className="flex items-center gap-2">
              <span>Application Results</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold">
                {batchResults.length} processed
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Review & Apply Recommendations</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold">
                {activeRecs.length} selected
              </span>
            </div>
          )
        }
        subtitle={
          batchResults
            ? 'Summary of live writes submitted to Amazon Ads and local database sync.'
            : 'Verify proposed changes against live performance metrics before sending writes to Amazon Ads.'
        }
        size="xl"
      >
        {batchResults ? (
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex flex-col">
                <span className="text-[11px] font-semibold text-emerald-800">Applied</span>
                <span className="text-xl font-bold text-emerald-700">
                  {batchResults.filter((r) => r.status === 'APPLIED' || r.success).length}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col">
                <span className="text-[11px] font-semibold text-amber-800">Stale (Skipped)</span>
                <span className="text-xl font-bold text-amber-700">
                  {batchResults.filter((r) => r.status === 'STALE').length}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 flex flex-col">
                <span className="text-[11px] font-semibold text-rose-800">Failed</span>
                <span className="text-xl font-bold text-rose-700">
                  {batchResults.filter((r) => !r.success && r.status !== 'STALE').length}
                </span>
              </div>
            </div>

            <div className="border border-border-dim rounded-lg overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-elevated border-b border-border-dim text-[11px] font-semibold text-text-dim sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Target / Campaign</th>
                    <th className="p-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {batchResults.map((item) => {
                    const rec = selectedRecs.find((r) => r.id === item.id) || item.recommendation;
                    const isApplied = item.status === 'APPLIED' || item.success;
                    const isStale = item.status === 'STALE';
                    return (
                      <tr key={item.id} className="hover:bg-surface-hover/30">
                        <td className="p-2.5 font-mono text-[11px]">#{item.id}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              isApplied
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isStale
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {isApplied ? 'Applied' : isStale ? 'Stale' : 'Failed'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-medium text-text-primary">
                            {rec?.entity_label || `Recommendation #${item.id}`}
                          </div>
                          <div className="text-[10px] text-text-dim">
                            {rec?.campaign_name || ''}
                          </div>
                        </td>
                        <td className="p-2.5 text-[11px]">
                          {item.error ? (
                            <span className="text-rose-600 font-mono text-[10px]">{item.error}</span>
                          ) : isApplied ? (
                            <span className="text-emerald-700">Applied successfully to Amazon Ads</span>
                          ) : (
                            <span className="text-text-dim">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border-dim">
              <Button size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-4 text-xs">
          {/* Conflict Alert Banner if mutual conflicts exist */}
          {hasConflicts && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Conflict detected in selection:</span>
                <span className="text-[11px] text-amber-800">
                  {activeConflicts.map((c, i) => (
                    <span key={i} className="block">
                      • Recommendation #{c.r1.id} (&quot;{c.r1.rule_name}&quot;) and #{c.r2.id} (&quot;{c.r2.rule_name}&quot;) target the same field on {c.r1.entity_label}. Please uncheck one before applying.
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}

          {/* Table of selected recommendations */}
          <div className="overflow-x-auto border border-border-dim rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-dim text-[11px] font-semibold text-text-muted">
                  <th className="p-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={activeRecs.length === selectedRecs.length && selectedRecs.length > 0}
                      onChange={() => {
                        if (activeRecs.length === selectedRecs.length) {
                          setActiveIds(new Set());
                        } else {
                          setActiveIds(new Set(selectedRecs.map((r) => r.id)));
                        }
                      }}
                      className="rounded border-border-dim text-primary size-3.5"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-2.5">Entity & Campaign</th>
                  <th className="p-2.5">Proposed Change (Old → New)</th>
                  <th className="p-2.5">Metrics Behind Rule</th>
                  <th className="p-2.5">Confidence</th>
                  <th className="p-2.5 text-right">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim">
                {selectedRecs.map((rec) => {
                  const isChecked = activeIds.has(rec.id);
                  const metrics = rec.evidence?.metrics || {};
                  const dateWin = rec.evidence?.date_window;
                  const confidence = rec.evidence?.confidence;
                  const firstAction = rec.suggested_actions?.[0];
                  const hasConflict = rec.conflicts_with && rec.conflicts_with.some((id) => activeIds.has(id));

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        !isChecked ? 'opacity-50 bg-slate-50/30' : hasConflict ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="p-2.5 align-top">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(rec.id)}
                          className="rounded border-border-dim text-primary size-3.5"
                          aria-label={`Select ${rec.entity_label}`}
                        />
                      </td>

                      {/* Entity & Campaign */}
                      <td className="p-2.5 align-top max-w-[200px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-text-main text-xs truncate">
                            {rec.entity_type === 'search_term' ? `"${rec.entity_label}"` : rec.entity_label}
                          </span>
                          <span className="text-[11px] text-text-muted truncate">
                            {rec.campaign_name || `Campaign #${rec.campaign_id}`}
                          </span>
                          {rec.ad_group_name && (
                            <span className="text-[10px] text-slate-400 truncate">
                              Ad group: {rec.ad_group_name}
                            </span>
                          )}
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 w-fit">
                            {rec.rule_name}
                          </span>
                        </div>
                      </td>

                      {/* Before -> After Comparison */}
                      <td className="p-2.5 align-top">
                        <div className="flex flex-col gap-1.5">
                          {rec.suggested_actions.map((act, i) => {
                            const desc = describeRecommendationAction(act, rec, currencySymbol);
                            const isBid = act.type.toLowerCase().includes('bid');
                            const isBudget = act.type.toLowerCase().includes('budget');
                            const fromVal = act.from !== undefined ? act.from : rec.evidence?.current?.[isBid ? 'bid' : 'daily_budget'];
                            const toVal = act.to !== undefined ? act.to : null;

                            return (
                              <div key={i} className="flex flex-col gap-1">
                                {fromVal !== null && fromVal !== undefined && toVal !== null ? (
                                  <div className="flex items-center gap-1.5 font-mono text-xs">
                                    <span className="text-slate-500 line-through">
                                      {isBid || isBudget ? `${currencySymbol}${Number(fromVal).toFixed(2)}` : String(fromVal)}
                                    </span>
                                    <ArrowRight className="size-3 text-slate-400" />
                                    <span className="font-bold text-primary">
                                      {isBid || isBudget ? `${currencySymbol}${Number(toVal).toFixed(2)}` : String(toVal)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-medium text-primary text-xs">{desc}</span>
                                )}
                              </div>
                            );
                          })}

                          {hasConflict && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                              <AlertTriangle className="size-3 shrink-0" />
                              <span>Conflicts with other selected items</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Metrics Behind Rule */}
                      <td className="p-2.5 align-top">
                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Spend:</span>
                            <span className="font-medium text-text-main">
                              {currencySymbol}{Number(metrics.spend || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Purchases (7d):</span>
                            <span className="font-medium text-text-main">{metrics.orders ?? 0}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">Clicks:</span>
                            <span className="font-medium text-text-main">{metrics.clicks ?? 0}</span>
                          </div>
                          {metrics.acos !== undefined && metrics.acos !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">ACOS:</span>
                              <span className="font-medium text-text-main">{Number(metrics.acos).toFixed(1)}%</span>
                            </div>
                          )}
                          {dateWin && (
                            <span className="text-[10px] font-sans text-slate-400 mt-0.5">
                              Window: {dateWin.start} – {dateWin.end}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="p-2.5 align-top">
                        {confidence ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold w-fit border ${
                                confidence.level === 'HIGH'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : confidence.level === 'MEDIUM'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {confidence.level}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {confidence.clicks} clicks
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* History link */}
                      <td className="p-2.5 align-top text-right">
                        <Link
                          href={`/campaigns/${rec.campaign_id}?tab=history`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                        >
                          <History className="size-3" />
                          <span>History</span>
                          <ExternalLink className="size-2.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-border-dim">
            <Button size="sm" variant="outline" onClick={onClose} disabled={isApplying}>
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleApplyClick}
                disabled={activeRecs.length === 0 || hasConflicts || isApplying}
                className="gap-1.5"
              >
                {isApplying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>
                  {isApplying
                    ? 'Applying to Amazon...'
                    : `Apply (${activeRecs.length}) to Amazon`}
                </span>
              </Button>
            </div>
          </div>
        </div>
        )}
      </Modal>

      {/* Confirmation Dialog before live Amazon write */}
      <ConfirmDialog
        open={showConfirmApply}
        onClose={() => setShowConfirmApply(false)}
        onConfirm={handleConfirmApply}
        title="Apply changes to Amazon Ads?"
        description={`You are about to write ${activeRecs.length} change(s) directly to your live Amazon Advertising account. Are you sure you want to proceed?`}
        confirmLabel={`Yes, apply (${activeRecs.length}) to Amazon`}
        variant="primary"
      />
    </>
  );
}
