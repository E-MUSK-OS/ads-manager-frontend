'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Search,
  RotateCw,
  AlertCircle,
  Pencil,
  Check,
  X,
  SlidersHorizontal,
  Calendar,
  IndianRupee,
  Clock,
  GitCompare,
  Plus,
} from 'lucide-react';
import { money, pct, ratio, num } from '@/lib/format';
import { calculateMaxEffectiveBid, type BiddingStrategy } from './wizard/helpers';
import { ColumnChooser, DEFAULT_VISIBLE_COLUMNS, ColumnKey } from './ColumnChooser';
import { RowMenu } from './RowMenu';
import { BulkBar } from './BulkBar';
import { HourlyModal } from './HourlyModal';
import { ComparePreviousModal } from './ComparePreviousModal';
import { BidThresholdModal } from './BidThresholdModal';
import { getCampaignAdGroups } from '@/lib/api-client';
import { Switch } from '@/components/ui/Switch';
import { Popover } from '@/components/ui/Popover';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { PercentInput } from '@/components/ui/PercentInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { RadioCard } from '@/components/ui/RadioCard';
import { FieldError } from '@/components/ui/FieldError';
import type {
  CampaignItem,
  CampaignState,
  ReportTotals,
  AdGroupItem,
} from '@/lib/types/campaign';
import type { FilterState } from './useCampaignList';

interface CampaignTableProps {
  campaigns: CampaignItem[];
  totals: ReportTotals | null;
  totalCount: number;
  loading: boolean;
  error: Error | null;
  highlightedRowId: number | null;
  page: number;
  pageSize: number;
  sortField: string;
  sortDir: 'asc' | 'desc';
  filters: FilterState;
  dateRange?: { start: string; end: string };
  selectedIds?: number[];
  onSelectedIdsChange?: (ids: number[]) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onFilterChange: (filters: FilterState) => void;
  onUpdateStatus: (id: number, state: CampaignState) => void;
  onUpdateBudget: (id: number, budget: number) => Promise<boolean>;
  onPatchCampaign?: (id: number, data: Partial<Record<string, unknown>>) => Promise<boolean>;
  onDuplicate: (id: number) => void;
  onBulkAction: (ids: number[], action: string, value?: any, extra?: any) => void;
  onRetry: () => void;
  onBidThreshold?: (campaign: CampaignItem) => void;
}

