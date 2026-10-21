import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import {
  listRules,
  setRuleActive,
  deleteRule as apiDeleteRule,
  duplicateRule as apiDuplicateRule,
  bulkRulesAction,
  updateRuleScope as apiUpdateRuleScope,
} from '@/lib/recommendations-api';
import type { Rule, ScopeMode } from '@/lib/types/recommendation';
import { useToast } from '@/components/ui/toast';

export type StatusFilter = 'all' | 'active' | 'inactive';

export function useRules() {
  const { account } = useActiveAccount();
  const { success, error: toastError } = useToast();

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchRules = useCallback(async () => {
    if (!account?.id) {
      setRules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listRules(account.id);
      setRules(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load recommendation rules';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchRules();
    });
    return () => {
      active = false;
    };
  }, [fetchRules]);

  // Optimistic toggle active with rollback
  const toggleRuleActive = useCallback(
    async (ruleId: number, nextState: boolean) => {
      // Find current rule
      const originalRule = rules.find((r) => r.id === ruleId);
      if (!originalRule) return;

      // Optimistic update
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_active: nextState } : r))
      );

      try {
        const updated = await setRuleActive(ruleId, nextState);
        setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
        success(`Rule "${originalRule.name}" ${nextState ? 'enabled' : 'disabled'}`);
      } catch (err: unknown) {
        // Rollback
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? originalRule : r))
        );
        const msg = err instanceof Error ? err.message : 'Failed to update rule state';
        toastError('Failed to update rule', msg);
      }
    },
    [rules, success, toastError]
  );

  const deleteRule = useCallback(
    async (ruleId: number) => {
      const target = rules.find((r) => r.id === ruleId);
      try {
        await apiDeleteRule(ruleId);
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(ruleId);
          return next;
        });
        success(`Rule "${target?.name || ruleId}" deleted`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete rule';
        toastError('Failed to delete rule', msg);
        throw err;
      }
    },
    [rules, success, toastError]
  );

  const duplicateRule = useCallback(
    async (ruleId: number) => {
      try {
        const duplicated = await apiDuplicateRule(ruleId);
        setRules((prev) => [duplicated, ...prev]);
        success(`Rule duplicated as "${duplicated.name}"`);
        return duplicated;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to duplicate rule';
        toastError('Failed to duplicate rule', msg);
        throw err;
      }
    },
    [success, toastError]
  );

  const updateScope = useCallback(
    async (ruleId: number, scopeMode: ScopeMode, campaignIds: number[]) => {
      try {
        const updated = await apiUpdateRuleScope(ruleId, scopeMode, campaignIds);
        setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
        success('Campaign scope updated');
        return updated;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update campaign scope';
        toastError('Failed to update scope', msg);
        throw err;
      }
    },
    [success, toastError]
  );

  const handleBulkAction = useCallback(
    async (action: 'enable' | 'disable' | 'delete') => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      try {
        await bulkRulesAction(ids, action.toUpperCase() as 'ENABLE' | 'DISABLE' | 'DELETE');
        if (action === 'enable') {
          setRules((prev) =>
            prev.map((r) => (ids.includes(r.id) ? { ...r, is_active: true } : r))
          );
          success(`${ids.length} rule${ids.length > 1 ? 's' : ''} enabled`);
        } else if (action === 'disable') {
          setRules((prev) =>
            prev.map((r) => (ids.includes(r.id) ? { ...r, is_active: false } : r))
          );
          success(`${ids.length} rule${ids.length > 1 ? 's' : ''} disabled`);
        } else if (action === 'delete') {
          setRules((prev) => prev.filter((r) => !ids.includes(r.id)));
          success(`${ids.length} rule${ids.length > 1 ? 's' : ''} deleted`);
        }
        setSelectedIds(new Set());
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Failed to perform bulk ${action}`;
        toastError('Bulk action failed', msg);
      }
    },
    [selectedIds, success, toastError]
  );

  // Selection handlers
  const toggleSelectRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (statusFilter === 'active' && !rule.is_active) return false;
      if (statusFilter === 'inactive' && rule.is_active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!rule.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rules, statusFilter, searchQuery]);

  return {
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
    refreshRules: fetchRules,
    toggleRuleActive,
    deleteRule,
    duplicateRule,
    updateScope,
    handleBulkAction,
  };
}
