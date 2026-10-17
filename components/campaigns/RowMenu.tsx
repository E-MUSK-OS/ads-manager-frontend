'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Edit2,
  Copy,
  Pause,
  Play,
  Archive,
  Search,
  KeyRound,
} from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { CampaignItem, CampaignState } from '@/lib/types/campaign';

interface RowMenuProps {
  campaign: CampaignItem;
  onDuplicate: (id: number) => void;
  onUpdateStatus: (id: number, state: CampaignState) => void;
}

export function RowMenu({ campaign, onDuplicate, onUpdateStatus }: RowMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const isEnabled = campaign.state === 'ENABLED';
  const isArchived = campaign.state === 'ARCHIVED';

  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
        align="start"
        trigger={
          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Campaign actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="w-44 p-1 text-xs font-mono text-text-main flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/campaigns/${campaign.id}`);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-left text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDuplicate(campaign.id);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-left text-slate-700"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicate</span>
          </button>

          {!isArchived && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onUpdateStatus(campaign.id, isEnabled ? 'PAUSED' : 'ENABLED');
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-left text-slate-700"
            >
              {isEnabled ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Enable</span>
                </>
              )}
            </button>
          )}

          <div className="h-px bg-border-dim my-0.5" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/campaigns/${campaign.id}?tab=keywords`);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-left text-slate-700"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>View keywords</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/campaigns/${campaign.id}?tab=search_terms`);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 text-left text-slate-700"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>View search terms</span>
          </button>

          {!isArchived && (
            <>
              <div className="h-px bg-border-dim my-0.5" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setArchiveConfirmOpen(true);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-rose-50 text-left text-spend"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            </>
          )}
        </div>
      </Popover>

      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Archive campaign?"
        description={`Are you sure you want to archive "${campaign.name}"? This action cannot be undone.`}
        confirmLabel="Archive"
        destructive
        onConfirm={() => {
          onUpdateStatus(campaign.id, 'ARCHIVED');
          setArchiveConfirmOpen(false);
        }}
      />
    </>
  );
}
