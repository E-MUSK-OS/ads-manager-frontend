'use client';

import React, { useState, useEffect, useCallback, use, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  Search,
  Pencil,
  BarChart3,
  Check,
  AlertTriangle,
  RotateCw,
  Info,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct, ratio, num } from '@/lib/format';
import {
  getCampaign,
  getCampaignSummary,
  getCampaignAdGroups,
  getCampaignPlacements,
  getCampaignHistory,
  patchCampaign,
  updateCampaignState,
} from '@/lib/api-client';
import type {
  CampaignItem,
  CampaignSummaryResponse,
  AdGroupItem,
  CampaignState,
  PlacementItem,
  CampaignHistoryItem,
} from '@/lib/types/campaign';
import type { MetricKey } from '@/components/campaigns/wizard/helpers';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { KpiCards } from '@/components/campaigns/KpiCards';
import { PerformanceChart } from '@/components/campaigns/PerformanceChart';
import { DateRangePicker, DateRangeState } from '@/components/campaigns/DateRangePicker';
import { useToast } from '@/components/ui/toast';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

type TabKey = 'ad-groups' | 'placements' | 'settings' | 'history';

export function CampaignDetailContent({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = typeof (params as any)?.then === 'function' ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const campaignId = Number(resolvedParams.id);

  const { todayInTz } = useActiveAccount();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab') as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (tabParam && ['ad-groups', 'placements', 'settings', 'history'].includes(tabParam)) {
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

  // Chart controls
  const [showChart, setShowChart] = useState(false);
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartMetrics, setChartMetrics] = useState<MetricKey[]>(['spend', 'sales', 'acos', 'roas']);

  const handleSelectMetric = (metric: MetricKey) => {
    setChartMetrics((prev) => {
      if (prev.includes(metric)) {
        if (prev.length <= 1) return prev; // Keep at least one metric
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric]; // Allow selecting all metrics
    });
  };

  // Data states
  const [campaign, setCampaign] = useState<CampaignItem | null>(null);
  const [summary, setSummary] = useState<CampaignSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Tab-specific data
  const [adGroups, setAdGroups] = useState<AdGroupItem[]>([]);
  const [adGroupSearch, setAdGroupSearch] = useState('');
  const [adGroupStatusFilter, setAdGroupStatusFilter] = useState<'ALL' | 'ENABLED' | 'PAUSED'>('ALL');
  const [placements, setPlacements] = useState<PlacementItem[]>([]);
  const [historyItems, setHistoryItems] = useState<CampaignHistoryItem[]>([]);

  // Settings form states
  const [formName, setFormName] = useState('');
  const [formState, setFormState] = useState<CampaignState>('ENABLED');
  const [formBudget, setFormBudget] = useState<number>(500);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState<string | null>(null);
  const [formNoEndDate, setFormNoEndDate] = useState(true);
  const [formStrategy, setFormStrategy] = useState<string>('DOWN_ONLY');
  const [savingSettings, setSavingSettings] = useState(false);

  // Quick edit modals (Q6)
  const [quickEditNameOpen, setQuickEditNameOpen] = useState(false);
  const [quickNameValue, setQuickNameValue] = useState('');
  const [quickEditBudgetOpen, setQuickEditBudgetOpen] = useState(false);
  const [quickBudgetValue, setQuickBudgetValue] = useState<number>(500);

  // Confirmation dialog (Q6)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm Changes',
    variant: 'primary',
    onConfirm: async () => {},
  });

  // Load campaign & summary
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
          granularity,
        }),
      ]);
      setCampaign(cRes);
      setSummary(sRes);

      // Populate Settings form
      setFormName(cRes.name || '');
      setFormState(cRes.state || 'ENABLED');
      setFormBudget(cRes.daily_budget || 500);
      setFormStartDate(cRes.start_date || today);
      setFormEndDate(cRes.end_date || null);
      setFormNoEndDate(!cRes.end_date);
      setFormStrategy(cRes.bidding_strategy || 'DOWN_ONLY');

      // Populate quick edit states
      setQuickNameValue(cRes.name || '');
      setQuickBudgetValue(cRes.daily_budget || 500);
    } catch (err: any) {
      showToast({ title: 'Failed to load campaign', message: err?.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [campaignId, dateRange.start, dateRange.end, granularity, today, showToast]);

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
      } else if (activeTab === 'history') {
        const histRes = await getCampaignHistory(campaignId);
        setHistoryItems(histRes);
      }
    } catch (err: any) {
      showToast({ title: 'Failed to load tab data', message: err?.message, type: 'error' });
    } finally {
      setTabLoading(false);
    }
  }, [campaignId, activeTab, dateRange.start, dateRange.end, showToast]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Q6 Status Toggle Handler
  const handleToggleStateSwitch = () => {
    if (!campaign || campaign.state === 'ARCHIVED') return;
    const nextState: CampaignState = campaign.state === 'ENABLED' ? 'PAUSED' : 'ENABLED';

    setConfirmDialog({
      open: true,
      title: 'Confirm Campaign Status Change',
      description: `Are you sure you want to change campaign status from ${campaign.state} to ${nextState}? This update will be sent directly to the Amazon Ads API and logged in Campaign History.`,
      confirmLabel: `Set to ${nextState}`,
      variant: nextState === 'PAUSED' ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await updateCampaignState(campaign.id, nextState);
          showToast({
            title: 'Status Updated',
            message: `Campaign status changed to ${nextState} on Amazon Ads.`,
            type: 'success',
          });
          await loadCampaignData();
          if (activeTab === 'history') await loadTabData();
        } catch (err: any) {
          showToast({
            title: 'Amazon Ads API Error',
            message: err?.message || 'Failed to update campaign state on Amazon Ads',
            type: 'error',
          });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Q6 Quick Name Save
  const handleQuickNameSave = () => {
    if (!campaign) return;
    const trimmed = quickNameValue.trim();
    if (!trimmed) {
      showToast({ title: 'Invalid Name', message: 'Campaign name cannot be empty', type: 'error' });
      return;
    }
    if (trimmed === campaign.name) {
      setQuickEditNameOpen(false);
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Confirm Campaign Name Update',
      description: `Change campaign name from "${campaign.name}" to "${trimmed}"? This change will be submitted to the Amazon Ads API.`,
      confirmLabel: 'Update Name',
      variant: 'primary',
      onConfirm: async () => {
        try {
          await patchCampaign(campaign.id, { name: trimmed });
          showToast({ title: 'Name Updated', message: 'Campaign name updated successfully.', type: 'success' });
          setQuickEditNameOpen(false);
          await loadCampaignData();
          if (activeTab === 'history') await loadTabData();
        } catch (err: any) {
          showToast({ title: 'Update Failed', message: err?.message || 'Failed to update name', type: 'error' });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Q6 Quick Budget Save
  const handleQuickBudgetSave = () => {
    if (!campaign) return;
    if (quickBudgetValue < 100) {
      showToast({ title: 'Invalid Budget', message: 'Minimum daily budget in India is ₹100.00', type: 'error' });
      return;
    }
    if (quickBudgetValue === campaign.daily_budget) {
      setQuickEditBudgetOpen(false);
      return;
    }

    const warningText = quickBudgetValue < 500
      ? '\n\nNote: Amazon allows lower budgets, but ₹500+/day is recommended in India to collect statistically useful data.'
      : '';

    setConfirmDialog({
      open: true,
      title: 'Confirm Daily Budget Change',
      description: `Change daily budget from ${money(campaign.daily_budget)} to ${money(quickBudgetValue)}? This update will be submitted to the Amazon Ads API.${warningText}`,
      confirmLabel: 'Update Budget',
      variant: 'primary',
      onConfirm: async () => {
        try {
          await patchCampaign(campaign.id, { daily_budget: quickBudgetValue });
          showToast({
            title: 'Budget Updated',
            message: `Daily budget set to ${money(quickBudgetValue)} on Amazon Ads.`,
            type: 'success',
          });
          setQuickEditBudgetOpen(false);
          await loadCampaignData();
          if (activeTab === 'history') await loadTabData();
        } catch (err: any) {
          showToast({ title: 'Budget Update Failed', message: err?.message || 'Failed to update budget', type: 'error' });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Q6 Settings Tab Save
  const handleSettingsSave = () => {
    if (!campaign) return;

    const trimmedName = formName.trim();
    if (!trimmedName) {
      showToast({ title: 'Invalid Name', message: 'Campaign name cannot be empty', type: 'error' });
      return;
    }
    if (formBudget < 100) {
      showToast({ title: 'Invalid Budget', message: 'Minimum daily budget in India is ₹100.00', type: 'error' });
      return;
    }
    if (!formStartDate) {
      showToast({ title: 'Invalid Start Date', message: 'Start date is required', type: 'error' });
      return;
    }
    const finalEndDate = formNoEndDate ? null : formEndDate;
    if (finalEndDate && finalEndDate < formStartDate) {
      showToast({ title: 'Invalid Date Range', message: 'End date cannot be earlier than start date', type: 'error' });
      return;
    }

    // Determine what changed
    const changes: Record<string, any> = {};
    const changeLines: string[] = [];

    if (trimmedName !== campaign.name) {
      changes.name = trimmedName;
      changeLines.push(`• Campaign Name: "${campaign.name}" → "${trimmedName}"`);
    }
    if (formState !== campaign.state) {
      changes.state = formState;
      changeLines.push(`• State: ${campaign.state} → ${formState}`);
    }
    if (formBudget !== campaign.daily_budget) {
      changes.daily_budget = formBudget;
      changeLines.push(`• Daily Budget: ${money(campaign.daily_budget)} → ${money(formBudget)}`);
    }
    if (formStartDate !== campaign.start_date) {
      changes.start_date = formStartDate;
      changeLines.push(`• Start Date: ${campaign.start_date} → ${formStartDate}`);
    }
    if (finalEndDate !== campaign.end_date) {
      changes.end_date = finalEndDate;
      changeLines.push(`• End Date: ${campaign.end_date || 'No end date'} → ${finalEndDate || 'No end date'}`);
    }
    if (formStrategy !== campaign.bidding_strategy) {
      changes.bidding_strategy = formStrategy;
      changeLines.push(`• Bidding Strategy: ${campaign.bidding_strategy} → ${formStrategy}`);
    }

    if (changeLines.length === 0) {
      showToast({ title: 'No Changes', message: 'No settings were modified', type: 'info' });
      return;
    }

    const warningBudget = formBudget < 500
      ? '\n\nNote: Amazon allows lower budgets, but ₹500+/day is recommended in India to collect statistically useful data.'
      : '';

    setConfirmDialog({
      open: true,
      title: 'Confirm Amazon Ads Campaign Changes',
      description: `The following modifications will be submitted to the Amazon Ads API and logged in Campaign History:\n\n${changeLines.join('\n')}${warningBudget}`,
      confirmLabel: 'Confirm & Save to Amazon',
      variant: 'primary',
      onConfirm: async () => {
        setSavingSettings(true);
        try {
          await patchCampaign(campaign.id, changes);
          showToast({
            title: 'Campaign Settings Saved',
            message: 'All updates applied successfully to Amazon Ads.',
            type: 'success',
          });
          await loadCampaignData();
          if (activeTab === 'history') await loadTabData();
        } catch (err: any) {
          showToast({
            title: 'Amazon Ads API Error',
            message: err?.message || 'Failed to save campaign settings',
            type: 'error',
          });
        } finally {
          setSavingSettings(false);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleSettingsReset = () => {
    if (!campaign) return;
    setFormName(campaign.name || '');
    setFormState(campaign.state || 'ENABLED');
    setFormBudget(campaign.daily_budget || 500);
    setFormStartDate(campaign.start_date || today);
    setFormEndDate(campaign.end_date || null);
    setFormNoEndDate(!campaign.end_date);
    setFormStrategy(campaign.bidding_strategy || 'DOWN_ONLY');
    showToast({ title: 'Form Reset', message: 'Settings form reset to current values', type: 'info' });
  };

  // Filtered Ad Groups
  const filteredAdGroups = useMemo(() => {
    return adGroups.filter((ag) => {
      if (adGroupStatusFilter !== 'ALL' && ag.state !== adGroupStatusFilter) return false;
      if (adGroupSearch) {
        return ag.name.toLowerCase().includes(adGroupSearch.toLowerCase());
      }
      return true;
    });
  }, [adGroups, adGroupSearch, adGroupStatusFilter]);

  // Ad Groups totals
  const adGroupsTotals = useMemo(() => {
    return filteredAdGroups.reduce(
      (acc, ag) => ({
        spend: acc.spend + (ag.spend || 0),
        orders: acc.orders + (ag.orders || 0),
        sales: acc.sales + (ag.sales || 0),
        clicks: acc.clicks + (ag.clicks || 0),
      }),
      { spend: 0, orders: 0, sales: 0, clicks: 0 }
    );
  }, [filteredAdGroups]);

  // Tab Items (Q13 Approved: Ad groups, Placements, Settings, History)
  const tabItems: TabItem[] = [
    { id: 'ad-groups', label: 'Ad groups', count: adGroups.length },
    { id: 'placements', label: 'Placements' },
    { id: 'settings', label: 'Settings' },
    { id: 'history', label: 'History', count: historyItems.length },
  ];

  const isArchived = campaign?.state === 'ARCHIVED';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <Link
          href="/campaigns"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1 text-slate-400" />
          Back to Campaigns
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dual-Axis Charts Toggle */}
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              showChart
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Performance Charts"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showChart ? 'Hide Charts' : 'Show Charts'}</span>
          </button>

          {/* Date Range Picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Main Campaign Header Banner */}
      <div className="bg-surface border border-border-dim rounded-lg p-5 shadow-2xs">
        {loading || !campaign ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            <RotateCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
            Loading campaign details...
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              {/* Name & Quick Status Switch */}
              <div className="flex flex-wrap items-center gap-3">
                <Switch
                  checked={campaign.state === 'ENABLED'}
                  onChange={handleToggleStateSwitch}
                  disabled={isArchived}
                  size="md"
                  aria-label="Toggle campaign status"
                />

                {quickEditNameOpen ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickNameValue}
                      onChange={(e) => setQuickNameValue(e.target.value)}
                      className="px-2.5 py-1 text-base font-bold text-slate-900 border border-indigo-300 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleQuickNameSave}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium cursor-pointer"
                      title="Save name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickEditNameOpen(false)}
                      className="p-1.5 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-100 cursor-pointer"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      {campaign.name}
                    </h1>
                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickNameValue(campaign.name);
                          setQuickEditNameOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit campaign name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Serving Status Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                    campaign.delivery_status === 'DELIVERING'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : campaign.delivery_status === 'OUT_OF_BUDGET'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : campaign.delivery_status === 'PAUSED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {campaign.delivery_status || campaign.state}
                </span>
              </div>

              {/* Sub-row metadata */}
              <div className="flex flex-wrap items-center gap-2.5 text-slate-500 text-xs">
                <span className="font-medium text-slate-700">Sponsored Products</span>
                <span>•</span>
                <span>{campaign.targeting_type === 'AUTO' ? 'Auto Targeting' : 'Manual Targeting'}</span>
                <span>•</span>
                <span>
                  Strategy:{' '}
                  <strong className="text-slate-800">
                    {campaign.bidding_strategy === 'DOWN_ONLY'
                      ? 'Dynamic down only'
                      : campaign.bidding_strategy === 'UP_AND_DOWN'
                      ? 'Dynamic up and down'
                      : 'Fixed bids'}
                  </strong>
                </span>
                <span>•</span>
                <span>Start: {campaign.start_date}</span>
                <span>•</span>
                <span>End: {campaign.end_date || 'No end date'}</span>
              </div>
            </div>

            {/* Right: Daily Budget Quick Box */}
            <div className="flex items-center gap-3 self-start lg:self-center">
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/70 flex flex-col items-end min-w-[140px]">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Daily Budget
                </span>
                {quickEditBudgetOpen ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MoneyInput
                      value={quickBudgetValue}
                      onChange={(val) => setQuickBudgetValue(val || 100)}
                      symbol="₹"
                      min={100}
                      className="w-28 text-right text-xs py-1"
                    />
                    <button
                      type="button"
                      onClick={handleQuickBudgetSave}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium cursor-pointer"
                      title="Save budget"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickEditBudgetOpen(false)}
                      className="p-1.5 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-100 cursor-pointer"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {money(campaign.daily_budget)}
                    </span>
                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickBudgetValue(campaign.daily_budget);
                          setQuickEditBudgetOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit daily budget"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards (Q14 Standard) - only show selection highlights when chart is visible */}
      <KpiCards
        summary={summary}
        totals={campaign}
        loading={loading}
        selectedChartMetrics={showChart ? chartMetrics : []}
        onSelectMetric={showChart ? handleSelectMetric : undefined}
      />

      {/* Collapsible Dual-Axis Performance Chart */}
      {showChart && summary && (
        <PerformanceChart
          summary={summary}
          loading={loading}
          granularity={granularity}
          onGranularityChange={setGranularity}
          selectedMetrics={chartMetrics}
          onSelectMetric={handleSelectMetric}
          endDate={dateRange.end}
        />
      )}

      {/* Amazon Ads Tabs Container */}
      <div className="space-y-4">
        <Tabs value={activeTab} onChange={handleTabChange} items={tabItems} size="md" />

        {/* TAB 1: Ad Groups */}
        {activeTab === 'ad-groups' && (
          <div className="bg-surface border border-border-dim rounded-lg shadow-2xs p-4 space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search ad groups..."
                    value={adGroupSearch}
                    onChange={(e) => setAdGroupSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={adGroupStatusFilter}
                  onChange={(e) => setAdGroupStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ENABLED">Enabled</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing {filteredAdGroups.length} of {adGroups.length} ad groups
              </div>
            </div>

            {/* Ad Groups Table */}
            {tabLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RotateCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
                Loading ad groups...
              </div>
            ) : filteredAdGroups.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                No ad groups found for this campaign.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Ad Group Name</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Default Bid</th>
                      <th className="px-3.5 py-2.5 text-right">Products</th>
                      <th className="px-3.5 py-2.5 text-right">Spend</th>
                      <th className="px-3.5 py-2.5 text-right">Purchases</th>
                      <th className="px-3.5 py-2.5 text-right">Sales</th>
                      <th className="px-3.5 py-2.5 text-right">ROAS</th>
                      <th className="px-3.5 py-2.5 text-right">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAdGroups.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3.5 py-2.5 font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ag.name}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ag.state === 'ENABLED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {ag.state}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium">
                          {money(ag.default_bid)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {num((ag as any).products_count ?? 1)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium text-slate-900">
                          {money(ag.spend)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {num(ag.orders)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-700">
                          {money(ag.sales)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium">
                          {ratio(ag.roas)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {num(ag.clicks)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-900">
                    <tr>
                      <td colSpan={4} className="px-3.5 py-2 text-left">
                        Total ({filteredAdGroups.length} Ad Groups)
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">
                        {money(adGroupsTotals.spend)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">
                        {num(adGroupsTotals.orders)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-emerald-700">
                        {money(adGroupsTotals.sales)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">
                        {adGroupsTotals.spend > 0
                          ? ratio(adGroupsTotals.sales / adGroupsTotals.spend)
                          : '—'}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">
                        {num(adGroupsTotals.clicks)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Placements (READ-ONLY per Q13 Approved) */}
        {activeTab === 'placements' && (
          <div className="bg-surface border border-border-dim rounded-lg shadow-2xs p-5 space-y-4">
            {/* Read-Only Notice */}
            <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950">
                  Placement Modifiers & Performance (Read-Only)
                </p>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Modifiers and performance data are synchronized directly from the Amazon Advertising API. Placement modifier adjustments are currently in read-only mode.
                </p>
              </div>
            </div>

            {/* Placements Table */}
            {tabLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RotateCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
                Loading placement performance...
              </div>
            ) : placements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                No placement metrics recorded for this campaign.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Placement</th>
                      <th className="px-3.5 py-2.5 text-right">Bid Modifier</th>
                      <th className="px-3.5 py-2.5 text-right">Base Bid</th>
                      <th className="px-3.5 py-2.5 text-right">Max Effective Bid</th>
                      <th className="px-3.5 py-2.5 text-right">Impressions</th>
                      <th className="px-3.5 py-2.5 text-right">Clicks</th>
                      <th className="px-3.5 py-2.5 text-right">Spend</th>
                      <th className="px-3.5 py-2.5 text-right">Purchases</th>
                      <th className="px-3.5 py-2.5 text-right">Sales</th>
                      <th className="px-3.5 py-2.5 text-right">CTR</th>
                      <th className="px-3.5 py-2.5 text-right">CPC</th>
                      <th className="px-3.5 py-2.5 text-right">ACOS</th>
                      <th className="px-3.5 py-2.5 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {placements.map((plc) => (
                      <tr key={plc.placement} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3.5 py-2.5 font-medium text-slate-900">
                          {plc.label}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              plc.modifier_pct > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {plc.modifier_pct > 0 ? `+${plc.modifier_pct}%` : '0%'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium">
                          {money(plc.base_bid)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium text-indigo-700">
                          {money(plc.max_effective_bid)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {num(plc.impressions)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {num(plc.clicks)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium text-slate-900">
                          {money(plc.spend)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {num(plc.orders)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-700">
                          {money(plc.sales)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {pct(plc.ctr)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {money(plc.cpc)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {pct(plc.acos)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold">
                          {ratio(plc.roas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Settings (Q6 / Amazon Ads Console Layout) */}
        {activeTab === 'settings' && (
          <div className="bg-surface border border-border-dim rounded-lg shadow-2xs p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your Sponsored Products campaign configuration. All modifications are sent to Amazon Ads with audit history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Field 1: Campaign Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Campaign Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={isArchived || savingSettings}
                  placeholder="Enter campaign name..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <span className="text-[11px] text-slate-400">
                  Unique name to identify this campaign in Amazon Ads.
                </span>
              </div>

              {/* Field 2: Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Campaign State
                </label>
                <select
                  value={formState}
                  onChange={(e) => setFormState(e.target.value as CampaignState)}
                  disabled={isArchived || savingSettings}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="ENABLED">Enabled</option>
                  <option value="PAUSED">Paused</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <span className="text-[11px] text-slate-400">
                  Active delivery state of the campaign.
                </span>
              </div>

              {/* Field 3: Daily Budget */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Daily Budget (₹) <span className="text-rose-500">*</span>
                </label>
                <MoneyInput
                  value={formBudget}
                  onChange={(val) => setFormBudget(val || 100)}
                  symbol="₹"
                  min={100}
                  disabled={isArchived || savingSettings}
                  className="w-full text-xs"
                />
                {formBudget < 500 ? (
                  <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>
                      Amazon allows lower budgets, but <strong>₹500+/day</strong> is recommended in India to collect statistically useful data.
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Minimum daily budget accepted by Amazon in India is ₹100.00.
                  </span>
                )}
              </div>

              {/* Field 4: Schedule */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Schedule (Start & End Date)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Start Date</span>
                    <DatePicker
                      value={formStartDate}
                      onChange={setFormStartDate}
                      disabled={isArchived || savingSettings}
                      placeholder="Start date"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">End Date</span>
                    <DatePicker
                      value={formNoEndDate ? null : formEndDate}
                      onChange={(d) => {
                        setFormEndDate(d);
                        setFormNoEndDate(false);
                      }}
                      disabled={isArchived || formNoEndDate || savingSettings}
                      placeholder="No end date"
                      minDate={formStartDate}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="no-end-date"
                    checked={formNoEndDate}
                    onChange={(e) => {
                      setFormNoEndDate(e.target.checked);
                      if (e.target.checked) setFormEndDate(null);
                    }}
                    disabled={isArchived || savingSettings}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="no-end-date" className="text-xs text-slate-600 select-none cursor-pointer">
                    No end date (run continuously)
                  </label>
                </div>
              </div>
            </div>

            {/* Field 5: Bidding Strategy */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Campaign Bidding Strategy
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Option 1: Down Only */}
                <label
                  className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                    formStrategy === 'DOWN_ONLY'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="DOWN_ONLY"
                      checked={formStrategy === 'DOWN_ONLY'}
                      onChange={() => setFormStrategy('DOWN_ONLY')}
                      disabled={isArchived || savingSettings}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Dynamic bids - down only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Amazon will lower your bids in real time when your ad may be less likely to convert to a sale.
                  </p>
                </label>

                {/* Option 2: Up and Down */}
                <label
                  className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                    formStrategy === 'UP_AND_DOWN'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="UP_AND_DOWN"
                      checked={formStrategy === 'UP_AND_DOWN'}
                      onChange={() => setFormStrategy('UP_AND_DOWN')}
                      disabled={isArchived || savingSettings}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Dynamic bids - up and down
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Amazon will raise bids up to 100% for top of search and 50% for other placements when likely to convert, and lower when less likely.
                  </p>
                </label>

                {/* Option 3: Fixed */}
                <label
                  className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                    formStrategy === 'FIXED'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="FIXED"
                      checked={formStrategy === 'FIXED'}
                      onChange={() => setFormStrategy('FIXED')}
                      disabled={isArchived || savingSettings}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Fixed bids
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Amazon will use your exact bid and any manual placement adjustments you set, and won&apos;t change bids automatically.
                  </p>
                </label>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSettingsReset}
                disabled={isArchived || savingSettings}
                className="px-4 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSettingsSave}
                disabled={isArchived || savingSettings}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {savingSettings && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                Save to Amazon Ads
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: History */}
        {activeTab === 'history' && (
          <div className="bg-surface border border-border-dim rounded-lg shadow-2xs p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of all modifications made to this campaign, with before and after snapshots.
              </p>
            </div>

            {tabLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RotateCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
                Loading audit history...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                No audit events recorded yet for this campaign.
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {item.event_title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {item.event_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {(item.previous_value || item.new_value) && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                        {item.previous_value && (
                          <div className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-rose-800">
                            <span className="text-slate-400 mr-1">Before:</span>
                            <span className="font-mono">{item.previous_value}</span>
                          </div>
                        )}
                        {item.previous_value && item.new_value && (
                          <span className="text-slate-400">→</span>
                        )}
                        {item.new_value && (
                          <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
                            <span className="text-slate-400 mr-1">After:</span>
                            <span className="font-mono">{item.new_value}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog (Q6 Approved) */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}

export default function CampaignDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading campaign view...
        </div>
      }
    >
      <CampaignDetailContent {...props} />
    </Suspense>
  );
}
