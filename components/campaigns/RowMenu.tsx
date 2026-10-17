"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "@/components/ui/Popover";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export type CampaignStatus = "ENABLED" | "PAUSED" | "ARCHIVED" | string;

export interface RowMenuCampaign {
  id: string | number;
  name: string;
  status?: CampaignStatus;
  state?: CampaignStatus;
  daily_budget?: number;
}

export interface RowMenuProps {
  campaign: RowMenuCampaign;
  onStatusChange?: (
    campaignId: string,
    nextStatus: "ENABLED" | "PAUSED" | "ARCHIVED"
  ) => Promise<void> | void;
  onDuplicate?: (campaign: RowMenuCampaign) => Promise<void> | void;
  onEditBudget?: (campaign: RowMenuCampaign) => void;
  onDelete?: (campaignId: string) => Promise<void> | void;
  disabled?: boolean;
}

export function RowMenu({
  campaign,
  onStatusChange,
  onDuplicate,
  onEditBudget,
  onDelete,
  disabled = false,
}: RowMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: "ARCHIVE" | "DELETE" | null;
  }>({ open: false, type: null });

  const normalizedStatus = (campaign.status || campaign.state || "").toUpperCase();
  const isArchived = normalizedStatus === "ARCHIVED";
  const isEnabled = normalizedStatus === "ENABLED" || normalizedStatus === "ACTIVE";
  const isPaused = normalizedStatus === "PAUSED";

  const runAction = async (
    action: () => Promise<void> | void,
    closeMenu: () => void
  ) => {
    if (isPending || disabled) return;
    closeMenu();
    try {
      setIsPending(true);
      await action();
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmState.type || isPending) return;
    const actionType = confirmState.type;
    setConfirmState({ open: false, type: null });

    try {
      setIsPending(true);
      if (actionType === "ARCHIVE" && onStatusChange) {
        await onStatusChange(String(campaign.id), "ARCHIVED");
      } else if (actionType === "DELETE" && onDelete) {
        await onDelete(String(campaign.id));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="inline-flex items-center justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        align="right"
        trigger={
          <button
            type="button"
            disabled={disabled || isPending}
            aria-label={`Actions for ${campaign.name}`}
            data-testid={`row-menu-trigger-${campaign.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        }
      >
        {({ close }) => (
          <div className="flex flex-col py-1 text-sm text-slate-700 dark:text-slate-200">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                close();
                router.push(`/campaigns/${campaign.id}`);
              }}
            >
              View details
            </button>

            {onEditBudget && !isArchived && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onEditBudget(campaign);
                }}
              >
                Edit daily budget
              </button>
            )}

            {onStatusChange && isEnabled && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  void runAction(
                    () => onStatusChange(String(campaign.id), "PAUSED"),
                    close
                  );
                }}
              >
                Pause campaign
              </button>
            )}

            {onStatusChange && isPaused && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  void runAction(
                    () => onStatusChange(String(campaign.id), "ENABLED"),
                    close
                  );
                }}
              >
                Enable campaign
              </button>
            )}

            {onDuplicate && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  void runAction(() => onDuplicate(campaign), close);
                }}
              >
                Duplicate
              </button>
            )}

            {!isArchived && onStatusChange && (
              <>
                <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                    setConfirmState({ open: true, type: "ARCHIVE" });
                  }}
                >
                  Archive campaign
                </button>
              </>
            )}

            {onDelete && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  setConfirmState({ open: true, type: "DELETE" });
                }}
              >
                Delete campaign
              </button>
            )}
          </div>
        )}
      </Popover>

      {/* Rendered outside Popover so closing the menu does not unmount the modal */}
      <ConfirmDialog
        open={confirmState.open}
        title={
          confirmState.type === "ARCHIVE"
            ? "Archive Campaign?"
            : "Delete Campaign?"
        }
        description={
          confirmState.type === "ARCHIVE"
            ? `Archiving "${campaign.name}" will permanently stop ad delivery. Archived campaigns cannot be re-enabled.`
            : `Are you sure you want to permanently delete "${campaign.name}"?`
        }
        confirmLabel={confirmState.type === "ARCHIVE" ? "Archive" : "Delete"}
        variant="destructive"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, type: null })}
      />
    </div>
  );
}

export default RowMenu;
