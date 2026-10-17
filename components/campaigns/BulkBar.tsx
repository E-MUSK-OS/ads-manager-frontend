'use client';

import React, { useState } from 'react';
import { Play, Pause, Archive, DollarSign, Percent, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Popover } from '@/components/ui/Popover';
import { useActiveAccount } from '@/lib/useActiveAccount';

interface BulkBarProps {
  selectedIds: number[];
  onAction: (ids: number[], action: string, value?: number) => void;
  onClearSelection: () => void;
}

export function BulkBar({ selectedIds, onAction, onClearSelection }: BulkBarProps) {
  const { rules } = useActiveAccount();
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [budgetPopoverOpen, setBudgetPopoverOpen] = useState(false);
  const [budgetValue, setBudgetValue] = useState<string>('');
  const [adjustPopoverOpen, setAdjustPopoverOpen] = useState(false);
  const [adjustPct, setAdjustPct] = useState<string>('');

  if (selectedIds.length === 0) return null;

  const handleSetBudget = () => {
    const num = Number(budgetValue);
    if (!isNaN(num) && num > 0) {
      onAction(selectedIds, 'SET_BUDGET', num);
      setBudgetPopoverOpen(false);
      setBudgetValue('');
    }
  };

  const handleAdjustBudget = () => {
    const num = Number(adjustPct);
    if (!isNaN(num) && num !== 0) {
      onAction(selectedIds, 'ADJUST_BUDGET_PCT', num);
      setAdjustPopoverOpen(false);
      setAdjustPct('');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface border border-border-dim rounded-md shadow-lg px-4 py-2.5 flex items-center gap-3 text-xs font-mono text-text-main animate-in fade-in slide-in-from-bottom-2 duration-150">
      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
        {selectedIds.length} selected
      </span>

      <div className="h-4 w-px bg-border-dim" />

      {/* Enable */}
      <button
        type="button"
        onClick={() => onAction(selectedIds, 'ENABLE')}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700"
      >
        <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
        <span>Enable</span>
      </button>

      {/* Pause */}
      <button
        type="button"
        onClick={() => onAction(selectedIds, 'PAUSE')}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700"
      >
        <Pause className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
        <span>Pause</span>
      </button>

      {/* Set Budget Popover */}
      <Popover
        open={budgetPopoverOpen}
        onOpenChange={setBudgetPopoverOpen}
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700"
          >
            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
            <span>Set Budget</span>
          </button>
        }
      >
        <div className="w-48 p-2.5 text-xs font-mono">
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
            New Daily Budget ({rules?.symbol || '$'})
          </label>
          <input
            type="number"
            min={rules?.min_budget || 1}
            step="any"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            className="w-full px-2 py-1 border border-border-dim rounded mb-2 text-xs"
            placeholder={`Min ${rules?.symbol || '$'}${rules?.min_budget || 1}`}
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setBudgetPopoverOpen(false)}
              className="px-2 py-1 border rounded text-[11px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSetBudget}
              disabled={!budgetValue || Number(budgetValue) <= 0}
              className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </Popover>

      {/* Adjust Budget % Popover */}
      <Popover
        open={adjustPopoverOpen}
        onOpenChange={setAdjustPopoverOpen}
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700"
          >
            <Percent className="w-3.5 h-3.5 text-slate-500" />
            <span>Change %</span>
          </button>
        }
      >
        <div className="w-48 p-2.5 text-xs font-mono">
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
            Adjust Budget % (e.g. +10 or -15)
          </label>
          <input
            type="number"
            value={adjustPct}
            onChange={(e) => setAdjustPct(e.target.value)}
            className="w-full px-2 py-1 border border-border-dim rounded mb-2 text-xs"
            placeholder="+10"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAdjustPopoverOpen(false)}
              className="px-2 py-1 border rounded text-[11px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdjustBudget}
              disabled={!adjustPct || Number(adjustPct) === 0}
              className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </Popover>

      {/* Archive */}
      <button
        type="button"
        onClick={() => setArchiveConfirmOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-100 text-spend"
      >
        <Archive className="w-3.5 h-3.5" />
        <span>Archive</span>
      </button>

      <div className="h-4 w-px bg-border-dim" />

      {/* Clear selection */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 text-slate-400 hover:text-slate-600 rounded"
        title="Deselect all"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Archive selected campaigns?"
        description={`Are you sure you want to archive ${selectedIds.length} campaigns? This action cannot be undone.`}
        confirmLabel="Archive campaigns"
        destructive
        onConfirm={() => {
          onAction(selectedIds, 'ARCHIVE');
          setArchiveConfirmOpen(false);
        }}
      />
    </div>
  );
}
