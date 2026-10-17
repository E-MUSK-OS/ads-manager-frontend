'use client';

import React, { useState, useEffect, useCallback, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  KeyRound,
  Search,
  ShieldBan,
  Settings as SettingsIcon,
  RotateCw,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import {
  getCampaign,
  getCampaignSummary,
  getCampaignAdGroups,
  patchAdGroup,
  getKeywords,
  patchKeyword,
  createKeyword,
  getSearchTerms,
  getNegativeKeywords,
  createNegativeKeyword,
  deleteNegativeKeyword,
  patchCampaign,
  updateCampaignState,
  updateCampaignBudget,
  duplicateCampaign,
} from '@/lib/api-client';
import type {
  CampaignItem,
  CampaignSummaryResponse,
  AdGroupItem,
  KeywordItem,
  SearchTermItem,
  NegativeKeywordItem,
  CampaignState,
  Match,
  NegMatch,
} from '@/lib/types/campaign';
import { KpiCards } from '@/components/campaigns/KpiCards';
import { PerformanceChart } from '@/components/campaigns/PerformanceChart';
import { DateRangePicker, DateRangeState } from '@/components/campaigns/DateRangePicker';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

function CampaignDetailContent({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const campaignId = Number(resolvedParams.id);

  const { rules, todayInTz } = useActiveAccount();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ad_groups' | 'keywords' | 'search_terms' | 'negatives' | 'settings'>(() => {
    const tab = searchParams.get('tab');
    if (tab && ['ad_groups', 'keywords', 'search_terms', 'negatives', 'settings'].includes(tab)) {
      return tab as any;
    }
    return 'ad_groups';
  });

  const today = todayInTz();
  const defaultStartDate = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  })();

  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: 'last_7_days',
    start: defaultStartDate,
    end: today,
    compare: false,
  });

  // Data states
  const [campaign, setCampaign] = useState<CampaignItem | null>(null);
  const [summary, setSummary] = useState<CampaignSummaryResponse | null>(null);
  const [adGroups, setAdGroups] = useState<AdGroupItem[]>([]);
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTermItem[]>([]);
  const [negatives, setNegatives] = useState<NegativeKeywordItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Inline budget editing
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');

  // Modals
  const [addKeywordModalOpen, setAddKeywordModalOpen] = useState(false);
  const [newKeywordText, setNewKeywordText] = useState('');
  const [newKeywordMatch, setNewKeywordMatch] = useState<Match>('EXACT');
  const [newKeywordBid, setNewKeywordBid] = useState('');
  const [newKeywordAdGroupId, setNewKeywordAdGroupId] = useState<number | ''>('');

  const [addNegativeModalOpen, setAddNegativeModalOpen] = useState(false);
  const [newNegativeText, setNewNegativeText] = useState('');
  const [newNegativeMatch, setNewNegativeMatch] = useState<NegMatch>('NEGATIVE_EXACT');

  const [addTermAsKeywordModalOpen, setAddTermAsKeywordModalOpen] = useState(false);
  const [addTermAsNegModalOpen, setAddTermAsNegModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<SearchTermItem | null>(null);

  // Settings tab form state
  const [settingsStrategy, setSettingsStrategy] = useState('');
  const [settingsTopPct, setSettingsTopPct] = useState(0);
  const [settingsRestPct, setSettingsRestPct] = useState(0);
  const [settingsProductPagePct, setSettingsProductPagePct] = useState(0);
  const [settingsEndDate, setSettingsEndDate] = useState('');
  const [settingsTargetAcos, setSettingsTargetAcos] = useState<number | ''>('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Load campaign and summary
  const loadCampaignData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [cRes, sRes, agRes] = await Promise.all([
        getCampaign(campaignId),
        getCampaignSummary({
          campaign_id: campaignId,
          start: dateRange.start,
          end: dateRange.end,
          compare: dateRange.compare,
        }),
        getCampaignAdGroups(campaignId, dateRange.start, dateRange.end),
      ]);

      setCampaign(cRes);
      setSummary(sRes);
      setAdGroups(agRes);

      // Settings form defaults
      setSettingsStrategy(cRes.bidding_strategy);
      setSettingsTopPct(cRes.placement_top_pct || 0);
      setSettingsRestPct(cRes.placement_rest_pct || 0);
      setSettingsProductPagePct(cRes.placement_product_page_pct || 0);
      setSettingsEndDate(cRes.end_date || '');
      setSettingsTargetAcos(cRes.target_acos ?? '');
    } catch (err: any) {
      showToast({ title: 'Error loading campaign', message: err?.message || 'Could not fetch details', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [campaignId, dateRange, showToast]);

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  // Load tab-specific data
  const loadTabData = useCallback(async () => {
    if (!campaignId) return;
    setTabLoading(true);
    try {
      if (activeTab === 'keywords') {
        if (adGroups.length > 0) {
          const allKeywords: KeywordItem[] = [];
          for (const ag of adGroups) {
            const kwRes = await getKeywords(ag.id);
            allKeywords.push(...kwRes);
          }
          setKeywords(allKeywords);
        }
      } else if (activeTab === 'search_terms') {
        const stRes = await getSearchTerms(campaignId);
        setSearchTerms(stRes);
      } else if (activeTab === 'negatives') {
        const negRes = await getNegativeKeywords(campaignId);
        setNegatives(negRes);
      }
    } catch {
      // ignore
    } finally {
      setTabLoading(false);
    }
  }, [campaignId, activeTab, adGroups]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Handle status toggle
  const handleToggleStatus = async () => {
    if (!campaign) return;
    const nextState: CampaignState = campaign.state === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    setCampaign({ ...campaign, state: nextState });
    try {
      await updateCampaignState(campaign.id, nextState);
      showToast({ title: 'Status updated', message: `Campaign is now ${nextState.toLowerCase()}`, type: 'success' });
    } catch (err: any) {
      setCampaign(campaign);
      showToast({ title: 'Update failed', message: err?.message || 'Could not change status', type: 'error' });
    }
  };

  // Handle budget edit
  const handleSaveBudget = async () => {
    if (!campaign) return;
    const newBudget = Number(budgetValue);
    if (isNaN(newBudget) || newBudget <= 0) {
      setIsEditingBudget(false);
      return;
    }
    if (rules && newBudget < rules.min_budget) {
      showToast({ title: 'Invalid budget', message: `Minimum is ${rules.symbol}${rules.min_budget}`, type: 'error' });
      return;
    }

    try {
      await updateCampaignBudget(campaign.id, newBudget);
      setCampaign({ ...campaign, daily_budget: newBudget });
      setIsEditingBudget(false);
      showToast({ title: 'Budget updated', message: `Saved ${rules?.symbol || '$'}${newBudget}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed to update budget', message: err?.message, type: 'error' });
    }
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    if (!campaign) return;
    try {
      const copy = await duplicateCampaign(campaign.id);
      showToast({ title: 'Campaign duplicated', message: `Created "${copy.name}"`, type: 'success' });
      router.push(`/campaigns/${copy.id}`);
    } catch (err: any) {
      showToast({ title: 'Duplicate failed', message: err?.message, type: 'error' });
    }
  };

  // Handle inline ad group bid edit
  const handleAdGroupBidSave = async (agId: number, bid: number) => {
    try {
      await patchAdGroup(agId, { default_bid: bid });
      setAdGroups((prev) => prev.map((ag) => (ag.id === agId ? { ...ag, default_bid: bid } : ag)));
      showToast({ title: 'Bid saved', message: `Ad group bid updated to ${rules?.symbol || '$'}${bid}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Bid save failed', message: err?.message, type: 'error' });
    }
  };

  // Handle keyword bid edit
  const handleKeywordBidSave = async (kwId: number, bid: number) => {
    try {
      await patchKeyword(kwId, { bid });
      setKeywords((prev) => prev.map((k) => (k.id === kwId ? { ...k, bid } : k)));
      showToast({ title: 'Keyword bid saved', message: `Bid updated to ${rules?.symbol || '$'}${bid}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Keyword bid update failed', message: err?.message, type: 'error' });
    }
  };

  // Handle keyword state toggle
  const handleKeywordStateToggle = async (kw: KeywordItem) => {
    const nextState = kw.state === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    try {
      await patchKeyword(kw.id, { state: nextState });
      setKeywords((prev) => prev.map((k) => (k.id === kw.id ? { ...k, state: nextState } : k)));
      showToast({ title: 'Keyword updated', message: `Keyword is now ${nextState.toLowerCase()}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Update failed', message: err?.message, type: 'error' });
    }
  };

  // Handle add keyword
  const handleAddKeyword = async () => {
    if (!newKeywordText.trim() || !newKeywordAdGroupId) return;
    try {
      const created = await createKeyword({
        ad_group_id: Number(newKeywordAdGroupId),
        keyword_text: newKeywordText.trim(),
        match_type: newKeywordMatch,
        bid: newKeywordBid ? Number(newKeywordBid) : undefined,
      });
      setKeywords((prev) => [...prev, created]);
      setAddKeywordModalOpen(false);
      setNewKeywordText('');
      setNewKeywordBid('');
      showToast({ title: 'Keyword created', message: `Added "${created.keyword_text}"`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed to add keyword', message: err?.message, type: 'error' });
    }
  };

  // Handle add negative keyword
  const handleAddNegative = async () => {
    if (!newNegativeText.trim()) return;
    try {
      const created = await createNegativeKeyword(campaignId, {
        keyword_text: newNegativeText.trim(),
        match_type: newNegativeMatch,
      });
      setNegatives((prev) => [...prev, created]);
      setAddNegativeModalOpen(false);
      setNewNegativeText('');
      showToast({ title: 'Negative keyword added', message: `Excluded "${created.keyword_text}"`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed to add negative', message: err?.message, type: 'error' });
    }
  };

  // Handle delete negative keyword
  const handleDeleteNegative = async (nkId: number) => {
    try {
      await deleteNegativeKeyword(campaignId, nkId);
      setNegatives((prev) => prev.filter((n) => n.id !== nkId));
      showToast({ title: 'Negative removed', message: 'Targeting restriction lifted', type: 'info' });
    } catch (err: any) {
      showToast({ title: 'Delete failed', message: err?.message, type: 'error' });
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    if (!campaign) return;
    setSavingSettings(true);
    try {
      const payload = {
        bidding_strategy: settingsStrategy,
        placement_top_pct: Number(settingsTopPct) || 0,
        placement_rest_pct: Number(settingsRestPct) || 0,
        placement_product_page_pct: Number(settingsProductPagePct) || 0,
        end_date: settingsEndDate || null,
        target_acos: settingsTargetAcos === '' ? null : Number(settingsTargetAcos),
      };
      await patchCampaign(campaign.id, payload);
      setCampaign({ ...campaign, ...payload } as any);
      showToast({ title: 'Settings saved', message: 'Campaign configuration updated.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Save failed', message: err?.message, type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading && !campaign) {
    return (
      <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center">
        <div className="font-mono text-xs text-slate-500 inline-flex items-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading campaign details...</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-graph-paper-faint p-6">
        <div className="bg-surface border border-border-dim rounded-md p-6 max-w-md mx-auto text-center font-mono text-xs">
          <p className="font-bold text-slate-900 mb-2">Campaign not found</p>
          <Link href="/campaigns" className="text-primary hover:underline">
            ← Return to campaigns list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graph-paper-faint p-6 space-y-5 font-mono text-xs text-text-main">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
        <Link href="/campaigns" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Campaigns</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-800 truncate max-w-md">{campaign.name}</span>
      </div>

      {/* Header Bar */}
      <div className="bg-surface border border-border-dim rounded-md p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Status Toggle */}
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={campaign.state === 'ARCHIVED'}
            className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
              campaign.state === 'ENABLED'
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : campaign.state === 'ARCHIVED'
                ? 'bg-slate-100 text-slate-400'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                campaign.state === 'ENABLED'
                  ? 'bg-emerald-500'
                  : campaign.state === 'ARCHIVED'
                  ? 'bg-slate-400'
                  : 'bg-amber-500'
              }`}
            />
            <span>{campaign.state}</span>
          </button>

          <div>
            <h1 className="text-base font-bold text-slate-900">{campaign.name}</h1>
            <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
              <span>{campaign.targeting_type} Targeting</span>
              <span>•</span>
              <span>Start: {campaign.start_date}</span>
              <span>•</span>
              <span>End: {campaign.end_date || 'No end date'}</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Inline Budget */}
          <div className="flex items-center gap-1.5 border border-border-dim rounded px-2.5 py-1 bg-white">
            <span className="text-slate-400">Budget:</span>
            {isEditingBudget ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  autoFocus
                  step="any"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBudget();
                    if (e.key === 'Escape') setIsEditingBudget(false);
                  }}
                  className="w-20 px-1 py-0.5 border border-primary rounded text-right font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBudgetValue(String(campaign.daily_budget));
                  setIsEditingBudget(true);
                }}
                className="font-bold text-slate-900 hover:text-primary hover:underline tabular-nums"
                title="Click to edit budget"
              >
                {money(campaign.daily_budget, rules)}
              </button>
            )}
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <button
            type="button"
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50 text-slate-700"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards summary={summary} loading={loading} campaignId={campaign.id} />

      {/* Performance Chart */}
      <PerformanceChart summary={summary} loading={loading} campaignId={campaign.id} />

      {/* Tab Navigation */}
      <div className="border-b border-border-dim flex items-center gap-2">
        {[
          { key: 'ad_groups', label: `Ad Groups (${adGroups.length})`, icon: Layers },
          { key: 'keywords', label: `Keywords (${keywords.length})`, icon: KeyRound },
          { key: 'search_terms', label: `Search Terms (${searchTerms.length})`, icon: Search },
          { key: 'negatives', label: `Negatives (${negatives.length})`, icon: ShieldBan },
          { key: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${
                active
                  ? 'border-primary text-primary bg-indigo-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4">
        {/* Tab 1: Ad Groups */}
        {activeTab === 'ad_groups' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Ad Groups
              </span>
            </div>
            <div className="overflow-x-auto border border-border-dim rounded">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-border-dim text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">State</th>
                    <th className="py-2 px-3 text-right">Default Bid</th>
                    <th className="py-2 px-3 text-right">Impr.</th>
                    <th className="py-2 px-3 text-right">Clicks</th>
                    <th className="py-2 px-3 text-right">Spend</th>
                    <th className="py-2 px-3 text-right">Sales</th>
                    <th className="py-2 px-3 text-right">Orders</th>
                    <th className="py-2 px-3 text-right">ACOS</th>
                    <th className="py-2 px-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim bg-white">
                  {adGroups.map((ag) => (
                    <tr key={ag.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{ag.name}</td>
                      <td className="py-2 px-3 text-slate-500">{ag.state}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        <input
                          type="number"
                          step="any"
                          defaultValue={ag.default_bid}
                          onBlur={(e) => handleAdGroupBidSave(ag.id, Number(e.target.value))}
                          className="w-16 px-1 py-0.5 border border-transparent hover:border-border-dim focus:border-primary rounded text-right font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{num(ag.impressions)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{num(ag.clicks)}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold text-spend">
                        {money(ag.spend, rules)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold text-sales">
                        {money(ag.sales, rules)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{num(ag.orders)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{pct(ag.acos)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{ratio(ag.roas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Keywords */}
        {activeTab === 'keywords' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Keywords ({keywords.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewKeywordAdGroupId(adGroups[0]?.id || '');
                  setAddKeywordModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded font-medium shadow-2xs hover:bg-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add keyword</span>
              </button>
            </div>

            {keywords.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No keywords found in this campaign.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-dim rounded">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-border-dim text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Keyword</th>
                      <th className="py-2 px-3">Match Type</th>
                      <th className="py-2 px-3">State</th>
                      <th className="py-2 px-3 text-right">Bid</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dim bg-white">
                    {keywords.map((kw) => (
                      <tr key={kw.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{kw.keyword_text}</td>
                        <td className="py-2 px-3 text-slate-600">{kw.match_type}</td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => handleKeywordStateToggle(kw)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              kw.state === 'ENABLED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {kw.state}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          <input
                            type="number"
                            step="any"
                            defaultValue={kw.bid ?? ''}
                            onBlur={(e) => handleKeywordBidSave(kw.id, Number(e.target.value))}
                            className="w-16 px-1 py-0.5 border border-transparent hover:border-border-dim focus:border-primary rounded text-right font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleKeywordStateToggle(kw)}
                            className="text-primary hover:underline text-[11px]"
                          >
                            {kw.state === 'ENABLED' ? 'Pause' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Search Terms */}
        {activeTab === 'search_terms' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Customer Search Terms
              </span>
            </div>

            {searchTerms.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No customer search terms recorded for this campaign yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-dim rounded">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-border-dim text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Search Term</th>
                      <th className="py-2 px-3 text-right">Clicks</th>
                      <th className="py-2 px-3 text-right">Impressions</th>
                      <th className="py-2 px-3 text-right">Spend</th>
                      <th className="py-2 px-3 text-right">Sales</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dim bg-white">
                    {searchTerms.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{st.search_term}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(st.clicks)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(st.impressions)}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-spend">
                          {money(st.spend, rules)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-sales">
                          {money(st.sales, rules)}
                        </td>
                        <td className="py-2 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTerm(st);
                              setAddTermAsKeywordModalOpen(true);
                            }}
                            className="text-primary hover:underline text-[11px]"
                          >
                            + Add as keyword
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTerm(st);
                              setAddTermAsNegModalOpen(true);
                            }}
                            className="text-spend hover:underline text-[11px]"
                          >
                            + Add as negative
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Negatives */}
        {activeTab === 'negatives' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Negative Keywords ({negatives.length})
              </span>
              <button
                type="button"
                onClick={() => setAddNegativeModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded font-medium shadow-2xs hover:bg-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add negative</span>
              </button>
            </div>

            {negatives.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No negative keywords defined. Exclude wasteful search terms to optimize spend.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-dim rounded">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-border-dim text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Keyword</th>
                      <th className="py-2 px-3">Match Type</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dim bg-white">
                    {negatives.map((nk) => (
                      <tr key={nk.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{nk.keyword_text}</td>
                        <td className="py-2 px-3 text-slate-600">{nk.match_type}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteNegative(nk.id)}
                            className="p-1 text-slate-400 hover:text-spend"
                            title="Remove negative keyword"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-xl">
            <span className="font-bold uppercase tracking-wider text-slate-700 block">
              Campaign Settings & Placements
            </span>

            {/* Bidding Strategy */}
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1">
                Bidding Strategy
              </label>
              <select
                value={settingsStrategy}
                onChange={(e) => setSettingsStrategy(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white text-xs font-mono"
              >
                <option value="AUTO_FOR_SALES">Dynamic bids – up and down (AUTO_FOR_SALES)</option>
                <option value="LEGACY_FOR_SALES">Dynamic bids – down only (LEGACY_FOR_SALES)</option>
                <option value="MANUAL">Fixed bids (MANUAL)</option>
              </select>
            </div>

            {/* Placements (0–900%) */}
            <div className="border border-border-dim rounded p-3 bg-slate-50/50 space-y-3">
              <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                Placement Bid Adjustments (0–900%)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Top of search (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={900}
                    value={settingsTopPct}
                    onChange={(e) => setSettingsTopPct(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-border-dim rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Rest of search (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={900}
                    value={settingsRestPct}
                    onChange={(e) => setSettingsRestPct(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-border-dim rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 mb-1">
                    Product pages (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={900}
                    value={settingsProductPagePct}
                    onChange={(e) => setSettingsProductPagePct(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-border-dim rounded bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={settingsEndDate}
                min={campaign.start_date}
                onChange={(e) => setSettingsEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white text-xs font-mono"
              />
            </div>

            {/* Target ACOS */}
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1">
                Target ACOS (%)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={settingsTargetAcos}
                onChange={(e) => setSettingsTargetAcos(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25"
                className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white text-xs font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-4 py-2 bg-primary text-white rounded font-medium shadow-xs hover:bg-indigo-800 disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        )}
      </div>

      {/* Add Keyword Modal */}
      {addKeywordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border-dim rounded-md shadow-xl max-w-sm w-full p-4 font-mono text-xs">
            <span className="font-bold text-sm block mb-3">Add Keyword</span>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-slate-500 mb-1">Ad Group</label>
                <select
                  value={newKeywordAdGroupId}
                  onChange={(e) => setNewKeywordAdGroupId(Number(e.target.value))}
                  className="w-full border rounded px-2 py-1 bg-white"
                >
                  {adGroups.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Keyword text</label>
                <input
                  type="text"
                  value={newKeywordText}
                  onChange={(e) => setNewKeywordText(e.target.value)}
                  placeholder="e.g. running shoes"
                  className="w-full border rounded px-2 py-1 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Match Type</label>
                <select
                  value={newKeywordMatch}
                  onChange={(e) => setNewKeywordMatch(e.target.value as Match)}
                  className="w-full border rounded px-2 py-1 bg-white"
                >
                  <option value="EXACT">EXACT</option>
                  <option value="PHRASE">PHRASE</option>
                  <option value="BROAD">BROAD</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Bid (Optional)</label>
                <input
                  type="number"
                  step="any"
                  value={newKeywordBid}
                  onChange={(e) => setNewKeywordBid(e.target.value)}
                  placeholder={`Default: ${rules?.symbol || '$'}1.00`}
                  className="w-full border rounded px-2 py-1 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddKeywordModalOpen(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddKeyword}
                disabled={!newKeywordText.trim()}
                className="px-3 py-1 bg-primary text-white rounded font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Negative Keyword Modal */}
      {addNegativeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border-dim rounded-md shadow-xl max-w-sm w-full p-4 font-mono text-xs">
            <span className="font-bold text-sm block mb-3">Add Negative Keyword</span>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-slate-500 mb-1">Keyword text</label>
                <input
                  type="text"
                  value={newNegativeText}
                  onChange={(e) => setNewNegativeText(e.target.value)}
                  placeholder="e.g. cheap"
                  className="w-full border rounded px-2 py-1 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Match Type</label>
                <select
                  value={newNegativeMatch}
                  onChange={(e) => setNewNegativeMatch(e.target.value as NegMatch)}
                  className="w-full border rounded px-2 py-1 bg-white"
                >
                  <option value="NEGATIVE_EXACT">NEGATIVE_EXACT</option>
                  <option value="NEGATIVE_PHRASE">NEGATIVE_PHRASE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddNegativeModalOpen(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNegative}
                disabled={!newNegativeText.trim()}
                className="px-3 py-1 bg-primary text-white rounded font-medium disabled:opacity-50"
              >
                Exclude
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Search Term as Keyword Modal */}
      {addTermAsKeywordModalOpen && selectedTerm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border-dim rounded-md shadow-xl max-w-sm w-full p-4 font-mono text-xs">
            <span className="font-bold text-sm block mb-2">Add as Keyword</span>
            <p className="text-slate-600 mb-3">
              Add &ldquo;{selectedTerm.search_term}&rdquo; as a targeted keyword.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-slate-500 mb-1">Target Ad Group</label>
                <select
                  defaultValue={selectedTerm.ad_group_id || adGroups[0]?.id}
                  id="target-term-ag"
                  className="w-full border rounded px-2 py-1 bg-white"
                >
                  {adGroups.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Match Type</label>
                <select id="target-term-match" className="w-full border rounded px-2 py-1 bg-white">
                  <option value="EXACT">EXACT</option>
                  <option value="PHRASE">PHRASE</option>
                  <option value="BROAD">BROAD</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddTermAsKeywordModalOpen(false);
                  setSelectedTerm(null);
                }}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const agSel = (document.getElementById('target-term-ag') as HTMLSelectElement)?.value;
                  const matchSel = (document.getElementById('target-term-match') as HTMLSelectElement)?.value;
                  try {
                    await createKeyword({
                      ad_group_id: Number(agSel),
                      keyword_text: selectedTerm.search_term,
                      match_type: matchSel,
                    });
                    showToast({ title: 'Keyword added', message: `Added "${selectedTerm.search_term}"`, type: 'success' });
                    setAddTermAsKeywordModalOpen(false);
                    setSelectedTerm(null);
                    loadTabData();
                  } catch (err: any) {
                    showToast({ title: 'Failed', message: err?.message, type: 'error' });
                  }
                }}
                className="px-3 py-1 bg-primary text-white rounded font-medium"
              >
                Add Keyword
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Search Term as Negative Modal */}
      {addTermAsNegModalOpen && selectedTerm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border-dim rounded-md shadow-xl max-w-sm w-full p-4 font-mono text-xs">
            <span className="font-bold text-sm block mb-2">Add as Negative</span>
            <p className="text-slate-600 mb-3">
              Exclude &ldquo;{selectedTerm.search_term}&rdquo; from triggering ads.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-slate-500 mb-1">Match Type</label>
                <select id="target-neg-match" className="w-full border rounded px-2 py-1 bg-white">
                  <option value="NEGATIVE_EXACT">NEGATIVE_EXACT</option>
                  <option value="NEGATIVE_PHRASE">NEGATIVE_PHRASE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddTermAsNegModalOpen(false);
                  setSelectedTerm(null);
                }}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const matchSel = (document.getElementById('target-neg-match') as HTMLSelectElement)?.value;
                  try {
                    await createNegativeKeyword(campaignId, {
                      keyword_text: selectedTerm.search_term,
                      match_type: matchSel,
                    });
                    showToast({ title: 'Negative added', message: `Excluded "${selectedTerm.search_term}"`, type: 'success' });
                    setAddTermAsNegModalOpen(false);
                    setSelectedTerm(null);
                    loadTabData();
                  } catch (err: any) {
                    showToast({ title: 'Failed', message: err?.message, type: 'error' });
                  }
                }}
                className="px-3 py-1 bg-spend text-white rounded font-medium"
              >
                Exclude Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center font-mono text-xs text-slate-400">
          Loading campaign details...
        </div>
      }
    >
      <CampaignDetailContent params={params} />
    </Suspense>
  );
}

