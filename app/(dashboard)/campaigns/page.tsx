'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  BarChart3,
  Plus,
  Briefcase,
  Target,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useCampaignList } from '@/components/campaigns/useCampaignList';
import { DateRangePicker } from '@/components/campaigns/DateRangePicker';
import { FilterBar } from '@/components/campaigns/FilterBar';
import { KpiCards } from '@/components/campaigns/KpiCards';
import { PerformanceChart } from '@/components/campaigns/PerformanceChart';
import { CampaignTable } from '@/components/campaigns/CampaignTable';
import { num } from '@/lib/format';
import type { MetricKey } from '@/components/campaigns/wizard/helpers';

const CHART_COLLAPSE_STORAGE_KEY = 'ads_manager_chart_collapsed';

function CampaignsPageContent() {
  const {
    account,
    accounts,
    accountLoading,
    meta,
    campaigns,
    totals,
    totalCount,
    summaryData,
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
    granularity,
    setGranularity,
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

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [chartMetrics, setChartMetrics] = useState<MetricKey[]>(['spend', 'sales']);

  const handleSelectMetric = (metric: MetricKey) => {
    setChartMetrics((prev) => {
      if (prev.includes(metric)) {
        if (prev.length <= 1) return prev; // min 1
        return prev.filter((m) => m !== metric);
      }
      
      return [...prev, metric];
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
  };

  const activeStatus =
    filters.delivery_status ||
    (filters.status && filters.status.length === 1 && (filters.status[0] === 'PAUSED' || filters.status[0] === 'ARCHIVED' || filters.status[0] === 'DELIVERING' || filters.status[0] === 'OUT_OF_BUDGET')
      ? filters.status[0]
      : filters.status && filters.status.length === 1 && filters.status[0] === 'ALL'
      ? 'ALL'
      : filters.delivery_status === undefined && (!filters.status || filters.status.length === 0)
      ? 'ALL'
      : 'DELIVERING');

  const handleStatusPillClick = (statusKey: string) => {
    if (statusKey === 'ALL') {
      updateFilters({ status: ['ALL'], delivery_status: undefined });
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

  if (!account && !accountLoading && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center font-mono">
        <div className="max-w-md w-full p-8 bg-white border border-slate-300 rounded-lg shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Connect Your Amazon Ads Account</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Link your Amazon India (Amazon.in) advertising account via Login with Amazon to monitor campaigns, manage bids, and analyze performance with real data.
          </p>
          <Link
            href="/connect-amazon"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#FF9900] hover:bg-[#e68a00] text-slate-900 font-bold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Connect your Amazon Ads account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-graph-paper-faint p-6 space-y-5 transition-all ${
        selectedIds.length > 0 ? 'pb-24' : ''
      }`}
    >
      {/* Re-auth Warning Banner */}
      {account?.connection_status === 'reauth_required' && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md flex items-center justify-between gap-3 text-xs font-mono text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Amazon Ads access expired. Please reconnect your account to resume syncing data.</span>
          </div>
          <Link
            href="/connect-amazon"
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shrink-0 transition-colors"
          >
            Reconnect
          </Link>
        </div>
      )}

      {/* Sync Failed Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-md flex items-center justify-between gap-3 text-xs font-mono text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-semibold">{error.message || 'Sync failed.'}</span>
              {account?.last_synced_at && (
                <span className="text-rose-700 ml-2">
                  (Last successful sync: {new Date(account.last_synced_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Retry sync
          </button>
        </div>
      )}

      {/* Syncing Running Banner */}
      {syncing && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md flex items-center gap-2.5 text-xs font-mono text-indigo-900 shadow-2xs">
          <RotateCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
          <span>Syncing your campaigns with Amazon Ads…</span>
        </div>
      )}
      {/* Top Header & Portfolio Rail */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 uppercase">
              Campaigns
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
              Sponsored Products (SP)
            </span>
            <span className="text-xs font-mono text-slate-500">
              ({num(totalCount)} {totalCount === 1 ? 'campaign' : 'campaigns'})
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Amazon Ads India (Amazon.in) Campaign Manager — Sponsored Products, Brands & Display
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {account?.last_synced_at ? (
              <span className="text-[11px] font-mono text-slate-500">
                Data as of {new Date(account.last_synced_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-400">Not synced yet</span>
            )}
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400 shrink-0" />
              Amazon Ads data may take 24–48 hours to fully attribute. Recent days are subject to change.
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* Sync Now Button */}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !account}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 transition-colors shadow-2xs text-slate-800 hover:text-slate-950 disabled:opacity-50 font-mono text-xs font-semibold"
            title="Sync account metrics with Amazon Ads"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{syncing ? 'Syncing with Amazon Ads...' : 'Sync Now'}</span>
          </button>

          {/* Show / Hide Chart Toggle */}
          <button
            type="button"
            onClick={toggleShowChart}
            className={`p-2 rounded-md border transition-colors shadow-2xs ${
              showChart
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
            }`}
            title={showChart ? 'Collapse performance chart' : 'Show performance chart'}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Primary Create Campaign Button */}
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create campaign</span>
          </Link>
        </div>
      </div>

      {/* Portfolio Switcher & Status Pills Rail */}
      <div className="bg-white border border-slate-300 rounded-md p-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-2xs">
        {/* Left: Quick Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL', label: 'All', count: statusCounts.ALL },
            { key: 'DELIVERING', label: 'Delivering', count: statusCounts.DELIVERING },
            { key: 'OUT_OF_BUDGET', label: 'Out of Budget', count: statusCounts.OUT_OF_BUDGET },
            { key: 'PAUSED', label: 'Paused', count: statusCounts.PAUSED },
            { key: 'ARCHIVED', label: 'Archived', count: statusCounts.ARCHIVED },
          ].map((pill) => {
            const isSelected = activeStatus === pill.key;
            const isOobWithCount = pill.key === 'OUT_OF_BUDGET' && (pill.count || 0) > 0;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => handleStatusPillClick(pill.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border border-indigo-600 font-semibold shadow-2xs'
                    : isOobWithCount
                    ? 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 font-semibold'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 hover:text-slate-950 font-medium'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[11px] tabular-nums ${
                    isSelected
                      ? 'bg-indigo-800 text-white font-bold'
                      : isOobWithCount
                      ? 'bg-red-200 text-red-900 font-bold'
                      : 'bg-slate-200 text-slate-800 font-semibold'
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
          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-700 font-semibold text-[11px] uppercase tracking-wider">Portfolio:</span>
          <select
            value={filters.portfolio || 'ALL'}
            onChange={(e) => handlePortfolioChange(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900 text-xs font-mono focus:border-indigo-600 focus:outline-hidden"
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

      {/* 8-Card Interactive KPI Ribbon - only show selection highlights when chart is visible */}
      <KpiCards
        summary={summaryData}
        totals={totals}
        loading={loading}
        selectedChartMetrics={showChart ? chartMetrics : []}
        onSelectMetric={showChart ? handleSelectMetric : undefined}
      />

      {/* Collapsible Dual-Axis Performance Chart */}
      {showChart && (
        <PerformanceChart
          summary={summaryData}
          loading={loading}
          granularity={granularity}
          onGranularityChange={setGranularity}
          selectedMetrics={chartMetrics}
          onSelectMetric={handleSelectMetric}
          endDate={dateRange.end}
          meta={meta}
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
        dateRange={dateRange}
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
      />
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
