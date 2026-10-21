import React, { useState } from 'react';
import { Pencil, Trash2, Link2, Layers, Wand2 } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { describeCondition, describeRuleAction, describeScopeBadge } from './describe';
import type { Rule, Meta } from '@/lib/types/recommendation';

interface RuleTableProps {
  rules: Rule[];
  meta: Meta | null;
  currencySymbol: string;
  selectedIds: Set<number>;
  onToggleSelectRow: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onClearSelection: () => void;
  onToggleActive: (id: number, nextState: boolean) => void;
  onEditRule: (rule: Rule) => void;
  onDeleteRule: (id: number) => Promise<void>;
  onAssignScope: (rule: Rule) => void;
  onBrowseTemplates: () => void;
  onBuildCustom: () => void;
  onBulkAction: (action: 'enable' | 'disable' | 'delete') => Promise<void>;
  onExportSelected: () => void;
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function RuleTable({
  rules,
  meta,
  currencySymbol,
  selectedIds,
  onToggleSelectRow,
  onSelectAll,
  onClearSelection,
  onToggleActive,
  onEditRule,
  onDeleteRule,
  onAssignScope,
  onBrowseTemplates,
  onBuildCustom,
  onBulkAction,
  onExportSelected,
}: RuleTableProps) {
  // Delete confirm state
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const allSelected = rules.length > 0 && rules.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleMasterCheckbox = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll(rules.map((r) => r.id));
    }
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteRule(ruleToDelete.id);
      setRuleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface rounded-lg border border-border-dim">
        <div className="size-12 rounded-full bg-indigo-50 text-primary flex items-center justify-center mb-3">
          <Layers className="size-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-main">
          No rules yet — start from a template or build your own
        </h3>
        <p className="text-xs text-text-muted mt-1 max-w-md">
          Define automated recommendation logic to continually audit search terms, bids, and targeting.
        </p>
        <div className="flex items-center gap-3 mt-5">
          <Button
            size="sm"
            variant="outline"
            onClick={onBrowseTemplates}
            className="gap-1.5"
          >
            <Layers className="size-3.5" />
            <span>Browse templates</span>
          </Button>
          <Button
            size="sm"
            onClick={onBuildCustom}
            className="gap-1.5"
          >
            <Wand2 className="size-3.5" />
            <span>Build custom rule</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col rounded-lg border border-border-dim bg-surface overflow-hidden shadow-xs">
      {/* Bulk Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white text-xs z-20">
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono">{selectedIds.size}</span>
            <span className="text-slate-300">rule{selectedIds.size > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onBulkAction('enable')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => onBulkAction('disable')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Disable
            </button>
            <button
              type="button"
              onClick={() => onBulkAction('delete')}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-medium transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onExportSelected}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Export
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="ml-2 text-slate-400 hover:text-white underline text-[11px]"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-slate-50 border-b border-border-dim z-10 select-none">
            <tr className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              {/* Select */}
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleMasterCheckbox}
                  className="rounded border-border-dim text-primary focus:ring-primary size-3.5"
                  aria-label="Select all rules"
                />
              </th>
              {/* Actions */}
              <th className="w-24 px-3 py-2.5">Actions</th>
              {/* Active */}
              <th className="w-16 px-3 py-2.5">Active</th>
              {/* Name */}
              <th className="px-3 py-2.5 min-w-[180px]">Name</th>
              {/* Affected Parameter */}
              <th className="px-3 py-2.5 w-32">Affected</th>
              {/* Scope Badge */}
              <th className="px-3 py-2.5 w-36">Scope</th>
              {/* Conditions */}
              <th className="px-3 py-2.5 min-w-[220px]">Conditions</th>
              {/* Suggested Actions */}
              <th className="px-3 py-2.5 min-w-[200px]">Actions</th>
              {/* Last Analysed */}
              <th className="px-3 py-2.5 w-36 text-right">Last Analysed</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-dim/60 font-sans">
            {rules.map((rule) => {
              const isSelected = selectedIds.has(rule.id);
              const scopeInfo = describeScopeBadge(rule.scope_mode, rule.campaign_ids);
              const dateLabel =
                meta?.date_filters?.[rule.date_filter] ||
                rule.date_filter.replace(/_/g, ' ').toLowerCase();

              return (
                <tr
                  key={rule.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  {/* Select */}
                  <td className="px-3 py-2.5 align-top">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(rule.id)}
                      className="rounded border-border-dim text-primary focus:ring-primary size-3.5"
                      aria-label={`Select rule ${rule.name}`}
                    />
                  </td>

                  {/* Row Actions */}
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center gap-1 text-text-muted">
                      <button
                        type="button"
                        onClick={() => onEditRule(rule)}
                        className="p-1 hover:text-primary rounded hover:bg-slate-100 transition-colors"
                        title="Edit rule"
                        aria-label={`Edit ${rule.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAssignScope(rule)}
                        className="p-1 hover:text-primary rounded hover:bg-slate-100 transition-colors"
                        title="Assign campaigns"
                        aria-label={`Assign campaigns for ${rule.name}`}
                      >
                        <Link2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRuleToDelete(rule)}
                        className="p-1 hover:text-danger rounded hover:bg-red-50 transition-colors"
                        title="Delete rule"
                        aria-label={`Delete ${rule.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Active Switch */}
                  <td className="px-3 py-2.5 align-top">
                    <Switch
                      checked={rule.is_active}
                      onChange={(checked: boolean) => onToggleActive(rule.id, checked)}
                      aria-label={`Enable or disable rule ${rule.name}`}
                    />
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2.5 align-top">
                    <span className="font-semibold text-text-main block leading-tight">
                      {rule.name}
                    </span>
                  </td>

                  {/* Affected Parameter */}
                  <td className="px-3 py-2.5 align-top">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {rule.affected_parameter.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Scope Badge */}
                  <td className="px-3 py-2.5 align-top">
                    <button
                      type="button"
                      onClick={() => onAssignScope(rule)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                        rule.scope_mode === 'ALL'
                          ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          : rule.scope_mode === 'INCLUDE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Click to change campaign scope"
                    >
                      <span>{scopeInfo.label}</span>
                    </button>
                  </td>

                  {/* Conditions */}
                  <td className="px-3 py-2.5 align-top text-[11px] leading-relaxed">
                    <div className="flex flex-col gap-0.5 text-text-muted">
                      <span className="text-[10px] font-medium text-slate-400">
                        Date: {dateLabel}
                      </span>
                      {rule.conditions.map((cond, i) => (
                        <span key={i} className="font-mono text-text-main">
                          {describeCondition(cond, meta, currencySymbol)}
                        </span>
                      ))}
                      {rule.min_clicks > 0 && (
                        <span className="text-text-muted font-mono">
                          Min clicks: {rule.min_clicks}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 align-top text-[11px] leading-relaxed">
                    <div className="flex flex-col gap-0.5">
                      {rule.actions.map((act, i) => (
                        <span key={i} className="text-primary font-medium">
                          {describeRuleAction(act, meta, currencySymbol)}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Last Analysed */}
                  <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums text-[11px]">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-text-muted">
                        {formatRelativeTime(rule.last_run_at)}
                      </span>
                      {rule.open_count !== undefined && (
                        <span className="text-[10px] font-semibold text-primary">
                          {rule.open_count} open
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Rule Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onCancel={() => setRuleToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={`Delete rule '${ruleToDelete?.name}'?`}
        description="Its open recommendations will be marked as expired. This action cannot be undone."
        confirmLabel="Delete Rule"
        cancelLabel="Keep Rule"
        variant="danger"
      />
    </div>
  );
}
