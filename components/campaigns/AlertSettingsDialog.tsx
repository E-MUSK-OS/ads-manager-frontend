'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import {
  getCampaignAlerts,
  getCampaignSettings,
  updateCampaignSettings,
} from '@/lib/api-client';
import type { CampaignAlert, UserCampaignSettings } from '@/lib/types/campaign';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { money, pct } from '@/lib/format';
import { useToast } from '@/components/ui/toast';

interface AlertSettingsDialogProps {
  alerts: CampaignAlert[];
  onSettingsSaved?: () => void;
}

export function AlertSettingsDialog({ alerts, onSettingsSaved }: AlertSettingsDialogProps) {
  const { account, rules } = useActiveAccount();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<UserCampaignSettings | null>(null);
  const [lowAcos, setLowAcos] = useState<number>(20);
  const [highAcos, setHighAcos] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getCampaignSettings()
        .then((s) => {
          setSettings(s);
          setLowAcos(s.acos_low ?? 20);
          setHighAcos(s.acos_high ?? 90);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSave = async () => {
    if (lowAcos < 0 || highAcos <= lowAcos || highAcos > 1000) {
      setFieldError('Must satisfy: 0 ≤ Lower ACOS < Higher ACOS ≤ 1000%');
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      const payload: UserCampaignSettings = {
        ...(settings || {
          default_target_acos: 25,
          bid_limit_acos: null,
          health_rules: null,
        }),
        acos_low: lowAcos,
        acos_high: highAcos,
      };
      await updateCampaignSettings(payload);
      showToast({ title: 'Alert settings saved', message: 'Thresholds updated successfully.', type: 'success' });
      onSettingsSaved?.();
      setOpen(false);
    } catch (err: any) {
      showToast({ title: 'Save failed', message: err?.message || 'Could not save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-slate-600 hover:text-slate-900"
        title="Alerts and notifications"
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-spend ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border-dim rounded-md shadow-xl max-w-xl w-full p-5 text-text-main font-mono text-xs max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-dim">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Campaign Alerts & Triggers
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-5">
              {/* Active Alerts List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Active Alerts ({alerts.length})
                  </span>
                  {alerts.length > 0 && (
                    <span className="text-[10px] text-spend bg-rose-50 px-1.5 py-0.5 rounded font-medium">
                      Action Required
                    </span>
                  )}
                </div>

                {alerts.length === 0 ? (
                  <div className="p-4 rounded border border-border-dim bg-slate-50/50 text-center text-slate-500">
                    <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <span>No active alerts. All campaigns are operating within thresholds.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded border border-rose-200 bg-rose-50/40 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{alert.name}</span>
                          <span className="text-spend font-medium text-[11px]">{alert.reason}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                          <span>Spend: {money(alert.spend, rules)}</span>
                          <span>Sales: {money(alert.sales, rules)}</span>
                          <span>ACOS: {pct(alert.acos)}</span>
                        </div>
                        {alert.action_suggested && (
                          <div className="text-[11px] text-primary font-medium mt-0.5">
                            Suggested: {alert.action_suggested}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Threshold Configuration */}
              <div className="border-t border-border-dim pt-4">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">
                  ACOS Alert Thresholds
                </span>
                <p className="text-[11px] text-slate-500 mb-3 font-sans">
                  Alerts trigger when a campaign's ACOS breaches these boundaries over the reporting period. Spend with zero sales is automatically treated as a high breach.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-500 mb-1">
                      Notify when ACOS is lower than (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={lowAcos}
                      onChange={(e) => setLowAcos(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white text-xs"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Opportunities to scale budget
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-500 mb-1">
                      Notify when ACOS is higher than (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={highAcos}
                      onChange={(e) => setHighAcos(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-border-dim rounded bg-white text-xs"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Budget leaks & overspend
                    </span>
                  </div>
                </div>

                {fieldError && (
                  <div className="text-spend text-xs mt-2 font-medium">{fieldError}</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border-dim flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="px-3.5 py-1.5 bg-primary text-white rounded font-medium hover:bg-indigo-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save thresholds'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
