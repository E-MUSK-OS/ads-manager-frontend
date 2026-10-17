'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, Plus, ChevronDown, Bookmark, Check } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import type { FilterState } from './useCampaignList';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onFilterPreset?: (preset: string) => void;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
}

const STORAGE_KEY = 'ads_manager_saved_filters';

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load saved filters
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedFilters(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const handleSaveFilter = () => {
    if (!saveName.trim()) return;
    const newSaved: SavedFilter = {
      id: Date.now().toString(),
      name: saveName.trim(),
      filters: { ...filters },
    };
    const updated = [...savedFilters, newSaved];
    setSavedFilters(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSaveName('');
    setSaveModalOpen(false);
  };

  const handleApplySavedFilter = (sf: SavedFilter) => {
    onChange(sf.filters);
  };

  const handleDeleteSavedFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAll = () => {
    onChange({
      status: [],
      health: [],
      targeting_type: [],
      search: filters.search,
    });
  };

  // Quick filters
  const applyQuickFilter = (type: 'leak' | 'scale' | 'budget_limited') => {
    if (type === 'leak') {
      onChange({
        ...filters,
        health: filters.health.includes('BUDGET_LEAK')
          ? filters.health.filter((h) => h !== 'BUDGET_LEAK')
          : [...filters.health, 'BUDGET_LEAK'],
      });
    } else if (type === 'scale') {
      onChange({
        ...filters,
        health: filters.health.includes('SCALE')
          ? filters.health.filter((h) => h !== 'SCALE')
          : [...filters.health, 'SCALE'],
      });
    } else if (type === 'budget_limited') {
      onChange({
        ...filters,
        min_utilization: filters.min_utilization === 90 ? undefined : 90,
      });
    }
  };

  // Helper for numeric chip
  const renderNumericChip = (
    label: string,
    minKey: keyof FilterState,
    maxKey: keyof FilterState,
    unit = ''
  ) => {
    const minVal = filters[minKey];
    const maxVal = filters[maxKey];
    if (minVal === undefined && maxVal === undefined) return null;

    let text = `${label}: `;
    if (minVal !== undefined && maxVal !== undefined) {
      text += `${unit}${minVal} – ${unit}${maxVal}`;
    } else if (minVal !== undefined) {
      text += `≥ ${unit}${minVal}`;
    } else {
      text += `≤ ${unit}${maxVal}`;
    }

    return (
      <span
        key={label}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-surface border border-border-dim text-text-main shadow-2xs"
      >
        <span>{text}</span>
        <button
          type="button"
          onClick={() => onChange({ ...filters, [minKey]: undefined, [maxKey]: undefined })}
          className="text-slate-400 hover:text-slate-600 ml-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  };

  // Helper for array chip
  const renderArrayChip = (label: string, key: 'status' | 'health' | 'targeting_type') => {
    const arr = filters[key];
    if (!arr || arr.length === 0) return null;

    return (
      <span
        key={label}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-surface border border-border-dim text-text-main shadow-2xs"
      >
        <span>
          {label}: {arr.join(', ')}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...filters, [key]: [] })}
          className="text-slate-400 hover:text-slate-600 ml-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Main "Filter by" Popover */}
        <Popover
          open={activePopover === 'main'}
          onOpenChange={(open) => setActivePopover(open ? 'main' : null)}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-text-main"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter by</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          }
        >
          <div className="w-56 p-2 text-xs font-mono text-text-main flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1">
              Select Field
            </span>
            {[
              { id: 'status', label: 'Status' },
              { id: 'health', label: 'Health' },
              { id: 'targeting_type', label: 'Targeting Type' },
              { id: 'budget', label: 'Budget' },
              { id: 'spend', label: 'Spend' },
              { id: 'sales', label: 'Sales' },
              { id: 'orders', label: 'Orders' },
              { id: 'clicks', label: 'Clicks' },
              { id: 'impressions', label: 'Impressions' },
              { id: 'cpc', label: 'CPC' },
              { id: 'acos', label: 'ACOS' },
              { id: 'roas', label: 'ROAS' },
              { id: 'utilization', label: 'Time in Budget (%)' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActivePopover(f.id)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between"
              >
                <span>{f.label}</span>
                <span className="text-slate-400">›</span>
              </button>
            ))}

            {savedFilters.length > 0 && (
              <>
                <div className="h-px bg-border-dim my-1" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1">
                  Saved Filters
                </span>
                {savedFilters.map((sf) => (
                  <div
                    key={sf.id}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleApplySavedFilter(sf);
                        setActivePopover(null);
                      }}
                      className="text-left flex-1 truncate"
                    >
                      {sf.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </Popover>

        {/* Status Popover */}
        <Popover
          open={activePopover === 'status'}
          onOpenChange={(open) => setActivePopover(open ? 'status' : null)}
          trigger={<span className="hidden" />}
        >
          <div className="w-48 p-3 text-xs font-mono">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-medium">
              Status Filter
            </span>
            {['ENABLED', 'PAUSED', 'ARCHIVED'].map((st) => (
              <label key={st} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.status.includes(st)}
                  onChange={(e) => {
                    const newStatus = e.target.checked
                      ? [...filters.status, st]
                      : filters.status.filter((s) => s !== st);
                    onChange({ ...filters, status: newStatus });
                  }}
                  className="rounded border-border-dim text-primary focus:ring-primary"
                />
                <span>{st}</span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setActivePopover(null)}
              className="mt-2 w-full py-1 bg-primary text-white text-xs rounded text-center"
            >
              Done
            </button>
          </div>
        </Popover>

        {/* Health Popover */}
        <Popover
          open={activePopover === 'health'}
          onOpenChange={(open) => setActivePopover(open ? 'health' : null)}
          trigger={<span className="hidden" />}
        >
          <div className="w-48 p-3 text-xs font-mono">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-medium">
              Health Status
            </span>
            {['LEARNING', 'BUDGET_LEAK', 'SCALE', 'HEALTHY'].map((h) => (
              <label key={h} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.health.includes(h)}
                  onChange={(e) => {
                    const newHealth = e.target.checked
                      ? [...filters.health, h]
                      : filters.health.filter((x) => x !== h);
                    onChange({ ...filters, health: newHealth });
                  }}
                  className="rounded border-border-dim text-primary focus:ring-primary"
                />
                <span>{h}</span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setActivePopover(null)}
              className="mt-2 w-full py-1 bg-primary text-white text-xs rounded text-center"
            >
              Done
            </button>
          </div>
        </Popover>

        {/* Targeting Popover */}
        <Popover
          open={activePopover === 'targeting_type'}
          onOpenChange={(open) => setActivePopover(open ? 'targeting_type' : null)}
          trigger={<span className="hidden" />}
        >
          <div className="w-48 p-3 text-xs font-mono">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-medium">
              Targeting Type
            </span>
            {['AUTO', 'MANUAL'].map((t) => (
              <label key={t} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.targeting_type.includes(t)}
                  onChange={(e) => {
                    const newTargeting = e.target.checked
                      ? [...filters.targeting_type, t]
                      : filters.targeting_type.filter((x) => x !== t);
                    onChange({ ...filters, targeting_type: newTargeting });
                  }}
                  className="rounded border-border-dim text-primary focus:ring-primary"
                />
                <span>{t}</span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setActivePopover(null)}
              className="mt-2 w-full py-1 bg-primary text-white text-xs rounded text-center"
            >
              Done
            </button>
          </div>
        </Popover>

        {/* Numeric Filter Popovers (Spend, Sales, Budget, Acos, etc) */}
        {['budget', 'spend', 'sales', 'orders', 'clicks', 'impressions', 'cpc', 'acos', 'roas', 'utilization'].map((field) => {
          const minKey = `min_${field}` as keyof FilterState;
          const maxKey = `max_${field}` as keyof FilterState;
          const isOpen = activePopover === field;

          return (
            <Popover
              key={field}
              open={isOpen}
              onOpenChange={(open) => setActivePopover(open ? field : null)}
              trigger={<span className="hidden" />}
            >
              <div className="w-64 p-3 text-xs font-mono">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-medium">
                  {field.toUpperCase()} Range
                </span>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Min</label>
                    <input
                      type="number"
                      step="any"
                      value={filters[minKey] ?? ''}
                      onChange={(e) =>
                        onChange({
                          ...filters,
                          [minKey]: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-border-dim rounded bg-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Max</label>
                    <input
                      type="number"
                      step="any"
                      value={filters[maxKey] ?? ''}
                      onChange={(e) =>
                        onChange({
                          ...filters,
                          [maxKey]: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-border-dim rounded bg-white"
                      placeholder="∞"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...filters, [minKey]: undefined, [maxKey]: undefined })
                    }
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="px-3 py-1 bg-primary text-white text-xs rounded"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </Popover>
          );
        })}

        {/* Quick filter buttons */}
        <div className="flex items-center gap-1.5 border-l border-border-dim pl-2">
          <button
            type="button"
            onClick={() => applyQuickFilter('leak')}
            className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
              filters.health.includes('BUDGET_LEAK')
                ? 'bg-rose-50 border-rose-300 text-spend font-medium'
                : 'border-border-dim bg-surface text-slate-600 hover:bg-slate-50'
            }`}
          >
            Budget leak
          </button>
          <button
            type="button"
            onClick={() => applyQuickFilter('scale')}
            className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
              filters.health.includes('SCALE')
                ? 'bg-emerald-50 border-emerald-300 text-sales font-medium'
                : 'border-border-dim bg-surface text-slate-600 hover:bg-slate-50'
            }`}
          >
            Ready to scale
          </button>
          <button
            type="button"
            onClick={() => applyQuickFilter('budget_limited')}
            className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
              filters.min_utilization === 90
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-medium'
                : 'border-border-dim bg-surface text-slate-600 hover:bg-slate-50'
            }`}
          >
            Limited by budget
          </button>
        </div>

        {/* Save Filter Button */}
        <Popover
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-600 hover:text-slate-900 border border-border-dim rounded-md bg-surface hover:bg-slate-50 ml-auto"
            >
              <Bookmark className="w-3 h-3" />
              <span>Save filter</span>
            </button>
          }
        >
          <div className="w-60 p-3 text-xs font-mono">
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-medium">
              Save Current Filter
            </span>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. High spend campaigns"
              className="w-full px-2 py-1 text-xs border border-border-dim rounded mb-2"
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-2 py-1 text-xs border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFilter}
                disabled={!saveName.trim()}
                className="px-2.5 py-1 text-xs bg-primary text-white rounded font-medium disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </Popover>

        {/* Clear All */}
        {(filters.status.length > 0 ||
          filters.health.length > 0 ||
          filters.targeting_type.length > 0 ||
          filters.min_spend !== undefined ||
          filters.max_spend !== undefined ||
          filters.min_sales !== undefined ||
          filters.min_utilization !== undefined) && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-mono text-slate-400 hover:text-slate-600 px-1 py-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
        {renderArrayChip('Status', 'status')}
        {renderArrayChip('Health', 'health')}
        {renderArrayChip('Targeting', 'targeting_type')}
        {renderNumericChip('Budget', 'min_budget', 'max_budget')}
        {renderNumericChip('Spend', 'min_spend', 'max_spend')}
        {renderNumericChip('Sales', 'min_sales', 'max_sales')}
        {renderNumericChip('Orders', 'min_orders', 'max_orders')}
        {renderNumericChip('Clicks', 'min_clicks', 'max_clicks')}
        {renderNumericChip('Impressions', 'min_impressions', 'max_impressions')}
        {renderNumericChip('CPC', 'min_cpc', 'max_cpc')}
        {renderNumericChip('ACOS', 'min_acos', 'max_acos', '%')}
        {renderNumericChip('ROAS', 'min_roas', 'max_roas', 'x')}
        {renderNumericChip('Time in budget', 'min_utilization', 'max_utilization', '%')}
      </div>
    </div>
  );
}
