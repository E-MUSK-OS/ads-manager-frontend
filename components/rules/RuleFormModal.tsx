'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Clock, HelpCircle, Info, AlertCircle } from 'lucide-react';
import { Modal } from './ui/RulesModal';
import { Button } from './ui/RulesButton';
import { Select } from './ui/RulesSelect';
import { createRule, updateRule, fetchRule } from './rules-api';
import { useToast } from './ui/RulesToast';
import type {
  Rule,
  RuleDraft,
  Condition,
  RuleAction,
  RuleMeta,
  AffectedParameter,
  Operator,
} from './rules-types';

interface RuleFormModalProps {
  open: boolean;
  onClose: () => void;
  adsAccountId: number | null;
  ruleId?: number | null;
  defaultAffectedParameter: AffectedParameter;
  meta: RuleMeta | null;
  currencySymbol?: string;
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

const DEFAULT_METRICS: Record<string, { label: string; unit: 'money' | 'percent' | 'count' | 'ratio' }> = {
  spend: { label: 'Spend', unit: 'money' },
  acos: { label: 'ACOS', unit: 'percent' },
  roas: { label: 'ROAS', unit: 'ratio' },
  clicks: { label: 'Clicks', unit: 'count' },
  impressions: { label: 'Impressions', unit: 'count' },
  orders: { label: 'Orders', unit: 'count' },
  cpc: { label: 'Cost Per Click (CPC)', unit: 'money' },
  ctr: { label: 'Click-Through Rate (CTR)', unit: 'percent' },
};

const DEFAULT_OPERATORS: Record<string, { label: string; symbol: string }> = {
  GT: { label: 'Greater than', symbol: '>' },
  LT: { label: 'Less than', symbol: '<' },
  GTE: { label: 'Greater than or equal to', symbol: '≥' },
  LTE: { label: 'Less than or equal to', symbol: '≤' },
  EQ: { label: 'Equal to', symbol: '=' },
};

interface ActionConfig {
  scopes: { value: string; label: string }[];
  verbs: { value: string; label: string; defaultType: string; isPause?: boolean }[];
  units: { value: string; label: string }[];
}

const ACTION_CONFIGS: Record<AffectedParameter, ActionConfig> = {
  PLACEMENT: {
    scopes: [
      { value: 'Top of Search', label: 'Top of Search' },
      { value: 'Product Pages', label: 'Product Pages' },
      { value: 'Rest of Search', label: 'Rest of Search' },
    ],
    verbs: [
      { value: 'Increase Bid', label: 'Increase Bid', defaultType: 'INCREASE_PLACEMENT' },
      { value: 'Decrease Bid', label: 'Decrease Bid', defaultType: 'DECREASE_PLACEMENT' },
      { value: 'Set Bid', label: 'Set Bid', defaultType: 'INCREASE_PLACEMENT' },
    ],
    units: [
      { value: 'Percentage (%)', label: 'Percentage (%)' },
      { value: 'Fixed Value', label: 'Fixed Value' },
    ],
  },
  CAMPAIGN: {
    scopes: [{ value: 'Daily Budget', label: 'Daily Budget' }],
    verbs: [
      { value: 'Increase Budget', label: 'Increase Budget', defaultType: 'INCREASE_BUDGET' },
      { value: 'Decrease Budget', label: 'Decrease Budget', defaultType: 'DECREASE_BUDGET' },
      { value: 'Pause Campaign', label: 'Pause Campaign', defaultType: 'PAUSE_CAMPAIGN', isPause: true },
    ],
    units: [
      { value: 'Percentage (%)', label: 'Percentage (%)' },
      { value: 'Fixed Value', label: 'Fixed Value' },
    ],
  },
  TARGETING: {
    scopes: [
      { value: 'Keyword Bid', label: 'Keyword Bid' },
      { value: 'Target Bid', label: 'Target Bid' },
      { value: 'Negative Keyword', label: 'Negative Keyword' },
    ],
    verbs: [
      { value: 'Increase Bid', label: 'Increase Bid', defaultType: 'INCREASE_BID' },
      { value: 'Decrease Bid', label: 'Decrease Bid', defaultType: 'DECREASE_BID' },
      { value: 'Pause Target', label: 'Pause Target', defaultType: 'PAUSE_TARGET', isPause: true },
      { value: 'Set Bid', label: 'Set Bid', defaultType: 'INCREASE_BID' },
    ],
    units: [
      { value: 'Percentage (%)', label: 'Percentage (%)' },
      { value: 'Fixed Value', label: 'Fixed Value' },
    ],
  },
  SEARCH_TERM: {
    scopes: [
      { value: 'Negative Search Term', label: 'Negative Search Term' },
      { value: 'Targeting Keyword', label: 'Targeting Keyword' },
    ],
    verbs: [
      { value: 'Add as Negative', label: 'Add as Negative', defaultType: 'ADD_AS_NEGATIVE', isPause: true },
      { value: 'Add as Targeting', label: 'Add as Targeting', defaultType: 'ADD_AS_TARGETING' },
    ],
    units: [{ value: 'Percentage (%)', label: 'Percentage (%)' }],
  },
};

export function RuleFormModal({
  open,
  onClose,
  adsAccountId,
  ruleId,
  defaultAffectedParameter,
  meta,
  currencySymbol = '₹',
  onRuleSaved,
}: RuleFormModalProps) {
  const { success, error: toastError } = useToast();

  const [name, setName] = useState<string>('');
  const [affectedParameter, setAffectedParameter] = useState<AffectedParameter>(defaultAffectedParameter);
  const [dateFilter, setDateFilter] = useState<string>('LAST_30_DAYS');
  const [daysSinceCreationEnabled, setDaysSinceCreationEnabled] = useState<boolean>(false);
  const [daysSinceCreation, setDaysSinceCreation] = useState<number>(0);

  const [conditions, setConditions] = useState<Condition[]>([
    { metric: 'spend', op: 'GTE', value: 20 },
  ]);

  const [actions, setActions] = useState<RuleAction[]>([
    { type: 'INCREASE_PLACEMENT', params: { points: 20, scope: 'Top of Search', verb: 'Increase Bid', unit: 'Percentage (%)' } },
  ]);

  const [ruleDays, setRuleDays] = useState<string[]>(['All']);
  const [ruleTimes, setRuleTimes] = useState<string[]>(['09:00']);
  const [allowMultipleTimes, setAllowMultipleTimes] = useState<boolean>(true);
  const [hourlyEnabled, setHourlyEnabled] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset when modal opens or ruleId changes
  useEffect(() => {
    if (!open) return;
    setFormError(null);

    if (ruleId) {
      setLoading(true);
      fetchRule(ruleId)
        .then((rule) => {
          setName(rule.name);
          setAffectedParameter(rule.affected_parameter);
          setDateFilter(rule.date_filter || 'LAST_30_DAYS');
          setConditions(rule.conditions?.length ? rule.conditions : [{ metric: 'spend', op: 'GTE', value: 20 }]);
          setActions(rule.actions?.length ? rule.actions : [{ type: 'INCREASE_PLACEMENT', params: {} }]);

          const firstParams = rule.actions?.[0]?.params || {};
          if (Array.isArray(firstParams.rule_days) && firstParams.rule_days.length > 0) {
            setRuleDays(firstParams.rule_days);
          } else {
            setRuleDays(['All']);
          }

          if (Array.isArray(firstParams.rule_times) && firstParams.rule_times.length > 0) {
            setRuleTimes(firstParams.rule_times);
          } else {
            setRuleTimes(['09:00']);
          }

          if (typeof firstParams.allow_multiple_times === 'boolean') {
            setAllowMultipleTimes(firstParams.allow_multiple_times);
          }
          if (typeof firstParams.hourly_based_changes === 'boolean') {
            setHourlyEnabled(firstParams.hourly_based_changes);
          }
          if (rule.min_clicks > 0) {
            setDaysSinceCreationEnabled(true);
            setDaysSinceCreation(rule.min_clicks);
          }
        })
        .catch(() => {
          toastError('Failed to load rule configuration');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setName('');
      setAffectedParameter(defaultAffectedParameter);
      setDateFilter('LAST_30_DAYS');
      setDaysSinceCreationEnabled(false);
      setDaysSinceCreation(0);
      setConditions([{ metric: 'spend', op: 'GTE', value: 20 }]);
      setRuleDays(['All']);
      setRuleTimes(['09:00']);
      setAllowMultipleTimes(true);
      setHourlyEnabled(false);

      // Default initial action based on parameter
      const cfg = ACTION_CONFIGS[defaultAffectedParameter] || ACTION_CONFIGS.PLACEMENT;
      const firstVerb = cfg.verbs[0];
      setActions([
        {
          type: firstVerb.defaultType,
          params: {
            scope: cfg.scopes[0].value,
            verb: firstVerb.value,
            unit: cfg.units[0].value,
            points: 20,
            pct: 20,
          },
        },
      ]);
    }
  }, [open, ruleId, defaultAffectedParameter, toastError]);

  const categoryTitle = useMemo(() => {
    switch (affectedParameter) {
      case 'PLACEMENT':
        return 'Placement Rules';
      case 'CAMPAIGN':
        return 'Budget Rules';
      case 'TARGETING':
        return 'Targeting Rules';
      case 'SEARCH_TERM':
        return 'Search Term Rules';
      default:
        return 'Rule Configuration';
    }
  }, [affectedParameter]);

  // Handle Affected Parameter change
  const handleParameterChange = (newParam: AffectedParameter) => {
    setAffectedParameter(newParam);
    const cfg = ACTION_CONFIGS[newParam] || ACTION_CONFIGS.PLACEMENT;
    const firstVerb = cfg.verbs[0];
    setActions([
      {
        type: firstVerb.defaultType,
        params: {
          scope: cfg.scopes[0].value,
          verb: firstVerb.value,
          unit: cfg.units[0].value,
          points: 20,
          pct: 20,
        },
      },
    ]);
  };

  // Conditions helpers
  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { metric: 'spend', op: 'GTE', value: 20 }]);
  };

