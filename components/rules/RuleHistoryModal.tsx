'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Play, Clock, AlertCircle } from 'lucide-react';
import { Modal } from './ui/RulesModal';
import { Button } from './ui/RulesButton';
import { listRuleHistory, triggerRuleRun } from './rules-api';
import { useActiveAccount } from './rules-use-active-account';
import { useToast } from './ui/RulesToast';
import { formatDateIN } from './rule-helpers';
import type { AffectedParameter } from './rules-types';

interface RuleHistoryModalProps {
  open: boolean;
  onClose: () => void;
  affectedParameter?: AffectedParameter;
  title: string;
  onRunComplete?: () => void;
}

export function RuleHistoryModal({
  open,
  onClose,
  affectedParameter,
  title,
  onRunComplete,
}: RuleHistoryModalProps) {
  const { account } = useActiveAccount();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [lastSummary, setLastSummary] = useState<{
    created: number;
    expired: number;
    skipped: number;
    finished_at: string;
  } | null>(null);

  const loadHistory = useCallback(async () => {
    if (!account?.id) return;
    setLoading(true);
    try {
      const items = await listRuleHistory(account.id, affectedParameter);
      setHistoryItems(items);
    } catch {
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  }, [account?.id, affectedParameter]);

  useEffect(() => {
    if (open) {
      loadHistory();
      setLastSummary(null);
    }
  }, [open, loadHistory]);

  const handleRunNow = async () => {
    if (!account?.id || running) return;
    setRunning(true);
    try {
      const res = await triggerRuleRun(account.id, undefined, affectedParameter);
      setLastSummary(res);
      success(`Rule evaluation complete. ${res.created} recommendations generated.`);
      await loadHistory();
      onRunComplete?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute rules';
      toastError(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${title} Execution History`} size="xl">
      <div className="flex flex-col gap-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-600">
            <span>Runs automatically based on scheduled trigger times, or trigger immediately below.</span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleRunNow}
            disabled={running || !account?.id}
            className="gap-1.5"
          >
            <Play className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
            <span>{running ? 'Evaluating...' : 'Run Rules Now'}</span>
          </Button>
        </div>

        {/* Last Run Summary Card */}
        {lastSummary && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Last run summary:</span>
              <span>{lastSummary.created} generated</span>
              <span>·</span>
              <span>{lastSummary.skipped} skipped</span>
              <span>·</span>
              <span>{lastSummary.expired} expired</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-600">
              {formatDateIN(lastSummary.finished_at)}
            </span>
          </div>
        )}

        {/* History List */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
          <div className="py-2 px-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
            <span>Past Actions Generated</span>
            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="text-primary hover:underline flex items-center gap-1 font-normal"
            >
              <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-xs text-slate-400 gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-primary" />
              <span>Loading execution logs...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
              <Clock className="w-8 h-8 text-slate-300" />
              <span>No execution logs found for this rule type yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {historyItems.map((item) => (
                <div key={item.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                  <div className="flex flex-col gap-0.5 max-w-lg">
                    <span className="font-medium text-slate-800">{item.title || item.type || 'Action evaluated'}</span>
                    <span className="text-[11px] text-slate-500 truncate">{item.reason || item.message || 'Criteria met'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-semibold">
                      {item.status || 'LOGGED'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDateIN(item.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
