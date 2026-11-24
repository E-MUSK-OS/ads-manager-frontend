'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Pin,
  Pencil,
  Trash2,
  Copy,
  Layers,
  RotateCw,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Columns2,
} from 'lucide-react';
import { Switch } from './ui/RulesSwitch';
import { Button } from './ui/RulesButton';
import { ConfirmDialog } from './ui/RulesConfirmDialog';
import { Modal } from './ui/RulesModal';
import { useActiveAccount } from './rules-use-active-account';
import { useToast } from './ui/RulesToast';
import {
  fetchRules,
  fetchRulesMeta,
  toggleRuleActive,
  deleteRule,
  duplicateRule,
  updateRuleScope,
  bulkRulesAction,
} from './rules-api';
import { RuleFormModal } from './RuleFormModal';
import { PlacementRuleFormModal } from './PlacementRuleFormModal';
import { BudgetRuleFormModal } from './BudgetRuleFormModal';
import { TargetingRuleFormModal } from './TargetingRuleFormModal';
import { SearchTermRuleFormModal } from './SearchTermRuleFormModal';
import { RuleScopeModal } from './RuleScopeModal';
import { RuleHistoryModal } from './RuleHistoryModal';
import { CustomizeColumnsModal, DEFAULT_VISIBLE_COLUMNS } from './CustomizeColumnsModal';
import {
  formatConditionBadge,
  formatActionBadge,
  formatScopeBadge,
  formatDateIN,
} from './rule-helpers';
import type { Rule, ScopeMode, AffectedParameter, RuleMeta, RuleSection } from './rules-types';

interface ColumnDef {
  id: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  canPin?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'select', label: '', width: 44, align: 'center', canPin: false },
  { id: 'action', label: 'ACTION', width: 110, align: 'left', canPin: true },
  { id: 'is_active', label: 'IS ACTIVE', width: 90, align: 'center', canPin: true },
  { id: 'name', label: 'RULE NAME', width: 220, align: 'left', canPin: true },
  { id: 'conditions', label: 'CONDITIONS', width: 260, align: 'left', canPin: true },
  { id: 'action_type', label: 'ACTION TYPE', width: 220, align: 'left', canPin: true },
  { id: 'assign_campaign', label: 'ASSIGN CAMPAIGN', width: 170, align: 'left', canPin: true },
  { id: 'trigger_at', label: 'TRIGGER AT', width: 150, align: 'left', canPin: true },
  { id: 'created_at', label: 'CREATED AT', width: 140, align: 'left', canPin: true },
  { id: 'updated_at', label: 'UPDATED AT', width: 140, align: 'left', canPin: true },
];

const DEFAULT_PINNED = ['select', 'action', 'is_active', 'name'];

interface RulesTableManagerProps {
  activeSection: RuleSection;
  affectedParameter?: AffectedParameter;
  title: string;
}

