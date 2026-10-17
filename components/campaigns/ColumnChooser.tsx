'use client';

import React, { useState, useEffect } from 'react';
import { Columns3, Check } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';

export type ColumnKey =
  | 'status'
  | 'health'
  | 'start_date'
  | 'end_date'
  | 'daily_budget'
  | 'targeting_type'
  | 'bidding_strategy'
  | 'impressions'
  | 'clicks'
  | 'ctr'
  | 'spend'
  | 'cpc'
  | 'orders'
  | 'sales'
  | 'acos'
  | 'roas'
  | 'budget_utilization';

export interface ColumnDef {
  key: ColumnKey;
  label: string;
}

export const ALL_COLUMNS: ColumnDef[] = [
  { key: 'status', label: 'Status' },
  { key: 'health', label: 'Health' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'daily_budget', label: 'Budget' },
  { key: 'targeting_type', label: 'Targeting' },
  { key: 'bidding_strategy', label: 'Strategy' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'ctr', label: 'CTR' },
  { key: 'spend', label: 'Spend' },
  { key: 'cpc', label: 'CPC' },
  { key: 'orders', label: 'Orders' },
  { key: 'sales', label: 'Sales' },
  { key: 'acos', label: 'ACOS' },
  { key: 'roas', label: 'ROAS' },
  { key: 'budget_utilization', label: 'Budget Util.' },
];

export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  'status',
  'health',
  'start_date',
  'daily_budget',
  'impressions',
  'clicks',
  'spend',
  'orders',
  'sales',
  'acos',
  'roas',
];

const STORAGE_KEY = 'ads_manager_visible_columns';

interface ColumnChooserProps {
  visibleColumns: ColumnKey[];
  onChange: (columns: ColumnKey[]) => void;
}

export function ColumnChooser({ visibleColumns, onChange }: ColumnChooserProps) {
  const [open, setOpen] = useState(false);

  const toggleColumn = (key: ColumnKey) => {
    if (visibleColumns.includes(key)) {
      if (visibleColumns.length > 1) {
        const next = visibleColumns.filter((c) => c !== key);
        onChange(next);
        saveColumns(next);
      }
    } else {
      const next = [...visibleColumns, key];
      onChange(next);
      saveColumns(next);
    }
  };

  const saveColumns = (cols: ColumnKey[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
    } catch {
      // ignore
    }
  };

  const resetDefaults = () => {
    onChange(DEFAULT_VISIBLE_COLUMNS);
    saveColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-text-main"
          title="Choose columns"
        >
          <Columns3 className="w-3.5 h-3.5 text-slate-500" />
          <span>Columns</span>
        </button>
      }
    >
      <div className="w-56 p-2 text-xs font-mono text-text-main max-h-80 overflow-y-auto">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border-dim">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Customize Columns
          </span>
          <button
            type="button"
            onClick={resetDefaults}
            className="text-[10px] text-primary hover:underline"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {ALL_COLUMNS.map((col) => {
            const checked = visibleColumns.includes(col.key);
            return (
              <label
                key={col.key}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className={checked ? 'font-medium' : 'text-slate-600'}>
                  {col.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </Popover>
  );
}
