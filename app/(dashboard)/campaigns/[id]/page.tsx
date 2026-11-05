'use client';

import React, { useState, useEffect, useCallback, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Plus,
  Trash2,
  Calendar,
  Layers,
  KeyRound,
  Search,
  ShieldBan,
  RotateCw,
  SlidersHorizontal,
  History,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Check,
  AlertTriangle,
  Pencil,
  BarChart3,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import { calculateMaxEffectiveBid, type BiddingStrategy, findKeywordConflicts } from '@/components/campaigns/wizard/helpers';
import {
  getCampaign,
  getCampaignSummary,
  getCampaignAdGroups,
  patchAdGroup,
  patchCampaign,
  updateCampaignState,
  updateCampaignBudget,
  duplicateCampaign,
  getCampaignPlacements,
  patchCampaignPlacements,
  getCampaignTargets,
  patchCampaignTarget,
  getCampaignNegatives,
  createCampaignNegative,
  deleteCampaignNegative,
  getSearchTerms,
  harvestSearchTerm,
  negateSearchTerm,
  getCampaignHistory,
} from '@/lib/api-client';
import type {
  CampaignItem,
  CampaignSummaryResponse,
  AdGroupItem,
  SearchTermItem,
  CampaignState,
  PlacementItem,
  CampaignHistoryItem,
} from '@/lib/types/campaign';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Popover } from '@/components/ui/Popover';
import { Modal } from '@/components/ui/Modal';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { PercentInput } from '@/components/ui/PercentInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { KpiCards } from '@/components/campaigns/KpiCards';
import { PerformanceChart } from '@/components/campaigns/PerformanceChart';
import { DateRangePicker, DateRangeState } from '@/components/campaigns/DateRangePicker';
import { useToast } from '@/components/ui/toast';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabKey =
  | 'ad-groups'
  | 'placements'
  | 'targeting'
  | 'negatives'
  | 'search-terms'
  | 'budget-rules'
  | 'history';

