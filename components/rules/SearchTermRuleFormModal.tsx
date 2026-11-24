'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/RulesButton';
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

interface SearchTermRuleFormModalProps {
  open?: boolean;
  onClose: () => void;
  adsAccountId: number | null;
  ruleId?: number | null;
  meta: RuleMeta | null;
  onRuleSaved: (savedRule: Rule) => void;
}

const DATE_FILTER_OPTIONS = [
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { value: 'LAST_14_DAYS', label: 'Last 14 Days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { value: 'LAST_60_DAYS', label: 'Last 60 Days' },
  { value: 'LAST_90_DAYS', label: 'Last 90 Days' },
];

export const SEARCH_TERM_METRIC_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'roas', label: 'Return on ad spend (ROAS)' },
  { value: 'purchases_flag', label: 'Purchases' },
  { value: 'spend', label: 'Spend' },
  { value: 'acos', label: 'Advertising cost of sales (ACOS)' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'campaign_active_status', label: 'Campaign Active Status' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'bid', label: 'Bid' },
];

export const SEARCH_TERM_OPERATOR_OPTIONS = [
  { value: 'LT', label: 'Less Than' },
  { value: 'LTE', label: 'Less Than Or Equal To' },
  { value: 'GTE', label: 'Greater Than Or Equal To' },
  { value: 'GT', label: 'Greater Than' },
  { value: 'EQ', label: 'Equal To' },
  { value: 'NEQ', label: 'Not Equal To' },
  { value: 'BETWEEN', label: 'Between' },
];

export const SEARCH_TERM_ACTION_NAMES = [
  { value: 'Targeting', label: 'Targeting' },
  { value: 'Negative Targeting', label: 'Negative Targeting' },
  { value: 'Create Campaign', label: 'Create Campaign' },
];

export const SEARCH_TERM_ACTION_TYPES = [
  { value: 'EXACT', label: 'EXACT' },
  { value: 'PHRASE', label: 'PHRASE' },
];

interface SearchTermConditionState {
  metric: string;
  op: string;
  value: number | string | null;
  maxValue?: number | string | null;
  useTargetAcos?: boolean;
}

