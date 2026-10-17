'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { getCampaignSettings, updateCampaignSettings } from '@/lib/api-client';
import type {
  UserCampaignSettings,
  HealthRule,
  HealthRuleCondition,
} from '@/lib/types/campaign';
import { useToast } from '@/components/ui/toast';

const ALLOWED_METRICS = [
  { key: 'acos', label: 'ACOS (%)' },
  { key: 'roas', label: 'ROAS (x)' },
  { key: 'spend', label: 'Spend' },
  { key: 'sales', label: 'Sales' },
  { key: 'orders', label: 'Orders' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'ctr', label: 'CTR (%)' },
  { key: 'cpc', label: 'CPC' },
  { key: 'cvr', label: 'CVR (%)' },
  { key: 'budget_utilization', label: 'Budget Utilization (%)' },
  { key: 'age_days', label: 'Campaign Age (Days)' },
  { key: 'spend_without_sales', label: 'Spend without Sales' },
];

const ALLOWED_OPS = ['>', '>=', '<', '<=', '=='];

const COLOR_CLASSES: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  red: 'bg-rose-50 text-rose-700 border-rose-300',
  amber: 'bg-amber-50 text-amber-700 border-amber-300',
  blue: 'bg-sky-50 text-sky-700 border-sky-300',
  slate: 'bg-slate-50 text-slate-700 border-slate-300',
};

const DEFAULT_HEALTH_RULES: HealthRule[] = [
  {
    key: 'LEARNING',
    name: 'Learning',
    color: 'blue',
    enabled: true,
    match: 'ANY',
    conditions: [
      { metric: 'age_days', op: '<', value: 7 },
      { metric: 'clicks', op: '<', value: 20 },
    ],
  },
  {
    key: 'BUDGET_LEAK',
    name: 'Budget Leak',
    color: 'red',
    enabled: true,
    match: 'ANY',
    conditions: [
      { metric: 'acos', op: '>', value: 90 },
      { metric: 'spend_without_sales', op: '>', value: 0 },
    ],
  },
  {
    key: 'SCALE',
    name: 'Ready to Scale',
    color: 'amber',
    enabled: true,
    match: 'ALL',
    conditions: [
      { metric: 'acos', op: '<=', value: '@target_acos' },
      { metric: 'orders', op: '>=', value: 3 },
    ],
  },
];