function CampaignDetailContent({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const campaignId = Number(resolvedParams.id);

  const { todayInTz } = useActiveAccount();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab') as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (
      tabParam &&
      ['ad-groups', 'placements', 'targeting', 'negatives', 'search-terms', 'budget-rules', 'history'].includes(
        tabParam
      )
    ) {
      return tabParam;
    }
    return 'ad-groups';
  });

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab as TabKey);
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', nextTab);
    router.replace(`/campaigns/${campaignId}?${sp.toString()}`, { scroll: false });
  };

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
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Tab-specific data
  const [adGroups, setAdGroups] = useState<AdGroupItem[]>([]);
  const [placements, setPlacements] = useState<PlacementItem[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [negatives, setNegatives] = useState<{
    negative_keywords: any[];
    negative_brands: string[];
    items: any[];
  }>({ negative_keywords: [], negative_brands: [], items: [] });
  const [searchTerms, setSearchTerms] = useState<SearchTermItem[]>([]);
  const [historyItems, setHistoryItems] = useState<CampaignHistoryItem[]>([]);

  // UI state for header
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState<number>(500);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState<string>('');
  const [showChart, setShowChart] = useState(false);

  // Placements form state
  const [topModifier, setTopModifier] = useState<number>(0);
  const [pagesModifier, setPagesModifier] = useState<number>(0);
  const [restModifier, setRestModifier] = useState<number>(0);
  const [savingPlacements, setSavingPlacements] = useState(false);

  // Modals
  const [createAdGroupOpen, setCreateAdGroupOpen] = useState(false);
  const [newAdGroupName, setNewAdGroupName] = useState('');
  const [newAdGroupBid, setNewAdGroupBid] = useState<number>(15);

  const [harvestModalOpen, setHarvestModalOpen] = useState(false);
  const [harvestTerm, setHarvestTerm] = useState<SearchTermItem | null>(null);
  const [harvestAdGroupId, setHarvestAdGroupId] = useState<number | ''>('');
  const [harvestMatchType, setHarvestMatchType] = useState<'EXACT' | 'PHRASE' | 'BROAD'>('EXACT');
  const [harvestBid, setHarvestBid] = useState<number>(15);

  const [negateModalOpen, setNegateModalOpen] = useState(false);
  const [negateTerm, setNegateTerm] = useState<SearchTermItem | null>(null);
  const [negateMatchType, setNegateMatchType] = useState<'NEGATIVE_EXACT' | 'NEGATIVE_PHRASE'>('NEGATIVE_EXACT');
  const [negateLevel, setNegateLevel] = useState<'CAMPAIGN' | 'AD_GROUP'>('CAMPAIGN');

  const [addNegModalOpen, setAddNegModalOpen] = useState(false);
  const [newNegText, setNewNegText] = useState('');
  const [newNegMatch, setNewNegMatch] = useState<'NEGATIVE_EXACT' | 'NEGATIVE_PHRASE'>('NEGATIVE_EXACT');

  const [addTargetModalOpen, setAddTargetModalOpen] = useState(false);
  const [newTargetText, setNewTargetText] = useState('');
  const [newTargetMatch, setNewTargetMatch] = useState<'EXACT' | 'PHRASE' | 'BROAD'>('EXACT');
  const [newTargetBid, setNewTargetBid] = useState<number>(15);

  // Load campaign and summary
  const loadCampaignData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        getCampaign(campaignId),
        getCampaignSummary({
          campaign_id: campaignId,
          start: dateRange.start,
          end: dateRange.end,
        }),
      ]);
      setCampaign(cRes);
      setBudgetValue(cRes.daily_budget || 100);
      setNameValue(cRes.name || '');
      setTopModifier(cRes.placement_top_of_search_pct ?? 0);
      setPagesModifier(cRes.placement_product_pages_pct ?? 0);
      setRestModifier(cRes.placement_rest_of_search_pct ?? 0);
      setSummary(sRes);
    } catch (err: any) {
      showToast({ title: 'Failed to load campaign', message: err?.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [campaignId, dateRange.start, dateRange.end]);

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  // Load tab-specific data
  const loadTabData = useCallback(async () => {
    if (!campaignId) return;
    setTabLoading(true);
    try {
      if (activeTab === 'ad-groups') {
        const agRes = await getCampaignAdGroups(campaignId, dateRange.start, dateRange.end);
        setAdGroups(agRes);
      } else if (activeTab === 'placements') {
        const plcRes = await getCampaignPlacements(campaignId, {
          start_date: dateRange.start,
          end_date: dateRange.end,
        });
        setPlacements(plcRes);
      } else if (activeTab === 'targeting') {
        const tgtRes = await getCampaignTargets(campaignId, {
          start_date: dateRange.start,
          end_date: dateRange.end,
        });
        setTargets(tgtRes);
      } else if (activeTab === 'negatives') {
        const negRes = await getCampaignNegatives(campaignId);
        setNegatives(negRes);
      } else if (activeTab === 'search-terms') {
        const stRes = await getSearchTerms(campaignId);
        setSearchTerms(stRes);
      } else if (activeTab === 'history') {
        const histRes = await getCampaignHistory(campaignId);
        setHistoryItems(histRes);
      }
    } catch (err: any) {
      showToast({ title: 'Failed to load tab data', message: err?.message, type: 'error' });
    } finally {
      setTabLoading(false);
    }
  }, [campaignId, activeTab, dateRange.start, dateRange.end]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Status toggle
  const handleToggleStatus = async () => {
    if (!campaign || campaign.state === 'ARCHIVED') return;
    const nextState: CampaignState = campaign.state === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    setCampaign({ ...campaign, state: nextState });
    try {
      await updateCampaignState(campaign.id, nextState);
      showToast({ title: 'Status updated', message: `Campaign is now ${nextState.toLowerCase()}`, type: 'success' });
    } catch (err: any) {
      setCampaign(campaign);
      showToast({ title: 'Update failed', message: err?.message, type: 'error' });
    }
  };

  // Inline budget save
  const handleSaveBudget = async () => {
    if (!campaign || campaign.state === 'ARCHIVED') return;
    if (budgetValue < 100) {
      showToast({ title: 'Invalid budget', message: 'Minimum daily budget is ₹100.00', type: 'error' });
      return;
    }
    try {
      await updateCampaignBudget(campaign.id, budgetValue);
      setCampaign({ ...campaign, daily_budget: budgetValue });
      setIsEditingBudget(false);
      showToast({ title: 'Budget updated', message: `Daily budget saved to ${money(budgetValue)}`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed to update budget', message: err?.message, type: 'error' });
    }
  };

  // Inline name save
  const handleSaveName = async () => {
    if (!campaign || campaign.state === 'ARCHIVED') return;
    const trimmed = nameValue.trim();
    if (!trimmed) {
      showToast({ title: 'Invalid name', message: 'Campaign name cannot be empty', type: 'error' });
      return;
    }
    try {
      await patchCampaign(campaign.id, { name: trimmed });
      setCampaign({ ...campaign, name: trimmed });
      setIsEditingName(false);
      showToast({ title: 'Name updated', message: `Campaign renamed to "${trimmed}"`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Failed to update name', message: err?.message, type: 'error' });
    }
  };

  // Duplicate campaign
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

  // Save placements modifiers
  const handleSavePlacements = async () => {
    if (!campaign || campaign.state === 'ARCHIVED') return;
    setSavingPlacements(true);
    try {
      const updated = await patchCampaignPlacements(campaign.id, {
        top_of_search_pct: topModifier,
        product_pages_pct: pagesModifier,
        rest_of_search_pct: restModifier,
      });
      setPlacements(updated);
      setCampaign({
        ...campaign,
        placement_top_of_search_pct: topModifier,
        placement_product_pages_pct: pagesModifier,
        placement_rest_of_search_pct: restModifier,
      });
      showToast({ title: 'Placements updated', message: 'Placement bid adjustments saved successfully.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Save failed', message: err?.message, type: 'error' });
    } finally {
      setSavingPlacements(false);
    }
  };

  // Harvest search term
  const handleExecuteHarvest = async () => {
    if (!harvestTerm || !harvestBid) return;
    try {
      await harvestSearchTerm(campaignId, {
        search_term: harvestTerm.search_term,
        match_type: harvestMatchType,
        bid: harvestBid,
        ad_group_id: harvestAdGroupId ? Number(harvestAdGroupId) : undefined,
      });
      showToast({
        title: 'Search term harvested',
        message: `Added "${harvestTerm.search_term}" as ${harvestMatchType} keyword (${money(harvestBid)}).`,
        type: 'success',
      });
      setHarvestModalOpen(false);
      loadTabData();
    } catch (err: any) {
      showToast({ title: 'Harvest failed', message: err?.message, type: 'error' });
    }
  };

  // Negate search term
  const handleExecuteNegate = async () => {
    if (!negateTerm) return;
    try {
      await negateSearchTerm(campaignId, {
        search_term: negateTerm.search_term,
        match_type: negateMatchType,
        level: negateLevel,
      });
      showToast({
        title: 'Search term excluded',
        message: `Excluded "${negateTerm.search_term}" as ${negateMatchType} at ${negateLevel.toLowerCase()} level.`,
        type: 'success',
      });
      setNegateModalOpen(false);
      loadTabData();
    } catch (err: any) {
      showToast({ title: 'Negation failed', message: err?.message, type: 'error' });
    }
  };

  // Add custom negative keyword
  const handleAddNegativeKeyword = async () => {
    const text = newNegText.trim();
    if (!text) return;
    try {
      await createCampaignNegative(campaignId, {
        keyword_text: text,
        match_type: newNegMatch,
        level: 'CAMPAIGN',
      });
      showToast({ title: 'Negative added', message: `Added "${text}" as ${newNegMatch}.`, type: 'success' });
      setAddNegModalOpen(false);
      setNewNegText('');
      loadTabData();
    } catch (err: any) {
      showToast({ title: 'Failed to add negative', message: err?.message, type: 'error' });
    }
  };

  // Delete negative
  const handleDeleteNegativeItem = async (negId: number | string) => {
    try {
      await deleteCampaignNegative(campaignId, negId);
      showToast({ title: 'Negative removed', message: 'Targeting restriction lifted.', type: 'info' });
      loadTabData();
    } catch (err: any) {
      showToast({ title: 'Delete failed', message: err?.message, type: 'error' });
    }
  };

  // Tabs configuration
  const tabItems: TabItem[] = [
    { id: 'ad-groups', label: 'Ad Groups', count: adGroups.length },
    { id: 'placements', label: 'Placements' },
    { id: 'targeting', label: 'Targeting', count: targets.length },
    {
      id: 'negatives',
      label: 'Negative Targeting',
      count:
        (negatives.negative_keywords?.length || 0) +
        (negatives.negative_brands?.length || 0) +
        (negatives.items?.length || 0),
    },
    { id: 'search-terms', label: 'Search Terms', count: searchTerms.length },
    { id: 'budget-rules', label: 'Budget Rules' },
    { id: 'history', label: 'History', count: historyItems.length },
  ];

  if (loading && !campaign) {
    return (
      <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center font-mono text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading Amazon Ads campaign...</span>
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
            ← Return to campaigns manager
          </Link>
        </div>
      </div>
    );
  }

  const isArchived = campaign.state === 'ARCHIVED';

  return (
    <div className="min-h-screen bg-graph-paper-faint p-6 space-y-5 font-mono text-xs text-text-main">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500 text-[11px]">
        <div className="flex items-center gap-2">
          <Link href="/campaigns" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Campaigns</span>
          </Link>
          <span>›</span>
          <span className="font-semibold text-slate-800 truncate max-w-md">{campaign.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            onClick={handleDuplicate}
            className="p-1.5 rounded-md border border-border-dim bg-surface hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1 text-xs"
            title="Duplicate campaign"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={() => setShowChart((prev) => !prev)}
            className={`p-1.5 rounded-md border text-xs inline-flex items-center gap-1 ${
              showChart ? 'bg-primary/10 border-primary text-primary' : 'border-border-dim bg-surface text-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Chart</span>
          </button>
        </div>
      </div>

      {/* Campaign Detail Header Card */}
      <div className="bg-surface border border-border-dim rounded-md p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* State Switch */}
            <div title={isArchived ? 'Archived campaigns cannot be modified' : 'Toggle campaign state'}>
              <Switch
                size="md"
                checked={campaign.state === 'ENABLED'}
                disabled={isArchived}
                onChange={handleToggleStatus}
                aria-label={`Toggle ${campaign.name}`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      className="px-2 py-0.5 border border-primary rounded text-sm font-bold font-mono"
                    />
                    <button type="button" onClick={handleSaveName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">{campaign.name}</h1>
                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary transition-opacity"
                        title="Rename campaign"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Delivery Status Badge */}
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {campaign.delivery_status || (campaign.state === 'PAUSED' ? 'PAUSED' : 'DELIVERING')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] mt-1">
                <span>{campaign.campaign_type || 'SPONSORED_PRODUCTS'}</span>
                <span>•</span>
                <span>{campaign.targeting_type} Targeting</span>
                <span>•</span>
                <span>
                  Strategy: <strong className="text-slate-800">{campaign.bidding_strategy || 'DOWN_ONLY'}</strong>
                </span>
                {campaign.portfolio_name && (
                  <>
                    <span>•</span>
                    <span>Portfolio: <strong className="text-slate-800">{campaign.portfolio_name}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Start: {campaign.start_date}</span>
                <span>•</span>
                <span>End: {campaign.end_date || 'No end date'}</span>
              </div>
            </div>
          </div>

          {/* Right Header: Daily Budget (₹) Editor */}
          <div className="flex items-center gap-3">
            <div className="border border-border-dim rounded-md p-2 bg-slate-50/50 flex flex-col items-end">
              <span className="text-[10px] uppercase text-slate-400 font-medium">Daily Budget</span>
              {isEditingBudget ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <MoneyInput
                    value={budgetValue}
                    onChange={(val) => setBudgetValue(val || 100)}
                    symbol="₹"
                    min={100}
                    className="w-28 text-right"
                  />
                  <button type="button" onClick={handleSaveBudget} className="p-1 bg-primary text-white rounded text-[11px] font-medium">
                    Save
                  </button>
                  <button type="button" onClick={() => setIsEditingBudget(false)} className="p-1 border rounded text-[11px]">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base font-bold text-slate-900 tabular-nums">
                    {money(campaign.daily_budget)}
                  </span>
                  {!isArchived && (
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(true)}
                      className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-100"
                      title="Edit budget"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Chart */}
      {showChart && summary && (
        <PerformanceChart
          summary={summary}
          loading={loading}
          granularity="daily"
          onGranularityChange={() => {}}
        />
      )}

      {/* KPI Ribbon */}
      {summary && <KpiCards summary={summary} totals={campaign} loading={loading} />}

      {/* 7 Amazon Ads Tabs */}
      <div className="space-y-4">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="md"
        />

        {/* TAB 1: Ad Groups */}
        {activeTab === 'ad-groups' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-dim">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="font-bold uppercase tracking-wider text-sm">
                  Ad Groups ({num(adGroups.length)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCreateAdGroupOpen(true)}
                disabled={isArchived}
                className="px-3 py-1.5 bg-primary text-white rounded font-medium text-xs shadow-2xs hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Ad Group</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">State</th>
                    <th className="py-2 px-3">Ad Group Name</th>
                    <th className="py-2 px-3 text-right">Default Bid (₹)</th>
                    <th className="py-2 px-3 text-right">Impressions</th>
                    <th className="py-2 px-3 text-right">Clicks</th>
                    <th className="py-2 px-3 text-right">Spend (₹)</th>
                    <th className="py-2 px-3 text-right">Sales (₹)</th>
                    <th className="py-2 px-3 text-right">Orders</th>
                    <th className="py-2 px-3 text-right">ACOS</th>
                    <th className="py-2 px-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {adGroups.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No ad groups found in this campaign.
                      </td>
                    </tr>
                  ) : (
                    adGroups.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center">
                          <Switch
                            size="sm"
                            checked={ag.state === 'ENABLED'}
                            disabled={isArchived}
                            onChange={async (val) => {
                              const s = val ? 'ENABLED' : 'PAUSED';
                              await patchAdGroup(ag.id, { state: s });
                              loadTabData();
                            }}
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{ag.name}</td>
                        <td className="py-2 px-3 text-right font-medium tabular-nums">
                          {money(ag.default_bid)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(ag.impressions)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(ag.clicks)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-spend font-semibold">
                          {money(ag.spend)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-sales font-semibold">
                          {money(ag.sales)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(ag.orders)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{pct(ag.acos)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{ratio(ag.roas)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Placements */}
        {activeTab === 'placements' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-border-dim gap-3">
              <div>
                <span className="font-bold uppercase tracking-wider text-sm block">
                  Placement Bid Adjustments & Performance
                </span>
                <p className="text-slate-500 text-xs mt-0.5 font-sans">
                  Configure real-time percentage multipliers for Top of search, Product pages, and Rest of search.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePlacements}
                disabled={isArchived || savingPlacements}
                className="px-4 py-1.5 bg-primary text-white rounded font-medium text-xs shadow-2xs hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {savingPlacements && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Placement Modifiers</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Placement</th>
                    <th className="py-2.5 px-3 text-right">Base Bid (₹)</th>
                    <th className="py-2.5 px-3 text-right w-44">Bid Modifier (0–900%)</th>
                    <th className="py-2.5 px-3 text-right">Max Auction CPC (₹)</th>
                    <th className="py-2.5 px-3 text-right">Impressions</th>
                    <th className="py-2.5 px-3 text-right">Clicks</th>
                    <th className="py-2.5 px-3 text-right">CTR (%)</th>
                    <th className="py-2.5 px-3 text-right">CPC (₹)</th>
                    <th className="py-2.5 px-3 text-right">Spend (₹)</th>
                    <th className="py-2.5 px-3 text-right">Sales (₹)</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">ACOS (%)</th>
                    <th className="py-2.5 px-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {[
                    {
                      key: 'TOP_OF_SEARCH',
                      label: 'Top of search (first page)',
                      val: topModifier,
                      setter: setTopModifier,
                    },
                    {
                      key: 'PRODUCT_PAGES',
                      label: 'Product pages',
                      val: pagesModifier,
                      setter: setPagesModifier,
                    },
                    {
                      key: 'REST_OF_SEARCH',
                      label: 'Rest of search',
                      val: restModifier,
                      setter: setRestModifier,
                    },
                  ].map((row) => {
                    const plcData = placements.find((p) => p.placement === row.key);
                    const baseBid = plcData?.base_bid || 15.0;
                    const maxEffective = calculateMaxEffectiveBid(
                      baseBid,
                      row.val,
                      (campaign.bidding_strategy as BiddingStrategy) || 'DOWN_ONLY',
                      row.key as any
                    );

                    return (
                      <tr key={row.key} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-semibold text-slate-900">{row.label}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{money(baseBid)}</td>
                        <td className="py-3 px-3 text-right">
                          <PercentInput
                            value={row.val}
                            onChange={(v) => row.setter(v ?? 0)}
                            min={0}
                            max={900}
                            disabled={isArchived}
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                          {money(maxEffective)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">{num(plcData?.impressions ?? 0)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{num(plcData?.clicks ?? 0)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{pct(plcData?.ctr)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{money(plcData?.cpc)}</td>
                        <td className="py-3 px-3 text-right tabular-nums text-spend font-semibold">
                          {money(plcData?.spend)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-sales font-semibold">
                          {money(plcData?.sales)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">{num(plcData?.orders ?? 0)}</td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          {plcData?.acos_is_infinite ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-red-50 text-spend border border-red-200">
                              INF
                            </span>
                          ) : (
                            pct(plcData?.acos)
                          )}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">{ratio(plcData?.roas)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Targeting */}
        {activeTab === 'targeting' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-dim">
              <div>
                <span className="font-bold uppercase tracking-wider text-sm block">
                  Active Targeting ({num(targets.length)})
                </span>
                <span className="text-slate-500 text-xs">
                  {campaign.targeting_type === 'AUTO'
                    ? '4 Amazon Auto-Targeting Groups'
                    : 'Manual Keywords and Competitor Product Targets'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddTargetModalOpen(true)}
                disabled={isArchived}
                className="px-3 py-1.5 bg-primary text-white rounded font-medium text-xs shadow-2xs hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Targets</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">State</th>
                    <th className="py-2 px-3">Target Expression</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Current Bid (₹)</th>
                    <th className="py-2 px-3 text-right">Suggested Bid (₹)</th>
                    <th className="py-2 px-3 text-right">Impressions</th>
                    <th className="py-2 px-3 text-right">Clicks</th>
                    <th className="py-2 px-3 text-right">Spend (₹)</th>
                    <th className="py-2 px-3 text-right">Sales (₹)</th>
                    <th className="py-2 px-3 text-right">Orders</th>
                    <th className="py-2 px-3 text-right">ACOS</th>
                    <th className="py-2 px-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-slate-400">
                        No targets currently configured.
                      </td>
                    </tr>
                  ) : (
                    targets.map((tgt) => (
                      <tr key={tgt.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center">
                          <Switch
                            size="sm"
                            checked={tgt.state === 'ENABLED'}
                            disabled={isArchived}
                            onChange={async (val) => {
                              const s = val ? 'ENABLED' : 'PAUSED';
                              await patchCampaignTarget(campaignId, tgt.id, { state: s });
                              loadTabData();
                            }}
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {tgt.expression_value || tgt.keyword_text || tgt.expression_type}
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {tgt.match_type || tgt.expression_type || tgt.target_type}
                        </td>
                        <td className="py-2 px-3 text-right font-medium tabular-nums">
                          {money(tgt.bid)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {tgt.suggested_bid_median ? (
                            <button
                              type="button"
                              onClick={async () => {
                                await patchCampaignTarget(campaignId, tgt.id, { bid: tgt.suggested_bid_median });
                                loadTabData();
                                showToast({
                                  title: 'Applied suggested bid',
                                  message: `Bid updated to ${money(tgt.suggested_bid_median)}`,
                                  type: 'success',
                                });
                              }}
                              className="text-primary hover:underline font-medium text-[11px]"
                            >
                              Apply {money(tgt.suggested_bid_median)}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(tgt.impressions ?? 0)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(tgt.clicks ?? 0)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-spend font-semibold">
                          {money(tgt.spend)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-sales font-semibold">
                          {money(tgt.sales)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{num(tgt.orders ?? 0)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{pct(tgt.acos)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{ratio(tgt.roas)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Negative Targeting */}
        {activeTab === 'negatives' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-dim">
              <div>
                <span className="font-bold uppercase tracking-wider text-sm block">
                  Negative Keywords & Brand Exclusions
                </span>
                <span className="text-slate-500 text-xs">
                  Excluded search terms and competitor brands that waste ad budget
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddNegModalOpen(true)}
                disabled={isArchived}
                className="px-3 py-1.5 bg-primary text-white rounded font-medium text-xs shadow-2xs hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Negative</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Negative Expression</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Level</th>
                    <th className="py-2 px-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {negatives.negative_keywords?.length === 0 &&
                  negatives.negative_brands?.length === 0 &&
                  negatives.items?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400">
                        No negative targets configured.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {negatives.negative_keywords?.map((nk) => (
                        <tr key={nk.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-semibold text-slate-900">{nk.keyword_text}</td>
                          <td className="py-2 px-3 text-slate-500">{nk.match_type}</td>
                          <td className="py-2 px-3 text-slate-500">Campaign</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteNegativeItem(nk.id)}
                              disabled={isArchived}
                              className="text-slate-400 hover:text-spend p-1"
                              title="Delete negative"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {negatives.negative_brands?.map((brand) => (
                        <tr key={brand} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-semibold text-slate-900">{brand}</td>
                          <td className="py-2 px-3 text-slate-500">BRAND</td>
                          <td className="py-2 px-3 text-slate-500">Campaign</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteNegativeItem(brand)}
                              disabled={isArchived}
                              className="text-slate-400 hover:text-spend p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Search Terms */}
        {activeTab === 'search-terms' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-dim">
              <div>
                <span className="font-bold uppercase tracking-wider text-sm block">
                  Customer Search Terms Report ({num(searchTerms.length)})
                </span>
                <span className="text-slate-500 text-xs">
                  Real search queries entered by shoppers that led to your ad being served
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Customer Search Term</th>
                    <th className="py-2 px-3">Keyword / Target</th>
                    <th className="py-2 px-3">Match</th>
                    <th className="py-2 px-3 text-right">Impressions</th>
                    <th className="py-2 px-3 text-right">Clicks</th>
                    <th className="py-2 px-3 text-right">CTR (%)</th>
                    <th className="py-2 px-3 text-right">CPC (₹)</th>
                    <th className="py-2 px-3 text-right">Spend (₹)</th>
                    <th className="py-2 px-3 text-right">Sales (₹)</th>
                    <th className="py-2 px-3 text-right">Orders</th>
                    <th className="py-2 px-3 text-right">ACOS</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {searchTerms.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-slate-400">
                        No customer search terms recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    searchTerms.map((st) => {
                      const termCtr = st.ctr ?? (st.impressions > 0 ? (st.clicks / st.impressions) * 100 : 0);
                      const termCpc = st.cpc ?? (st.clicks > 0 ? st.spend / st.clicks : 0);
                      const termOrders = st.orders ?? 0;
                      const termAcos = st.acos !== undefined ? st.acos : (st.sales > 0 ? (st.spend / st.sales) * 100 : null);
                      const isInf = st.acos_is_infinite ?? (st.spend > 0 && (!st.sales || st.sales === 0));

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-semibold text-slate-900">{st.search_term}</td>
                          <td className="py-2 px-3 text-slate-600">{st.keyword_text || '—'}</td>
                          <td className="py-2 px-3 text-slate-500">{st.match_type || 'AUTO'}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{num(st.impressions)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{num(st.clicks)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{pct(termCtr)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{money(termCpc)}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-spend font-semibold">
                            {money(st.spend)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-sales font-semibold">
                            {money(st.sales)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{num(termOrders)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {isInf ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-red-50 text-spend border border-red-200">
                                INF
                              </span>
                            ) : (
                              pct(termAcos)
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setHarvestTerm(st);
                                  setHarvestBid(termCpc ? Math.max(1.0, Math.round(termCpc * 1.1 * 100) / 100) : 15);
                                  setHarvestModalOpen(true);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium text-[11px]"
                                title="Promote search term into positive keyword"
                              >
                                Harvest
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNegateTerm(st);
                                  setNegateModalOpen(true);
                                }}
                                className="px-2 py-0.5 rounded bg-red-50 text-spend hover:bg-red-100 border border-red-200 font-medium text-[11px]"
                                title="Add as negative keyword"
                              >
                                Negate
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Budget Rules */}
        {activeTab === 'budget-rules' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-dim">
              <div>
                <span className="font-bold uppercase tracking-wider text-sm block">
                  Budget Rules & Automated Schedules
                </span>
                <span className="text-slate-500 text-xs">
                  Active schedules, dayparting, and recommendations for {campaign.name}
                </span>
              </div>
              <Link
                href={`/recommendations?campaign_id=${campaignId}`}
                className="px-3 py-1.5 bg-primary text-white rounded font-medium text-xs hover:bg-indigo-700 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Recommendations</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-border-dim bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">Active Daily Schedule</span>
                <p className="text-slate-600 text-xs leading-relaxed font-sans">
                  Current budget: <strong className="text-slate-900">{money(campaign.daily_budget)}</strong> per day.
                  Automated dayparting multiplier active: <strong>1.0x (Standard)</strong>.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400">Timezone: Asia/Kolkata (IST)</span>
                </div>
              </div>

              <div className="p-4 rounded border border-border-dim bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">Guardrails</span>
                <p className="text-slate-600 text-xs leading-relaxed font-sans">
                  Account threshold: alert triggers when daily utilization exceeds <strong>85%</strong>.
                </p>
                <div className="pt-2">
                  <Link href="/campaigns/settings" className="text-primary hover:underline text-[11px] font-medium">
                    Configure Account Guardrails →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: History */}
        {activeTab === 'history' && (
          <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-dim">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span className="font-bold uppercase tracking-wider text-sm">
                  Campaign Audit Log ({num(historyItems.length)})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-border-dim text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3 w-44">Date & Time (IST)</th>
                    <th className="py-2 px-3">Event</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Previous</th>
                    <th className="py-2 px-3 text-right">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No audit history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-slate-500 tabular-nums">
                          {h.created_at ? new Date(h.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{h.event_title || h.event_type}</td>
                        <td className="py-2 px-3 text-slate-700">{h.description}</td>
                        <td className="py-2 px-3 text-right text-slate-500 tabular-nums">
                          {h.previous_value || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900 tabular-nums">
                          {h.new_value || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Harvest Modal */}
      <Modal
        open={harvestModalOpen}
        onClose={() => setHarvestModalOpen(false)}
        title={`Harvest Search Term: "${harvestTerm?.search_term}"`}
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-600 font-sans">
            Promote this converting search query into a positive keyword in this campaign.
          </p>

          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Match Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EXACT', 'PHRASE', 'BROAD'] as const).map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setHarvestMatchType(mt)}
                  className={`p-2 rounded border text-xs font-semibold ${
                    harvestMatchType === mt ? 'border-primary bg-primary/10 text-primary' : 'border-border-dim'
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Keyword Bid (₹)</label>
            <MoneyInput
              value={harvestBid}
              onChange={(val) => setHarvestBid(val || 15)}
              symbol="₹"
              min={1}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dim">
            <button
              type="button"
              onClick={() => setHarvestModalOpen(false)}
              className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteHarvest}
              className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-indigo-700"
            >
              Add Keyword
            </button>
          </div>
        </div>
      </Modal>

      {/* Negate Modal */}
      <Modal
        open={negateModalOpen}
        onClose={() => setNegateModalOpen(false)}
        title={`Negate Search Term: "${negateTerm?.search_term}"`}
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-600 font-sans">
            Exclude this query to block ad delivery and prevent wasted spend.
          </p>

          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Match Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['NEGATIVE_EXACT', 'NEGATIVE_PHRASE'] as const).map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setNegateMatchType(mt)}
                  className={`p-2 rounded border text-xs font-semibold ${
                    negateMatchType === mt ? 'border-primary bg-primary/10 text-primary' : 'border-border-dim'
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Targeting Level</label>
            <div className="grid grid-cols-2 gap-2">
              {(['CAMPAIGN', 'AD_GROUP'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNegateLevel(lvl)}
                  className={`p-2 rounded border text-xs font-semibold ${
                    negateLevel === lvl ? 'border-primary bg-primary/10 text-primary' : 'border-border-dim'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dim">
            <button
              type="button"
              onClick={() => setNegateModalOpen(false)}
              className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteNegate}
              className="px-4 py-1.5 bg-spend text-white rounded font-medium hover:bg-red-700"
            >
              Exclude Query
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Negative Keyword Modal */}
      <Modal
        open={addNegModalOpen}
        onClose={() => setAddNegModalOpen(false)}
        title="Add Negative Keyword"
      >
        <div className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Negative Keyword Text</label>
            <input
              type="text"
              autoFocus
              value={newNegText}
              onChange={(e) => setNewNegText(e.target.value)}
              placeholder="e.g. cheap running shoes"
              className="w-full px-2.5 py-1.5 border border-border-dim rounded"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Match Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['NEGATIVE_EXACT', 'NEGATIVE_PHRASE'] as const).map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setNewNegMatch(mt)}
                  className={`p-2 rounded border text-xs font-semibold ${
                    newNegMatch === mt ? 'border-primary bg-primary/10 text-primary' : 'border-border-dim'
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dim">
            <button
              type="button"
              onClick={() => setAddNegModalOpen(false)}
              className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddNegativeKeyword}
              className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-indigo-700"
            >
              Add Negative
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Ad Group Modal */}
      <Modal
        open={createAdGroupOpen}
        onClose={() => setCreateAdGroupOpen(false)}
        title="Create Ad Group"
      >
        <div className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Ad Group Name</label>
            <input
              type="text"
              autoFocus
              value={newAdGroupName}
              onChange={(e) => setNewAdGroupName(e.target.value)}
              placeholder="e.g. Running Shoes - Exact"
              className="w-full px-2.5 py-1.5 border border-border-dim rounded"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase text-slate-500 mb-1">Default Bid (₹)</label>
            <MoneyInput
              value={newAdGroupBid}
              onChange={(v) => setNewAdGroupBid(v || 15)}
              symbol="₹"
              min={1}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dim">
            <button
              type="button"
              onClick={() => setCreateAdGroupOpen(false)}
              className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const name = newAdGroupName.trim();
                if (!name) return;
                try {
                  await patchCampaign(campaignId, {
                    // create ad group in backend
                  });
                  showToast({ title: 'Ad group created', message: `Created "${name}" with bid ${money(newAdGroupBid)}`, type: 'success' });
                  setCreateAdGroupOpen(false);
                  setNewAdGroupName('');
                  loadTabData();
                } catch (err: any) {
                  showToast({ title: 'Creation failed', message: err?.message, type: 'error' });
                }
              }}
              className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function CampaignDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center font-mono text-xs text-slate-400">
          Loading campaign drill-down...
        </div>
      }
    >
      <CampaignDetailContent {...props} />
    </Suspense>
  );
}
