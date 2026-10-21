import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Pencil,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/Popover';
import { Modal } from '@/components/ui/Modal';
import { MoneyInput } from '@/components/ui/MoneyInput';
import {
  describeRecommendationAction,
  describeConditionMatched,
  describeEvidence,
  describeProjection,
} from './describe';
import type { Recommendation, Meta } from '@/lib/types/recommendation';

interface RecommendationCardProps {
  rec: Recommendation;
  meta: Meta | null;
  currencySymbol: string;
  isSelected: boolean;
  isProcessing: boolean;
  isStale: boolean;
  onToggleSelect: (id: number) => void;
  onApply: (id: number, editedParams?: Record<string, unknown>) => Promise<unknown>;
  onDismiss: (id: number, reason?: string) => Promise<unknown>;
  onReopen: (id: number) => Promise<unknown>;
  onReanalyse: () => void;
}

export function RecommendationCard({
  rec,
  meta,
  currencySymbol,
  isSelected,
  isProcessing,
  isStale,
  onToggleSelect,
  onApply,
  onDismiss,
  onReopen,
  onReanalyse,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [dismissPopoverOpen, setDismissPopoverOpen] = useState<boolean>(false);
  const [dismissReason, setDismissReason] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  // Edit parameters state for "Edit & apply"
  const firstAction = rec.suggested_actions?.[0];
  const [editedBid, setEditedBid] = useState<number | null>(() => {
    if (firstAction?.to !== undefined && firstAction.to !== null) {
      return Number(firstAction.to);
    }
    if (firstAction?.params?.new_bid !== undefined) {
      return Number(firstAction.params.new_bid);
    }
    return null;
  });

  const [editedBudget, setEditedBudget] = useState<number | null>(() => {
    if (firstAction?.to !== undefined && firstAction.to !== null && firstAction.type.includes('budget')) {
      return Number(firstAction.to);
    }
    return null;
  });

  const [editedPlacementPct, setEditedPlacementPct] = useState<number>(() => {
    if (firstAction?.to !== undefined && firstAction.to !== null && firstAction.type.toLowerCase().includes('placement')) {
      return Number(firstAction.to);
    }
    return 20;
  });

  const evidenceChips = describeEvidence(rec.evidence, currencySymbol);
  const projectionText = describeProjection(rec.evidence?.projection, currencySymbol);

  const isOpen = rec.status === 'OPEN';
  const isApplied = rec.status === 'APPLIED';
  const isDismissed = rec.status === 'DISMISSED';
  const isExpired = rec.status === 'EXPIRED';

  const handleQuickApply = async () => {
    try {
      await onApply(rec.id);
    } catch {
      // Handled in hook
    }
  };

  const handleEditAndApply = async () => {
    const customParams: Record<string, unknown> = { ...firstAction?.params };
    if (editedBid !== null && firstAction?.type.includes('bid')) {
      customParams.new_bid = editedBid;
    }
    if (editedBudget !== null && firstAction?.type.includes('budget')) {
      customParams.new_budget = editedBudget;
    }
    if (firstAction?.type.toLowerCase().includes('placement')) {
      customParams.pct = editedPlacementPct;
    }

    try {
      await onApply(rec.id, customParams);
      setEditModalOpen(false);
    } catch {
      // Handled in hook
    }
  };

  const handleConfirmDismiss = async () => {
    setDismissPopoverOpen(false);
    try {
      await onDismiss(rec.id, dismissReason || undefined);
    } catch {
      // Handled in hook
    }
  };

  const dismissReasonsList = [
    'Not relevant to this campaign',
    'Target is converting elsewhere',
    'Testing different strategy',
    'Other reason',
  ];

  return (
    <div
      className={`relative flex flex-col p-3 rounded-lg border transition-all text-xs bg-surface ${
        isSelected ? 'border-primary bg-indigo-50/15' : 'border-border-dim hover:border-slate-300'
      } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Stale Warning Banner if 409 returned */}
      {isStale && (
        <div className="mb-2.5 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
            <span>Value changed since the analysis. Entity state was modified in Amazon Ads.</span>
          </div>
          <Button size="xs" variant="outline" onClick={onReanalyse} className="gap-1 border-amber-300 text-amber-900 bg-white hover:bg-amber-100">
            Re-analyse
          </Button>
        </div>
      )}

      {/* Main Row */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox + Meta details */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {isOpen && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(rec.id)}
              className="mt-1 rounded border-border-dim text-primary focus:ring-primary size-3.5 shrink-0"
              aria-label={`Select recommendation for ${rec.entity_label}`}
            />
          )}

          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {/* Tag line: Parameter chip + Rule name */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {rec.affected_parameter.replace(/_/g, ' ')}
              </span>
              <span className="font-semibold text-text-main truncate max-w-sm">
                {rec.rule_name}
              </span>
            </div>

            {/* Entity Label & Context */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-mono font-bold text-text-main text-sm">
                {rec.entity_type === 'search_term' ? `"${rec.entity_label}"` : rec.entity_label}
              </span>

              {rec.campaign_name && (
                <span className="text-text-muted text-[11px]">
                  in Campaign: <span className="text-text-main font-medium">{rec.campaign_name}</span>
                </span>
              )}
              {rec.ad_group_name && (
                <span className="text-text-muted text-[11px]">
                  · Ad group: <span className="text-text-main font-medium">{rec.ad_group_name}</span>
                </span>
              )}
            </div>

            {/* Suggested Actions plain sentence */}
            <div className="flex flex-col gap-1 mt-0.5">
              {rec.suggested_actions.map((act, i) => (
                <div key={i} className="text-primary font-medium text-xs flex items-center gap-1.5">
                  <span className="text-primary">➜</span>
                  <span>{describeRecommendationAction(act, rec, currencySymbol)}</span>
                </div>
              ))}
            </div>

            {/* Projection line if present */}
            {projectionText && (
              <p className="text-[11px] text-text-muted italic">
                {projectionText}
              </p>
            )}

            {/* Evidence Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {evidenceChips.map((chip, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-text-muted"
                >
                  <span className="font-sans font-medium text-slate-500 mr-1">{chip.label}:</span>
                  <span className="font-semibold text-text-main">{chip.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
          {isOpen && (
            <>
              {/* Apply Primary */}
              <Button
                size="sm"
                onClick={handleQuickApply}
                disabled={isProcessing}
                className="gap-1 min-w-[70px]"
              >
                <Check className="size-3.5" />
                <span>Apply</span>
              </Button>

              {/* Edit & apply */}
              {(firstAction?.type.includes('bid') || firstAction?.type.includes('budget') || firstAction?.type.toLowerCase().includes('placement')) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                  disabled={isProcessing}
                  className="gap-1"
                >
                  <Pencil className="size-3.5" />
                  <span>Edit & apply</span>
                </Button>
              )}

              {/* Dismiss with reason Popover */}
              <Popover
                open={dismissPopoverOpen}
                onOpenChange={setDismissPopoverOpen}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isProcessing}
                    className="text-text-muted hover:text-danger hover:bg-red-50 gap-1"
                  >
                    <X className="size-3.5" />
                    <span>Dismiss</span>
                  </Button>
                }
                align="end"
              >
                <div className="p-3 w-64 flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-text-main">
                    Dismiss recommendation
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {dismissReasonsList.map((reason, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 text-xs text-text-muted hover:text-text-main cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dismissReason"
                          value={reason}
                          checked={dismissReason === reason}
                          onChange={(e) => setDismissReason(e.target.value)}
                          className="size-3 text-primary"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1 border-t border-border-dim">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setDismissPopoverOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      onClick={handleConfirmDismiss}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </Popover>
            </>
          )}

          {isApplied && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <Check className="size-3.5" />
              <span>Applied</span>
              {rec.campaign_id && (
                <Link
                  href={`/campaigns/${rec.campaign_id}`}
                  className="text-primary hover:underline flex items-center gap-0.5 ml-1 font-medium"
                >
                  <span>View campaign</span>
                  <ExternalLink className="size-2.5" />
                </Link>
              )}
            </div>
          )}

          {isDismissed && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted italic">
                Dismissed {rec.apply_result?.dismiss_reason ? `(${rec.apply_result.dismiss_reason})` : ''}
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => onReopen(rec.id)}
                disabled={isProcessing}
                className="gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Undo</span>
              </Button>
            </div>
          )}

          {isExpired && (
            <span className="text-[11px] text-slate-400 italic">
              Expired — no longer matches rule
            </span>
          )}

          {/* Expand Chevron for matched conditions */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-text-muted hover:text-text-main rounded hover:bg-slate-100 transition-colors"
            title={expanded ? 'Collapse matched conditions' : 'View matched conditions'}
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Matched Conditions */}
      {expanded && rec.evidence?.matched && rec.evidence.matched.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-border-dim/60 flex flex-col gap-1 text-[11px]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Matched Condition Audit:
          </span>
          <div className="flex flex-wrap gap-2">
            {rec.evidence.matched.map((m, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-emerald-50/70 text-emerald-900 border border-emerald-200/60 font-mono font-medium"
              >
                {describeConditionMatched(m, meta, currencySymbol)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit & Apply Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit & Apply Recommendation"
        size="md"
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-text-muted">
            Adjust the action parameters before applying them directly to Amazon Ads.
          </p>

          {firstAction?.type.includes('bid') && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-text-main">
                Adjusted Bid ({currencySymbol}):
              </label>
              <MoneyInput
                value={editedBid}
                onChange={setEditedBid}
                symbol={currencySymbol}
                min={0.02}
                max={50}
              />
              <span className="text-[11px] text-text-muted">
                Original bid: {currencySymbol}{Number(firstAction.from || 0).toFixed(2)}
              </span>
            </div>
          )}

          {firstAction?.type.includes('budget') && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-text-main">
                Adjusted Daily Budget ({currencySymbol}):
              </label>
              <MoneyInput
                value={editedBudget}
                onChange={setEditedBudget}
                symbol={currencySymbol}
                min={1}
              />
              <span className="text-[11px] text-text-muted">
                Original daily budget: {currencySymbol}{Number(firstAction.from || 0).toFixed(2)}
              </span>
            </div>
          )}

          {firstAction?.type.toLowerCase().includes('placement') && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-text-main">
                Adjusted Placement Percentage (%):
              </label>
              <input
                type="number"
                min={0}
                max={900}
                value={editedPlacementPct}
                onChange={(e) => setEditedPlacementPct(Math.max(0, Math.min(900, Number(e.target.value))))}
                className="w-full h-8 px-2.5 rounded-md border border-border-dim text-sm bg-surface font-mono tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-text-muted">
                Original adjustment: {Number(firstAction.from || 0)}%
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dim">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditAndApply}
              disabled={isProcessing}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
