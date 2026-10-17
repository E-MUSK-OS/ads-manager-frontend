'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';
import { useCampaignList } from '@/components/campaigns/useCampaignList';
import { DateRangePicker } from '@/components/campaigns/DateRangePicker';
import { FilterBar } from '@/components/campaigns/FilterBar';
import { KpiCards } from '@/components/campaigns/KpiCards';
import { PerformanceChart } from '@/components/campaigns/PerformanceChart';
import { CampaignTable } from '@/components/campaigns/CampaignTable';
import { AlertSettingsDialog } from '@/components/campaigns/AlertSettingsDialog';

const CHART_COLLAPSE_STORAGE_KEY = 'ads_manager_chart_collapsed';

function CampaignsPageContent() {
  const {
    account,
    rules,
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
    refetch,
    handleSync,
    handleUpdateStatus,
    handleUpdateBudget,
    handleDuplicate,
    handleBulkAction,
  } = useCampaignList();

  const [showChart, setShowChart] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(CHART_COLLAPSE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const toggleShowChart = () => {
    setShowChart((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CHART_COLLAPSE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-graph-paper-faint p-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 uppercase">
              Campaigns
            </h1>
            <span className="text-xs font-mono text-slate-500">
              ({totalCount} {totalCount === 1 ? 'campaign' : 'campaigns'})
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Sponsored Products performance, targeting, and budget optimization
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

          {/* Alerts Dialog */}
          <AlertSettingsDialog alerts={alerts} onSettingsSaved={refetch} />

          {/* Settings Link */}
          <Link
            href="/campaigns/settings"
            className="p-2 rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-slate-600 hover:text-slate-900"
            title="Campaign settings & health rules"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Primary Create Campaign Button */}
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-indigo-800 text-white font-mono text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create campaign</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* KPI Cards */}
      <KpiCards summary={summaryData} totals={totals} loading={loading} />

      {/* Collapsible Performance Chart */}
      {showChart && (
        <PerformanceChart
          summary={summaryData}
          loading={loading}
          granularity={granularity}
          onGranularityChange={setGranularity}
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
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={(field, dir) => {
          setSortField(field);
          setSortDir(dir);
        }}
        onFilterChange={setFilters}
        onUpdateStatus={handleUpdateStatus}
        onUpdateBudget={handleUpdateBudget}
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
          Loading campaigns...
        </div>
      }
    >
      <CampaignsPageContent />
    </Suspense>
  );
}