'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Archive,
  IndianRupee,
  Percent,
  SlidersHorizontal,
  Download,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Popover } from '@/components/ui/Popover';
import { Modal } from '@/components/ui/Modal';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { PercentInput } from '@/components/ui/PercentInput';
import { money, pct, ratio, num } from '@/lib/format';
import type { CampaignItem } from '@/lib/types/campaign';

export interface BulkBarProps {
  selectedIds: number[];
  campaigns?: CampaignItem[];
  onAction: (
    ids: number[],
    action: string,
    value?: number | string,
    extra?: {
      placement?: 'TOP_OF_SEARCH' | 'PRODUCT_PAGES' | 'REST_OF_SEARCH';
      min_budget_floor?: number;
      max_budget_cap?: number;
    }
  ) => void;
  onClearSelection: () => void;
}

type BudgetMode =
  | 'BUDGET_SET'
  | 'BUDGET_INCREASE_PCT'
  | 'BUDGET_DECREASE_PCT'
  | 'BUDGET_INCREASE_AMT'
  | 'BUDGET_DECREASE_AMT';

export function BulkBar({
  selectedIds,
  campaigns = [],
  onAction,
  onClearSelection,
}: BulkBarProps) {
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('BUDGET_SET');
  const [budgetValue, setBudgetValue] = useState<number>(500);
  const [budgetFloor, setBudgetFloor] = useState<number>(100);
  const [budgetCap, setBudgetCap] = useState<number | undefined>(undefined);

  const [strategyPopoverOpen, setStrategyPopoverOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'DOWN_ONLY' | 'UP_AND_DOWN' | 'FIXED'>(
    'DOWN_ONLY'
  );

  const [placementPopoverOpen, setPlacementPopoverOpen] = useState(false);
  const [placementTarget, setPlacementTarget] = useState<
    'TOP_OF_SEARCH' | 'PRODUCT_PAGES' | 'REST_OF_SEARCH'
  >('TOP_OF_SEARCH');
  const [placementModifier, setPlacementModifier] = useState<number>(50);

  if (selectedIds.length === 0) return null;

  const handleApplyBudget = () => {
    onAction(selectedIds, budgetMode, budgetValue, {
      min_budget_floor: budgetFloor || 100,
      max_budget_cap: budgetCap,
    });
    setBudgetModalOpen(false);
  };

  const handleApplyStrategy = () => {
    onAction(selectedIds, 'SET_BIDDING_STRATEGY', selectedStrategy);
    setStrategyPopoverOpen(false);
  };

  const handleApplyPlacement = () => {
    onAction(selectedIds, 'SET_PLACEMENT_PCT', placementModifier, {
      placement: placementTarget,
    });
    setPlacementPopoverOpen(false);
  };

  const handleExportSelectedCsv = () => {
    const selectedRows = campaigns.filter((c) => selectedIds.includes(c.id));
    if (selectedRows.length === 0) return;

    const headers = [
      'Campaign ID',
      'Name',
      'State',
      'Delivery Status',
      'Daily Budget (INR)',
      'Spend (INR)',
      'Sales (INR)',
      'Orders',
      'Clicks',
      'Impressions',
      'CTR (%)',
      'CPC (INR)',
      'ACOS (%)',
      'ROAS',
      'Bidding Strategy',
      'Top of Search (%)',
      'Product Pages (%)',
    ];

    const rows = selectedRows.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.state,
      c.delivery_status || 'DELIVERING',
      c.daily_budget,
      c.spend,
      c.sales,
      c.orders,
      c.clicks,
      c.impressions,
      c.ctr !== null && c.ctr !== undefined ? c.ctr.toFixed(2) : '',
      c.cpc !== null && c.cpc !== undefined ? c.cpc.toFixed(2) : '',
      c.acos_is_infinite ? 'INF' : c.acos !== null && c.acos !== undefined ? c.acos.toFixed(2) : '',
      c.roas !== null && c.roas !== undefined ? c.roas.toFixed(2) : '',
      c.bidding_strategy || '',
      c.placement_top_of_search_pct ?? 0,
      c.placement_product_pages_pct ?? 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `selected_campaigns_inr_${selectedIds.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white border border-slate-700 rounded-md shadow-xl px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[calc(100vw-1.5rem)] overflow-x-auto">
        <span className="font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-700 px-2 py-0.5 rounded">
          {num(selectedIds.length)} selected
        </span>

        <div className="h-4 w-px bg-slate-700" />

        {/* Enable */}
        <button
          type="button"
          onClick={() => onAction(selectedIds, 'ENABLE')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title="Enable selected campaigns"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>Enable</span>
        </button>

        {/* Pause */}
        <button
          type="button"
          onClick={() => onAction(selectedIds, 'PAUSE')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title="Pause selected campaigns"
        >
          <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Pause</span>
        </button>

        {/* Adjust Budget */}
        <button
          type="button"
          onClick={() => setBudgetModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title="Bulk adjust daily budget"
        >
          <IndianRupee className="w-3.5 h-3.5 text-indigo-300" />
          <span>Adjust Budget</span>
        </button>

        {/* Change Bidding Strategy */}
        <Popover
          open={strategyPopoverOpen}
          onOpenChange={setStrategyPopoverOpen}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="Change bidding strategy"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-300" />
              <span>Strategy</span>
            </button>
          }
        >
          <div className="w-56 p-3 text-xs font-mono space-y-2.5 bg-white text-slate-900">
            <div className="font-bold uppercase tracking-wider text-[11px] text-slate-700 pb-1 border-b border-slate-200">
              Bidding Strategy
            </div>
            <div className="space-y-1.5">
              {[
                { value: 'DOWN_ONLY', label: 'Dynamic bids - down only' },
                { value: 'UP_AND_DOWN', label: 'Dynamic bids - up and down' },
                { value: 'FIXED', label: 'Fixed bids' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="strategy_radio"
                    checked={selectedStrategy === opt.value}
                    onChange={() => setSelectedStrategy(opt.value as any)}
                    className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="text-[11px] text-slate-800 font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStrategyPopoverOpen(false)}
                className="px-2 py-1 border border-slate-300 rounded text-[11px] text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyStrategy}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </Popover>

        {/* Adjust Placement % */}
        <Popover
          open={placementPopoverOpen}
          onOpenChange={setPlacementPopoverOpen}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="Adjust placement bid multiplier"
            >
              <Percent className="w-3.5 h-3.5 text-indigo-300" />
              <span>Placement %</span>
            </button>
          }
        >
          <div className="w-64 p-3 text-xs font-mono space-y-2.5 bg-white text-slate-900">
            <div className="font-bold uppercase tracking-wider text-[11px] text-slate-700 pb-1 border-b border-slate-200">
              Placement Multiplier
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">Placement</label>
              <select
                value={placementTarget}
                onChange={(e) => setPlacementTarget(e.target.value as any)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
              >
                <option value="TOP_OF_SEARCH">Top of search (first page)</option>
                <option value="PRODUCT_PAGES">Product pages</option>
                <option value="REST_OF_SEARCH">Rest of search</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">Modifier (0% to 900%)</label>
              <PercentInput
                value={placementModifier}
                onChange={(val) => setPlacementModifier(val ?? 0)}
                min={0}
                max={900}
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPlacementPopoverOpen(false)}
                className="px-2 py-1 border border-slate-300 rounded text-[11px] text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPlacement}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </Popover>

        {/* Export CSV */}
        <button
          type="button"
          onClick={handleExportSelectedCsv}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title="Export selected as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          <span>Export CSV</span>
        </button>

        {/* Archive */}
        <button
          type="button"
          onClick={() => setArchiveConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-red-950 text-red-200 border border-red-700 hover:bg-red-900 text-xs font-medium transition-colors cursor-pointer"
          title="Archive selected campaigns"
        >
          <Archive className="w-3.5 h-3.5 text-red-400" />
          <span>Archive</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          title="Deselect all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Adjust Budget Modal */}
      <Modal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={`Adjust Daily Budget (${num(selectedIds.length)} campaigns)`}
      >
        <div className="space-y-4 font-mono text-xs text-text-main">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
              Adjustment Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'BUDGET_SET', label: 'Set new fixed budget (₹)' },
                { id: 'BUDGET_INCREASE_PCT', label: 'Increase by percentage (%)' },
                { id: 'BUDGET_DECREASE_PCT', label: 'Decrease by percentage (%)' },
                { id: 'BUDGET_INCREASE_AMT', label: 'Increase by amount (₹)' },
                { id: 'BUDGET_DECREASE_AMT', label: 'Decrease by amount (₹)' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                    budgetMode === opt.id
                      ? 'border-primary bg-primary/5 font-semibold text-slate-900'
                      : 'border-border-dim hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulk_budget_mode"
                    checked={budgetMode === opt.id}
                    onChange={() => setBudgetMode(opt.id as BudgetMode)}
                    className="text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="text-[11px]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
              {budgetMode.includes('PCT') ? 'Percentage (%)' : 'Amount (₹)'}
            </label>
            {budgetMode.includes('PCT') ? (
              <PercentInput
                value={budgetValue}
                onChange={(val) => setBudgetValue(val ?? 10)}
                min={1}
                max={500}
              />
            ) : (
              <MoneyInput
                value={budgetValue}
                onChange={(val) => setBudgetValue(val || 100)}
                symbol="₹"
                min={budgetMode === 'BUDGET_SET' ? 100 : 1}
                helperText={budgetMode === 'BUDGET_SET' ? 'Min daily budget is ₹100.00' : undefined}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-dim">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Minimum Budget Floor (₹)
              </label>
              <MoneyInput
                value={budgetFloor}
                onChange={(val) => setBudgetFloor(val || 100)}
                symbol="₹"
                min={100}
                helperText="Floor: ₹100.00"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Maximum Budget Cap (₹, optional)
              </label>
              <MoneyInput
                value={budgetCap ?? null}
                onChange={(val) => setBudgetCap(val ?? undefined)}
                symbol="₹"
                placeholder="No ceiling"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-dim">
            <button
              type="button"
              onClick={() => setBudgetModalOpen(false)}
              className="px-3 py-1.5 border border-border-dim rounded text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyBudget}
              className="px-4 py-1.5 bg-primary text-white rounded text-xs font-medium shadow-xs hover:bg-indigo-700"
            >
              Apply Budget Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveConfirmOpen}
        title={`Archive ${num(selectedIds.length)} Campaigns?`}
        description="Archiving is permanent and cannot be undone. All selected campaigns will permanently stop ad delivery and cannot be re-enabled."
        confirmLabel="Archive Permanently"
        variant="destructive"
        onConfirm={() => {
          setArchiveConfirmOpen(false);
          onAction(selectedIds, 'ARCHIVE');
        }}
        onCancel={() => setArchiveConfirmOpen(false)}
      />
    </>
  );
}

export default BulkBar;
