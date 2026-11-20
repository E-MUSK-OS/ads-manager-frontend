'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Clock, HelpCircle, Info, AlertCircle, ChevronDown, ArrowLeft } from 'lucide-react';
import { Button } from './ui/RulesButton';
import { Switch } from './ui/RulesSwitch';
import { createRule, updateRule, fetchRule } from './rules-api';
import { useToast } from './ui/RulesToast';
import type {
  Rule,
  RuleDraft,
  Condition,
  RuleAction,
  RuleMeta,
  Operator,
} from './rules-types';

interface TargetingRuleFormModalProps {
  open?: boolean;
  onClose: () => void;
  adsAccountId: number | null;
  ruleId?: number | null;
  meta: RuleMeta | null;
  onRuleSaved: (savedRule: Rule) => void;
}

const ALL_DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const INTERVAL_OPTIONS = [
  'Every 10 Days',
  'Every 15 Days',
  'Every 30 Days',
];

const DATE_FILTER_OPTIONS = [
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { value: 'LAST_14_DAYS', label: 'Last 14 Days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { value: 'LAST_60_DAYS', label: 'Last 60 Days' },
  { value: 'LAST_90_DAYS', label: 'Last 90 Days' },
];

export const TARGETING_METRIC_OPTIONS = [
  { value: 'top_of_search_is', label: 'Top of Search IS' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'campaign_active_status', label: 'Campaign Active Status' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'purchases_flag', label: 'Purchases' },
  { value: 'spend', label: 'Spend' },
  { value: 'bid', label: 'Bid' },
  { value: 'targeting_type', label: 'Targeting type' },
  { value: 'roas', label: 'Return on ad spend (ROAS)' },
  { value: 'target_active_status', label: 'Target Active Status' },
  { value: 'sales', label: 'Sales' },
  { value: 'acos', label: 'Advertising cost of sales (ACOS)' },
  { value: 'purchases', label: 'Purchases' },
];

export const TARGETING_OPERATOR_OPTIONS = [
  { value: 'LT', label: 'Less Than' },
  { value: 'LTE', label: 'Less Than Or Equal To' },
  { value: 'GTE', label: 'Greater Than Or Equal To' },
  { value: 'GT', label: 'Greater Than' },
  { value: 'EQ', label: 'Equal To' },
  { value: 'NEQ', label: 'Not Equal To' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'All But Archived', label: 'All But Archived' },
  { value: 'Enabled', label: 'Enabled' },
  { value: 'Paused', label: 'Paused' },
];

export const TARGETING_TYPE_CHECKBOXES = [
  { id: 'EXACT', label: 'Exact Keywords' },
  { id: 'PHRASE', label: 'Phrase Keywords' },
  { id: 'BROAD', label: 'Broad Keywords' },
  { id: 'TARGET', label: 'Product Targets' },
];

export const TARGETING_ACTION_OPTIONS = [
  { value: 'Targets / Keywords: Enabled', label: 'Targets / Keywords: Enabled', hasAttributes: false, defaultType: 'ENABLE_TARGET' },
  { value: 'Targets / Keywords: Paused', label: 'Targets / Keywords: Paused', hasAttributes: false, defaultType: 'PAUSE_TARGET' },
  { value: 'Targets / Keywords: Set Bid', label: 'Targets / Keywords: Set Bid', hasAttributes: true, defaultType: 'SET_BID' },
  { value: 'Targets / Keywords: Increase Bid', label: 'Targets / Keywords: Increase Bid', hasAttributes: true, defaultType: 'INCREASE_BID' },
  { value: 'Targets / Keywords: Decrease Bid', label: 'Targets / Keywords: Decrease Bid', hasAttributes: true, defaultType: 'DECREASE_BID' },
  { value: 'Campaign: Enabled', label: 'Campaign: Enabled', hasAttributes: false, defaultType: 'ENABLE_CAMPAIGN' },
  { value: 'Campaign: Paused', label: 'Campaign: Paused', hasAttributes: false, defaultType: 'PAUSE_CAMPAIGN' },
  { value: 'AdGroup: Enabled', label: 'AdGroup: Enabled', hasAttributes: false, defaultType: 'ENABLE_AD_GROUP' },
  { value: 'AdGroup: Paused', label: 'AdGroup: Paused', hasAttributes: false, defaultType: 'PAUSE_AD_GROUP' },
];

interface TargetingConditionState {
  metric: string;
  op: string;
  value: number | string | null;
  statusVal?: string;
  targetingTypes?: string[];
}

interface TargetingActionState {
  actionName: string;
  unit: 'Number' | 'Percentage';
  val: number | string;
}

export function TargetingRuleFormModal({
  open,
  onClose,
  adsAccountId,
  ruleId,
  meta,
  onRuleSaved,
}: TargetingRuleFormModalProps) {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(ruleId);

  // Form states
  const [name, setName] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('LAST_30_DAYS');
  const [enableDaysSinceCreation, setEnableDaysSinceCreation] = useState<boolean>(false);
  const [daysSinceCreation, setDaysSinceCreation] = useState<number>(0);

  // Conditions
  const [conditions, setConditions] = useState<TargetingConditionState[]>([
    { metric: 'top_of_search_is', op: 'GTE', value: '' },
  ]);

  // Actions
  const [actions, setActions] = useState<TargetingActionState[]>([
    { actionName: 'Targets / Keywords: Increase Bid', unit: 'Percentage', val: 10 },
  ]);

  // Schedule Days
  const [selectedDays, setSelectedDays] = useState<string[]>(['All']);

  // Schedule Times
  const [ruleTimes, setRuleTimes] = useState<string[]>(['09:00']);
  const [allowMultipleTimeChange, setAllowMultipleTimeChange] = useState<boolean>(false);

  // Hourly-based changes
  const [enableHourlyChanges, setEnableHourlyChanges] = useState<boolean>(false);

  // Status
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingRule, setLoadingRule] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (!ruleId) {
      setName('');
      setDateFilter('LAST_30_DAYS');
      setEnableDaysSinceCreation(false);
      setDaysSinceCreation(0);
      setConditions([{ metric: 'top_of_search_is', op: 'GTE', value: '' }]);
      setActions([{ actionName: 'Targets / Keywords: Increase Bid', unit: 'Percentage', val: 10 }]);
      setSelectedDays(['All']);
      setRuleTimes(['09:00']);
      setAllowMultipleTimeChange(false);
      setEnableHourlyChanges(false);
      setFormError(null);
      return;
    }

    setLoadingRule(true);
    setFormError(null);

    fetchRule(ruleId)
      .then((existing) => {
        setName(existing.name || '');
        setDateFilter(existing.date_filter || 'LAST_30_DAYS');

        // Map conditions
        if (existing.conditions && existing.conditions.length > 0) {
          setConditions(
            existing.conditions.map((c: any) => {
              const metric = c.metric || 'impressions';
              const isStatus = metric === 'campaign_active_status' || metric === 'target_active_status';
              const isTargetingTypes = metric === 'targeting_type';

              return {
                metric,
                op: c.op || 'GTE',
                value: c.value !== null && c.value !== undefined ? c.value : '',
                statusVal: isStatus ? String(c.value || 'All') : undefined,
                targetingTypes: isTargetingTypes
                  ? Array.isArray(c.value)
                    ? c.value
                    : ['EXACT']
                  : undefined,
              };
            })
          );
        } else {
          setConditions([{ metric: 'top_of_search_is', op: 'GTE', value: '' }]);
        }

        // Map actions
        if (existing.actions && existing.actions.length > 0) {
          setActions(
            existing.actions.map((a: any) => {
              const typeUpper = (a.type || '').toUpperCase();
              let actionName = 'Targets / Keywords: Increase Bid';
              if (typeUpper.includes('SET') && typeUpper.includes('BID')) {
                actionName = 'Targets / Keywords: Set Bid';
              } else if (typeUpper.includes('DECREASE') && typeUpper.includes('BID')) {
                actionName = 'Targets / Keywords: Decrease Bid';
              } else if (typeUpper.includes('PAUSE') && typeUpper.includes('TARGET')) {
                actionName = 'Targets / Keywords: Paused';
              } else if (typeUpper.includes('ENABLE') && typeUpper.includes('TARGET')) {
                actionName = 'Targets / Keywords: Enabled';
              } else if (typeUpper.includes('ENABLE') && typeUpper.includes('CAMPAIGN')) {
                actionName = 'Campaign: Enabled';
              } else if (typeUpper.includes('PAUSE') && typeUpper.includes('CAMPAIGN')) {
                actionName = 'Campaign: Paused';
              } else if (typeUpper.includes('ENABLE') && typeUpper.includes('AD_GROUP')) {
                actionName = 'AdGroup: Enabled';
              } else if (typeUpper.includes('PAUSE') && typeUpper.includes('AD_GROUP')) {
                actionName = 'AdGroup: Paused';
              }

              const isPct = a.params?.unit === 'PERCENT' || (a.params?.pct !== undefined && a.params?.pct !== null);
              const unit = isPct ? 'Percentage' : 'Number';
              const val = a.params?.pct ?? a.params?.amount ?? a.params?.value ?? '';

              return {
                actionName,
                unit,
                val,
              };
            })
          );
        } else {
          setActions([{ actionName: 'Targets / Keywords: Increase Bid', unit: 'Percentage', val: 10 }]);
        }

        // Days
        const d = (existing as any).schedule_days;
        if (Array.isArray(d) && d.length > 0) {
          setSelectedDays(d);
        } else {
          setSelectedDays(['All']);
        }

        // Times
        const t = (existing as any).schedule_times;
        if (Array.isArray(t) && t.length > 0) {
          setRuleTimes(t);
        } else {
          setRuleTimes(['09:00']);
        }

        setAllowMultipleTimeChange(Boolean((existing as any).allow_multiple_changes));
        setEnableHourlyChanges(Boolean((existing as any).hourly_based_changes));
      })
      .catch(() => {
        toastError('Failed to load rule configuration');
        onClose();
      })
      .finally(() => {
        setLoadingRule(false);
      });
  }, [open, ruleId, toastError, onClose]);

  // Days toggle
  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (day === 'All') return ['All'];
      const withoutAll = prev.filter((d) => d !== 'All');
      if (withoutAll.includes(day)) {
        const next = withoutAll.filter((d) => d !== day);
        return next.length === 0 ? ['All'] : next;
      } else {
        return [...withoutAll, day];
      }
    });
  };

  // Conditions
  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { metric: 'impressions', op: 'GTE', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMetricChange = (index: number, newMetric: string) => {
    setConditions((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (newMetric === 'purchases_flag') {
          return { metric: 'purchases_flag', op: 'GTE', value: '' };
        }
        if (newMetric === 'campaign_active_status') {
          return { metric: 'campaign_active_status', op: 'EQ', value: 'All', statusVal: 'All' };
        }
        if (newMetric === 'target_active_status') {
          return { metric: 'target_active_status', op: 'EQ', value: 'All', statusVal: 'All' };
        }
        if (newMetric === 'targeting_type') {
          return { metric: 'targeting_type', op: 'EQ', value: '', targetingTypes: ['EXACT'] };
        }
        return {
          metric: newMetric,
          op: c.op || 'GTE',
          value: '',
        };
      })
    );
  };

  const handleUpdateCondition = (index: number, patch: Partial<TargetingConditionState>) => {
    setConditions((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const handleToggleTargetingCheckbox = (index: number, typeId: string) => {
    setConditions((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const currentTypes = c.targetingTypes || [];
        const nextTypes = currentTypes.includes(typeId)
          ? currentTypes.filter((t) => t !== typeId)
          : [...currentTypes, typeId];
        return { ...c, targetingTypes: nextTypes };
      })
    );
  };

  // Actions
  const handleAddAction = () => {
    setActions((prev) => [
      ...prev,
      { actionName: 'Targets / Keywords: Increase Bid', unit: 'Percentage', val: 10 },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActionNameChange = (index: number, newName: string) => {
    setActions((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const opt = TARGETING_ACTION_OPTIONS.find((o) => o.value === newName);
        return {
          ...a,
          actionName: newName,
          val: opt?.hasAttributes ? a.val || 10 : '',
        };
      })
    );
  };

  const handleUpdateAction = (index: number, patch: Partial<TargetingActionState>) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  // Times
  const handleAddTime = () => {
    setRuleTimes((prev) => [...prev, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    setRuleTimes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleUpdateTime = (index: number, val: string) => {
    setRuleTimes((prev) => prev.map((t, i) => (i === index ? val : t)));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adsAccountId) {
      toastError('No active account selected');
      return;
    }
    if (!name.trim()) {
      setFormError('Rule name is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // Build conditions payload
      const conditionsPayload: Condition[] = conditions.map((c) => {
        if (c.metric === 'purchases_flag') {
          return {
            metric: 'purchases_flag',
            op: 'GTE',
            value: 0,
          };
        }
        if (c.metric === 'campaign_active_status') {
          return {
            metric: 'campaign_active_status',
            op: 'EQ',
            value: (c.statusVal || 'All') as any,
          };
        }
        if (c.metric === 'target_active_status') {
          return {
            metric: 'target_active_status',
            op: 'EQ',
            value: (c.statusVal || 'All') as any,
          };
        }
        if (c.metric === 'targeting_type') {
          return {
            metric: 'targeting_type',
            op: 'EQ',
            value: (c.targetingTypes || []) as any,
          };
        }

        const numVal = c.value === '' || c.value === null ? 0 : Number(c.value);
        return {
          metric: c.metric,
          op: (c.op || 'GTE') as Operator,
          value: numVal,
        };
      });

      // Build actions payload
      const actionsPayload: RuleAction[] = actions.map((a) => {
        const opt = TARGETING_ACTION_OPTIONS.find((o) => o.value === a.actionName);
        const actionType = opt?.defaultType || 'INCREASE_BID';

        if (!opt?.hasAttributes) {
          return {
            type: actionType,
            params: {},
          };
        }

        const isPct = a.unit === 'Percentage';
        const numVal = Number(a.val) || 0;

        return {
          type: actionType,
          params: isPct
            ? { pct: numVal, unit: 'PERCENT' }
            : { amount: numVal, unit: 'AMOUNT' },
        };
      });

      const draft: RuleDraft & Record<string, any> = {
        name: name.trim(),
        affected_parameter: 'TARGETING',
        date_filter: dateFilter,
        min_clicks: 0,
        conditions: conditionsPayload,
        actions: actionsPayload,
        schedule_days: selectedDays,
        schedule_times: ruleTimes,
        allow_multiple_changes: allowMultipleTimeChange,
        hourly_based_changes: enableHourlyChanges,
        days_since_creation: enableDaysSinceCreation ? Number(daysSinceCreation) : 0,
      };

      let resultRule: Rule;
      if (isEditing && ruleId) {
        resultRule = await updateRule(ruleId, draft);
        success('Targeting rule updated successfully');
      } else {
        const res = await createRule(adsAccountId, draft);
        resultRule = res.rule;
        success('Targeting rule created successfully');
      }

      onRuleSaved(resultRule);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save rule';
      setFormError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-150">
      {/* Page Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Back to rules"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-slate-300" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {isEditing ? 'Edit Targeting Rule' : 'Create Targeting Rule'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define automated conditions to adjust keyword bids and target performance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card Container */}
      <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-2xs">
        {loadingRule ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400">
            Loading rule configuration...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
          {formError && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Rule Name, Date Filter, Day's Since Creation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Rule Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Rule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter rule name"
                className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            {/* Date Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800">Date Filter</label>
              <div className="relative inline-flex w-full">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Day's Since Creation */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableDaysSinceCreation}
                  onChange={(e) => setEnableDaysSinceCreation(e.target.checked)}
                  className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Day&apos;s Since Creation</span>
              </label>
              <input
                type="number"
                min={0}
                disabled={!enableDaysSinceCreation}
                value={daysSinceCreation}
                onChange={(e) => setDaysSinceCreation(Number(e.target.value))}
                placeholder="0"
                className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-xs bg-white font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Conditions Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-600 inline-block" />
                <h3 className="text-sm font-bold text-slate-800">Conditions</h3>
              </div>
              <Button
                type="button"
                size="xs"
                onClick={handleAddCondition}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 font-medium shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Add Condition</span>
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {conditions.map((cond, idx) => {
                const isPurchasesFlag = cond.metric === 'purchases_flag';
                const isCampaignStatus = cond.metric === 'campaign_active_status';
                const isTargetStatus = cond.metric === 'target_active_status';
                const isTargetingType = cond.metric === 'targeting_type';

                // Currency prefix ₹: Spend, Bid, Sales
                const isCurrency = cond.metric === 'spend' || cond.metric === 'bid' || cond.metric === 'sales';
                // Percentage suffix %: Top of Search IS, ACOS
                const isPercent = cond.metric === 'top_of_search_is' || cond.metric === 'acos';
                // Plain number: Impressions, Clicks, ROAS, Purchases (second)
                const isPlain =
                  cond.metric === 'impressions' ||
                  cond.metric === 'clicks' ||
                  cond.metric === 'roas' ||
                  cond.metric === 'purchases';

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    {/* 1. Metric Dropdown */}
                    <div
                      className={
                        isPurchasesFlag
                          ? 'w-full sm:w-[240px]'
                          : isCampaignStatus || isTargetStatus
                          ? 'w-full sm:w-[200px]'
                          : isTargetingType
                          ? 'w-full sm:w-[170px]'
                          : 'flex-1 min-w-[170px]'
                      }
                    >
                      <div className="relative inline-flex w-full">
                        <select
                          value={cond.metric}
                          onChange={(e) => handleMetricChange(idx, e.target.value)}
                          className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-sans transition-colors outline-none cursor-pointer hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <optgroup label="Filter Options">
                            {TARGETING_METRIC_OPTIONS.map((opt, i) => (
                              <option key={`${opt.value}-${i}`} value={opt.value} className="text-slate-900 bg-white">
                                {opt.label}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    {/* 2. Campaign Active Status Dropdown */}
                    {isCampaignStatus && (
                      <div className="w-full sm:w-[200px]">
                        <div className="relative inline-flex w-full">
                          <select
                            value={cond.statusVal || 'All'}
                            onChange={(e) =>
                              handleUpdateCondition(idx, { statusVal: e.target.value })
                            }
                            className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-sans transition-colors outline-none cursor-pointer hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {STATUS_FILTER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3. Target Active Status Dropdown */}
                    {isTargetStatus && (
                      <div className="w-full sm:w-[200px]">
                        <div className="relative inline-flex w-full">
                          <select
                            value={cond.statusVal || 'All'}
                            onChange={(e) =>
                              handleUpdateCondition(idx, { statusVal: e.target.value })
                            }
                            className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-sans transition-colors outline-none cursor-pointer hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {STATUS_FILTER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 4. Targeting Type Checkboxes */}
                    {isTargetingType && (
                      <div className="flex flex-wrap items-center gap-3 py-1 px-2.5 rounded-md border border-slate-200 bg-slate-50/50">
                        <span className="text-xs font-semibold text-slate-600">Types:</span>
                        {TARGETING_TYPE_CHECKBOXES.map((cb) => {
                          const isChecked = (cond.targetingTypes || []).includes(cb.id);
                          return (
                            <label
                              key={cb.id}
                              className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleTargetingCheckbox(idx, cb.id)}
                                className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span>{cb.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 5. Metrics with Operator and Value Input */}
                    {!isPurchasesFlag && !isCampaignStatus && !isTargetStatus && !isTargetingType && (
                      <>
                        {/* Operator Dropdown */}
                        <div className="w-full sm:w-[190px]">
                          <div className="relative inline-flex w-full">
                            <select
                              value={cond.op}
                              onChange={(e) => handleUpdateCondition(idx, { op: e.target.value })}
                              className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs font-sans transition-colors outline-none cursor-pointer hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {TARGETING_OPERATOR_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          </div>
                        </div>

                        {/* Value Input */}
                        <div className="w-full sm:w-[170px]">
                          {isCurrency ? (
                            /* Rupee prefix ₹: Spend, Bid, Sales */
                            <div className="flex h-8.5 rounded-md border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden transition-colors">
                              <span className="px-3 bg-slate-50 border-r border-slate-300 text-slate-600 text-xs font-semibold flex items-center justify-center select-none shrink-0">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={cond.value !== null && cond.value !== undefined ? cond.value : ''}
                                onChange={(e) =>
                                  handleUpdateCondition(idx, {
                                    value: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                                placeholder="Value"
                                className="w-full h-full px-2.5 text-xs bg-white font-mono text-slate-800 outline-none"
                              />
                            </div>
                          ) : isPercent ? (
                            /* Percentage suffix %: Top of Search IS, ACOS */
                            <div className="flex h-8.5 rounded-md border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden transition-colors">
                              <input
                                type="number"
                                step="any"
                                value={cond.value !== null && cond.value !== undefined ? cond.value : ''}
                                onChange={(e) =>
                                  handleUpdateCondition(idx, {
                                    value: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                                placeholder="Value"
                                className="w-full h-full px-2.5 text-xs bg-white font-mono text-slate-800 outline-none"
                              />
                              <span className="px-3 bg-slate-50 border-l border-slate-300 text-slate-600 text-xs font-semibold flex items-center justify-center select-none shrink-0">
                                %
                              </span>
                            </div>
                          ) : (
                            /* Plain Number: Impressions, Clicks, ROAS, Purchases */
                            <div className="flex h-8.5 rounded-md border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden transition-colors">
                              <input
                                type="number"
                                step="any"
                                value={cond.value !== null && cond.value !== undefined ? cond.value : ''}
                                onChange={(e) =>
                                  handleUpdateCondition(idx, {
                                    value: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                                placeholder="Value"
                                className="w-full h-full px-2.5 text-xs bg-white font-mono text-slate-800 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Remove Condition Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(idx)}
                      disabled={conditions.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors self-end sm:self-center cursor-pointer shrink-0"
                      title="Remove condition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Action Type Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-600 inline-block" />
                <h3 className="text-sm font-bold text-slate-800">
                  Action Type <span className="text-red-500">*</span>
                </h3>
              </div>
              <Button
                type="button"
                size="xs"
                onClick={handleAddAction}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 font-medium shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Add Action</span>
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {actions.map((act, idx) => {
                const opt = TARGETING_ACTION_OPTIONS.find((o) => o.value === act.actionName);
                const hasAttr = opt?.hasAttributes ?? false;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    {/* Action Dropdown */}
                    <div className={hasAttr ? 'w-full sm:w-[240px]' : 'w-full sm:w-[280px]'}>
                      <div className="relative inline-flex w-full">
                        <select
                          value={act.actionName}
                          onChange={(e) => handleActionNameChange(idx, e.target.value)}
                          className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          {TARGETING_ACTION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value} className="text-slate-900 bg-white">
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    {/* Unit Dropdown & Value Input for Set Bid / Increase Bid / Decrease Bid */}
                    {hasAttr && (
                      <>
                        {/* Unit Dropdown (Number / Percentage) */}
                        <div className="w-full sm:w-[130px]">
                          <div className="relative inline-flex w-full">
                            <select
                              value={act.unit}
                              onChange={(e) =>
                                handleUpdateAction(idx, {
                                  unit: e.target.value as 'Number' | 'Percentage',
                                })
                              }
                              className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-900 text-xs outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              <option value="Number">Number</option>
                              <option value="Percentage">Percentage</option>
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          </div>
                        </div>

                        {/* Value Input */}
                        <div className="w-full sm:w-[190px]">
                          {act.unit === 'Percentage' ? (
                            /* Percentage: suffix % */
                            <div className="flex h-8.5 rounded-md border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
                              <input
                                type="number"
                                step="any"
                                value={act.val}
                                onChange={(e) => handleUpdateAction(idx, { val: e.target.value })}
                                placeholder="Value"
                                className="w-full h-full px-2.5 text-xs bg-white font-mono text-slate-800 outline-none"
                              />
                              <span className="px-3 bg-slate-50 border-l border-slate-300 text-slate-600 text-xs font-semibold flex items-center justify-center select-none shrink-0">
                                %
                              </span>
                            </div>
                          ) : (
                            /* Number: prefix ₹ */
                            <div className="flex h-8.5 rounded-md border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
                              <span className="px-3 bg-slate-50 border-r border-slate-300 text-slate-600 text-xs font-semibold flex items-center justify-center select-none shrink-0">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={act.val}
                                onChange={(e) => handleUpdateAction(idx, { val: e.target.value })}
                                placeholder="Value"
                                className="w-full h-full px-2.5 text-xs bg-white font-mono text-slate-800 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(idx)}
                      disabled={actions.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                      title="Remove action"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Rule Days * */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-800">
              Rule Days <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {/* All pill */}
              <button
                type="button"
                onClick={() => handleToggleDay('All')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  selectedDays.includes('All')
                    ? 'bg-slate-800 border-slate-800 text-white font-semibold'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All
              </button>

              {/* Day pills */}
              {ALL_DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleDay(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-slate-800 text-white font-semibold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}

              {/* Interval pills */}
              {INTERVAL_OPTIONS.map((interval) => {
                const isSelected = selectedDays.includes(interval);
                return (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => handleToggleDay(interval)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-slate-800 text-white font-semibold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {interval}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Rule Times * */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-slate-800">
              Rule Times <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {ruleTimes.map((timeVal, idx) => (
                  <div key={idx} className="relative inline-flex items-center">
                    <input
                      type="time"
                      value={timeVal}
                      onChange={(e) => handleUpdateTime(idx, e.target.value)}
                      className="h-8.5 px-3 py-1 rounded-md border border-slate-300 bg-white text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {ruleTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(idx)}
                        className="ml-1 p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Remove time"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  size="xs"
                  onClick={handleAddTime}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 font-medium shadow-2xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Time</span>
                </Button>
              </div>

              {/* Allow Multiple Time Change Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={allowMultipleTimeChange}
                  onChange={(e) => setAllowMultipleTimeChange(e.target.checked)}
                  className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-medium">
                  Allow Multiple Time Change In A Campaign Per Day
                </span>
                <span title="When enabled, multiple rules can adjust the same campaign within the same day">
                  <Info className="size-3.5 text-slate-400 hover:text-slate-600" />
                </span>
              </label>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Enable Hourly-Based Changes */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="size-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                  <span>Enable Hourly-Based Changes</span>
                  <span title="Allows custom rule schedules based on hourly performance patterns">
                    <HelpCircle className="size-3.5 text-slate-400 cursor-help" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Configure changes for specific time periods throughout the day.
                </div>
              </div>
            </div>

            <Switch
              checked={enableHourlyChanges}
              onChange={setEnableHourlyChanges}
              aria-label="Enable Hourly-Based Changes"
            />
          </div>

          {/* Footer Controls: Back on Left, Cancel + Submit on Right */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-slate-700 hover:bg-slate-100"
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
                className="text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
              >
                {submitting ? 'Saving...' : isEditing ? 'Update Rule' : 'Submit'}
              </Button>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}