export function RulesTableManager({
  activeSection,
  affectedParameter,
  title,
}: RulesTableManagerProps) {
  const { account } = useActiveAccount();
  const { success, error: toastError } = useToast();

  const [rules, setRules] = useState<Rule[]>([]);
  const [meta, setMeta] = useState<RuleMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // View State (Table view vs Full-Page Form)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editRuleId, setEditRuleId] = useState<number | null>(null);
  const [createTypeModalOpen, setCreateTypeModalOpen] = useState<boolean>(false);
  const [selectedCreateType, setSelectedCreateType] = useState<RuleSection>('placement');
  const [scopeModalRule, setScopeModalRule] = useState<Rule | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<Rule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Column Pinning
  const storageKey = `rules_pinned_cols_${activeSection}`;
  const [pinnedColumns, setPinnedColumns] = useState<string[]>(DEFAULT_PINNED);

  // Measure visible table card container width so empty state & loading align exactly to center of screen
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!containerEl) return;
    const updateWidth = () => {
      setContainerWidth(containerEl.clientWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerEl);
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, [containerEl]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validPinned = parsed.filter((id) => {
            const col = ALL_COLUMNS.find((c) => c.id === id);
            return col && (col.id === 'select' || col.canPin);
          });
          const safePinned = Array.from(new Set(['select', ...validPinned]));
          setPinnedColumns(safePinned);
          return;
        }
      }
    } catch {}
    setPinnedColumns(DEFAULT_PINNED);
  }, [storageKey]);

  const togglePin = useCallback(
    (colId: string) => {
      const targetCol = ALL_COLUMNS.find((c) => c.id === colId);
      if (!targetCol || !targetCol.canPin || colId === 'select') return;

      setPinnedColumns((prev) => {
        let next: string[];
        if (prev.includes(colId)) {
          next = prev.filter((id) => id !== colId);
        } else {
          next = [...prev, colId];
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey]
  );

  // Load rules & metadata
  const loadData = useCallback(async () => {
    if (!account?.id) return;
    setLoading(true);
    try {
      const [rulesData, metaData] = await Promise.all([
        fetchRules(account.id),
        fetchRulesMeta(account.id).catch(() => null),
      ]);
      setRules(rulesData || []);
      if (metaData) setMeta(metaData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load rules';
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [account?.id, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter rules by active section's affected parameter (or return all if activeSection === 'all')
  const sectionRules = useMemo(() => {
    if (activeSection === 'all') {
      return rules;
    }
    return rules.filter((r) => r.affected_parameter === affectedParameter);
  }, [rules, activeSection, affectedParameter]);

  const handleOpenAddModal = () => {
    setEditRuleId(null);
    if (activeSection === 'all') {
      setCreateTypeModalOpen(true);
    } else {
      setIsFormOpen(true);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('action', 'create');
        url.searchParams.delete('ruleId');
        window.history.pushState(null, '', url.toString());
      } catch {}
    }
  };

  const handleOpenEdit = (ruleId: number) => {
    setEditRuleId(ruleId);
    setIsFormOpen(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'edit');
      url.searchParams.set('ruleId', String(ruleId));
      window.history.pushState(null, '', url.toString());
    } catch {}
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditRuleId(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      url.searchParams.delete('ruleId');
      url.searchParams.delete('type');
      window.history.pushState(null, '', url.toString());
    } catch {}
  };

  // Sync URL query params with form state for bookmarking and browser navigation
  useEffect(() => {
    const checkUrlParams = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const action = sp.get('action');
        const rId = sp.get('ruleId');
        const type = sp.get('type') as RuleSection | null;
        if (action === 'create') {
          if (type) setSelectedCreateType(type);
          setEditRuleId(null);
          setIsFormOpen(true);
        } else if (action === 'edit' && rId) {
          setEditRuleId(Number(rId));
          setIsFormOpen(true);
        } else {
          setIsFormOpen(false);
          setEditRuleId(null);
        }
      } catch {}
    };

    checkUrlParams();
    window.addEventListener('popstate', checkUrlParams);
    return () => window.removeEventListener('popstate', checkUrlParams);
  }, []);

  const activeModalType: RuleSection = useMemo(() => {
    if (editRuleId) {
      const editingRule = rules.find((r) => r.id === editRuleId);
      if (editingRule?.affected_parameter === 'PLACEMENT') return 'placement';
      if (editingRule?.affected_parameter === 'CAMPAIGN') return 'budget';
      if (editingRule?.affected_parameter === 'TARGETING') return 'targeting';
      if (editingRule?.affected_parameter === 'SEARCH_TERM') return 'search_term';
    }
    if (activeSection === 'all') {
      return selectedCreateType;
    }
    return activeSection;
  }, [editRuleId, rules, activeSection, selectedCreateType]);

  // Search filter
  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return sectionRules;
    const q = searchQuery.toLowerCase();
    return sectionRules.filter((r) => r.name.toLowerCase().includes(q));
  }, [sectionRules, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const paginatedRules = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, page, pageSize]);

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const currentPageIds = paginatedRules.map((r) => r.id);
    const allSelected = currentPageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      currentPageIds.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const allCurrentSelected =
    paginatedRules.length > 0 && paginatedRules.every((r) => selectedIds.has(r.id));
  const someCurrentSelected =
    paginatedRules.some((r) => selectedIds.has(r.id)) && !allCurrentSelected;

  // Single rule actions
  const handleToggleActive = async (rule: Rule, checked: boolean) => {
    try {
      await toggleRuleActive(rule.id, checked);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: checked } : r))
      );
      success(`Rule ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      toastError('Failed to update rule status');
    }
  };

  const handleDuplicate = async (ruleId: number) => {
    try {
      const duplicated = await duplicateRule(ruleId);
      setRules((prev) => [duplicated, ...prev]);
      window.dispatchEvent(new CustomEvent('rules:changed'));
      success('Rule duplicated successfully');
    } catch {
      toastError('Failed to duplicate rule');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRule) return;
    setIsDeleting(true);
    try {
      await deleteRule(deleteConfirmRule.id);
      setRules((prev) => prev.filter((r) => r.id !== deleteConfirmRule.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirmRule.id);
        return next;
      });
      window.dispatchEvent(new CustomEvent('rules:changed'));
      success('Rule deleted');
      setDeleteConfirmRule(null);
    } catch {
      toastError('Failed to delete rule');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk actions
  const handleBulk = async (action: 'ENABLE' | 'DISABLE' | 'DELETE') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await bulkRulesAction(ids, action);
      if (action === 'DELETE') {
        setRules((prev) => prev.filter((r) => !ids.includes(r.id)));
        setSelectedIds(new Set());
        window.dispatchEvent(new CustomEvent('rules:changed'));
        success(`Deleted ${ids.length} rule(s)`);
      } else {
        const isEnable = action === 'ENABLE';
        setRules((prev) =>
          prev.map((r) => (ids.includes(r.id) ? { ...r, is_active: isEnable } : r))
        );
        success(`${isEnable ? 'Enabled' : 'Disabled'} ${ids.length} rule(s)`);
      }
    } catch {
      toastError('Bulk action failed');
    }
  };

  // Customizable Columns state
  const columnsStorageKey = `rules_visible_cols_${activeSection}`;
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [customizeModalOpen, setCustomizeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(columnsStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleColumns(parsed);
        }
      }
    } catch {}
  }, [columnsStorageKey]);

  const handleApplyCustomColumns = useCallback(
    (newCols: string[]) => {
      setVisibleColumns(newCols);
      try {
        localStorage.setItem(columnsStorageKey, JSON.stringify(newCols));
      } catch {}
      success('Columns updated successfully');
    },
    [columnsStorageKey, success]
  );

  const activeColumnDefs = useMemo(() => {
    const selectDef = ALL_COLUMNS.find((c) => c.id === 'select')!;
    const defs = visibleColumns
      .map((id) => ALL_COLUMNS.find((c) => c.id === id))
      .filter(Boolean) as ColumnDef[];

    // Group pinned columns first so sticky left offsets are contiguous from the left
    const pinned = defs.filter((col) => pinnedColumns.includes(col.id));
    const unpinned = defs.filter((col) => !pinnedColumns.includes(col.id));

    return [selectDef, ...pinned, ...unpinned];
  }, [visibleColumns, pinnedColumns]);

  const tableMinWidth = useMemo(() => {
    const baseWidth = activeColumnDefs.reduce((acc, col) => acc + col.width, 0);
    const pinnedWidth = activeColumnDefs
      .filter((col) => pinnedColumns.includes(col.id))
      .reduce((acc, col) => acc + col.width, 0);
    const unpinnedWidth = baseWidth - pinnedWidth;

    // As more columns are pinned, extend table width simultaneously so there is always
    // ample horizontal scroll track to comfortably scroll and view all columns
    const extraScrollBuffer =
      paginatedRules.length > 0 && unpinnedWidth > 0 ? Math.max(pinnedWidth, 400) : 0;
    return Math.max(baseWidth + extraScrollBuffer, 1200);
  }, [activeColumnDefs, pinnedColumns, paginatedRules.length]);

  // Column left offset calculator based on active visible columns
  const columnOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let currentLeft = 0;
    activeColumnDefs.forEach((col) => {
      if (pinnedColumns.includes(col.id)) {
        offsets[col.id] = currentLeft;
        currentLeft += col.width;
      }
    });
    return offsets;
  }, [activeColumnDefs, pinnedColumns]);

  const lastPinnedId = useMemo(() => {
    const pinnedList = activeColumnDefs.filter((c) => pinnedColumns.includes(c.id));
    return pinnedList[pinnedList.length - 1]?.id;
  }, [activeColumnDefs, pinnedColumns]);

  // If in Form View, render the full-page Rule Form component
  if (isFormOpen) {
    return (
      <div className="w-full">
        {activeModalType === 'placement' ? (
          <PlacementRuleFormModal
            onClose={handleCloseForm}
            adsAccountId={account?.id ?? null}
            ruleId={editRuleId}
            meta={meta}
            onRuleSaved={() => {
              loadData();
              window.dispatchEvent(new CustomEvent('rules:changed'));
              handleCloseForm();
            }}
          />
        ) : activeModalType === 'budget' ? (
          <BudgetRuleFormModal
            onClose={handleCloseForm}
            adsAccountId={account?.id ?? null}
            ruleId={editRuleId}
            meta={meta}
            onRuleSaved={() => {
              loadData();
              window.dispatchEvent(new CustomEvent('rules:changed'));
              handleCloseForm();
            }}
          />
        ) : activeModalType === 'targeting' ? (
          <TargetingRuleFormModal
            onClose={handleCloseForm}
            adsAccountId={account?.id ?? null}
            ruleId={editRuleId}
            meta={meta}
            onRuleSaved={() => {
              loadData();
              window.dispatchEvent(new CustomEvent('rules:changed'));
              handleCloseForm();
            }}
          />
        ) : (
          <SearchTermRuleFormModal
            onClose={handleCloseForm}
            adsAccountId={account?.id ?? null}
            ruleId={editRuleId}
            meta={meta}
            onRuleSaved={() => {
              loadData();
              window.dispatchEvent(new CustomEvent('rules:changed'));
              handleCloseForm();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Search input & Bulk actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 w-full sm:max-w-md">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in shrink-0">
              <button
                type="button"
                onClick={() => handleBulk('ENABLE')}
                className="px-2 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Enable ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={() => handleBulk('DISABLE')}
                className="px-2 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Disable
              </button>
              <button
                type="button"
                onClick={() => handleBulk('DELETE')}
                className="px-2 py-1 text-xs font-medium rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Right: History & + Add Rule Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryModalOpen(true)}
            className="gap-1.5 text-slate-700 border-slate-300"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenAddModal}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </Button>

          <button
            type="button"
            onClick={loadData}
            title="Refresh rules"
            className="p-1.5 border border-slate-300 rounded-md bg-white hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Container with Horizontal Scroll */}
      <div className="border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
        <div ref={setContainerEl} className="overflow-x-auto relative min-h-[350px]" style={{ containerType: 'inline-size' }}>
          <table
            style={{ minWidth: `${Math.max(tableMinWidth, 800)}px` }}
            className="w-full text-xs text-left border-collapse"
          >
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 text-[11px] font-mono tracking-wider select-none">
                {activeColumnDefs.map((col) => {
                  const isPinned = pinnedColumns.includes(col.id);
                  const isLastPinned = isPinned && col.id === lastPinnedId;
                  const leftOffset = columnOffsets[col.id];
                  const canStick =
                    isPinned &&
                    (containerWidth
                      ? containerWidth >= 768 && leftOffset + col.width <= containerWidth * 0.65
                      : false);
                  const stickyClasses = canStick
                    ? `sticky z-30 bg-slate-100 ${
                        isLastPinned
                          ? 'border-r-2 border-slate-300 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.12)]'
                          : 'border-r border-slate-200/80 shadow-[1px_0_0_0_#cbd5e1]'
                      }`
                    : 'border-r border-slate-200/80';

                  return (
                    <th
                      key={col.id}
                      style={{
                        width: col.width,
                        minWidth: col.width,
                        left: canStick ? `${leftOffset}px` : undefined,
                      }}
                      className={`py-2.5 px-3 relative ${stickyClasses} ${
                        col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        {col.id === 'select' ? (
                          <input
                            type="checkbox"
                            checked={allCurrentSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someCurrentSelected;
                            }}
                            onChange={handleToggleSelectAll}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 size-3.5 mx-auto block cursor-pointer"
                          />
                        ) : (
                          <span className="font-bold truncate">{col.label}</span>
                        )}

                        {col.canPin && col.id !== 'select' && (
                          <button
                            type="button"
                            onClick={() => togglePin(col.id)}
                            title={isPinned ? `Unpin ${col.label}` : `Pin ${col.label} to left`}
                            className={`p-1 rounded transition-colors ${
                              isPinned
                                ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                : 'text-slate-400 opacity-40 hover:opacity-100 hover:text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <Pin className={`w-3 h-3 ${isPinned ? 'fill-indigo-600 rotate-45' : ''}`} />
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {loading && rules.length === 0 ? (
                <tr>
                  <td colSpan={activeColumnDefs.length} className="p-0 border-none">
                    <div
                      className="sticky left-0 flex items-center justify-center py-20 px-4 text-slate-400"
                      style={{ width: containerWidth ? `${containerWidth}px` : '100cqw' }}
                    >
                      <div className="inline-flex items-center gap-2">
                        <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading rules...</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan={activeColumnDefs.length} className="p-0 border-none">
                    <div
                      className="sticky left-0 flex items-center justify-center py-24 px-4"
                      style={{ width: containerWidth ? `${containerWidth}px` : '100cqw' }}
                    >
                      <div className="max-w-md w-full flex flex-col items-center text-center">
                        <div className="relative w-16 h-14 mb-4 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-lg bg-slate-100 border border-slate-200 rotate-[-6deg]" />
                          <div className="absolute inset-0 rounded-lg bg-indigo-50/80 border border-indigo-200 rotate-[3deg]" />
                          <div className="relative w-12 h-10 rounded-md bg-white border border-slate-300 shadow-xs flex items-center justify-center text-indigo-600">
                            <Layers className="w-5 h-5" />
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No records found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                          There are no matching rows or data to display right now.
                        </p>
                        <Button
                          type="button"
                          size="xs"
                          onClick={handleOpenAddModal}
                          className="mt-4 gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create your first rule</span>
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule) => {
                  const isSelected = selectedIds.has(rule.id);
                  const scopeBadge = formatScopeBadge(rule.scope_mode, rule.campaign_ids);
                  const firstAction = rule.actions?.[0];
                  const ruleDaysStr = Array.isArray(firstAction?.params?.rule_days)
                    ? firstAction?.params?.rule_days.join(', ')
                    : 'All';
                  const ruleTimesStr = Array.isArray(firstAction?.params?.rule_times)
                    ? firstAction?.params?.rule_times.join(', ')
                    : '09:00';

                  return (
                    <tr
                      key={rule.id}
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {activeColumnDefs.map((col) => {
                        const isPinned = pinnedColumns.includes(col.id);
                        const isLastPinned = isPinned && col.id === lastPinnedId;
                        const leftOffset = columnOffsets[col.id];
                        const canStick =
                    isPinned &&
                    (containerWidth
                      ? containerWidth >= 768 && leftOffset + col.width <= containerWidth * 0.65
                      : false);
                        const stickyClasses = canStick
                          ? `sticky z-20 bg-white group-hover:bg-slate-50 ${
                              isLastPinned
                                ? 'border-r-2 border-slate-300 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.12)]'
                                : 'border-r border-slate-100 shadow-[1px_0_0_0_#e2e8f0]'
                            }`
                          : 'border-r border-slate-100';

                        return (
                          <td
                            key={col.id}
                            style={{
                              width: col.width,
                              minWidth: col.width,
                              left: canStick ? `${leftOffset}px` : undefined,
                            }}
                            className={`py-3 px-3 ${stickyClasses} ${
                              col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {/* 1. Selection Checkbox */}
                            {col.id === 'select' && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(rule.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 size-3.5 mx-auto block cursor-pointer"
                              />
                            )}

                            {/* 2. Action Buttons */}
                            {col.id === 'action' && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(rule.id)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Edit rule"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setScopeModalRule(rule)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Assign campaign scope"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(rule.id)}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Duplicate rule"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmRule(rule)}
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Delete rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* 3. IS ACTIVE */}
                            {col.id === 'is_active' && (
                              <div className="flex justify-center">
                                <Switch
                                  checked={rule.is_active}
                                  onChange={(checked) => handleToggleActive(rule, checked)}
                                  size="sm"
                                  className="mx-auto"
                                />
                              </div>
                            )}

                            {/* 4. RULE NAME */}
                            {col.id === 'name' && (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900 truncate" title={rule.name}>
                                    {rule.name}
                                  </span>
                                  {activeSection === 'all' && (
                                    <span
                                      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${
                                        rule.affected_parameter === 'PLACEMENT'
                                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                                          : rule.affected_parameter === 'CAMPAIGN'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : rule.affected_parameter === 'TARGETING'
                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}
                                    >
                                      {rule.affected_parameter === 'PLACEMENT'
                                        ? 'Placement'
                                        : rule.affected_parameter === 'CAMPAIGN'
                                        ? 'Budget'
                                        : rule.affected_parameter === 'TARGETING'
                                        ? 'Targeting'
                                        : 'Search Term'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {rule.date_filter || 'LAST_30_DAYS'}
                                </span>
                              </div>
                            )}

                            {/* 5. CONDITIONS */}
                            {col.id === 'conditions' && (
                              <div className="flex flex-wrap gap-1 max-w-[250px]">
                                {rule.conditions && rule.conditions.length > 0 ? (
                                  rule.conditions.map((cond, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-800"
                                    >
                                      {formatConditionBadge(cond, meta)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">No conditions</span>
                                )}
                                {rule.min_clicks > 0 && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-800">
                                    Days/Clicks ≥ {rule.min_clicks}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 6. ACTION TYPE */}
                            {col.id === 'action_type' && (
                              <div className="flex flex-wrap gap-1 max-w-[210px]">
                                {rule.actions && rule.actions.length > 0 ? (
                                  rule.actions.map((act, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                                    >
                                      {formatActionBadge(act, meta)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">None</span>
                                )}
                              </div>
                            )}

                            {/* 7. ASSIGN CAMPAIGN */}
                            {col.id === 'assign_campaign' && (
                              <button
                                type="button"
                                onClick={() => setScopeModalRule(rule)}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors cursor-pointer"
                                title="Click to change campaign scope"
                              >
                                <span>{scopeBadge.label}</span>
                              </button>
                            )}

                            {/* 8. TRIGGER AT */}
                            {col.id === 'trigger_at' && (
                              <div className="flex flex-col gap-0.5 text-[11px]">
                                <span className="font-semibold text-slate-800 truncate" title={ruleDaysStr}>
                                  {ruleDaysStr}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{ruleTimesStr}</span>
                                </span>
                              </div>
                            )}

                            {/* 9. CREATED AT */}
                            {col.id === 'created_at' && (
                              <span className="text-slate-600">{formatDateIN(rule.created_at)}</span>
                            )}

                            {/* 10. UPDATED AT */}
                            {col.id === 'updated_at' && (
                              <span className="text-slate-600">{formatDateIN(rule.updated_at)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination Matrix */}
        <div className="p-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-600 bg-slate-50/50">
          {/* Rows Per Page */}
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-mono focus:border-primary focus:outline-hidden"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Page Nav & Column Config */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="text-slate-700">
              Page <strong className="text-slate-900">{page}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="p-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="p-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
              title="Refresh table"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-600" />
            </button>

            {/* Column Customization Modal Button */}
            <button
              type="button"
              onClick={() => setCustomizeModalOpen(true)}
              className="p-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 hover:text-slate-800"
              title="Customize columns"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Rule Type Selection Modal (when creating from "All Rules") */}
      {createTypeModalOpen && (
        <Modal
          open={createTypeModalOpen}
          onClose={() => setCreateTypeModalOpen(false)}
          title="Create New Rule"
          size="md"
        >
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-slate-600 mb-1">
              Select the category of rule you want to create:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCreateType('placement');
                  setCreateTypeModalOpen(false);
                  setEditRuleId(null);
                  setIsFormOpen(true);
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('action', 'create');
                    url.searchParams.set('type', 'placement');
                    window.history.pushState(null, '', url.toString());
                  } catch {}
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left flex flex-col gap-1 cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Placement Rule</span>
                <span className="text-[11px] text-slate-500 leading-tight">Adjust placement multipliers based on performance</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCreateType('budget');
                  setCreateTypeModalOpen(false);
                  setEditRuleId(null);
                  setIsFormOpen(true);
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('action', 'create');
                    url.searchParams.set('type', 'budget');
                    window.history.pushState(null, '', url.toString());
                  } catch {}
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left flex flex-col gap-1 cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Budget Rule</span>
                <span className="text-[11px] text-slate-500 leading-tight">Automate daily campaign budget scaling</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCreateType('targeting');
                  setCreateTypeModalOpen(false);
                  setEditRuleId(null);
                  setIsFormOpen(true);
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('action', 'create');
                    url.searchParams.set('type', 'targeting');
                    window.history.pushState(null, '', url.toString());
                  } catch {}
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left flex flex-col gap-1 cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Targeting Rule</span>
                <span className="text-[11px] text-slate-500 leading-tight">Optimize target and keyword bid levels</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCreateType('search_term');
                  setCreateTypeModalOpen(false);
                  setEditRuleId(null);
                  setIsFormOpen(true);
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('action', 'create');
                    url.searchParams.set('type', 'search_term');
                    window.history.pushState(null, '', url.toString());
                  } catch {}
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left flex flex-col gap-1 cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Search Term Rule</span>
                <span className="text-[11px] text-slate-500 leading-tight">Harvest converting queries or add negative keywords</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Scope Assignment Modal */}
      {scopeModalRule && (
        <RuleScopeModal
          open={Boolean(scopeModalRule)}
          onClose={() => setScopeModalRule(null)}
          rule={scopeModalRule}
          adsAccountId={account?.id ?? null}
          onSaveScope={async (ruleId: number, mode: ScopeMode, campIds: number[]) => {
            await updateRuleScope(ruleId, mode, campIds);
            setScopeModalRule(null);
            loadData();
          }}
        />
      )}

      {/* History Modal */}
      <RuleHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        affectedParameter={affectedParameter}
        title={title}
        onRunComplete={loadData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteConfirmRule)}
        onClose={() => setDeleteConfirmRule(null)}
        onCancel={() => setDeleteConfirmRule(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Rule?"
        description={`Are you sure you want to delete the rule "${deleteConfirmRule?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Rule"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
      />

      {/* Customize Columns Modal */}
      <CustomizeColumnsModal
        open={customizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
        visibleColumns={visibleColumns}
        onApply={handleApplyCustomColumns}
      />
    </div>
  );
}
