'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, ArrowRight, X, Clock } from 'lucide-react';
import { getCampaignDrafts, deleteCampaignDraft } from '@/lib/api-client';
import type { CampaignDraftRecord } from '@/lib/types/campaign';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DraftsPanelProps {
  open: boolean;
  onClose: () => void;
}

const STEP_NAMES: Record<number, string> = {
  1: 'Campaign Details',
  2: 'Products',
  3: 'Targeting',
  4: 'Negative Targeting',
  5: 'Review & Launch',
};

export function DraftsPanel({ open, onClose }: DraftsPanelProps) {
  const router = useRouter();
  const { account } = useActiveAccount();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<CampaignDraftRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const fetchDrafts = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const data = await getCampaignDrafts(account.id);
      setDrafts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDrafts();
    }
  }, [open, account]);

  const handleResume = (draft: CampaignDraftRecord) => {
    onClose();
    router.push(`/campaigns/new?draft=${draft.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCampaignDraft(deleteTargetId);
      showToast({ title: 'Draft deleted', message: 'The campaign draft has been removed.', type: 'info' });
      setDrafts((prev) => prev.filter((d) => d.id !== deleteTargetId));
    } catch (err: any) {
      showToast({ title: 'Delete failed', message: err?.message || 'Could not delete draft', type: 'error' });
    } finally {
      setDeleteTargetId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="bg-surface border-l border-border-dim w-full max-w-md h-full shadow-2xl p-6 flex flex-col font-mono text-xs text-text-main animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-dim">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Saved Drafts ({drafts.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-10 h-10 stroke-[1.5] mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">No saved drafts</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Drafts are automatically saved when building campaigns.
              </p>
            </div>
          ) : (
            drafts.map((d) => {
              const dateStr = new Date(d.updated_at).toLocaleString();
              const stepName = STEP_NAMES[d.step] || `Step ${d.step}`;

              return (
                <div
                  key={d.id}
                  className="p-3 rounded-md border border-border-dim bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{d.name}</span>
                      <span className="text-[11px] text-primary font-medium">
                        Step {d.step} of 5 — {stepName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(d.id)}
                      className="text-slate-400 hover:text-spend p-1"
                      title="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-dim text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {dateStr}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResume(d)}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border-dim flex justify-between items-center text-slate-500">
          <span>Drafts expire after 30 days</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-border-dim rounded hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open: boolean) => !open && setDeleteTargetId(null)}
        title="Delete draft?"
        description="Are you sure you want to discard this campaign draft? This cannot be undone."
        confirmLabel="Delete draft"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
