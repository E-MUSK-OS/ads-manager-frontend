import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useActiveAccount } from '@/lib/useActiveAccount';
import {
  getCampaignReport,
  getCampaignSummary,
  getCampaignAlerts,
  getCampaignsMeta,
  syncAdsAccount,
  bulkAction,
  updateCampaignState,
  updateCampaignBudget,
  duplicateCampaign,
  patchCampaign,
  ApiError,
} from '@/lib/api-client';
import type {
  CampaignItem,
  CampaignReportResponse,
  CampaignSummaryResponse,
  CampaignAlert,
  CampaignState,
  ReportTotals,
} from '@/lib/types/campaign';
import type { MetricKey } from '@/components/campaigns/wizard/helpers';
import { useToast } from '@/components/ui/toast';

export interface FilterState {
  status: string[];
  health: string[];
  targeting_type: string[];
  search: string;
  portfolio?: string;
  bidding_strategy?: string;
  campaign_type?: string;
  delivery_status?: string;
  min_spend?: number;
  max_spend?: number;
  min_sales?: number;
  max_sales?: number;
  min_orders?: number;
  max_orders?: number;
  min_clicks?: number;
  max_clicks?: number;
  min_impressions?: number;
  max_impressions?: number;
  min_cpc?: number;
  max_cpc?: number;
  min_acos?: number;
  max_acos?: number;
  min_roas?: number;
  max_roas?: number;
  min_budget?: number;
  max_budget?: number;
  min_utilization?: number;
  max_utilization?: number;
}

export interface DateRangeState {
  preset: string;
  start: string;
  end: string;
  compare: boolean;
}