  const handleUpdateCondition = (index: number, updated: Condition) => {
    setConditions((prev) => prev.map((c, i) => (i === index ? updated : c)));
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  // Actions helpers
  const handleAddAction = () => {
    const cfg = ACTION_CONFIGS[affectedParameter] || ACTION_CONFIGS.PLACEMENT;
    const firstVerb = cfg.verbs[0];
    setActions((prev) => [
      ...prev,
      {
        type: firstVerb.defaultType,
        params: {
          scope: cfg.scopes[0].value,
          verb: firstVerb.value,
          unit: cfg.units[0].value,
          points: 20,
          pct: 20,
        },
      },
    ]);
  };

  const handleUpdateAction = (index: number, updated: RuleAction) => {
    setActions((prev) => prev.map((a, i) => (i === index ? updated : a)));
  };

  const handleRemoveAction = (index: number) => {
    if (actions.length <= 1) return;
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  // Days toggle logic (exclusive 'All')
  const toggleDay = (day: string) => {
    if (day === 'All') {
      if (ruleDays.includes('All')) {
        setRuleDays([]);
      } else {
        setRuleDays(['All']);
      }
      return;
    }

    if (INTERVAL_OPTIONS.includes(day)) {
      if (ruleDays.includes(day)) {
        setRuleDays(['All']);
      } else {
        setRuleDays([day]);
      }
      return;
    }

    let next = ruleDays.filter((d) => d !== 'All' && !INTERVAL_OPTIONS.includes(d));
    if (next.includes(day)) {
      next = next.filter((d) => d !== day);
    } else {
      next = [...next, day];
    }
    setRuleDays(next.length > 0 ? next : ['All']);
  };

  const isDayActive = (day: string): boolean => {
    return ruleDays.includes(day);
  };

  // Times helpers
  const handleAddTime = () => {
    setAllowMultipleTimes(true);
    setRuleTimes((prev) => [...prev, '14:00']);
  };

  const handleTimeChange = (index: number, val: string) => {
    setRuleTimes((prev) => prev.map((t, i) => (i === index ? val : t)));
  };

  const handleRemoveTime = (index: number) => {
    if (ruleTimes.length <= 1) return;
    setRuleTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Rule name is required');
      return;
    }
    if (!adsAccountId) {
      setFormError('No active advertising account selected');
      return;
    }

    setSaving(true);
    setFormError(null);

    const serializedActions: RuleAction[] = actions.map((act) => ({
      type: act.type,
      params: {
        ...act.params,
        rule_days: ruleDays,
        rule_times: ruleTimes,
        allow_multiple_times: allowMultipleTimes,
        hourly_based_changes: hourlyEnabled,
      },
    }));

    const draft: RuleDraft = {
      id: ruleId || undefined,
      name: name.trim(),
      affected_parameter: affectedParameter,
      date_filter: dateFilter,
      min_clicks: daysSinceCreationEnabled ? daysSinceCreation : 0,
      conditions,
      actions: serializedActions,
      scope_mode: 'ALL',
      campaign_ids: [],
    };

    try {
      if (ruleId) {
        const updated = await updateRule(ruleId, draft);
        success('Rule updated successfully');
        onRuleSaved(updated);
        onClose();
      } else {
        const res = await createRule(adsAccountId, draft);
        success('Rule created successfully');
        onRuleSaved(res.rule);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save rule';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const dateFilterOptions = [
    { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { value: 'LAST_14_DAYS', label: 'Last 14 Days' },
    { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { value: 'LAST_60_DAYS', label: 'Last 60 Days' },
    { value: 'TODAY', label: 'Today' },
    { value: 'YESTERDAY', label: 'Yesterday' },
  ];

  const ruleTypeOptions = [
    { value: 'PLACEMENT', label: 'Placement' },
    { value: 'CAMPAIGN', label: 'Budget' },
    { value: 'TARGETING', label: 'Targeting' },
    { value: 'SEARCH_TERM', label: 'Search Term' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ruleId ? `${categoryTitle} (Edit)` : categoryTitle}
      size="xl"
    >
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading rule details...</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Rule Name, Date Filter, Day's Since Creation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                required
                className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-sm bg-white text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Date Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800">Date Filter</label>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                options={dateFilterOptions}
              />
            </div>

            {/* Day's Since Creation */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={daysSinceCreationEnabled}
                  onChange={(e) => setDaysSinceCreationEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 size-3.5"
                />
                <span>Day&apos;s Since Creation</span>
              </label>
              <input
                type="number"
                min={0}
                value={daysSinceCreation}
                onChange={(e) => setDaysSinceCreation(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={!daysSinceCreationEnabled}
                placeholder="0"
                className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-sm bg-white font-mono tabular-nums text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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

            <div className="flex flex-col gap-2">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 min-w-[150px]">
                    <Select
                      value={cond.metric}
                      onChange={(e) => handleUpdateCondition(idx, { ...cond, metric: e.target.value })}
                      options={Object.entries(DEFAULT_METRICS).map(([k, v]) => ({ value: k, label: v.label }))}
                      placeholder="Select"
                    />
                  </div>
                  <div className="w-full sm:w-[150px]">
                    <Select
                      value={cond.op}
                      onChange={(e) => handleUpdateCondition(idx, { ...cond, op: e.target.value as Operator })}
                      options={Object.entries(DEFAULT_OPERATORS).map(([k, v]) => ({ value: k, label: `${v.symbol} (${v.label})` }))}
                      placeholder="Select"
                    />
                  </div>
                  <div className="w-full sm:w-[140px] relative">
                    <input
                      type="number"
                      step="any"
                      value={cond.value !== null && cond.value !== undefined ? cond.value : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        handleUpdateCondition(idx, { ...cond, value: val });
                      }}
                      placeholder="0"
                      className="w-full h-8 px-2.5 pr-7 rounded-md border border-slate-300 text-sm bg-white font-mono tabular-nums text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      {cond.metric === 'spend' || cond.metric === 'cpc' ? currencySymbol : cond.metric === 'acos' || cond.metric === 'ctr' ? '%' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(idx)}
                    disabled={conditions.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors self-end sm:self-center cursor-pointer"
                    title="Remove condition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
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

            <div className="flex flex-col gap-2">
              {actions.map((act, idx) => {
                const cfg = ACTION_CONFIGS[affectedParameter] || ACTION_CONFIGS.PLACEMENT;
                const currentScope = String(act.params?.scope || act.params?.placement_position || cfg.scopes[0].value);
                const currentVerb = String(act.params?.verb || cfg.verbs[0].value);
                const currentUnit = String(act.params?.unit || cfg.units[0].value);
                const rawVal = act.params?.points ?? act.params?.pct ?? act.params?.bid ?? 20;
                const isPause = Boolean(cfg.verbs.find((v) => v.value === currentVerb)?.isPause);

                const updateActionFields = (scope: string, verb: string, unit: string, val: number | null) => {
                  const verbDef = cfg.verbs.find((v) => v.value === verb) || cfg.verbs[0];
                  const targetType = verbDef.defaultType;
                  const newParams: Record<string, any> = {
                    ...act.params,
                    scope,
                    placement_position: scope,
                    target_scope: scope,
                    verb,
                    unit,
                  };
                  if (affectedParameter === 'PLACEMENT') newParams.points = val ?? 20;
                  else if (affectedParameter === 'CAMPAIGN') newParams.pct = val ?? 10;
                  else if (affectedParameter === 'TARGETING') newParams.pct = val ?? 10;
                  else if (affectedParameter === 'SEARCH_TERM') {
                    if (verb === 'Add as Negative') {
                      newParams.match_type = 'NEGATIVE_EXACT';
                      newParams.level = 'AD_GROUP';
                    } else {
                      newParams.match_type = 'EXACT';
                      newParams.bid = val;
                    }
                  }

                  handleUpdateAction(idx, { type: targetType, params: newParams });
                };

                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Scope */}
                    <div className="flex-1 w-full sm:w-1/4">
                      <Select
                        value={currentScope}
                        onChange={(e) => updateActionFields(e.target.value, currentVerb, currentUnit, rawVal)}
                        options={cfg.scopes}
                      />
                    </div>
                    {/* Verb */}
                    <div className="flex-1 w-full sm:w-1/4">
                      <Select
                        value={currentVerb}
                        onChange={(e) => updateActionFields(currentScope, e.target.value, currentUnit, rawVal)}
                        options={cfg.verbs.map((v) => ({ value: v.value, label: v.label }))}
                      />
                    </div>
                    {/* Unit */}
                    <div className="flex-1 w-full sm:w-1/4">
                      <Select
                        value={currentUnit}
                        onChange={(e) => updateActionFields(currentScope, currentVerb, e.target.value, rawVal)}
                        options={cfg.units.map((u) => ({
                          value: u.value,
                          label: u.value === 'Fixed Value' ? `Fixed Value (${currencySymbol})` : u.label,
                        }))}
                        disabled={isPause}
                      />
                    </div>
                    {/* Value */}
                    <div className="w-full sm:w-1/4 relative">
                      <input
                        type="number"
                        min={1}
                        max={900}
                        value={isPause ? '' : (rawVal ?? '')}
                        onChange={(e) => {
                          const parsed = e.target.value === '' ? null : Number(e.target.value);
                          updateActionFields(currentScope, currentVerb, currentUnit, parsed);
                        }}
                        disabled={isPause}
                        placeholder={isPause ? '—' : '20'}
                        className="w-full h-8 px-2.5 pr-8 rounded-md border border-slate-300 text-sm bg-white font-mono tabular-nums text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                      {!isPause && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                          {currentUnit.includes('Fixed') ? currencySymbol : '%'}
                        </span>
                      )}
                    </div>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(idx)}
                      disabled={actions.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors self-end sm:self-center cursor-pointer"
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

          {/* Rule Days Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-800">
              Rule Days <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {/* Row 1: All */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDay('All')}
                  className={`px-3.5 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                    isDayActive('All')
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 font-normal'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Row 2: Days of week */}
              <div className="flex flex-wrap items-center gap-2">
                {ALL_DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                      isDayActive(day)
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 font-normal'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Row 3: Intervals */}
              <div className="flex flex-wrap items-center gap-2">
                {INTERVAL_OPTIONS.map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => toggleDay(interval)}
                    className={`px-3.5 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                      isDayActive(interval)
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 font-normal'
                    }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rule Times Section */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-slate-800">
              Rule Times <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {ruleTimes.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="relative w-36">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="w-full h-8 px-2.5 pr-8 rounded-md border border-slate-300 text-sm font-mono bg-white text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                    <Clock className="size-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {ruleTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove time"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-mono text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowMultipleTimes}
                  onChange={(e) => setAllowMultipleTimes(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 size-3.5 cursor-pointer"
                />
                <span>Allow Multiple Time Change In A Campaign Per Day</span>
                <span title="Allows executing this rule multiple times per day for intraday pacing">
                  <Info className="size-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </span>
              </label>

              <Button
                type="button"
                size="xs"
                onClick={handleAddTime}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 font-medium shadow-2xs"
              >
                <Plus className="size-3" />
                <span>Add Time</span>
              </Button>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Enable Hourly-Based Changes Section */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Clock className="size-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <span>Enable Hourly-Based Changes</span>
                  <span title="Configure changes for specific time periods throughout the day.">
                    <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure changes for specific time periods throughout the day.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={hourlyEnabled}
              onClick={() => setHourlyEnabled(!hourlyEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                hourlyEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle hourly-based changes"
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  hourlyEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px] shadow-xs"
            >
              {saving ? 'Saving...' : ruleId ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