export default function CampaignSettingsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings fields
  const [defaultTargetAcos, setDefaultTargetAcos] = useState<number>(25);
  const [bidLimitAcos, setBidLimitAcos] = useState<number | ''>('');
  const [acosLow, setAcosLow] = useState<number>(20);
  const [acosHigh, setAcosHigh] = useState<number>(90);

  // Health rules
  const [healthRules, setHealthRules] = useState<HealthRule[]>(DEFAULT_HEALTH_RULES);

  // Modal for editing/adding rule
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Modal form state
  const [ruleKey, setRuleKey] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [ruleColor, setRuleColor] = useState<'red' | 'amber' | 'green' | 'blue' | 'slate'>('green');
  const [ruleMatch, setRuleMatch] = useState<'ALL' | 'ANY'>('ALL');
  const [ruleConditions, setRuleConditions] = useState<HealthRuleCondition[]>([
    { metric: 'acos', op: '<=', value: 30 },
  ]);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getCampaignSettings()
      .then((s) => {
        setDefaultTargetAcos(s.default_target_acos ?? 25);
        setBidLimitAcos(s.bid_limit_acos ?? '');
        setAcosLow(s.acos_low ?? 20);
        setAcosHigh(s.acos_high ?? 90);
        if (s.health_rules && s.health_rules.length > 0) {
          setHealthRules(s.health_rules);
        } else {
          setHealthRules(DEFAULT_HEALTH_RULES);
        }
      })
      .catch((err) => {
        showToast({ title: 'Failed to load settings', message: err?.message, type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSaveAll = async () => {
    if (acosLow < 0 || acosHigh <= acosLow || acosHigh > 1000) {
      showToast({
        title: 'Validation error',
        message: 'Must satisfy: 0 ≤ Lower ACOS < Higher ACOS ≤ 1000%',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: UserCampaignSettings = {
        default_target_acos: defaultTargetAcos,
        bid_limit_acos: bidLimitAcos === '' ? null : Number(bidLimitAcos),
        acos_low: acosLow,
        acos_high: acosHigh,
        health_rules: healthRules,
      };

      await updateCampaignSettings(payload);
      showToast({ title: 'Settings saved', message: 'Campaign configuration and health rules updated.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Save failed', message: err?.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setHealthRules(DEFAULT_HEALTH_RULES);
    setAcosLow(20);
    setAcosHigh(90);
    setDefaultTargetAcos(25);
    setBidLimitAcos('');
    showToast({ title: 'Defaults restored', message: 'Click "Save changes" to persist defaults.', type: 'info' });
  };

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= healthRules.length) return;
    const next = [...healthRules];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setHealthRules(next);
  };

  const toggleRuleEnabled = (index: number) => {
    const next = [...healthRules];
    next[index].enabled = !next[index].enabled;
    setHealthRules(next);
  };

  const deleteRule = (index: number) => {
    if (healthRules.length <= 1) {
      showToast({ title: 'Cannot delete', message: 'At least one health rule must remain.', type: 'error' });
      return;
    }
    setHealthRules(healthRules.filter((_, i) => i !== index));
  };

  const openAddRule = () => {
    setEditingIndex(null);
    setRuleKey(`CUSTOM_${Date.now().toString().slice(-4)}`);
    setRuleName('');
    setRuleColor('amber');
    setRuleMatch('ALL');
    setRuleConditions([{ metric: 'acos', op: '<=', value: 30 }]);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditRule = (index: number) => {
    const r = healthRules[index];
    setEditingIndex(index);
    setRuleKey(r.key);
    setRuleName(r.name);
    setRuleColor(r.color);
    setRuleMatch(r.match);
    setRuleConditions(r.conditions.map((c) => ({ ...c })));
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveModalRule = () => {
    const trimmedName = ruleName.trim();
    if (!trimmedName || trimmedName.length > 24) {
      setModalError('Rule name is required (max 24 characters).');
      return;
    }
    if (ruleConditions.length === 0) {
      setModalError('At least one condition is required.');
      return;
    }

    const ruleObj: HealthRule = {
      key: ruleKey.trim().toUpperCase().replace(/\s+/g, '_'),
      name: trimmedName,
      color: ruleColor,
      enabled: true,
      match: ruleMatch,
      conditions: ruleConditions,
    };

    if (editingIndex !== null) {
      const next = [...healthRules];
      next[editingIndex] = ruleObj;
      setHealthRules(next);
    } else {
      if (healthRules.length >= 12) {
        setModalError('Maximum 12 health rules allowed.');
        return;
      }
      setHealthRules([...healthRules, ruleObj]);
    }

    setModalOpen(false);
  };

  const addCondition = () => {
    if (ruleConditions.length >= 4) return;
    setRuleConditions([...ruleConditions, { metric: 'clicks', op: '>=', value: 10 }]);
  };

  const removeCondition = (idx: number) => {
    if (ruleConditions.length <= 1) return;
    setRuleConditions(ruleConditions.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-graph-paper-faint p-6 space-y-6 font-mono text-xs text-text-main max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
        <Link href="/campaigns" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Campaigns</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-800">Campaign Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
            Campaign Settings
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Set global optimization targets, alert boundaries, and dynamic health score evaluation rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50 text-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded font-medium shadow-xs hover:bg-indigo-800 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save changes'}</span>
          </button>
        </div>
      </div>

      {/* General Settings Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
        <span className="font-bold uppercase tracking-wider text-slate-800 block text-xs">
          Global Optimization & Alert Thresholds
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Default Target ACOS (%)
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={defaultTargetAcos}
              onChange={(e) => setDefaultTargetAcos(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-border-dim rounded bg-white font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Applied automatically when a new campaign doesn&apos;t specify a target ACOS.
            </span>
          </div>

          <div>
            <label className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Bid-Limit ACOS (%) (Optional)
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={bidLimitAcos}
              onChange={(e) => setBidLimitAcos(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full px-3 py-1.5 border border-border-dim rounded bg-white font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Caps automated bid increases when campaign ACOS breaches this limit.
            </span>
          </div>

          <div>
            <label className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Notify when ACOS is lower than (%)
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={acosLow}
              onChange={(e) => setAcosLow(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-border-dim rounded bg-white font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Identifies scaling opportunities (campaigns with 0 sales excluded).
            </span>
          </div>

          <div>
            <label className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Notify when ACOS is higher than (%)
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={acosHigh}
              onChange={(e) => setAcosHigh(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-border-dim rounded bg-white font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Identifies budget leaks (spend &gt; 0 with 0 sales automatically breaches).
            </span>
          </div>
        </div>
      </div>

      {/* Health Score Rules Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-800 block text-xs">
              Health Score Rules
            </span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Rules are evaluated top-to-bottom. The first enabled rule whose conditions match determines the campaign health status. If no rules match, the status defaults to HEALTHY.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddRule}
            disabled={healthRules.length >= 12}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded font-medium shadow-2xs hover:bg-indigo-800 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add rule</span>
          </button>
        </div>

        {/* Rules Table */}
        <div className="border border-border-dim rounded-md overflow-hidden bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-border-dim text-[11px] uppercase text-slate-500">
              <tr>
                <th className="py-2 px-3 w-12 text-center">Active</th>
                <th className="py-2 px-3 w-40">Status Label</th>
                <th className="py-2 px-3">Conditions</th>
                <th className="py-2 px-3 w-32 text-right">Order & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {healthRules.map((rule, idx) => (
                <tr
                  key={rule.key + idx}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !rule.enabled ? 'opacity-50' : ''
                  }`}
                >
                  {/* Enable Switch */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRuleEnabled(idx)}
                      className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>

                  {/* Name & Badge */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${
                        COLOR_CLASSES[rule.color] || COLOR_CLASSES.green
                      }`}
                    >
                      {rule.name}
                    </span>
                  </td>

                  {/* Conditions Summary */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-semibold">{rule.match}:</span>
                      {rule.conditions.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-1.5 py-0.5 rounded bg-slate-100 border border-border-dim text-slate-700"
                        >
                          {c.metric} {c.op} {String(c.value)}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Actions & Order */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveRule(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Move rule up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === healthRules.length - 1}
                        onClick={() => moveRule(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Move rule down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditRule(idx)}
                        className="p-1 text-slate-400 hover:text-primary"
                        title="Edit rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRule(idx)}
                        className="p-1 text-slate-400 hover:text-spend"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Health Rule Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border-dim rounded-md shadow-xl max-w-lg w-full p-5 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border-dim mb-4">
              <span className="font-bold text-sm uppercase">
                {editingIndex !== null ? 'Edit Health Rule' : 'Add Health Rule'}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Rule Name (max 24)</label>
                  <input
                    type="text"
                    maxLength={24}
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. High ACOS"
                    className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Badge Color</label>
                  <select
                    value={ruleColor}
                    onChange={(e) => setRuleColor(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white"
                  >
                    <option value="red">Red (Leak / Severe)</option>
                    <option value="amber">Amber (Warning / Scale)</option>
                    <option value="green">Green (Healthy)</option>
                    <option value="blue">Blue (Learning)</option>
                    <option value="slate">Slate (Neutral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Match Condition Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="match_type"
                      checked={ruleMatch === 'ALL'}
                      onChange={() => setRuleMatch('ALL')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Match ALL conditions (AND)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="match_type"
                      checked={ruleMatch === 'ANY'}
                      onChange={() => setRuleMatch('ANY')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Match ANY condition (OR)</span>
                  </label>
                </div>
              </div>

              {/* Conditions List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-500">Conditions (max 4)</label>
                  {ruleConditions.length < 4 && (
                    <button
                      type="button"
                      onClick={addCondition}
                      className="text-primary hover:underline text-[11px] inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add condition</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {ruleConditions.map((cond, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <select
                        value={cond.metric}
                        onChange={(e) => {
                          const next = [...ruleConditions];
                          next[cIdx].metric = e.target.value;
                          setRuleConditions(next);
                        }}
                        className="flex-1 px-2 py-1 border border-border-dim rounded bg-white text-xs"
                      >
                        {ALLOWED_METRICS.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={cond.op}
                        onChange={(e) => {
                          const next = [...ruleConditions];
                          next[cIdx].op = e.target.value as any;
                          setRuleConditions(next);
                        }}
                        className="w-16 px-2 py-1 border border-border-dim rounded bg-white text-xs text-center font-bold"
                      >
                        {ALLOWED_OPS.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={String(cond.value)}
                        onChange={(e) => {
                          const next = [...ruleConditions];
                          const v = e.target.value;
                          next[cIdx].value = v === '@target_acos' ? '@target_acos' : isNaN(Number(v)) ? v : Number(v);
                          setRuleConditions(next);
                        }}
                        placeholder="Value or @target_acos"
                        className="w-32 px-2 py-1 border border-border-dim rounded bg-white text-xs"
                      />

                      {ruleConditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(cIdx)}
                          className="p-1 text-slate-400 hover:text-spend"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {modalError && (
                <div className="text-spend text-[11px] font-semibold">{modalError}</div>
              )}
            </div>

            <div className="pt-4 border-t border-border-dim mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalRule}
                className="px-3.5 py-1.5 bg-primary text-white rounded font-medium hover:bg-indigo-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