export function useCampaignList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { account, rules, todayInTz } = useActiveAccount();
  const { showToast } = useToast();

  const highlightId = searchParams.get('highlight') ? Number(searchParams.get('highlight')) : null;
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(highlightId);

  useEffect(() => {
    if (highlightId) {
      setHighlightedRowId(highlightId);
      const timer = setTimeout(() => {
        setHighlightedRowId(null);
        const sp = new URLSearchParams(window.location.search);
        sp.delete('highlight');
        const newUrl = sp.toString() ? `${pathname}?${sp.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, pathname, router]);

  const today = todayInTz();
  const defaultEndDate = today;
  const defaultStartDate = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  })();

  const [dateRange, setDateRangeState] = useState<DateRangeState>(() => {
    const start = searchParams.get('start') || defaultStartDate;
    const end = searchParams.get('end') || defaultEndDate;
    const preset = searchParams.get('preset') || 'last_7_days';
    const compare = searchParams.get('compare') === 'true';
    return { preset, start, end, compare };
  });

  const [page, setPage] = useState<number>(() => Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState<number>(() => Number(searchParams.get('pageSize')) || 25);
  const [sortField, setSortField] = useState<string>(() => searchParams.get('sort') || 'spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => (searchParams.get('dir') === 'asc' ? 'asc' : 'desc'));

  const [filters, setFiltersState] = useState<FilterState>(() => {
    const statusParam = searchParams.getAll('status');
    const healthParam = searchParams.getAll('health');
    const targetingParam = searchParams.getAll('targeting_type');
    return {
      status: statusParam.length ? statusParam : ['ENABLED', 'PAUSED'],
      health: healthParam,
      targeting_type: targetingParam,
      search: searchParams.get('q') || '',
      portfolio: searchParams.get('portfolio') || undefined,
      bidding_strategy: searchParams.get('bidding_strategy') || undefined,
      campaign_type: searchParams.get('campaign_type') || undefined,
      delivery_status: searchParams.get('delivery_status') || undefined,
      min_spend: searchParams.get('min_spend') ? Number(searchParams.get('min_spend')) : undefined,
      max_spend: searchParams.get('max_spend') ? Number(searchParams.get('max_spend')) : undefined,
      min_sales: searchParams.get('min_sales') ? Number(searchParams.get('min_sales')) : undefined,
      max_sales: searchParams.get('max_sales') ? Number(searchParams.get('max_sales')) : undefined,
      min_orders: searchParams.get('min_orders') ? Number(searchParams.get('min_orders')) : undefined,
      max_orders: searchParams.get('max_orders') ? Number(searchParams.get('max_orders')) : undefined,
      min_clicks: searchParams.get('min_clicks') ? Number(searchParams.get('min_clicks')) : undefined,
      max_clicks: searchParams.get('max_clicks') ? Number(searchParams.get('max_clicks')) : undefined,
      min_impressions: searchParams.get('min_impressions') ? Number(searchParams.get('min_impressions')) : undefined,
      max_impressions: searchParams.get('max_impressions') ? Number(searchParams.get('max_impressions')) : undefined,
      min_cpc: searchParams.get('min_cpc') ? Number(searchParams.get('min_cpc')) : undefined,
      max_cpc: searchParams.get('max_cpc') ? Number(searchParams.get('max_cpc')) : undefined,
      min_acos: searchParams.get('min_acos') ? Number(searchParams.get('min_acos')) : undefined,
      max_acos: searchParams.get('max_acos') ? Number(searchParams.get('max_acos')) : undefined,
      min_roas: searchParams.get('min_roas') ? Number(searchParams.get('min_roas')) : undefined,
      max_roas: searchParams.get('max_roas') ? Number(searchParams.get('max_roas')) : undefined,
      min_budget: searchParams.get('min_budget') ? Number(searchParams.get('min_budget')) : undefined,
      max_budget: searchParams.get('max_budget') ? Number(searchParams.get('max_budget')) : undefined,
      min_utilization: searchParams.get('min_utilization') ? Number(searchParams.get('min_utilization')) : undefined,
      max_utilization: searchParams.get('max_utilization') ? Number(searchParams.get('max_utilization')) : undefined,
    };
  });

  // Chart Metric Pair (persist to localStorage)
  const [selectedChartMetrics, setSelectedChartMetrics] = useState<[MetricKey, MetricKey]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('agy_campaign_chart_metrics');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 2) {
            return parsed as [MetricKey, MetricKey];
          }
        }
      } catch {}
    }
    return ['spend', 'sales'];
  });

  const toggleChartMetric = useCallback((metric: MetricKey) => {
    setSelectedChartMetrics((prev) => {
      let next: [MetricKey, MetricKey];
      if (prev[0] === metric) {
        next = prev;
      } else if (prev[1] === metric) {
        next = [prev[1], prev[0]];
      } else {
        next = [prev[0], metric];
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('agy_campaign_chart_metrics', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  // Atomic filter updater (Glitch 6: resets page to 1)
  const updateFilters = useCallback((partial: Partial<FilterState>) => {
    setPage(1);
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setDateRange = useCallback((val: DateRangeState | ((prev: DateRangeState) => DateRangeState)) => {
    setPage(1);
    setDateRangeState(val);
  }, []);

  const setFilters = useCallback((val: FilterState | ((prev: FilterState) => FilterState)) => {
    setPage(1);
    setFiltersState(val);
  }, []);

  // Data states
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [totals, setTotals] = useState<ReportTotals | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [summaryData, setSummaryData] = useState<CampaignSummaryResponse | null>(null);
  const [alerts, setAlerts] = useState<CampaignAlert[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Sync state to URL
  const updateUrl = useCallback(() => {
    const sp = new URLSearchParams();
    if (page > 1) sp.set('page', String(page));
    if (pageSize !== 25) sp.set('pageSize', String(pageSize));
    if (sortField !== 'spend') sp.set('sort', sortField);
    if (sortDir !== 'desc') sp.set('dir', sortDir);
    if (dateRange.preset) sp.set('preset', dateRange.preset);
    if (dateRange.start) sp.set('start', dateRange.start);
    if (dateRange.end) sp.set('end', dateRange.end);
    if (dateRange.compare) sp.set('compare', 'true');
    if (filters.search) sp.set('q', filters.search);
    if (filters.portfolio) sp.set('portfolio', filters.portfolio);
    if (filters.bidding_strategy) sp.set('bidding_strategy', filters.bidding_strategy);
    if (filters.campaign_type) sp.set('campaign_type', filters.campaign_type);
    if (filters.delivery_status) sp.set('delivery_status', filters.delivery_status);

    filters.status.forEach((s) => sp.append('status', s));
    filters.health.forEach((h) => sp.append('health', h));
    filters.targeting_type.forEach((t) => sp.append('targeting_type', t));

    const numericFields: Array<keyof FilterState> = [
      'min_spend', 'max_spend', 'min_sales', 'max_sales',
      'min_orders', 'max_orders', 'min_clicks', 'max_clicks',
      'min_impressions', 'max_impressions', 'min_cpc', 'max_cpc',
      'min_acos', 'max_acos', 'min_roas', 'max_roas',
      'min_budget', 'max_budget', 'min_utilization', 'max_utilization'
    ];
    numericFields.forEach((field) => {
      const val = filters[field];
      if (val !== undefined && val !== null && val !== '') {
        sp.set(field, String(val));
      }
    });

    const newQuery = sp.toString();
    const targetUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    window.history.replaceState(null, '', targetUrl);
  }, [page, pageSize, sortField, sortDir, dateRange, filters, pathname]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Stale request abortion (Glitch 5)
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!account) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const queryParams: Record<string, any> = {
      ads_account_id: account.id,
      page,
      page_size: pageSize,
      sort: sortField,
      dir: sortDir,
      start: dateRange.start,
      end: dateRange.end,
    };

    if (filters.search) queryParams.q = filters.search;
    if (filters.status.length) queryParams.status = filters.status;
    if (filters.health.length) queryParams.health = filters.health;
    if (filters.targeting_type.length) queryParams.targeting_type = filters.targeting_type;
    if (filters.portfolio) queryParams.portfolio = filters.portfolio;
    if (filters.bidding_strategy) queryParams.bidding_strategy = filters.bidding_strategy;
    if (filters.campaign_type) queryParams.campaign_type = filters.campaign_type;
    if (filters.delivery_status) queryParams.delivery_status = filters.delivery_status;

    const numericKeys = [
      'min_spend', 'max_spend', 'min_sales', 'max_sales',
      'min_orders', 'max_orders', 'min_clicks', 'max_clicks',
      'min_impressions', 'max_impressions', 'min_cpc', 'max_cpc',
      'min_acos', 'max_acos', 'min_roas', 'max_roas',
      'min_budget', 'max_budget', 'min_utilization', 'max_utilization'
    ];
    numericKeys.forEach((key) => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        queryParams[key] = val;
      }
    });

    try {
      const [reportRes, summaryRes, alertsRes, metaRes] = await Promise.all([
        getCampaignReport(queryParams, controller.signal),
        getCampaignSummary(
          {
            ads_account_id: account.id,
            start: dateRange.start,
            end: dateRange.end,
            compare: dateRange.compare,
            granularity: 'daily',
          },
          controller.signal
        ),
        getCampaignAlerts(account.id, controller.signal).catch(() => []),
        getCampaignsMeta(account.id, controller.signal).catch(() => null),
      ]);

      setCampaigns(reportRes.items);
      setTotals(reportRes.totals);
      setTotalCount(reportRes.total_count);
      setSummaryData(summaryRes);
      setAlerts(alertsRes);
      if (metaRes) setMeta(metaRes);
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (err instanceof ApiError) {
        setError(err);
      } else {
        setError(new ApiError(err?.message || 'Failed to load campaigns', 500));
      }
    } finally {
      setLoading(false);
    }
  }, [account, page, pageSize, sortField, sortDir, dateRange, filters]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Sync account
  const handleSync = async () => {
    if (!account || syncing) return;
    setSyncing(true);
    try {
      await syncAdsAccount(account.id);
      showToast({ title: 'Sync completed', message: 'Account metrics have been refreshed.', type: 'success' });
      await fetchData();
    } catch (err: any) {
      showToast({ title: 'Sync failed', message: err?.message || 'Failed to sync with Amazon Ads', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  // Optimistic inline patch with rollback
  const patchCampaignInline = useCallback(
    async (id: number, payload: Partial<CampaignItem>) => {
      const original = campaigns.find((c) => c.id === id);
      if (!original) return false;

      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));

      try {
        const updated = await patchCampaign(id, payload as any);
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
        showToast({ title: 'Campaign updated', message: 'Changes saved successfully.', type: 'success' });
        return true;
      } catch (err: any) {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? original : c)));
        showToast({ title: 'Update failed', message: err?.message || 'Failed to update campaign', type: 'error' });
        return false;
      }
    },
    [campaigns, showToast]
  );

  // Optimistic status update with rollback
  const handleUpdateStatus = async (id: number, newState: CampaignState) => {
    const original = campaigns.find((c) => c.id === id);
    if (!original) return;

    if (original.state === 'ARCHIVED') {
      showToast({ title: 'Archived campaign', message: 'Archived campaigns cannot be modified', type: 'error' });
      return;
    }

    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, state: newState, status_label: newState } : c))
    );

    try {
      await updateCampaignState(id, newState);
      showToast({ title: 'Status updated', message: `Campaign "${original.name}" is now ${newState.toLowerCase()}.`, type: 'success' });
    } catch (err: any) {
      setCampaigns((prev) => prev.map((c) => (c.id === id ? original : c)));
      showToast({ title: 'Update failed', message: err?.message || 'Failed to update campaign state', type: 'error' });
    }
  };

  // Inline budget edit with rollback
  const handleUpdateBudget = async (id: number, newBudget: number) => {
    const original = campaigns.find((c) => c.id === id);
    if (!original) return false;

    if (original.state === 'ARCHIVED') {
      showToast({ title: 'Archived campaign', message: 'Archived campaigns cannot be modified', type: 'error' });
      return false;
    }

    const minB = rules?.min_budget ?? 100.0;
    if (newBudget < minB) {
      showToast({
        title: 'Invalid budget',
        message: `Minimum daily budget is ₹${minB.toFixed(2)}`,
        type: 'error',
      });
      return false;
    }

    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, daily_budget: newBudget } : c)));

    try {
      await updateCampaignBudget(id, newBudget);
      showToast({ title: 'Budget saved', message: `Budget updated to ₹${newBudget.toFixed(2)}`, type: 'success' });
      return true;
    } catch (err: any) {
      setCampaigns((prev) => prev.map((c) => (c.id === id ? original : c)));
      showToast({ title: 'Save failed', message: err?.message || 'Failed to update budget', type: 'error' });
      return false;
    }
  };

  // Duplicate campaign
  const handleDuplicate = async (id: number) => {
    try {
      const res = await duplicateCampaign(id);
      showToast({ title: 'Campaign duplicated', message: 'Campaign copy created as PAUSED.', type: 'success' });
      await fetchData();
    } catch (err: any) {
      showToast({ title: 'Duplicate failed', message: err?.message || 'Could not duplicate campaign', type: 'error' });
    }
  };

  // Bulk actions
  const handleBulkAction = async (ids: number[], action: string, value?: number | string) => {
    try {
      const res = await bulkAction({ ids, action, value: value as any });
      const succeeded = res.results.filter((r) => r.ok).length;
      const failed = res.results.filter((r) => !r.ok).length;

      if (failed === 0) {
        showToast({ title: 'Bulk action complete', message: `${succeeded} campaigns updated successfully.`, type: 'success' });
      } else {
        const errorDetails = res.results.filter((r) => !r.ok).map((r) => `ID ${r.id}: ${r.error || (r as any).reason || 'Failed'}`).join(', ');
        showToast({
          title: 'Bulk action partial result',
          message: `${succeeded} updated, ${failed} failed (${errorDetails})`,
          type: 'error',
        });
      }
      await fetchData();
    } catch (err: any) {
      showToast({ title: 'Bulk action error', message: err?.message || 'Action failed', type: 'error' });
    }
  };

  return {
    account,
    rules,
    meta,
    campaigns,
    totals,
    totalCount,
    summaryData,
    alerts,
    loading,
    syncing,
    error,
    highlightedRowId,
    // chart metrics
    selectedChartMetrics,
    toggleChartMetric,
    // filters & pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    dateRange,
    setDateRange,
    filters,
    setFilters,
    updateFilters,
    // actions
    refetch: fetchData,
    handleSync,
    handleUpdateStatus,
    handleUpdateBudget,
    handleDuplicate,
    handleBulkAction,
    patchCampaignInline,
  };
}
