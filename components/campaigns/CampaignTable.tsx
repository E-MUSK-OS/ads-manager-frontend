'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Download,
  Filter,
  Check,
  RotateCw,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import { ColumnChooser, DEFAULT_VISIBLE_COLUMNS, ColumnKey } from './ColumnChooser';
import { RowMenu } from './RowMenu';
import { BulkBar } from './BulkBar';
import { DraftsPanel } from './DraftsPanel';
import { getCampaignAdGroups } from '@/lib/api-client';
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
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onFilterChange: (filters: FilterState) => void;
  onUpdateStatus: (id: number, state: CampaignState) => void;
  onUpdateBudget: (id: number, budget: number) => Promise<boolean>;
  onDuplicate: (id: number) => void;
  onBulkAction: (ids: number[], action: string, value?: number) => void;
  onRetry: () => void;
  draftsCount?: number;
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
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onUpdateStatus,
  onUpdateBudget,
  onDuplicate,
  onBulkAction,
  onRetry,
  draftsCount = 0,
}: CampaignTableProps) {
  const router = useRouter();
  const { account, rules } = useActiveAccount();

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

  // Columns visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    try {
      const stored = localStorage.getItem('ads_manager_visible_columns');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_VISIBLE_COLUMNS;
  });

  // Row selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Expanded rows (for nested ad-groups)
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [adGroupsData, setAdGroupsData] = useState<Record<number, AdGroupItem[]>>({});
  const [adGroupsLoading, setAdGroupsLoading] = useState<Record<number, boolean>>({});

  // Inline budget editing
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState<string>('');
  const [savingBudget, setSavingBudget] = useState(false);

  // Drafts panel open
  const [draftsOpen, setDraftsOpen] = useState(false);

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

  const handleStartBudgetEdit = (c: CampaignItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBudgetId(c.id);
    setEditingBudgetValue(String(c.daily_budget));
  };

  const handleSaveBudget = async (id: number) => {
    const val = Number(editingBudgetValue);
    if (isNaN(val) || val <= 0) {
      setEditingBudgetId(null);
      return;
    }
    setSavingBudget(true);
    const ok = await onUpdateBudget(id, val);
    setSavingBudget(false);
    if (ok) {
      setEditingBudgetId(null);
    }
  };

  const handleExportCsv = () => {
    if (campaigns.length === 0) return;
    const headers = ['ID', 'Name', 'State', 'Health', 'Budget', 'Spend', 'Sales', 'Orders', 'Clicks', 'Impressions', 'ACOS', 'ROAS'];
    const rows = campaigns.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.state,
      c.health,
      c.daily_budget,
      c.spend,
      c.sales,
      c.orders,
      c.clicks,
      c.impressions,
      c.acos !== null ? `${c.acos.toFixed(2)}%` : '—',
      c.roas !== null ? `${c.roas.toFixed(2)}x` : '—',
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `campaigns_report_${account?.marketplace || 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  // Status badge colors
  const getStatusBadge = (state: CampaignState, id: number) => {
    const isArchived = state === 'ARCHIVED';
    const isEnabled = state === 'ENABLED';

    return (
      <button
        type="button"
        disabled={isArchived}
        onClick={(e) => {
          e.stopPropagation();
          onUpdateStatus(id, isEnabled ? 'PAUSED' : 'ENABLED');
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
          isEnabled
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : isArchived
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
        }`}
        title={isArchived ? 'Archived campaigns cannot be enabled' : `Click to ${isEnabled ? 'pause' : 'enable'}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isEnabled ? 'bg-emerald-500' : isArchived ? 'bg-slate-400' : 'bg-amber-500'
          }`}
        />
        <span>{state}</span>
      </button>
    );
  };

  // Health badge colors
  const getHealthBadge = (c: CampaignItem) => {
    const color = c.health_color || 'green';
    const label = c.health_label || c.health || 'Healthy';

    const colorMap: Record<string, string> = {
      green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      red: 'bg-rose-50 text-rose-700 border-rose-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      blue: 'bg-sky-50 text-sky-700 border-sky-200',
      slate: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border font-medium uppercase tracking-wider ${
          colorMap[color] || colorMap.green
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="bg-surface border border-border-dim rounded-md shadow-2xs flex flex-col font-mono text-xs text-text-main">
      {/* Top Table Toolbar */}
      <div className="p-3 border-b border-border-dim flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide uppercase text-slate-800">
              Campaigns
            </span>
            <button
              type="button"
              onClick={() => setDraftsOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-primary hover:bg-indigo-50 transition-colors font-medium"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Drafts</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-border-dim rounded-md bg-white focus:outline-hidden focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ColumnChooser visibleColumns={visibleColumns} onChange={setVisibleColumns} />

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={campaigns.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-text-main disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
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
            className="mt-3 px-3 py-1 bg-primary text-white text-xs rounded font-medium inline-flex items-center gap-1.5"
          >
            <RotateCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Table Area */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-slate-50 border-b border-border-dim text-[11px] font-mono uppercase tracking-wider text-slate-500 sticky top-0 z-20">
            <tr>
              {/* Checkbox column */}
              <th className="py-2.5 px-3 w-10 sticky left-0 z-30 bg-slate-50">
                <input
                  type="checkbox"
                  checked={campaigns.length > 0 && selectedIds.length === campaigns.length}
                  onChange={toggleSelectAll}
                  className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
                />
              </th>

              {/* Actions column */}
              <th className="py-2.5 px-2 w-8 sticky left-10 z-30 bg-slate-50 text-center">
                ⋮
              </th>

              {/* Campaign Name column */}
              <th className="py-2.5 px-3 min-w-[220px] sticky left-[68px] z-30 bg-slate-50">
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
                <th className="py-2.5 px-3 min-w-[100px]">Status</th>
              )}

              {visibleColumns.includes('health') && (
                <th className="py-2.5 px-3 min-w-[110px]">Health</th>
              )}

              {visibleColumns.includes('start_date') && (
                <th className="py-2.5 px-3 min-w-[100px]">Start</th>
              )}

              {visibleColumns.includes('end_date') && (
                <th className="py-2.5 px-3 min-w-[100px]">End</th>
              )}

              {visibleColumns.includes('daily_budget') && (
                <th className="py-2.5 px-3 min-w-[120px] text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleHeaderSort('daily_budget')}
                      className="hover:text-slate-800"
                    >
                      Budget
                    </button>
                    {sortField === 'daily_budget' && (
                      <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.includes('targeting_type') && (
                <th className="py-2.5 px-3 min-w-[90px]">Targeting</th>
              )}

              {visibleColumns.includes('bidding_strategy') && (
                <th className="py-2.5 px-3 min-w-[130px]">Strategy</th>
              )}

              {visibleColumns.includes('impressions') && (
                <th className="py-2.5 px-3 min-w-[110px] text-right">
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
                <th className="py-2.5 px-3 min-w-[100px] text-right">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort('spend')}
                    className="hover:text-slate-800"
                  >
                    Spend {sortField === 'spend' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('cpc') && (
                <th className="py-2.5 px-3 min-w-[80px] text-right">CPC</th>
              )}

              {visibleColumns.includes('orders') && (
                <th className="py-2.5 px-3 min-w-[80px] text-right">
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
                    Sales {sortField === 'sales' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              )}

              {visibleColumns.includes('acos') && (
                <th className="py-2.5 px-3 min-w-[80px] text-right">
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
                <th className="py-2.5 px-3 min-w-[110px] text-right">Util. %</th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border-dim bg-white">
            {loading && campaigns.length === 0 ? (
              <tr>
                <td colSpan={20} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading campaigns...</span>
                  </div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={20} className="py-16 text-center text-slate-400">
                  {!account ? (
                    <div className="max-w-xs mx-auto">
                      <p className="font-semibold text-slate-700">No account connected</p>
                      <p className="text-[11px] mt-1 text-slate-500">
                        Connect an Amazon Ads account to view your campaigns.
                      </p>
                    </div>
                  ) : totalCount === 0 && !filters.search ? (
                    <div className="max-w-xs mx-auto">
                      <p className="font-semibold text-slate-700">No campaigns yet</p>
                      <p className="text-[11px] mt-1 text-slate-500">
                        Create your first Amazon Ads campaign to get started.
                      </p>
                      <Link
                        href="/campaigns/new"
                        className="mt-3 inline-block px-3 py-1.5 bg-primary text-white rounded font-medium text-xs shadow-2xs"
                      >
                        + Create campaign
                      </Link>
                    </div>
                  ) : (
                    <div className="max-w-xs mx-auto">
                      <p className="font-semibold text-slate-700">No campaigns match</p>
                      <p className="text-[11px] mt-1 text-slate-500">
                        Try adjusting your filters or search terms.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onFilterChange({ status: [], health: [], targeting_type: [], search: '' })
                        }
                        className="mt-3 px-3 py-1 border border-border-dim rounded text-xs font-medium hover:bg-slate-50"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const isExpanded = expandedIds.includes(c.id);
                const isSelected = selectedIds.includes(c.id);
                const isHighlighted = highlightedRowId === c.id;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => router.push(`/campaigns/${c.id}`)}
                      className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      } ${isHighlighted ? 'bg-indigo-50/70 ring-2 ring-primary/40' : ''}`}
                    >
                      {/* Select checkbox */}
                      <td
                        className="py-2.5 px-3 sticky left-0 z-10 bg-white"
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

                      {/* Row actions */}
                      <td
                        className="py-2.5 px-2 sticky left-10 z-10 bg-white text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowMenu
                          campaign={c}
                          onStatusChange={async (id, nextStatus) => {
                            onUpdateStatus(Number(id), nextStatus as CampaignState);
                          }}
                          onDuplicate={(cmp) => {
                            onDuplicate(Number(cmp.id));
                          }}
                          onEditBudget={(cmp) => {
                            setEditingBudgetId(Number(cmp.id));
                            setEditingBudgetValue(String(cmp.daily_budget || ''));
                          }}
                        />
                      </td>

                      {/* Campaign Name */}
                      <td className="py-2.5 px-3 sticky left-[68px] z-10 bg-white">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandRow(c.id);
                            }}
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
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-slate-900 hover:text-primary transition-colors hover:underline truncate max-w-[280px]"
                            title={c.name}
                          >
                            {c.name}
                          </Link>
                        </div>
                      </td>

                      {/* Status */}
                      {visibleColumns.includes('status') && (
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          {getStatusBadge(c.state, c.id)}
                        </td>
                      )}

                      {/* Health */}
                      {visibleColumns.includes('health') && (
                        <td className="py-2.5 px-3">{getHealthBadge(c)}</td>
                      )}

                      {/* Start Date */}
                      {visibleColumns.includes('start_date') && (
                        <td className="py-2.5 px-3 text-slate-600">{c.start_date}</td>
                      )}

                      {/* End Date */}
                      {visibleColumns.includes('end_date') && (
                        <td className="py-2.5 px-3 text-slate-600">{c.end_date || 'No end date'}</td>
                      )}

                      {/* Daily Budget (inline editable) */}
                      {visibleColumns.includes('daily_budget') && (
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {editingBudgetId === c.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                autoFocus
                                step="any"
                                value={editingBudgetValue}
                                onChange={(e) => setEditingBudgetValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveBudget(c.id);
                                  if (e.key === 'Escape') setEditingBudgetId(null);
                                }}
                                className="w-20 px-1.5 py-0.5 text-xs border border-primary rounded text-right font-mono"
                              />
                              <button
                                type="button"
                                disabled={savingBudget}
                                onClick={() => handleSaveBudget(c.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleStartBudgetEdit(c, e)}
                              className="font-medium hover:text-primary hover:underline tabular-nums"
                              title="Click to edit budget"
                            >
                              {money(c.daily_budget, rules)}
                            </button>
                          )}
                        </td>
                      )}

                      {/* Targeting */}
                      {visibleColumns.includes('targeting_type') && (
                        <td className="py-2.5 px-3 text-slate-600">{c.targeting_type}</td>
                      )}

                      {/* Strategy */}
                      {visibleColumns.includes('bidding_strategy') && (
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                          {c.bidding_strategy}
                        </td>
                      )}

                      {/* Metrics */}
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
                          {money(c.spend, rules)}
                        </td>
                      )}

                      {visibleColumns.includes('cpc') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{money(c.cpc, rules)}</td>
                      )}

                      {visibleColumns.includes('orders') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">{num(c.orders)}</td>
                      )}

                      {visibleColumns.includes('sales') && (
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-sales">
                          {money(c.sales, rules)}
                        </td>
                      )}

                      {visibleColumns.includes('acos') && (
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {c.acos !== null ? (
                            pct(c.acos)
                          ) : c.spend > 0 ? (
                            <span className="text-spend text-[10px]">No sales</span>
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
                          {c.budget_utilization !== undefined && c.budget_utilization !== null
                            ? `${c.budget_utilization.toFixed(1)}%`
                            : '—'}
                        </td>
                      )}
                    </tr>

                    {/* Expandable nested ad groups row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-y border-border-dim">
                        <td colSpan={25} className="py-3 px-8">
                          <div className="border border-border-dim rounded bg-white p-3 shadow-2xs">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block mb-2">
                              Ad Groups in &ldquo;{c.name}&rdquo;
                            </span>
                            {adGroupsLoading[c.id] ? (
                              <div className="py-4 text-center text-slate-400">Loading ad groups...</div>
                            ) : !adGroupsData[c.id] || adGroupsData[c.id].length === 0 ? (
                              <div className="py-2 text-slate-400 text-center">No ad groups found</div>
                            ) : (
                              <table className="w-full text-xs font-mono">
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
                                        {money(ag.default_bid, rules)}
                                      </td>
                                      <td className="py-1 px-2 text-right tabular-nums">{num(ag.impressions)}</td>
                                      <td className="py-1 px-2 text-right tabular-nums">{num(ag.clicks)}</td>
                                      <td className="py-1 px-2 text-right tabular-nums font-semibold text-spend">
                                        {money(ag.spend, rules)}
                                      </td>
                                      <td className="py-1 px-2 text-right tabular-nums font-semibold text-sales">
                                        {money(ag.sales, rules)}
                                      </td>
                                      <td className="py-1 px-2 text-right tabular-nums">{num(ag.orders)}</td>
                                      <td className="py-1 px-2 text-right tabular-nums">{pct(ag.acos)}</td>
                                      <td className="py-1 px-2 text-right tabular-nums">{ratio(ag.roas)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

          {/* Pinned Totals Row */}
          {totals && campaigns.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-border-dim font-bold text-text-main sticky bottom-0 z-20">
              <tr>
                <td className="py-2.5 px-3 sticky left-0 z-30 bg-slate-50" />
                <td className="py-2.5 px-2 sticky left-10 z-30 bg-slate-50" />
                <td className="py-2.5 px-3 sticky left-[68px] z-30 bg-slate-50">
                  Total ({totalCount} campaigns)
                </td>

                {visibleColumns.includes('status') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('health') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('start_date') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('end_date') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('daily_budget') && <td className="py-2.5 px-3 text-right" />}
                {visibleColumns.includes('targeting_type') && <td className="py-2.5 px-3" />}
                {visibleColumns.includes('bidding_strategy') && <td className="py-2.5 px-3" />}

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
                    {money(totals.spend, rules)}
                  </td>
                )}
                {visibleColumns.includes('cpc') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{money(totals.cpc, rules)}</td>
                )}
                {visibleColumns.includes('orders') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{num(totals.orders)}</td>
                )}
                {visibleColumns.includes('sales') && (
                  <td className="py-2.5 px-3 text-right tabular-nums text-sales">
                    {money(totals.sales, rules)}
                  </td>
                )}
                {visibleColumns.includes('acos') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{pct(totals.acos)}</td>
                )}
                {visibleColumns.includes('roas') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">{ratio(totals.roas)}</td>
                )}
                {visibleColumns.includes('budget_utilization') && (
                  <td className="py-2.5 px-3 text-right tabular-nums">—</td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-border-dim flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 bg-white">
        <div className="flex items-center gap-3">
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
            Showing {startIndex}–{endIndex} of {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-1">
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
          <span className="px-2">
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

      {/* Bulk action floating bar */}
      <BulkBar
        selectedIds={selectedIds}
        onAction={onBulkAction}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Drafts drawer */}
      <DraftsPanel open={draftsOpen} onClose={() => setDraftsOpen(false)} />
    </div>
  );
}
