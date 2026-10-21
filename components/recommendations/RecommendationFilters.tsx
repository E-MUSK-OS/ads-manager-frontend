import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import type {
  RecommendationStatus,
  SortOption,
} from './useRecommendations';
import type { Rule, AffectedParameter } from '@/lib/types/recommendation';

interface RecommendationFiltersProps {
  status: RecommendationStatus;
  counts: Record<RecommendationStatus, number>;
  affectedParameter: AffectedParameter | '';
  ruleId?: number;
  searchQuery: string;
  sort: SortOption;
  rules: Rule[];
  onUpdate: (updates: Record<string, string | number | undefined | null>) => void;
  onClearFilters: () => void;
}

export function RecommendationFilters({
  status,
  counts,
  affectedParameter,
  ruleId,
  searchQuery,
  sort,
  rules,
  onUpdate,
  onClearFilters,
}: RecommendationFiltersProps) {
  const [prevQuery, setPrevQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (prevQuery !== searchQuery) {
    setPrevQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onUpdate({ q: val || undefined, page: 1 });
    }, 300);
  };

  const statusList: Array<{ key: RecommendationStatus; label: string }> = [
    { key: 'OPEN', label: 'Open' },
    { key: 'APPLIED', label: 'Applied' },
    { key: 'DISMISSED', label: 'Dismissed' },
    { key: 'EXPIRED', label: 'Expired' },
  ];
  if (counts.FAILED > 0) {
    statusList.push({ key: 'FAILED', label: 'Failed' });
  }

  const affectedOptions = [
    { value: '', label: 'All parameters' },
    { value: 'SEARCH_TERM', label: 'Search term' },
    { value: 'TARGETING', label: 'Targeting' },
    { value: 'CAMPAIGN', label: 'Campaign' },
    { value: 'PLACEMENT', label: 'Placement' },
  ];

  const ruleOptions = [
    { value: '', label: 'All rules' },
    ...rules.map((r) => ({ value: String(r.id), label: r.name })),
  ];

  const sortOptions = [
    { value: 'impact', label: 'Biggest impact first' },
    { value: 'newest', label: 'Newest first' },
  ];

  const hasActiveFilters = Boolean(affectedParameter || ruleId || searchQuery);

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded-lg border border-border-dim">
      {/* Top: Status Segmented Control */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start overflow-x-auto">
        {statusList.map((st) => {
          const isActive = status === st.key;
          const count = counts[st.key] || 0;

          return (
            <button
              key={st.key}
              type="button"
              onClick={() => onUpdate({ status: st.key.toLowerCase(), page: 1 })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all select-none ${
                isActive
                  ? 'bg-surface text-text-main shadow-xs font-semibold'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-indigo-50 text-primary' : 'bg-slate-200/60 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Secondary Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search recommendations..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-2.5 rounded-md border border-border-dim bg-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Affected Parameter Select */}
        <div className="w-full sm:w-44">
          <Select
            value={affectedParameter}
            onChange={(e) => onUpdate({ affected_parameter: e.target.value || undefined, page: 1 })}
            options={affectedOptions}
            aria-label="Filter by affected parameter"
          />
        </div>

        {/* Rule Select */}
        <div className="w-full sm:w-48">
          <Select
            value={ruleId ? String(ruleId) : ''}
            onChange={(e) => onUpdate({ rule_id: e.target.value || undefined, page: 1 })}
            options={ruleOptions}
            aria-label="Filter by rule"
          />
        </div>

        {/* Sort Select */}
        <div className="w-full sm:w-44">
          <Select
            value={sort}
            onChange={(e) => onUpdate({ sort: e.target.value, page: 1 })}
            options={sortOptions}
            aria-label="Sort recommendations"
          />
        </div>

        {/* Clear Filters Button if any */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main px-2 py-1 rounded hover:bg-slate-100 self-center shrink-0"
          >
            <X className="size-3" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
