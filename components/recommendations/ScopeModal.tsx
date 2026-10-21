import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { RadioCard } from '@/components/ui/RadioCard';
import { Button } from '@/components/ui/button';
import { getCampaignReport } from '@/lib/api-client';
import type { Rule, ScopeMode } from '@/lib/types/recommendation';
import type { CampaignItem } from '@/lib/types/campaign';

interface ScopeModalProps {
  open: boolean;
  onClose: () => void;
  rule: Rule | null;
  adsAccountId: number | null;
  onSaveScope: (ruleId: number, scopeMode: ScopeMode, campaignIds: number[]) => Promise<void>;
}

export function ScopeModal({
  open,
  onClose,
  rule,
  adsAccountId,
  onSaveScope,
}: ScopeModalProps) {
  const [scopeMode, setScopeMode] = useState<ScopeMode>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from rule
  useEffect(() => {
    if (!open || !rule) return;
    const timer = setTimeout(() => {
      setScopeMode(rule.scope_mode || 'ALL');
      setSelectedIds(new Set(rule.campaign_ids || []));
      setSearch('');
      setError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [open, rule]);

  // Load campaigns for this account
  useEffect(() => {
    if (!open || !adsAccountId) return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) setLoadingCampaigns(true);
      getCampaignReport({ ads_account_id: adsAccountId, page_size: 200 })
        .then((res) => {
          if (active) setCampaigns(res.items || []);
        })
        .catch(() => {
          if (active) setCampaigns([]);
        })
        .finally(() => {
          if (active) setLoadingCampaigns(false);
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, adsAccountId]);

  // Filtered campaigns for checklist
  const filteredCampaigns = useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase().trim();
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, search]);

  const toggleCampaign = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError(null);
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredCampaigns.forEach((c) => next.add(c.id));
      return next;
    });
    setError(null);
  };

  const handleClearAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredCampaigns.forEach((c) => next.delete(c.id));
      return next;
    });
  };

  const handleSave = async () => {
    if (!rule) return;

    if (scopeMode !== 'ALL' && selectedIds.size === 0) {
      setError('Select at least one campaign');
      return;
    }

    setSaving(true);
    try {
      await onSaveScope(rule.id, scopeMode, Array.from(selectedIds));
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save scope';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const isChecklistVisible = scopeMode === 'INCLUDE' || scopeMode === 'EXCLUDE';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Campaign scope & selection"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Header subtitle */}
        <p className="text-xs text-text-muted">
          Configuring scope for: <span className="font-semibold text-text-main">{rule?.name}</span>
        </p>

        {/* 3 RadioCards */}
        <div className="flex flex-col gap-2.5">
          <RadioCard
            title="All campaigns"
            description="Automatically evaluate all active campaigns"
            selected={scopeMode === 'ALL'}
            onChange={() => {
              setScopeMode('ALL');
              setError(null);
            }}
          />

          <RadioCard
            title="Include campaigns"
            description="Generate recommendations exclusively for selected campaigns"
            selected={scopeMode === 'INCLUDE'}
            onChange={() => {
              setScopeMode('INCLUDE');
              setError(null);
            }}
          />

          <RadioCard
            title="Exclude campaigns"
            description="Evaluate all campaigns except the ones selected"
            selected={scopeMode === 'EXCLUDE'}
            onChange={() => {
              setScopeMode('EXCLUDE');
              setError(null);
            }}
          />
        </div>

        {/* Campaign Checklist when INCLUDE / EXCLUDE */}
        {isChecklistVisible && (
          <div className="flex flex-col gap-2.5 p-3 rounded-md border border-border-dim bg-slate-50/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-main">
                {scopeMode === 'INCLUDE' ? 'Select campaigns to include' : 'Select campaigns to exclude'}:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-primary">
                  {selectedIds.size} selected
                </span>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs text-text-muted hover:text-text-main font-medium"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAllFiltered}
                  className="text-xs text-text-muted hover:text-text-main font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 rounded-md border border-border-dim bg-surface text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Campaign List */}
            <div className="max-h-56 overflow-y-auto border border-border-dim rounded-md bg-surface divide-y divide-border-dim/60">
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-8 gap-2 text-xs text-text-muted">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Loading campaigns…</span>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  {campaigns.length === 0 ? 'No campaigns found in this account' : 'No matching campaigns'}
                </div>
              ) : (
                filteredCampaigns.map((camp) => {
                  const isChecked = selectedIds.has(camp.id);
                  const isEnabled = camp.state === 'ENABLED';

                  return (
                    <label
                      key={camp.id}
                      className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCampaign(camp.id)}
                          className="rounded border-border-dim text-primary focus:ring-primary size-3.5"
                        />
                        <span className="font-medium text-text-main truncate max-w-sm">
                          {camp.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {camp.state}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Validation error */}
        {error && <span className="text-xs text-danger">{error}</span>}

        {/* Helper Line */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Info className="size-3.5 text-slate-400 shrink-0" />
          <span>Only enabled campaigns are analysed.</span>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-dim">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || (isChecklistVisible && selectedIds.size === 0)}
          >
            {saving ? 'Saving...' : 'Apply & save scope'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