export function SearchTermRuleFormModal({
  open,
  onClose,
  adsAccountId,
  ruleId = null,
  meta,
  onRuleSaved,
}: SearchTermRuleFormModalProps) {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(ruleId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Top fields
  const [name, setName] = useState('');
  const [dateFilter, setDateFilter] = useState('LAST_7_DAYS');

  // Conditions
  const [conditions, setConditions] = useState<SearchTermConditionState[]>([
    {
      metric: 'sales',
      op: 'LT',
      value: '',
      maxValue: '',
      useTargetAcos: false,
    },
  ]);

  // Actions
  const [actionName, setActionName] = useState('Targeting');
  const [actionType, setActionType] = useState('EXACT');

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;

    if (ruleId && adsAccountId) {
      setLoading(true);
      fetchRule(ruleId)
        .then((rule) => {
          setName(rule.name || '');
          setDateFilter(rule.date_filter || 'LAST_7_DAYS');

          // Populate conditions
          if (rule.conditions && rule.conditions.length > 0) {
            const mappedConds: SearchTermConditionState[] = rule.conditions.map((c) => {
              const m = (c.metric || '').toLowerCase();
              const isPurchasesFlag = m === 'purchases_flag';
              const isCampaignStatus = m === 'campaign_active_status';
              const isTargetAcos = m === 'acos' && (c.value === 30 || (c as any).use_target_acos === true);

              return {
                metric: isPurchasesFlag ? 'purchases_flag' : isCampaignStatus ? 'campaign_active_status' : m,
                op: c.op || 'LT',
                value: isPurchasesFlag || isCampaignStatus ? '' : (c.value ?? ''),
                maxValue: (c as any).max_value ?? (c as any).value_max ?? '',
                useTargetAcos: isTargetAcos,
              };
            });
            setConditions(mappedConds);
          } else {
            setConditions([
              {
                metric: 'sales',
                op: 'LT',
                value: '',
                maxValue: '',
                useTargetAcos: false,
              },
            ]);
          }

          // Populate Action
          if (rule.actions && rule.actions.length > 0) {
            const firstAction = rule.actions[0];
            const aTypeUpper = (firstAction.type || '').toUpperCase();
            if (aTypeUpper.includes('NEGATIVE')) {
              setActionName('Negative Targeting');
            } else if (aTypeUpper.includes('CREATE_CAMPAIGN') || aTypeUpper.includes('CREATE CAMPAIGN')) {
              setActionName('Create Campaign');
            } else {
              setActionName('Targeting');
            }
            setActionType(firstAction.params?.match_type || 'EXACT');
          } else {
            setActionName('Targeting');
            setActionType('EXACT');
          }
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : 'Failed to load rule.';
          toastError(msg);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Create mode fresh state
      setName('');
      setDateFilter('LAST_7_DAYS');
      setConditions([
        {
          metric: 'sales',
          op: 'LT',
          value: '',
          maxValue: '',
          useTargetAcos: false,
        },
      ]);
      setActionName('Targeting');
      setActionType('EXACT');
      setFormError(null);
    }
  }, [open, ruleId, adsAccountId, toastError]);

  // Condition Handlers
  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        metric: 'sales',
        op: 'LT',
        value: '',
        maxValue: '',
        useTargetAcos: false,
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMetricChange = (index: number, newMetric: string) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        metric: newMetric,
        op: 'LT',
        value: '',
        maxValue: '',
        useTargetAcos: false,
      };
      return copy;
    });
  };

  const handleOpChange = (index: number, newOp: string) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        op: newOp,
      };
      return copy;
    });
  };

  const handleValueChange = (index: number, val: string) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        value: val === '' ? '' : Number(val),
      };
      return copy;
    });
  };

  const handleMaxValueChange = (index: number, val: string) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        maxValue: val === '' ? '' : Number(val),
      };
      return copy;
    });
  };

  const handleToggleTargetAcos = (index: number, checked: boolean) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        useTargetAcos: checked,
        value: checked ? 30 : '',
      };
      return copy;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a rule name.');
      return;
    }

    if (!adsAccountId) {
      setFormError('No active ads account selected.');
      return;
    }

    // Build conditions payload
    const finalConditions: Condition[] = [];
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (c.metric === 'purchases_flag') {
        finalConditions.push({
          metric: 'purchases_flag',
          op: 'GT',
          value: null,
        });
      } else if (c.metric === 'campaign_active_status') {
        finalConditions.push({
          metric: 'campaign_active_status',
          op: 'EQ',
          value: null,
        });
      } else {
        const numVal = c.value === '' || c.value === null ? 0 : Number(c.value);
        const condObj: any = {
          metric: c.metric,
          op: c.op as Operator,
          value: numVal,
        };
        if (c.op === 'BETWEEN') {
          condObj.max_value = c.maxValue === '' || c.maxValue === null ? 0 : Number(c.maxValue);
        }
        if (c.metric === 'acos' && c.useTargetAcos) {
          condObj.use_target_acos = true;
          condObj.value = 30;
        }
        finalConditions.push(condObj);
      }
    }

    // Build Action payload
    const backendActionType =
      actionName === 'Negative Targeting'
        ? 'ADD_AS_NEGATIVE'
        : actionName === 'Create Campaign'
          ? 'CREATE_CAMPAIGN'
          : 'ADD_AS_TARGETING';

    const finalActions: RuleAction[] = [
      {
        type: backendActionType,
        params: {
          action_name: actionName,
          match_type: actionType,
        },
      },
    ];

    const draft: RuleDraft = {
      name: name.trim(),
      affected_parameter: 'SEARCH_TERM',
      date_filter: dateFilter,
      min_clicks: 0,
      conditions: finalConditions,
      actions: finalActions,
      scope_mode: 'ALL',
      campaign_ids: [],
    };

    setSaving(true);
    try {
      let savedRule: Rule;
      if (isEditing && ruleId) {
        savedRule = await updateRule(ruleId, draft);
        success('Search term rule updated successfully.');
      } else {
        const res = await createRule(adsAccountId, draft);
        savedRule = res.rule;
        success('Search term rule created successfully.');
      }
      onRuleSaved(savedRule);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save search term rule.';
      setFormError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
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
              {isEditing ? 'Edit Search Term Rule' : 'Create Search Term Rule'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define automated conditions to evaluate search terms, harvesting, and negative keyword additions.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card Container */}
      <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-2xs">
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

          {/* Row 1: Top 2 Fields (Rule Name, Date Filter) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Rule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter rule name"
                className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Date Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800">Date Filter</label>
              <div className="relative inline-flex w-full">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-800 text-xs font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
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

            <div className="flex flex-col gap-3">
              {conditions.map((cond, idx) => {
                const isPurchasesFlag = cond.metric === 'purchases_flag';
                const isCampaignActiveStatus = cond.metric === 'campaign_active_status';
                const hasNoAttributes = isPurchasesFlag || isCampaignActiveStatus;

                const isCurrency =
                  cond.metric === 'sales' ||
                  cond.metric === 'spend' ||
                  cond.metric === 'bid';

                const isAcos = cond.metric === 'acos';
                const isBetween = cond.op === 'BETWEEN';

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Metric Selector */}
                      <div className="relative inline-flex min-w-[200px] flex-1">
                        <select
                          value={cond.metric}
                          onChange={(e) => handleMetricChange(idx, e.target.value)}
                          className="w-full h-8 px-2.5 pr-7 appearance-none rounded-md border border-slate-300 bg-white text-slate-800 text-xs font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                        >
                          {SEARCH_TERM_METRIC_OPTIONS.map((opt, optIdx) => (
                            <option
                              key={`${opt.value}-${optIdx}`}
                              value={opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      {/* Attributes (unless purchases_flag or campaign_active_status) */}
                      {!hasNoAttributes && (
                        <>
                          {/* Operator */}
                          <div className="relative inline-flex w-36">
                            <select
                              value={cond.op}
                              onChange={(e) => handleOpChange(idx, e.target.value)}
                              className="w-full h-8 px-2.5 pr-7 appearance-none rounded-md border border-slate-300 bg-white text-slate-800 text-xs font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                            >
                              {SEARCH_TERM_OPERATOR_OPTIONS.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                              <ChevronDown className="h-3.5 w-3.5" />
                            </span>
                          </div>

                          {/* Value Input */}
                          {isBetween ? (
                            <div className="flex items-center gap-1.5">
                              {/* Min Value */}
                              <div className="relative inline-flex items-center w-28">
                                {isCurrency && (
                                  <span className="absolute left-2.5 text-xs text-slate-500 font-medium">
                                    ₹
                                  </span>
                                )}
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Min"
                                  value={cond.value ?? ''}
                                  onChange={(e) => handleValueChange(idx, e.target.value)}
                                  className={`w-full h-8 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-mono outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 ${
                                    isCurrency ? 'pl-6 pr-2' : isAcos ? 'pl-2.5 pr-6' : 'px-2.5'
                                  }`}
                                />
                                {isAcos && (
                                  <span className="absolute right-2.5 text-xs text-slate-500 font-medium">
                                    %
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-medium">to</span>
                              {/* Max Value */}
                              <div className="relative inline-flex items-center w-28">
                                {isCurrency && (
                                  <span className="absolute left-2.5 text-xs text-slate-500 font-medium">
                                    ₹
                                  </span>
                                )}
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Max"
                                  value={cond.maxValue ?? ''}
                                  onChange={(e) => handleMaxValueChange(idx, e.target.value)}
                                  className={`w-full h-8 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-mono outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 ${
                                    isCurrency ? 'pl-6 pr-2' : isAcos ? 'pl-2.5 pr-6' : 'px-2.5'
                                  }`}
                                />
                                {isAcos && (
                                  <span className="absolute right-2.5 text-xs text-slate-500 font-medium">
                                    %
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="relative inline-flex items-center w-36">
                              {isCurrency && (
                                <span className="absolute left-2.5 text-xs text-slate-500 font-medium">
                                  ₹
                                </span>
                              )}
                              <input
                                type="number"
                                step="any"
                                disabled={isAcos && cond.useTargetAcos}
                                placeholder="Value"
                                value={cond.value ?? ''}
                                onChange={(e) => handleValueChange(idx, e.target.value)}
                                className={`w-full h-8 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-mono outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                                  isCurrency ? 'pl-6 pr-2' : isAcos ? 'pl-2.5 pr-6' : 'px-2.5'
                                }`}
                              />
                              {isAcos && (
                                <span className="absolute right-2.5 text-xs text-slate-500 font-medium">
                                  %
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        disabled={conditions.length <= 1}
                        onClick={() => handleRemoveCondition(idx)}
                        aria-label="Remove condition"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Checkbox for ACOS Target below row */}
                    {isAcos && (
                      <div className="flex items-center gap-2 pl-1 pt-0.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={cond.useTargetAcos ?? false}
                            onChange={(e) => handleToggleTargetAcos(idx, e.target.checked)}
                            className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>Use Target ACOS (30%)</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Action Type Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-600 inline-block" />
              <h3 className="text-sm font-bold text-slate-800">
                Action Type <span className="text-red-500">*</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-800">Action Name</label>
                <div className="relative inline-flex w-full">
                  <select
                    value={actionName}
                    onChange={(e) => setActionName(e.target.value)}
                    className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-800 text-xs font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {SEARCH_TERM_ACTION_NAMES.map((an) => (
                      <option key={an.value} value={an.value}>
                        {an.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* Action Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-800">Action Type</label>
                <div className="relative inline-flex w-full">
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full h-8.5 px-3 pr-8 appearance-none rounded-md border border-slate-300 bg-white text-slate-800 text-xs font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {SEARCH_TERM_ACTION_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-slate-300 my-1" />

          {/* Footer Controls: Back on Left, Cancel + Submit on Right */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
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
                disabled={saving}
                className="text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[80px]"
              >
                {saving ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}
