'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Modal } from './ui/RulesModal';
import { Button } from './ui/RulesButton';
import { rulesApiClient as apiClient } from './rules-api-client';
import type { Rule, ScopeMode } from './rules-types';

interface CampaignSummary {
  id: number;
  name: string;
  state: string;
}

interface RuleScopeModalProps {
  open: boolean;
  onClose: () => void;
  rule: Rule;
  adsAccountId: number | null;
  onSaveScope: (ruleId: number, mode: ScopeMode, campaignIds: number[]) => Promise<void>;
}

export function RuleScopeModal({
  open,
  onClose,
  rule,
  adsAccountId,
  onSaveScope,
}: RuleScopeModalProps) {
  const [mode, setMode] = useState<ScopeMode>(rule.scope_mode || 'ALL');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(rule.campaign_ids || [])
  );
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!open || !adsAccountId) return;

    setLoading(true);
    apiClient<{ campaigns: CampaignSummary[] }>(`/campaigns?ads_account_id=${adsAccountId}&limit=200`)
      .then((res) => {
        if (!active) return;
        setCampaigns(res.campaigns || []);
      })
      .catch(() => {
        if (!active) return;
        setCampaigns([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, adsAccountId]);

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const q = searchQuery.toLowerCase();
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, searchQuery]);

  const toggleCampaign = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFiltered = filteredCampaigns.map((c) => c.id);
    const allSelected = allFiltered.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFiltered.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ids = mode === 'ALL' ? [] : Array.from(selectedIds);
      await onSaveScope(rule.id, mode, ids);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign Campaign Scope: ${rule.name}`} size="lg">
      <div className="flex flex-col gap-4">
        {/* Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-800">Scope Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ALL', label: 'All Campaigns' },
              { id: 'INCLUDE', label: 'Include Specific' },
              { id: 'EXCLUDE', label: 'Exclude Specific' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id as ScopeMode)}
                className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                  mode === opt.id
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign List when INCLUDE or EXCLUDE */}
        {mode !== 'ALL' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter campaigns..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md outline-none focus:border-indigo-600 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline whitespace-nowrap px-1"
              >
                Toggle filtered
              </button>
            </div>

            <div className="border border-slate-300 rounded-md max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
              {loading ? (
                <div className="py-8 flex items-center justify-center text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading campaigns...</span>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No campaigns found</div>
              ) : (
                filteredCampaigns.map((c) => {
                  const checked = selectedIds.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCampaign(c.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary size-3.5"
                      />
                      <span className="font-mono text-slate-800 flex-1 truncate">{c.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {c.state}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{selectedIds.size} campaign(s) selected</span>
              {mode === 'INCLUDE' ? (
                <span>Rule only executes on selected campaigns</span>
              ) : (
                <span>Rule skips selected campaigns</span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="min-w-[100px]">
            {saving ? 'Saving...' : 'Save Scope'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
