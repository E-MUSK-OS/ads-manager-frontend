'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  BarChart3,
  Settings,
  Plus,
  FileText,
  Briefcase,
} from 'lucide-react';
import { useCampaignList } from '@/components/campaigns/useCampaignList';
import { DateRangePicker } from '@/components/campaigns/DateRangePicker';
import { FilterBar } from '@/components/campaigns/FilterBar';
import { KpiCards } from '@/components/campaigns/KpiCards';
import { PerformanceChart } from '@/components/campaigns/PerformanceChart';
import { CampaignTable } from '@/components/campaigns/CampaignTable';
import { AlertSettingsDialog } from '@/components/campaigns/AlertSettingsDialog';
import { DraftsPanel } from '@/components/campaigns/DraftsPanel';
import { num } from '@/lib/format';
import type { MetricKey } from '@/components/campaigns/wizard/helpers';

const CHART_COLLAPSE_STORAGE_KEY = 'ads_manager_chart_collapsed';

function CampaignsPageContent() {
  const {
    account,
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
    refetch,
    handleSync,
    handleUpdateStatus,
    handleUpdateBudget,
    patchCampaignInline,
    handleDuplicate,
    handleBulkAction,
  } = useCampaignList();

  const [showChart, setShowChart] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHART_COLLAPSE_STORAGE_KEY);
      if (stored !== null) {
        setShowChart(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [chartMetrics, setChartMetrics] = useState<[MetricKey, MetricKey]>(['spend', 'sales']);

  const handleSelectMetric = (metric: MetricKey) => {
    setChartMetrics((prev) => {
      if (prev[0] === metric) return prev;
      if (prev[1] === metric) return [metric, prev[0]];
      return [prev[0], metric];
    });
  };

  const toggleShowChart = () => {
    setShowChart((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CHART_COLLAPSE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const statusCounts = meta?.status_counts || {
    ALL: totalCount || campaigns.length,
    DELIVERING: campaigns.filter((c) => c.delivery_status === 'DELIVERING').length,
    OUT_OF_BUDGET: campaigns.filter((c) => c.delivery_status === 'OUT_OF_BUDGET').length,
    PAUSED: campaigns.filter((c) => c.state === 'PAUSED').length,
    ARCHIVED: campaigns.filter((c) => c.state === 'ARCHIVED').length,
    DRAFTS: 0,
  };

  const activeStatus = filters.delivery_status || (filters.status && filters.status[0]) || 'ALL';

  const handleStatusPillClick = (statusKey: string) => {
    if (statusKey === 'DRAFTS') {
      setDraftsOpen(true);
      return;
    }
    if (statusKey === 'ALL') {
      updateFilters({ status: [], delivery_status: undefined });
    } else if (statusKey === 'DELIVERING' || statusKey === 'OUT_OF_BUDGET') {
      updateFilters({ status: [], delivery_status: statusKey });
    } else if (statusKey === 'PAUSED' || statusKey === 'ARCHIVED') {
      updateFilters({ status: [statusKey], delivery_status: undefined });
    }
  };

  const handlePortfolioChange = (portfolio: string) => {
    if (portfolio === 'ALL') {
      updateFilters({ portfolio: undefined });
    } else {
      updateFilters({ portfolio });
    }
  };

  return (
    <div
      className={`min-h-screen bg-graph-paper-faint p-6 space-y-5 transition-all ${
        selectedIds.length > 0 ? 'pb-24' : ''
      }`}
    >
      {/* Top Header & Portfolio Rail */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 uppercase">
              Campaigns
            </h1>
            <span className="text-xs font-mono text-slate-500">
              ({num(totalCount)} {totalCount === 1 ? 'campaign' : 'campaigns'})
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Amazon Ads India (Amazon.in) Campaign Manager — Sponsored Products, Brands & Display
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* Refresh / Sync Button */}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !account}
            className="p-2 rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-slate-600 hover:text-slate-900 disabled:opacity-50"
            title="Sync account metrics"
          >
            <RotateCw className={`w-4 h-4 ${syncing ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Show / Hide Chart Toggle */}
          <button
            type="button"
            onClick={toggleShowChart}
            className={`p-2 rounded-md border transition-colors shadow-2xs ${
              showChart
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border-dim bg-surface text-slate-600 hover:bg-slate-50'
            }`}
            title={showChart ? 'Collapse performance chart' : 'Show performance chart'}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Drafts Trigger */}
          <button
            type="button"
            onClick={() => setDraftsOpen(true)}
            className="p-2 rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-slate-600 hover:text-slate-900"
            title="View saved drafts"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Alerts Dialog */}
          <AlertSettingsDialog alerts={alerts} onSettingsSaved={refetch} />

          {/* Settings Link */}
          <Link
            href="/campaigns/settings"
            className="p-2 rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-slate-600 hover:text-slate-900"
            title="Campaign settings & guardrails"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Primary Create Campaign Button */}
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-indigo-700 text-white font-mono text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create campaign</span>
          </Link>
        </div>
      </div>

      {/* Portfolio Switcher & Status Pills Rail */}
      <div className="bg-surface border border-border-dim rounded-md p-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-2xs">
        {/* Left: Quick Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL', label: 'All', count: statusCounts.ALL },
            { key: 'DELIVERING', label: 'Delivering', count: statusCounts.DELIVERING },
            { key: 'OUT_OF_BUDGET', label: 'Out of Budget', count: statusCounts.OUT_OF_BUDGET },
            { key: 'PAUSED', label: 'Paused', count: statusCounts.PAUSED },
            { key: 'ARCHIVED', label: 'Archived', count: statusCounts.ARCHIVED },
            { key: 'DRAFTS', label: 'Drafts', count: statusCounts.DRAFTS },
          ].map((pill) => {
            const isSelected = activeStatus === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => handleStatusPillClick(pill.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  isSelected
                    ? 'bg-primary text-white font-medium shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-border-dim'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {num(pill.count || 0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Portfolio Selector */}
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 text-[11px] uppercase tracking-wider">Portfolio:</span>
          <select
            value={filters.portfolio || 'ALL'}
            onChange={(e) => handlePortfolioChange(e.target.value)}
            className="border border-border-dim rounded px-2 py-1 bg-white text-xs font-mono focus:border-primary focus:outline-hidden"
          >
            <option value="ALL">All Portfolios</option>
            <option value="Uncategorized">Uncategorized</option>
            {meta?.portfolios?.map((p: string) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* 8-Card Interactive KPI Ribbon */}
      <KpiCards
        summary={summaryData}
        totals={totals}
        loading={loading}
        selectedChartMetrics={chartMetrics}
        onSelectMetric={handleSelectMetric}
      />

      {/* Collapsible Dual-Axis Performance Chart */}
      {showChart && (
        <PerformanceChart
          summary={summaryData}
          loading={loading}
          granularity={granularity}
          onGranularityChange={setGranularity}
          selectedMetrics={chartMetrics}
        />
      )}

      {/* Campaigns Data Table */}
      <CampaignTable
        campaigns={campaigns}
        totals={totals}
        totalCount={totalCount}
        loading={loading}
        error={error}
        highlightedRowId={highlightedRowId}
        page={page}
        pageSize={pageSize}
        sortField={sortField}
        sortDir={sortDir}
        filters={filters}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={(field, dir) => {
          setSortField(field);
          setSortDir(dir);
        }}
        onFilterChange={setFilters}
        onUpdateStatus={handleUpdateStatus}
        onUpdateBudget={handleUpdateBudget}
        onPatchCampaign={patchCampaignInline}
        onDuplicate={handleDuplicate}
        onBulkAction={handleBulkAction}
        onRetry={refetch}
        draftsCount={statusCounts.DRAFTS || 0}
      />

      {/* Drafts Drawer */}
      <DraftsPanel open={draftsOpen} onClose={() => setDraftsOpen(false)} />
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center font-mono text-xs text-slate-400">
          Loading Amazon Ads Campaigns...
        </div>
      }
    >
      <CampaignsPageContent />
    </Suspense>
  );
}