export function CampaignTable({
  campaigns,
  totals,
  totalCount,
  loading,
  error,
  highlightedRowId,
  page,
  pageSize,
  sortField,
  sortDir,
  filters,
  dateRange,
  selectedIds: controlledSelectedIds,
  onSelectedIdsChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onUpdateStatus,
  onUpdateBudget,
  onPatchCampaign,
  onDuplicate,
  onBulkAction,
  onRetry,
  onBidThreshold,
}: CampaignTableProps) {
  const router = useRouter();

  // Search input state (debounced)
  const [searchInput, setSearchInput] = useState(filters.search || '');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFilterChange]);

  // Columns visibility state (initialized to DEFAULT_VISIBLE_COLUMNS to prevent SSR hydration mismatch)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ads_manager_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleColumns(parsed);
        }
      }
    } catch {}
  }, []);

  // Row selection
  const [internalSelectedIds, setInternalSelectedIds] = useState<number[]>([]);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = (ids: number[]) => {
    if (onSelectedIdsChange) {
      onSelectedIdsChange(ids);
    } else {
      setInternalSelectedIds(ids);
    }
  };

  // Modals
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [hourlyModalOpen, setHourlyModalOpen] = useState(false);
  const [hourlyModalCampaignId, setHourlyModalCampaignId] = useState<number | undefined>();
  const [hourlyModalCampaignName, setHourlyModalCampaignName] = useState<string | undefined>();
  const [bidThresholdModalOpen, setBidThresholdModalOpen] = useState(false);
  const [bidThresholdCampaign, setBidThresholdCampaign] = useState<CampaignItem | null>(null);

  // Expanded rows (for nested ad-groups)
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [adGroupsData, setAdGroupsData] = useState<Record<number, AdGroupItem[]>>({});
  const [adGroupsLoading, setAdGroupsLoading] = useState<Record<number, boolean>>({});

  // Measure table scroll container width for bounding expandable child rows
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el) setContainerWidth(el.clientWidth);
    };
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  // Popover inline edit states
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameVal, setEditingNameVal] = useState<string>('');
  const [editingNameErr, setEditingNameErr] = useState<string | null>(null);

  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [editingBudgetVal, setEditingBudgetVal] = useState<number>(500);
  const [editingBudgetErr, setEditingBudgetErr] = useState<string | null>(null);

  const [editingStrategyId, setEditingStrategyId] = useState<number | null>(null);
  const [editingStrategyVal, setEditingStrategyVal] = useState<string>('DOWN_ONLY');

  const [editingPlacementsId, setEditingPlacementsId] = useState<number | null>(null);
  const [editingTopPct, setEditingTopPct] = useState<number>(0);
  const [editingPagesPct, setEditingPagesPct] = useState<number>(0);

  const [editingDatesId, setEditingDatesId] = useState<number | null>(null);
  const [editingStartDate, setEditingStartDate] = useState<string>('');
  const [editingEndDate, setEditingEndDate] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === campaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaigns.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleExpandRow = async (campaignId: number) => {
    if (expandedIds.includes(campaignId)) {
      setExpandedIds(expandedIds.filter((id) => id !== campaignId));
    } else {
      setExpandedIds([...expandedIds, campaignId]);
      if (!adGroupsData[campaignId]) {
        setAdGroupsLoading((prev) => ({ ...prev, [campaignId]: true }));
        try {
          const res = await getCampaignAdGroups(campaignId);
          setAdGroupsData((prev) => ({ ...prev, [campaignId]: res }));
        } catch {
          // ignore
        } finally {
          setAdGroupsLoading((prev) => ({ ...prev, [campaignId]: false }));
        }
      }
    }
  };

  const handleHeaderSort = (field: string) => {
    if (sortField === field) {
      onSortChange(field, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  // Inline edit savers
  const handleSaveName = async (c: CampaignItem) => {
    const trimmed = editingNameVal.trim();
    if (!trimmed) {
      setEditingNameErr('Campaign name cannot be empty');
      return;
    }
    setEditingNameErr(null);
    if (onPatchCampaign) {
      const ok = await onPatchCampaign(c.id, { name: trimmed });
      if (ok) setEditingNameId(null);
    } else {
      setEditingNameId(null);
    }
  };

  const handleSaveBudget = async (c: CampaignItem) => {
    if (editingBudgetVal < 100) {
      setEditingBudgetErr('Daily budget must be at least ₹100.00');
      return;
    }
    setEditingBudgetErr(null);
    const ok = await onUpdateBudget(c.id, editingBudgetVal);
    if (ok) setEditingBudgetId(null);
  };

  const handleSaveStrategy = async (c: CampaignItem) => {
    if (onPatchCampaign) {
      const ok = await onPatchCampaign(c.id, { bidding_strategy: editingStrategyVal });
      if (ok) setEditingStrategyId(null);
    } else {
      setEditingStrategyId(null);
    }
  };

  const handleSavePlacements = async (c: CampaignItem) => {
    if (onPatchCampaign) {
      const ok = await onPatchCampaign(c.id, {
        placement_top_of_search_pct: editingTopPct,
        placement_product_pages_pct: editingPagesPct,
      });
      if (ok) setEditingPlacementsId(null);
    } else {
      setEditingPlacementsId(null);
    }
  };

  const handleSaveDates = async (c: CampaignItem) => {
    if (onPatchCampaign) {
      const ok = await onPatchCampaign(c.id, {
        start_date: editingStartDate,
        end_date: editingEndDate || null,
      });
      if (ok) setEditingDatesId(null);
    } else {
      setEditingDatesId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  // Delivery status badge (from Amazon's own state / serving status - humanised per 4.6)
  const getDeliveryBadge = (c: CampaignItem) => {
    const raw = (c.delivery_status || (c.state === 'PAUSED' ? 'PAUSED' : 'DELIVERING')).toUpperCase();
    let label = 'Delivering';
    let style = 'bg-emerald-100 text-emerald-900 border-emerald-300';

    if (raw === 'OUT_OF_BUDGET' || raw.includes('OUT_OF_BUDGET')) {
      label = 'Out of budget';
      style = 'bg-red-100 text-red-900 border-red-300';
    } else if (raw === 'PAUSED' || raw.includes('PAUSED')) {
      label = 'Paused';
      style = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (raw === 'ARCHIVED' || raw.includes('ARCHIVED')) {
      label = 'Archived';
      style = 'bg-slate-200 text-slate-800 border-slate-300';
    } else if (raw === 'ENDED' || raw.includes('ENDED')) {
      label = 'Ended';
      style = 'bg-slate-200 text-slate-800 border-slate-300';
    } else if (raw === 'PENDING_START_DATE' || raw.includes('SCHEDULED')) {
      label = 'Scheduled';
      style = 'bg-blue-100 text-blue-900 border-blue-300';
    } else if (raw === 'PAYMENT_FAILURE') {
      label = 'Payment failure';
      style = 'bg-red-100 text-red-900 border-red-300';
    } else if (raw === 'ACCOUNT_OUT_OF_BUDGET') {
      label = 'Account out of budget';
      style = 'bg-red-100 text-red-900 border-red-300';
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border font-semibold tracking-wider ${style}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="bg-surface border border-border-dim rounded-md shadow-2xs flex flex-col font-mono text-xs text-text-main">
      {/* Top Table Toolbar (4.4) */}
      <div className="p-3 border-b border-border-dim flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide uppercase text-slate-800">
              Campaigns
            </span>
          </div>

          {/* Search box with clear icon */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search campaigns by name..."
              className="w-full pl-8 pr-7 py-1.5 text-xs font-mono border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-indigo-600 text-slate-900"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Compare Previous button (active when >= 2 rows are ticked per 4.4 / 4.8) */}
          {selectedIds.length >= 2 && (
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-md border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shadow-2xs transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Previous ({selectedIds.length})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between sm:justify-start md:justify-end">
          {/* Hourly Data button (7.4: honest 'Hourly data is not connected' state) */}
          <button
            type="button"
            onClick={() => {
              setHourlyModalCampaignId(undefined);
              setHourlyModalCampaignName(undefined);
              setHourlyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-100 transition-colors shadow-2xs text-slate-800"
            title="Hourly Performance Data"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden xs:inline">Hourly Data</span>
          </button>

          {/* Columns Chooser */}
          <ColumnChooser visibleColumns={visibleColumns} onChange={setVisibleColumns} />

          {/* Add Campaign Button */}
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Campaign</span>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6 text-center border-b border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-6 h-6 text-spend mx-auto mb-2" />
          <p className="font-bold text-slate-900">{error.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 px-3 py-1 bg-primary text-white text-xs rounded font-medium inline-flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Table Area with Strict 5-Layer Z-Index & Sticky Column Matrix */}
      <div
        ref={tableContainerRef}
        className="relative overflow-x-auto bg-white border border-slate-300 rounded-md shadow-2xs"
      >
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-mono uppercase tracking-wider text-slate-800 sticky top-0 z-20">
            <tr>
              {/* Sticky Col 1: Checkbox */}
              <th className="py-2.5 px-3 w-10 min-w-[40px] max-w-[40px] lg:sticky lg:left-0 lg:z-30 bg-slate-100">
                <input
                  type="checkbox"
                  aria-label="Select all campaigns"
                  checked={campaigns.length > 0 && selectedIds.length === campaigns.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
              </th>

              {/* Sticky Col 2: State Switch */}
              <th className="py-2.5 px-2 w-14 min-w-[56px] max-w-[56px] lg:sticky lg:left-[40px] lg:z-30 bg-slate-100 text-center">
                State
              </th>

              {/* Sticky Col 3: Campaign Name */}
              <th className="py-2.5 px-3 min-w-[200px] sm:min-w-[240px] lg:min-w-[260px] max-w-[320px] lg:sticky lg:left-[96px] lg:z-30 bg-slate-100 lg:shadow-[1px_0_0_0_#cbd5e1]">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('name')}
                  className="flex items-center gap-1 font-semibold uppercase hover:text-slate-800"
                >
                  <span>Campaign</span>
                  {sortField === 'name' && (
                    <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>

              {/* Dynamic Columns */}
              {visibleColumns.includes('status') && (
                <th className="py-2.5 px-3 min-w-[110px]">Delivery</th>
              )}

              {visibleColumns.includes('daily_budget') && (
                <th className="py-2.5 px-3 min-w-[140px] text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleHeaderSort('daily_budget')}
                      className="hover:text-slate-800"
                    >
                      Daily Budget (₹)
                    </button>
                    {sortField === 'daily_budget' && (
                      <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.includes('bidding_strategy') && (
                <th className="py-2.5 px-3 min-w-[130px]">Strategy</th>
              )}

              {visibleColumns.includes('placement_multipliers') && (
                <th className="py-2.5 px-3 min-w-[130px]">Placements</th>
              )}

              {visibleColumns.includes('targeting_type') && (
                <th className="py-2.5 px-3 min-w-[90px]">Targeting</th>
              )}

              {visibleColumns.includes('start_date') && (
                <th className="py-2.5 px-3 min-w-[100px]">Start Date</th>
              )}

              {visibleColumns.includes('end_date') && (
                <th className="py-2.5 px-3 min-w-[100px]">End Date</th>
              )}

              {visibleColumns.includes('impressions') && (
                <th className="py-2.5 px-3 min-w-[100px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('impressions')}
                    className="hover:text-slate-800"
                  >
                    Impr. {sortField === 'impressions' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('clicks') && (
                <th className="py-2.5 px-3 min-w-[90px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('clicks')}
                    className="hover:text-slate-800"
                  >
                    Clicks {sortField === 'clicks' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('ctr') && (
                <th className="py-2.5 px-3 min-w-[80px] text-right">CTR</th>
              )}

              {visibleColumns.includes('spend') && (
                <th className="py-2.5 px-3 min-w-[110px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('spend')}
                    className="hover:text-slate-800"
                  >
                    Spend (₹) {sortField === 'spend' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('cpc') && (
                <th className="py-2.5 px-3 min-w-[85px] text-right">CPC (₹)</th>
              )}

              {visibleColumns.includes('orders') && (
                <th className="py-2.5 px-3 min-w-[85px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('orders')}
                    className="hover:text-slate-800"
                  >
                    Orders {sortField === 'orders' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('sales') && (
                <th className="py-2.5 px-3 min-w-[110px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('sales')}
                    className="hover:text-slate-800"
                  >
                    Sales (₹) {sortField === 'sales' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('acos') && (
                <th className="py-2.5 px-3 min-w-[85px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('acos')}
                    className="hover:text-slate-800"
                  >
                    ACOS {sortField === 'acos' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('roas') && (
                <th className="py-2.5 px-3 min-w-[80px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('roas')}
                    className="hover:text-slate-800"
                  >
                    ROAS {sortField === 'roas' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('budget_utilization') && (
                <th className="py-2.5 px-3 min-w-[100px] text-right">Util. %</th>
              )}

              {/* Actions Column */}
              <th className="py-2.5 px-2 w-10 text-center">⋮</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border-dim bg-white">
            {loading && campaigns.length === 0 ? (
              <tr>
                <td colSpan={25} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading campaigns...</span>
                  </div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={25} className="py-16 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <p className="font-semibold text-slate-700">No campaigns found in your Amazon Ads account</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Try adjusting filters or date range, or create a new campaign on Amazon Ads.
                    </p>
                    <Link
                      href="/campaigns/new"
                      className="mt-3 inline-block px-3 py-1.5 bg-primary text-white rounded font-medium text-xs shadow-2xs"
                    >
                      + Create campaign
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const isExpanded = expandedIds.includes(c.id);
                const isSelected = selectedIds.includes(c.id);
                const isHighlighted = highlightedRowId === c.id;
                const isArchived = c.state === 'ARCHIVED';
                const utilizationPct =
                  c.budget_utilization_pct !== undefined
                    ? c.budget_utilization_pct
                    : c.daily_budget > 0
                    ? Number(((Number(c.today_spend || 0) / c.daily_budget) * 100).toFixed(1))
                    : 0;
                const isAlmostOutOfBudget = utilizationPct >= 85;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => router.push(`/campaigns/${c.id}`)}
                      className={`cursor-pointer hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      } ${isHighlighted ? 'bg-indigo-50/70 ring-2 ring-primary/40' : ''}`}
                    >
                      {/* Sticky Col 1: Checkbox (z-10) */}
                      <td
                        className="py-2.5 px-3 lg:sticky lg:left-0 lg:z-10 bg-white group-hover:bg-slate-50/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${c.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelectRow(c.id)}
                          className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                      </td>

                      {/* Sticky Col 2: State Switch (z-10, Fixes Glitch 10) */}
                      <td
                        className="py-2.5 px-2 lg:sticky lg:left-[40px] lg:z-10 bg-white group-hover:bg-slate-50/80 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          title={
                            isArchived
                              ? 'Archived campaigns cannot be modified'
                              : c.state === 'ENABLED'
                              ? 'Click to pause'
                              : 'Click to enable'
                          }
                        >
                          <Switch
                            size="sm"
                            checked={c.state === 'ENABLED'}
                            disabled={isArchived}
                            onChange={(val) =>
                              onUpdateStatus(c.id, val ? 'ENABLED' : 'PAUSED')
                            }
                            aria-label={`Toggle ${c.name}`}
                          />
                        </div>
                      </td>

                      {/* Sticky Col 3: Campaign Name (z-10 with shadow border) */}
                      <td
                        className="py-2.5 px-3 lg:sticky lg:left-[96px] lg:z-10 bg-white group-hover:bg-slate-50/80 lg:shadow-[1px_0_0_0_var(--color-border-dim)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleExpandRow(c.id)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                              title={isExpanded ? 'Collapse ad groups' : 'Expand ad groups'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <Link
                              href={`/campaigns/${c.id}`}
                              className="font-medium text-slate-900 hover:text-primary transition-colors hover:underline truncate max-w-[160px] sm:max-w-[200px] lg:max-w-[220px]"
                              title={c.name}
                            >
                              {c.name}
                            </Link>
                          </div>

                          {/* Zero-Jitter Name Inline Edit Popover (Glitch 3 & 10) */}
                          {!isArchived && (
                            <Popover
                              open={editingNameId === c.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingNameId(c.id);
                                  setEditingNameVal(c.name);
                                  setEditingNameErr(null);
                                } else {
                                  setEditingNameId(null);
                                }
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="p-1 text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 border border-slate-300 rounded transition-colors"
                                  title="Edit campaign name"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              }
                            >
                              <div className="w-72 p-3 text-xs font-mono space-y-2">
                                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 block">
                                  Edit Campaign Name
                                </span>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingNameVal}
                                  onChange={(e) => {
                                    setEditingNameVal(e.target.value);
                                    setEditingNameErr(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName(c);
                                    if (e.key === 'Escape') setEditingNameId(null);
                                  }}
                                  className="w-full px-2 py-1.5 border border-border-dim rounded text-xs focus:border-primary focus:outline-hidden"
                                />
                                {editingNameErr && <FieldError message={editingNameErr} />}
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingNameId(null)}
                                    className="px-2 py-1 border border-border-dim rounded text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveName(c)}
                                    className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </Popover>
                          )}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      {visibleColumns.includes('status') && (
                        <td className="py-2.5 px-3">{getDeliveryBadge(c)}</td>
                      )}

                      {/* Daily Budget (Fixed min-w, inline Popover + mini health bar) */}
                      {visibleColumns.includes('daily_budget') && (
                        <td
                          className="py-2.5 px-3 text-right min-w-[140px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isArchived ? (
                                <Popover
                                  open={editingBudgetId === c.id}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setEditingBudgetId(c.id);
                                      setEditingBudgetVal(c.daily_budget);
                                      setEditingBudgetErr(null);
                                    } else {
                                      setEditingBudgetId(null);
                                    }
                                  }}
                                  trigger={
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 transition-colors cursor-pointer"
                                      title="Click to edit budget"
                                    >
                                      <span>{money(c.daily_budget)}</span>
                                      <Pencil className="w-3 h-3 text-slate-500 shrink-0" />
                                    </span>
                                  }
                                >
                                  <div className="w-64 p-3 text-xs font-mono space-y-2.5">
                                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 block">
                                      Daily Budget (₹)
                                    </span>
                                    <MoneyInput
                                      value={editingBudgetVal}
                                      onChange={(val) => {
                                        setEditingBudgetVal(val || 100);
                                        setEditingBudgetErr(null);
                                      }}
                                      symbol="₹"
                                      min={100}
                                      helperText="Min ₹100.00"
                                    />
                                    {editingBudgetErr && (
                                      <FieldError message={editingBudgetErr} />
                                    )}
                                    <div className="flex items-center gap-1 pt-1">
                                      {[10, 20, 50].map((inc) => (
                                        <button
                                          key={inc}
                                          type="button"
                                          onClick={() =>
                                            setEditingBudgetVal(
                                              Math.round(c.daily_budget * (1 + inc / 100))
                                            )
                                          }
                                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700"
                                        >
                                          +{inc}%
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex justify-end gap-1.5 pt-1 border-t border-border-dim">
                                      <button
                                        type="button"
                                        onClick={() => setEditingBudgetId(null)}
                                        className="px-2 py-1 border border-border-dim rounded text-[11px]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveBudget(c)}
                                        className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                </Popover>
                              ) : (
                                <span className="font-medium text-slate-400 tabular-nums">
                                  {money(c.daily_budget)}
                                </span>
                              )}
                            </div>

                            {/* Mini Budget Utilization Bar */}
                            <div className="w-24 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isAlmostOutOfBudget ? 'bg-spend' : 'bg-primary'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, utilizationPct))}%`,
                                }}
                              />
                            </div>

                            {/* Almost Out of Budget Badge + Quick +20% Button */}
                            {isAlmostOutOfBudget && !isArchived && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-spend font-medium">
                                  {utilizationPct >= 100 ? 'Exhausted' : 'Almost out'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateBudget(c.id, Math.round(c.daily_budget * 1.2))
                                  }
                                  className="px-1 py-0.2 bg-red-50 hover:bg-red-100 text-spend border border-red-200 rounded text-[9px] font-medium"
                                  title="Increase budget by 20%"
                                >
                                  +20%
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Bidding Strategy Popover */}
                      {visibleColumns.includes('bidding_strategy') && (
                        <td className="py-2.5 px-3 min-w-[130px]" onClick={(e) => e.stopPropagation()}>
                          {!isArchived ? (
                            <Popover
                              open={editingStrategyId === c.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingStrategyId(c.id);
                                  setEditingStrategyVal(c.bidding_strategy || 'DOWN_ONLY');
                                } else {
                                  setEditingStrategyId(null);
                                }
                              }}
                              trigger={
                                <span
                                  className="bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors max-w-[130px]"
                                  title="Click to edit strategy"
                                >
                                  <span className="truncate">
                                    {String(c.bidding_strategy).toUpperCase() === 'UP_AND_DOWN'
                                      ? 'Up & Down'
                                      : String(c.bidding_strategy).toUpperCase() === 'FIXED'
                                      ? 'Fixed'
                                      : 'Down only'}
                                  </span>
                                  <Pencil className="w-3 h-3 text-slate-500 shrink-0" />
                                </span>
                              }
                            >
                              <div className="w-64 p-3 text-xs font-mono space-y-2">
                                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 block">
                                  Bidding Strategy
                                </span>
                                <div className="space-y-1.5">
                                  {[
                                    { value: 'DOWN_ONLY', title: 'Dynamic down only' },
                                    { value: 'UP_AND_DOWN', title: 'Dynamic up & down' },
                                    { value: 'FIXED', title: 'Fixed bids' },
                                  ].map((st) => (
                                    <RadioCard
                                      key={st.value}
                                      name="bidding_strategy_radio"
                                      value={st.value}
                                      selected={editingStrategyVal === st.value}
                                      onChange={() => setEditingStrategyVal(st.value)}
                                      title={st.title}
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-end gap-1.5 pt-2 border-t border-border-dim">
                                  <button
                                    type="button"
                                    onClick={() => setEditingStrategyId(null)}
                                    className="px-2 py-1 border border-border-dim rounded text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStrategy(c)}
                                    className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </Popover>
                          ) : (
                            <span className="text-slate-400">
                              {c.bidding_strategy || 'DOWN_ONLY'}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Placement Multipliers Popover */}
                      {visibleColumns.includes('placement_multipliers') && (
                        <td className="py-2.5 px-3 min-w-[130px]" onClick={(e) => e.stopPropagation()}>
                          {!isArchived ? (
                            <Popover
                              open={editingPlacementsId === c.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingPlacementsId(c.id);
                                  setEditingTopPct(c.placement_top_of_search_pct ?? 0);
                                  setEditingPagesPct(c.placement_product_pages_pct ?? 0);
                                } else {
                                  setEditingPlacementsId(null);
                                }
                              }}
                              trigger={
                                <span
                                  className="font-mono text-xs bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 px-2 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Click to edit placement multipliers"
                                >
                                  <span>
                                    Top: +{c.placement_top_of_search_pct ?? 0}%
                                  </span>
                                  <Pencil className="w-3 h-3 text-slate-500 shrink-0" />
                                </span>
                              }
                            >
                              <div className="w-64 p-3 text-xs font-mono space-y-2.5">
                                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 block">
                                  Placement Multipliers
                                </span>
                                <div>
                                  <label className="block text-[11px] text-slate-500 mb-1">
                                    Top of Search (first page) %
                                  </label>
                                  <PercentInput
                                    value={editingTopPct}
                                    onChange={(val) => setEditingTopPct(val ?? 0)}
                                    min={0}
                                    max={900}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-500 mb-1">
                                    Product Pages %
                                  </label>
                                  <PercentInput
                                    value={editingPagesPct}
                                    onChange={(val) => setEditingPagesPct(val ?? 0)}
                                    min={0}
                                    max={900}
                                  />
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-border-dim text-[11px] text-slate-600">
                                  Max Effective CPC:{' '}
                                  <span className="font-bold text-slate-900">
                                    {money(
                                      calculateMaxEffectiveBid(
                                        15.0,
                                        editingTopPct,
                                        (c.bidding_strategy as BiddingStrategy) || 'DOWN_ONLY',
                                        'TOP_OF_SEARCH'
                                      )
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-end gap-1.5 pt-1 border-t border-border-dim">
                                  <button
                                    type="button"
                                    onClick={() => setEditingPlacementsId(null)}
                                    className="px-2 py-1 border border-border-dim rounded text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSavePlacements(c)}
                                    className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </Popover>
                          ) : (
                            <span className="text-slate-400">
                              Top: +{c.placement_top_of_search_pct ?? 0}%
                            </span>
                          )}
                        </td>
                      )}

                      {/* Targeting Type */}
                      {visibleColumns.includes('targeting_type') && (
                        <td className="py-2.5 px-3 text-slate-600">{c.targeting_type}</td>
                      )}

                      {/* Start Date */}
                      {visibleColumns.includes('start_date') && (
                        <td className="py-2.5 px-3 text-slate-600" onClick={(e) => e.stopPropagation()}>
                          {!isArchived ? (
                            <Popover
                              open={editingDatesId === c.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingDatesId(c.id);
                                  setEditingStartDate(c.start_date || '');
                                  setEditingEndDate(c.end_date || null);
                                } else {
                                  setEditingDatesId(null);
                                }
                              }}
                              trigger={
                                <span
                                  className="bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Click to edit dates"
                                >
                                  <span>{c.start_date || '—'}</span>
                                  <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                                </span>
                              }
                            >
                              <div className="w-64 p-3 text-xs font-mono space-y-2.5">
                                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 block">
                                  Campaign Dates
                                </span>
                                <div>
                                  <label className="block text-[11px] text-slate-500 mb-1">Start Date</label>
                                  <DatePicker
                                    value={editingStartDate}
                                    onChange={(d) => setEditingStartDate(d || '')}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-500 mb-1">End Date (optional)</label>
                                  <DatePicker
                                    value={editingEndDate || ''}
                                    onChange={(d) => setEditingEndDate(d || null)}
                                    minDate={editingStartDate}
                                  />
                                </div>
                                <div className="flex justify-end gap-1.5 pt-1 border-t border-border-dim">
                                  <button
                                    type="button"
                                    onClick={() => setEditingDatesId(null)}
                                    className="px-2 py-1 border border-border-dim rounded text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveDates(c)}
                                    className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </Popover>
                          ) : (
                            c.start_date || '—'
                          )}
                        </td>
                      )}

                      {/* End Date */}
                      {visibleColumns.includes('end_date') && (
                        <td className="py-2.5 px-3 text-slate-600">{c.end_date || 'No end date'}</td>
                      )}

                      {/* Metrics (Strict Indian Currency / en-IN format) */}
                      {visibleColumns.includes('impressions') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{num(c.impressions)}</td>
                      )}

                      {visibleColumns.includes('clicks') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{num(c.clicks)}</td>
                      )}

                      {visibleColumns.includes('ctr') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{pct(c.ctr)}</td>
                      )}

                      {visibleColumns.includes('spend') && (
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-spend">
                          {money(c.spend)}
                        </td>
                      )}

                      {visibleColumns.includes('cpc') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{money(c.cpc)}</td>
                      )}

                      {visibleColumns.includes('orders') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{num(c.orders)}</td>
                      )}

                      {visibleColumns.includes('sales') && (
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-sales">
                          {money(c.sales)}
                        </td>
                      )}

                      {/* ACOS Column (Bleeding INF Badge) */}
                      {visibleColumns.includes('acos') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {c.acos_is_infinite ? (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-red-100 text-red-800 border border-red-300"
                              title={`${money(c.spend)} spent with 0 sales`}
                            >
                              INF
                            </span>
                          ) : c.acos !== null && c.acos !== undefined ? (
                            pct(c.acos)
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {visibleColumns.includes('roas') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{ratio(c.roas)}</td>
                      )}

                      {visibleColumns.includes('budget_utilization') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {utilizationPct.toFixed(1)}%
                        </td>
                      )}

                      {/* Actions Column */}
                      <td
                        className="py-2.5 px-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowMenu
                          campaign={c}
                          onUpdateStatus={onUpdateStatus}
                          onBidThreshold={(cmp) => {
                            if (onBidThreshold) onBidThreshold(c);
                            setBidThresholdCampaign(c);
                            setBidThresholdModalOpen(true);
                          }}
                          onHourlyTracking={(cmp) => {
                            setHourlyModalCampaignId(Number(cmp.id));
                            setHourlyModalCampaignName(cmp.name);
                            setHourlyModalOpen(true);
                          }}
                        />
                      </td>
                    </tr>

                    {/* Expandable nested ad groups row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-y border-border-dim">
                        <td colSpan={25} className="py-3 px-2 sm:px-4 lg:px-8">
                          <div
                            className="lg:sticky lg:left-8 border border-border-dim rounded bg-white p-3 shadow-2xs"
                            style={{
                              maxWidth: containerWidth ? `${Math.max(280, containerWidth - (containerWidth < 640 ? 16 : 48))}px` : '100%',
                            }}
                          >
                            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block mb-2">
                              Ad Groups in &ldquo;{c.name}&rdquo;
                            </span>
                            {adGroupsLoading[c.id] ? (
                              <div className="py-4 text-center text-slate-400">Loading ad groups...</div>
                            ) : !adGroupsData[c.id] || adGroupsData[c.id].length === 0 ? (
                              <div className="py-2 text-slate-400 text-center">No ad groups found</div>
                            ) : (
                              <div className="overflow-x-auto w-full">
                                <table className="w-full min-w-[760px] text-xs font-mono whitespace-nowrap">
                                  <thead className="border-b border-border-dim text-[10px] uppercase text-slate-400">
                                    <tr>
                                      <th className="py-1 px-2 text-left">Name</th>
                                      <th className="py-1 px-2 text-left">State</th>
                                      <th className="py-1 px-2 text-right">Default Bid</th>
                                      <th className="py-1 px-2 text-right">Impr.</th>
                                      <th className="py-1 px-2 text-right">Clicks</th>
                                      <th className="py-1 px-2 text-right">Spend</th>
                                      <th className="py-1 px-2 text-right">Sales</th>
                                      <th className="py-1 px-2 text-right">Orders</th>
                                      <th className="py-1 px-2 text-right">ACOS</th>
                                      <th className="py-1 px-2 text-right">ROAS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border-dim">
                                    {adGroupsData[c.id].map((ag) => (
                                      <tr key={ag.id} className="hover:bg-slate-50">
                                        <td className="py-1 px-2 font-medium text-slate-800">{ag.name}</td>
                                        <td className="py-1 px-2 text-slate-500">{ag.state}</td>
                                        <td className="py-1 px-2 text-right tabular-nums">
                                          {money(ag.default_bid)}
                                        </td>
                                        <td className="py-1 px-2 text-right tabular-nums">{num(ag.impressions)}</td>
                                        <td className="py-1 px-2 text-right tabular-nums">{num(ag.clicks)}</td>
                                        <td className="py-1 px-2 text-right tabular-nums font-semibold text-spend">
                                          {money(ag.spend)}
                                        </td>
                                        <td className="py-1 px-2 text-right tabular-nums font-semibold text-sales">
                                          {money(ag.sales)}
                                        </td>
                                        <td className="py-1 px-2 text-right tabular-nums">{num(ag.orders)}</td>
                                        <td className="py-1 px-2 text-right tabular-nums">{pct(ag.acos)}</td>
                                        <td className="py-1 px-2 text-right tabular-nums">{ratio(ag.roas)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Pinned Totals Row (Strict Indian Standards, Sticky corners z-30) */}
          {totals && campaigns.length > 0 && (
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-950 sticky bottom-0 z-20">
              <tr>
                <td className="py-2.5 px-3 lg:sticky lg:left-0 lg:z-30 bg-slate-100" />
                <td className="py-2.5 px-2 lg:sticky lg:left-[40px] lg:z-30 bg-slate-100" />
                <td className="py-2.5 px-3 lg:sticky lg:left-[96px] lg:z-30 bg-slate-100 lg:shadow-[1px_0_0_0_#cbd5e1]">
                  Total ({num(totalCount)} campaigns)
                </td>

                {visibleColumns.includes('status') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('daily_budget') && <td className="py-2.5 px-3 text-right" />}
                {visibleColumns.includes('bidding_strategy') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('placement_multipliers') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('targeting_type') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('start_date') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('end_date') && <td className="py-2.5 px-3" />}

                {visibleColumns.includes('impressions') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{num(totals.impressions)}</td>
                )}
                {visibleColumns.includes('clicks') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{num(totals.clicks)}</td>
                )}
                {visibleColumns.includes('ctr') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{pct(totals.ctr)}</td>
                )}
                {visibleColumns.includes('spend') && (
                  <td className="py-2.5 px-3 text-right tabular-nums text-spend">
                    {money(totals.spend)}
                  </td>
                )}
                {visibleColumns.includes('cpc') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{money(totals.cpc)}</td>
                )}
                {visibleColumns.includes('orders') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{num(totals.orders)}</td>
                )}
                {visibleColumns.includes('sales') && (
                  <td className="py-2.5 px-3 text-right tabular-nums text-sales">
                    {money(totals.sales)}
                  </td>
                )}
                {visibleColumns.includes('acos') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {(totals as any).acos_is_infinite || (totals.spend > 0 && totals.sales === 0) ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                        INF
                      </span>
                    ) : (
                      pct(totals.acos)
                    )}
                  </td>
                )}
                {visibleColumns.includes('roas') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{ratio(totals.roas)}</td>
                )}
                {visibleColumns.includes('budget_utilization') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">—</td>
                )}
                <td className="py-2.5 px-2" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-border-dim flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-500 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border border-border-dim rounded px-1.5 py-0.5 bg-white text-xs font-mono"
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <span>
            Showing {startIndex}–{endIndex} of {num(totalCount)}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            className="px-2 py-1 border border-border-dim rounded hover:bg-slate-50 disabled:opacity-40"
          >
            « First
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2 py-1 border border-border-dim rounded hover:bg-slate-50 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="px-2 whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2 py-1 border border-border-dim rounded hover:bg-slate-50 disabled:opacity-40"
          >
            Next ›
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="px-2 py-1 border border-border-dim rounded hover:bg-slate-50 disabled:opacity-40"
          >
            Last »
          </button>
        </div>
      </div>

      {/* Bulk action floating bar (Glitch 7) */}
      <BulkBar
        selectedIds={selectedIds}
        campaigns={campaigns}
        onAction={onBulkAction}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Bid Threshold Modal (Phase 5 / D9) */}
      {bidThresholdCampaign && (
        <BidThresholdModal
          open={bidThresholdModalOpen}
          onClose={() => {
            setBidThresholdModalOpen(false);
            setBidThresholdCampaign(null);
          }}
          campaignId={bidThresholdCampaign.id}
          campaignName={bidThresholdCampaign.name}
          onSuccess={() => {
            if (onRetry) onRetry();
          }}
        />
      )}

      {/* Hourly Data / Tracking Modal (7.4) */}
      <HourlyModal
        open={hourlyModalOpen}
        onClose={() => {
          setHourlyModalOpen(false);
          setHourlyModalCampaignId(undefined);
          setHourlyModalCampaignName(undefined);
        }}
        campaignId={hourlyModalCampaignId}
        campaignName={hourlyModalCampaignName}
      />

      {/* Compare Previous Modal (4.8) */}
      <ComparePreviousModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        campaigns={campaigns}
        selectedIds={selectedIds}
        currentStart={dateRange?.start || ''}
        currentEnd={dateRange?.end || ''}
      />
    </div>
  );
}
