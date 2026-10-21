import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationFilters } from './RecommendationFilters';
import { useRecommendations } from './useRecommendations';
import { useRules } from './useRules';
import { useRecommendationMeta } from './useRecommendationMeta';
import { formatRelativeTime } from './RuleTable';

interface RecommendationsTabProps {
  onGoToConfiguration?: () => void;
}

export function RecommendationsTab({ onGoToConfiguration }: RecommendationsTabProps) {
  const { meta, currencySymbol } = useRecommendationMeta();
  const { rules } = useRules();
  const {
    items,
    totalCount,
    counts,
    summary,
    loading,
    runningAnalysis,
    error,
    selectedIds,
    processingIds,
    staleIds,
    statusParam,
    paramFilter,
    ruleFilter,
    searchQuery,
    sortParam,
    pageParam,
    pageSizeParam,
    updateUrlParams,
    runAnalysis,
    applyRec,
    dismissRec,
    reopenRec,
    bulkApply,
    bulkDismiss,
    toggleSelect,
    selectAll,
    clearSelection,
    refreshList,
  } = useRecommendations();

  // Bulk confirmation dialog state
  const [showBulkApplyConfirm, setShowBulkApplyConfirm] = useState<boolean>(false);
  const [showBulkDismissConfirm, setShowBulkDismissConfirm] = useState<boolean>(false);

  // Bulk action type counts breakdown for confirmation dialog
  const bulkActionBreakdown = React.useMemo(() => {
    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    const breakdown: Record<string, number> = {};
    selectedItems.forEach((item) => {
      item.suggested_actions.forEach((act) => {
        const title = act.type.replace(/_/g, ' ');
        breakdown[title] = (breakdown[title] || 0) + 1;
      });
    });
    return breakdown;
  }, [items, selectedIds]);

  const handleConfirmBulkApply = async () => {
    setShowBulkApplyConfirm(false);
    await bulkApply(Array.from(selectedIds));
  };

  const handleConfirmBulkDismiss = async () => {
    setShowBulkDismissConfirm(false);
    await bulkDismiss(Array.from(selectedIds));
  };

  const handleClearFilters = () => {
    updateUrlParams({
      affected_parameter: undefined,
      rule_id: undefined,
      q: undefined,
      page: 1,
    });
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSizeParam));
  const hasNextPage = pageParam < totalPages;
  const hasPrevPage = pageParam > 1;

  const allVisibleSelected =
    items.length > 0 && items.every((i) => selectedIds.has(i.id));

  const handleMasterCheckbox = () => {
    if (allVisibleSelected) {
      clearSelection();
    } else {
      selectAll(items.map((i) => i.id));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <span>Recommendations</span>
          </h2>
          <p className="text-xs text-text-muted">
            Actionable insights based on your campaign performance.
          </p>
        </div>

        {/* Right: Analyse now & last analysed relative time */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted font-mono">
            Last analysed: {formatRelativeTime(summary?.last_run_at || null)}
          </span>

          <Button
            size="sm"
            onClick={runAnalysis}
            disabled={runningAnalysis}
            className="gap-1.5"
          >
            {runningAnalysis ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            <span>{runningAnalysis ? 'Analysing...' : 'Analyse now'}</span>
          </Button>
        </div>
      </div>

      {/* Filters & Status Segmented Bar */}
      <RecommendationFilters
        status={statusParam}
        counts={counts}
        affectedParameter={paramFilter}
        ruleId={ruleFilter}
        searchQuery={searchQuery}
        sort={sortParam}
        rules={rules}
        onUpdate={updateUrlParams}
        onClearFilters={handleClearFilters}
      />

      {/* Bulk Action Bar for Open Items */}
      {statusParam === 'OPEN' && selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono">{selectedIds.size}</span>
            <span className="text-slate-300">recommendation{selectedIds.size > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkApplyConfirm(true)}
              className="px-3 py-1 rounded bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center gap-1.5"
            >
              <Check className="size-3.5" />
              <span>Apply selected</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDismissConfirm(true)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center gap-1.5"
            >
              <X className="size-3.5" />
              <span>Dismiss selected</span>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="ml-2 text-slate-400 hover:text-white underline text-[11px]"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 text-xs text-danger bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button size="xs" variant="outline" onClick={refreshList} className="gap-1">
            <RefreshCw className="size-3" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-lg bg-surface border border-border-dim animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-6 w-20 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-80 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty States */
        rules.length === 0 ? (
          /* Empty: No rules exist */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface rounded-lg border border-border-dim">
            <div className="size-12 rounded-full bg-indigo-50 text-primary flex items-center justify-center mb-3">
              <Layers className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-text-main">
              No rules yet
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-md">
              Create rules in the Configuration tab to let the system evaluate your account.
            </p>
            {onGoToConfiguration && (
              <Button
                size="sm"
                onClick={onGoToConfiguration}
                className="mt-4 gap-1.5"
              >
                <span>Create a rule</span>
              </Button>
            )}
          </div>
        ) : Boolean(paramFilter || ruleFilter || searchQuery) ? (
          /* Empty: Filter with no results */
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-surface rounded-lg border border-border-dim">
            <p className="text-sm font-medium text-text-main">No recommendations match your filters</p>
            <p className="text-xs text-text-muted mt-1">Try clearing filters or search terms.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="mt-3"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          /* Empty: Rules exist, but no recommendations */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface rounded-lg border border-border-dim">
            <div className="size-12 rounded-full bg-indigo-50 text-primary flex items-center justify-center mb-3">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-text-main">
              No recommendations yet
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-md">
              We are continuously analysing your campaigns against your active rules. Click Analyse now to evaluate immediately.
            </p>
            <Button
              size="sm"
              onClick={runAnalysis}
              disabled={runningAnalysis}
              className="mt-4 gap-1.5"
            >
              <Sparkles className="size-3.5" />
              <span>Analyse now</span>
            </Button>
          </div>
        )
      ) : (
        /* List of Cards */
        <div className="flex flex-col gap-2.5">
          {statusParam === 'OPEN' && (
            <div className="flex items-center gap-2 px-1 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={handleMasterCheckbox}
                className="rounded border-border-dim text-primary focus:ring-primary size-3.5"
                aria-label="Select all visible recommendations"
              />
              <span>Select all visible ({items.length})</span>
            </div>
          )}

          {items.map((item) => (
            <RecommendationCard
              key={item.id}
              rec={item}
              meta={meta}
              currencySymbol={currencySymbol}
              isSelected={selectedIds.has(item.id)}
              isProcessing={processingIds.has(item.id)}
              isStale={staleIds.has(item.id)}
              onToggleSelect={toggleSelect}
              onApply={applyRec}
              onDismiss={dismissRec}
              onReopen={reopenRec}
              onReanalyse={runAnalysis}
            />
          ))}

          {/* Pagination Footer */}
          <div className="flex items-center justify-between pt-3 text-xs text-text-muted border-t border-border-dim">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSizeParam}
                onChange={(e) => updateUrlParams({ page_size: Number(e.target.value), page: 1 })}
                className="h-7 px-2 rounded border border-border-dim bg-surface text-xs outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="font-mono ml-2">
                Showing {items.length} of {totalCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={!hasPrevPage}
                onClick={() => updateUrlParams({ page: pageParam - 1 })}
              >
                Previous
              </Button>
              <span className="font-mono">
                Page {pageParam} of {totalPages}
              </span>
              <Button
                size="xs"
                variant="outline"
                disabled={!hasNextPage}
                onClick={() => updateUrlParams({ page: pageParam + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Apply Confirmation Dialog */}
      <ConfirmDialog
        open={showBulkApplyConfirm}
        onClose={() => setShowBulkApplyConfirm(false)}
        onCancel={() => setShowBulkApplyConfirm(false)}
        onConfirm={handleConfirmBulkApply}
        title={`Apply ${selectedIds.size} recommendation${selectedIds.size > 1 ? 's' : ''}?`}
        description={
          'This will execute the suggested actions directly on your Amazon Ads campaigns:\n' +
          Object.entries(bulkActionBreakdown)
            .map(([act, count]) => `• ${count} × ${act}`)
            .join('\n')
        }
        confirmLabel="Apply All"
        cancelLabel="Cancel"
      />

      {/* Bulk Dismiss Confirmation Dialog */}
      <ConfirmDialog
        open={showBulkDismissConfirm}
        onClose={() => setShowBulkDismissConfirm(false)}
        onCancel={() => setShowBulkDismissConfirm(false)}
        onConfirm={handleConfirmBulkDismiss}
        title={`Dismiss ${selectedIds.size} recommendation${selectedIds.size > 1 ? 's' : ''}?`}
        description="Dismissed recommendations will be removed from your active list and will respect rule cooldown periods."
        confirmLabel="Dismiss All"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
