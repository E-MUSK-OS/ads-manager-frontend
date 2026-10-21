import React, { useState } from 'react';
import { Plus, Search, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RuleTable } from './RuleTable';
import { AddRecommendationModal } from './AddRecommendationModal';
import { ScopeModal } from './ScopeModal';
import { ImportExportMenu } from './ImportExportMenu';
import { useRules, type StatusFilter } from './useRules';
import { useRecommendationMeta } from './useRecommendationMeta';
import { useActiveAccount } from '@/lib/useActiveAccount';
import type { Rule, ScopeMode } from '@/lib/types/recommendation';

export function ConfigurationTab() {
  const { account } = useActiveAccount();
  const { meta, currencySymbol } = useRecommendationMeta();
  const {
    rules,
    filteredRules,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    toggleSelectRow,
    selectAll,
    clearSelection,
    refreshRules,
    toggleRuleActive,
    deleteRule,
    duplicateRule,
    updateScope,
    handleBulkAction,
  } = useRules();

  // Modals state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [scopeRule, setScopeRule] = useState<Rule | null>(null);

  const handleOpenAdd = () => {
    setEditingRuleId(null);
    setModalOpen(true);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setModalOpen(true);
  };

  const handleAssignScope = (rule: Rule) => {
    setScopeRule(rule);
  };

  const handleSaveScope = async (ruleId: number, mode: ScopeMode, campIds: number[]) => {
    await updateScope(ruleId, mode, campIds);
  };

  const handleDuplicate = async (ruleId: number) => {
    await duplicateRule(ruleId);
  };

  const statusFilters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-main">
            Recommendation rules
          </h2>
          <p className="text-xs text-text-muted">
            Define automated conditions to evaluate search terms, targets, and campaign performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import / Export Menu */}
          <ImportExportMenu
            adsAccountId={account?.id ?? null}
            selectedIds={Array.from(selectedIds)}
            onDuplicate={handleDuplicate}
            onImportComplete={refreshRules}
          />

          {/* Add Recommendation Button */}
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            <span>Add recommendation</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface rounded-lg border border-border-dim">
        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start">
          {statusFilters.map((sf) => {
            const isActive = statusFilter === sf.key;
            return (
              <button
                key={sf.key}
                type="button"
                onClick={() => setStatusFilter(sf.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all select-none ${
                  isActive
                    ? 'bg-surface text-text-main shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {sf.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search rules by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-2.5 rounded-md border border-border-dim bg-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 text-xs text-danger bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button size="xs" variant="outline" onClick={refreshRules} className="gap-1">
            <RefreshCw className="size-3" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted bg-surface rounded-lg border border-border-dim">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs">Loading recommendation rules…</span>
        </div>
      ) : (
        /* Rules Table */
        <RuleTable
          rules={filteredRules}
          meta={meta}
          currencySymbol={currencySymbol}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onToggleActive={toggleRuleActive}
          onEditRule={handleEditRule}
          onDeleteRule={deleteRule}
          onAssignScope={handleAssignScope}
          onBrowseTemplates={handleOpenAdd}
          onBuildCustom={handleOpenAdd}
          onBulkAction={handleBulkAction}
          onExportSelected={() => {}}
        />
      )}

      {/* Add / Edit Rule Modal */}
      <AddRecommendationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        adsAccountId={account?.id ?? null}
        meta={meta}
        currencySymbol={currencySymbol}
        existingRules={rules}
        editRuleId={editingRuleId}
        onRuleSaved={() => {
          refreshRules();
        }}
      />

      {/* Scope Assignment Modal */}
      <ScopeModal
        open={Boolean(scopeRule)}
        onClose={() => setScopeRule(null)}
        rule={scopeRule}
        adsAccountId={account?.id ?? null}
        onSaveScope={handleSaveScope}
      />
    </div>
  );
}
