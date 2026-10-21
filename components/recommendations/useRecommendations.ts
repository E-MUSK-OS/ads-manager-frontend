import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useActiveAccount } from '@/lib/useActiveAccount';
import {
  listRecommendations,
  getRecommendationsSummary,
  runRecommendations,
  applyRecommendation as apiApplyRecommendation,
  dismissRecommendation as apiDismissRecommendation,
  reopenRecommendation as apiReopenRecommendation,
  bulkRecommendationsAction,
} from '@/lib/recommendations-api';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import type {
  Recommendation,
  RecommendationsSummary,
  AffectedParameter,
} from '@/lib/types/recommendation';

export type RecommendationStatus = 'OPEN' | 'APPLIED' | 'DISMISSED' | 'EXPIRED' | 'FAILED';
export type SortOption = 'impact' | 'newest';

export function useRecommendations() {
  const { account } = useActiveAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { success, error: toastError } = useToast();

  // Read URL query params
  const statusParam = (searchParams.get('status')?.toUpperCase() || 'OPEN') as RecommendationStatus;
  const paramFilter = (searchParams.get('affected_parameter') || '') as AffectedParameter | '';
  const ruleFilter = searchParams.get('rule_id') ? Number(searchParams.get('rule_id')) : undefined;
  const searchQuery = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') || 'impact') as SortOption;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('page_size') || '10', 10);

  // Local state
  const [items, setItems] = useState<Recommendation[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [counts, setCounts] = useState<Record<RecommendationStatus, number>>({
    OPEN: 0,
    APPLIED: 0,
    DISMISSED: 0,
    EXPIRED: 0,
    FAILED: 0,
  });
  const [summary, setSummary] = useState<RecommendationsSummary | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [runningAnalysis, setRunningAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selection & In-flight tracking
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [staleIds, setStaleIds] = useState<Set<number>>(new Set());

  // URL updater helper
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Ensure tab is preserved
      if (!params.get('tab')) {
        params.set('tab', 'recommendations');
      }

      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined || val === null || val === '') {
          params.delete(key);
        } else {
          params.set(key, String(val));
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Dispatch global change event
  const notifyChanged = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recommendations:changed'));
    }
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!account?.id) return;
    try {
      const s = await getRecommendationsSummary(account.id);
      setSummary(s);
    } catch {
      // Ignore background summary error
    }
  }, [account]);

  // Fetch recommendations list
  const fetchList = useCallback(async () => {
    if (!account?.id) {
      setItems([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await listRecommendations(account.id, {
        status: statusParam,
        affected_parameter: paramFilter || undefined,
        rule_id: ruleFilter,
        q: searchQuery || undefined,
        sort: sortParam,
        page: pageParam,
        page_size: pageSizeParam,
      });

      setItems(res.items);
      setTotalCount(res.total_count);
      setCounts(res.counts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    account,
    statusParam,
    paramFilter,
    ruleFilter,
    searchQuery,
    sortParam,
    pageParam,
    pageSizeParam,
  ]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchSummary();
    });
    return () => {
      active = false;
    };
  }, [fetchSummary]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchList();
    });
    return () => {
      active = false;
    };
  }, [fetchList]);

  // Run analysis
  const runAnalysis = useCallback(async () => {
    if (!account?.id || runningAnalysis) return;
    setRunningAnalysis(true);
    try {
      const result = await runRecommendations(account.id);
      success(
        `Analysis finished — ${result.created} new, ${result.expired} expired`
      );
      notifyChanged();
      await fetchSummary();
      await fetchList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toastError('Analysis failed', msg);
    } finally {
      setRunningAnalysis(false);
    }
  }, [account, runningAnalysis, success, toastError, notifyChanged, fetchSummary, fetchList]);

  // Single Apply
  const applyRec = useCallback(
    async (id: number, editedParams?: Record<string, unknown>) => {
      setProcessingIds((prev) => new Set(prev).add(id));
      try {
        const res = await apiApplyRecommendation(id, editedParams);
        success('Recommendation applied successfully');
        notifyChanged();
        await fetchSummary();
        await fetchList();
        return res;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 409) {
          setStaleIds((prev) => new Set(prev).add(id));
          toastError(
            'Value changed since analysis',
            'The campaign or target entity changed in Amazon Ads since this recommendation was created.'
          );
        } else {
          const msg = err instanceof Error ? err.message : 'Failed to apply recommendation';
          toastError('Apply failed', msg);
        }
        throw err;
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [success, toastError, notifyChanged, fetchSummary, fetchList]
  );

  // Single Dismiss
  const dismissRec = useCallback(
    async (id: number, reason?: string) => {
      setProcessingIds((prev) => new Set(prev).add(id));
      try {
        const res = await apiDismissRecommendation(id, reason);
        success('Recommendation dismissed');
        notifyChanged();
        await fetchSummary();
        await fetchList();
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to dismiss recommendation';
        toastError('Dismiss failed', msg);
        throw err;
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [success, toastError, notifyChanged, fetchSummary, fetchList]
  );

  // Reopen Dismissed
  const reopenRec = useCallback(
    async (id: number) => {
      setProcessingIds((prev) => new Set(prev).add(id));
      try {
        const res = await apiReopenRecommendation(id);
        success('Recommendation restored to Open');
        notifyChanged();
        await fetchSummary();
        await fetchList();
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to restore recommendation';
        toastError('Restore failed', msg);
        throw err;
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [success, toastError, notifyChanged, fetchSummary, fetchList]
  );

  // Bulk Apply
  const bulkApply = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return;
      try {
        const res = await bulkRecommendationsAction(ids, 'APPLY');
        const appliedCount = res.filter((r) => r.success).length;
        const failedCount = res.filter((r) => !r.success).length;

        if (failedCount > 0) {
          toastError(
            'Bulk apply completed with errors',
            `${appliedCount} applied, ${failedCount} failed.`
          );
        } else {
          success(`Successfully applied ${appliedCount} recommendation${appliedCount > 1 ? 's' : ''}`);
        }
        setSelectedIds(new Set());
        notifyChanged();
        await fetchSummary();
        await fetchList();
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bulk apply failed';
        toastError('Bulk apply failed', msg);
      }
    },
    [success, toastError, notifyChanged, fetchSummary, fetchList]
  );

  // Bulk Dismiss
  const bulkDismiss = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return;
      try {
        const res = await bulkRecommendationsAction(ids, 'DISMISS');
        const dismissedCount = res.filter((r) => r.success).length;
        success(`Dismissed ${dismissedCount} recommendation${dismissedCount > 1 ? 's' : ''}`);
        setSelectedIds(new Set());
        notifyChanged();
        await fetchSummary();
        await fetchList();
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bulk dismiss failed';
        toastError('Bulk dismiss failed', msg);
      }
    },
    [success, toastError, notifyChanged, fetchSummary, fetchList]
  );

  // Selection toggles
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
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
    refreshList: fetchList,
  };
}
