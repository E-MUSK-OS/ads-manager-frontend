'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ExternalLink,
  Filter,
  History,
  Loader2,
  Search,
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

type SortField = 'spend' | 'orders' | 'acos' | 'label' | 'campaign' | 'is_new' | 'delta';
type SortDirection = 'asc' | 'desc';

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

  // Filters & Search (Reference Tool Parity)
  const [searchQuery, setSearchQuery] = useState('');
  const [paramFilter, setParamFilter] = useState<'ALL' | 'CAMPAIGN' | 'TARGETING' | 'SEARCH_TERM'>('ALL');

  // Q20: Default ranking by spend at stake (window spend) descending
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleClose = () => {
    setBatchResults(null);
    setSearchQuery('');
    setParamFilter('ALL');
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
        if (r1.conflicts_with && r1.conflicts_with.includes(r2.id)) {
          conflicts.push({ r1, r2 });
        }
      }
    }
    return conflicts;
  }, [activeRecs]);

  const hasConflicts = activeConflicts.length > 0;

  // Filter items based on in-modal search and parameter filter
  const filteredRecs = useMemo(() => {
    return selectedRecs.filter((rec) => {
      if (paramFilter !== 'ALL' && rec.affected_parameter !== paramFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLabel = rec.entity_label?.toLowerCase().includes(q);
        const matchCamp = rec.campaign_name?.toLowerCase().includes(q);
        const matchAg = rec.ad_group_name?.toLowerCase().includes(q);
        const matchRule = rec.rule_name?.toLowerCase().includes(q);
        if (!matchLabel && !matchCamp && !matchAg && !matchRule) {
          return false;
        }
      }
      return true;
    });
  }, [selectedRecs, paramFilter, searchQuery]);

  // Sort items (Q20: Default ranking by spend at stake)
  const sortedRecs = useMemo(() => {
    return [...filteredRecs].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      const metricsA = a.evidence?.metrics || {};
      const metricsB = b.evidence?.metrics || {};

      switch (sortField) {
        case 'spend':
          valA = Number(metricsA.spend ?? 0);
          valB = Number(metricsB.spend ?? 0);
          break;
        case 'orders':
          valA = Number(metricsA.orders ?? 0);
          valB = Number(metricsB.orders ?? 0);
          break;
        case 'acos':
          valA = metricsA.acos !== null && metricsA.acos !== undefined ? Number(metricsA.acos) : -1;
          valB = metricsB.acos !== null && metricsB.acos !== undefined ? Number(metricsB.acos) : -1;
          break;
        case 'label':
          valA = (a.entity_label || '').toLowerCase();
          valB = (b.entity_label || '').toLowerCase();
          break;
        case 'campaign':
          valA = (a.campaign_name || '').toLowerCase();
          valB = (b.campaign_name || '').toLowerCase();
          break;
        case 'is_new':
          valA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valB = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'delta': {
          const actA = a.suggested_actions?.[0];
          const actB = b.suggested_actions?.[0];
          valA = actA && actA.to !== undefined && actA.from !== undefined ? Number(actA.to) - Number(actA.from) : 0;
          valB = actB && actB.to !== undefined && actB.from !== undefined ? Number(actB.to) - Number(actB.from) : 0;
          break;
        }
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'spend' || field === 'orders' || field === 'acos' ? 'desc' : 'asc');
    }
  };

  // Q15 Impact calculations for active recommendations (real figures only, no sales/savings predictions)
  const impactSummary = useMemo(() => {
    let totalSpend = 0;
    let totalOrders = 0;
    let totalBudgetDelta = 0;
    let totalBleeding30d = 0;
    let bleedingCount = 0;

    activeRecs.forEach((r) => {
      const metrics = r.evidence?.metrics || {};
      const spend = Number(metrics.spend ?? 0);
      const orders = Number(metrics.orders ?? 0);
      const days = r.evidence?.date_window?.days || 7;

      totalSpend += spend;
      totalOrders += orders;

      // Bleeding rules (orders <= 0 with spend > 0)
      if (orders <= 0 && spend > 0) {
        bleedingCount += 1;
        totalBleeding30d += (spend / days) * 30;
      }

      // Budget rules delta
      const firstAction = r.suggested_actions?.[0];
      if (firstAction && (firstAction.type === 'INCREASE_BUDGET' || firstAction.type === 'DECREASE_BUDGET' || firstAction.type === 'SET_BUDGET')) {
        const fromVal = firstAction.from !== undefined ? Number(firstAction.from) : Number(r.evidence?.current?.daily_budget ?? 0);
        const toVal = firstAction.to !== undefined ? Number(firstAction.to) : fromVal;
        totalBudgetDelta += (toVal - fromVal);
      }
    });

    return {
      totalSpend,
      totalOrders,
      totalBudgetDelta,
      totalBleeding30d,
      bleedingCount,
    };
  }, [activeRecs]);

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

  const allFilteredSelected =
    filteredRecs.length > 0 && filteredRecs.every((r) => activeIds.has(r.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setActiveIds((prev) => {
        const next = new Set(prev);
        filteredRecs.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setActiveIds((prev) => {
        const next = new Set(prev);
        filteredRecs.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-3 inline-block ml-0.5 text-primary" />
    ) : (
      <ArrowDown className="size-3 inline-block ml-0.5 text-primary" />
    );
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
          <div className="flex flex-col gap-3.5 text-xs">
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

            {/* Q15: Real figures Impact & Totals Card */}
            <div className="p-3 rounded-lg bg-slate-50 border border-border-dim flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-main uppercase tracking-wider">
                  Selection Summary & Historical Impact
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {activeRecs.length} of {selectedRecs.length} items active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                <div className="p-2 rounded bg-white border border-border-dim flex flex-col">
                  <span className="text-[10px] font-sans text-slate-500">Spend at Stake</span>
                  <span className="text-sm font-bold text-text-main">
                    {currencySymbol}{impactSummary.totalSpend.toFixed(2)}
                  </span>
                </div>

                <div className="p-2 rounded bg-white border border-border-dim flex flex-col">
                  <span className="text-[10px] font-sans text-slate-500">Purchases (7d)</span>
                  <span className="text-sm font-bold text-text-main">
                    {impactSummary.totalOrders}
                  </span>
                </div>

                <div className="p-2 rounded bg-white border border-border-dim flex flex-col">
                  <span className="text-[10px] font-sans text-slate-500">Net Daily Budget Delta</span>
                  <span className={`text-sm font-bold ${impactSummary.totalBudgetDelta > 0 ? 'text-primary' : impactSummary.totalBudgetDelta < 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {impactSummary.totalBudgetDelta > 0 ? '+' : impactSummary.totalBudgetDelta < 0 ? '-' : ''}{currencySymbol}{Math.abs(impactSummary.totalBudgetDelta).toFixed(2)}/day
                  </span>
                </div>

                <div className="p-2 rounded bg-white border border-border-dim flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans text-slate-500">Bleeding 30d Run-Rate</span>
                    <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-sans font-semibold">Estimate</span>
                  </div>
                  <span className="text-sm font-bold text-rose-700">
                    {currencySymbol}{impactSummary.totalBleeding30d.toFixed(2)}
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 italic">
                * Note: 30-day bleeding spend is a labelled estimate calculated strictly from window spend rates for zero-order items. No sales or savings predictions.
              </span>
            </div>

            {/* Search and Filters Bar (Reference Tool Parity) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setParamFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    paramFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({selectedRecs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setParamFilter('CAMPAIGN')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    paramFilter === 'CAMPAIGN'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Campaigns ({selectedRecs.filter((r) => r.affected_parameter === 'CAMPAIGN').length})
                </button>
                <button
                  type="button"
                  onClick={() => setParamFilter('TARGETING')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    paramFilter === 'TARGETING'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Targeting ({selectedRecs.filter((r) => r.affected_parameter === 'TARGETING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setParamFilter('SEARCH_TERM')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    paramFilter === 'SEARCH_TERM'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Search Terms ({selectedRecs.filter((r) => r.affected_parameter === 'SEARCH_TERM').length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search target, campaign, rule..."
                  className="w-full pl-8 pr-3 py-1 text-[11px] rounded border border-border-dim bg-white text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Table of selected recommendations */}
            <div className="overflow-x-auto border border-border-dim rounded-lg max-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border-dim text-[11px] font-semibold text-text-muted sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        className="rounded border-border-dim text-primary size-3.5"
                        aria-label="Select all"
                      />
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('is_new')}
                    >
                      <span>Tag</span>
                      {getSortIcon('is_new')}
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('campaign')}
                    >
                      <span>Campaign</span>
                      {getSortIcon('campaign')}
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('label')}
                    >
                      <span>Target + Ad Group</span>
                      {getSortIcon('label')}
                    </th>
                    <th className="p-2.5">Match Type</th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('delta')}
                    >
                      <span>Proposed Change</span>
                      {getSortIcon('delta')}
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('spend')}
                    >
                      <span>Spend</span>
                      {getSortIcon('spend')}
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('orders')}
                    >
                      <span>Purchases (7d)</span>
                      {getSortIcon('orders')}
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:text-text-main"
                      onClick={() => handleSort('acos')}
                    >
                      <span>ACOS</span>
                      {getSortIcon('acos')}
                    </th>
                    <th className="p-2.5">Impact (Q15)</th>
                    <th className="p-2.5 text-right">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {sortedRecs.map((rec) => {
                    const isChecked = activeIds.has(rec.id);
                    const metrics = rec.evidence?.metrics || {};
                    const spend = Number(metrics.spend ?? 0);
                    const orders = Number(metrics.orders ?? 0);
                    const days = rec.evidence?.date_window?.days || 7;
                    const confidence = rec.evidence?.confidence;
                    const hasConflict = rec.conflicts_with && rec.conflicts_with.some((id) => activeIds.has(id));

                    // NEW vs OLD tag
                    const isNew = rec.created_at && (Date.now() - new Date(rec.created_at).getTime() < 24 * 3600 * 1000);

                    // Match type
                    const matchType: string = String(
                      rec.evidence?.current?.match_type ||
                      rec.suggested_actions?.[0]?.params?.match_type ||
                      (rec.affected_parameter === 'SEARCH_TERM' ? 'SEARCH TERM' : rec.affected_parameter === 'CAMPAIGN' ? 'SP' : 'EXACT')
                    );

                    // Estimate 30d bleeding spend for zero-order rules
                    const isBleedingZeroOrders = orders <= 0 && spend > 0;
                    const bleedingEstimate30d = (spend / days) * 30;

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

                        {/* NEW / OLD Tag */}
                        <td className="p-2.5 align-top">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              isNew
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isNew ? 'NEW' : 'OLD'}
                          </span>
                        </td>

                        {/* Campaign */}
                        <td className="p-2.5 align-top max-w-[150px]">
                          <Link
                            href={`/campaigns/${rec.campaign_id}`}
                            target="_blank"
                            className="font-medium text-text-main text-[11px] hover:text-primary hover:underline truncate block"
                          >
                            {rec.campaign_name || `Campaign #${rec.campaign_id}`}
                          </Link>
                        </td>

                        {/* Target + Ad Group */}
                        <td className="p-2.5 align-top max-w-[180px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-text-main text-xs truncate">
                              {rec.entity_type === 'search_term' ? `"${rec.entity_label}"` : rec.entity_label}
                            </span>
                            {rec.ad_group_name && (
                              <span className="text-[10px] text-slate-400 truncate">
                                Ad group: {rec.ad_group_name}
                              </span>
                            )}
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700 w-fit truncate max-w-[160px]">
                              {rec.rule_name}
                            </span>
                          </div>
                        </td>

                        {/* Match Type */}
                        <td className="p-2.5 align-top">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {matchType}
                          </span>
                        </td>

                        {/* Proposed Change (Current -> Proposed) */}
                        <td className="p-2.5 align-top">
                          <div className="flex flex-col gap-1">
                            {rec.suggested_actions.map((act, i) => {
                              const desc = describeRecommendationAction(act, rec, currencySymbol);
                              const isBid = act.type.toLowerCase().includes('bid');
                              const isBudget = act.type.toLowerCase().includes('budget');
                              const fromVal = act.from !== undefined ? act.from : rec.evidence?.current?.[isBid ? 'bid' : 'daily_budget'];
                              const toVal = act.to !== undefined ? act.to : null;

                              return (
                                <div key={i} className="flex flex-col gap-0.5">
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

                                  {/* Delta line */}
                                  {fromVal !== null && fromVal !== undefined && toVal !== null && (isBid || isBudget) && (() => {
                                    const diff = Number(toVal) - Number(fromVal);
                                    const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
                                    return (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Delta: {sign}{currencySymbol}{Math.abs(diff).toFixed(2)}
                                      </span>
                                    );
                                  })()}
                                </div>
                              );
                            })}

                            {hasConflict && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                                <AlertTriangle className="size-3 shrink-0" />
                                <span>Conflict</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Spend */}
                        <td className="p-2.5 align-top font-mono font-medium text-text-main whitespace-nowrap">
                          {currencySymbol}{spend.toFixed(2)}
                        </td>

                        {/* Purchases (7d) */}
                        <td className="p-2.5 align-top font-mono font-medium text-text-main">
                          {orders}
                        </td>

                        {/* ACOS */}
                        <td className="p-2.5 align-top font-mono font-medium text-text-main">
                          {metrics.acos !== undefined && metrics.acos !== null
                            ? `${Number(metrics.acos).toFixed(1)}%`
                            : '—'}
                        </td>

                        {/* Q15 Impact column */}
                        <td className="p-2.5 align-top text-[10px] font-mono max-w-[150px]">
                          {isBleedingZeroOrders ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-rose-700 font-semibold">
                                Spend at this rate: {currencySymbol}{bleedingEstimate30d.toFixed(2)} per 30 days
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-sans font-semibold w-fit">
                                Estimate
                              </span>
                            </div>
                          ) : rec.suggested_actions?.[0]?.type?.includes('BUDGET') ? (() => {
                            const bDelta = Number(rec.suggested_actions[0].to) - Number(rec.suggested_actions[0].from);
                            const sign = bDelta > 0 ? '+' : bDelta < 0 ? '-' : '';
                            return (
                              <span className="text-slate-600">
                                Budget delta: {sign}{currencySymbol}{Math.abs(bDelta).toFixed(2)}/day
                              </span>
                            );
                          })() : (
                            <span className="text-slate-400">—</span>
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
