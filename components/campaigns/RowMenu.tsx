'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover } from '@/components/ui/Popover';
import { Sliders, Eye, Clock } from 'lucide-react';

export interface RowMenuCampaign {
  id: string | number;
  name: string;
  status?: string;
  state?: string;
  daily_budget?: number;
}

export interface RowMenuProps {
  campaign: RowMenuCampaign;
  onBidThreshold?: (campaign: RowMenuCampaign) => void;
  onHourlyTracking?: (campaign: RowMenuCampaign) => void;
  disabled?: boolean;
}

export function RowMenu({
  campaign,
  onBidThreshold,
  onHourlyTracking,
  disabled = false,
}: RowMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
            disabled={disabled}
            aria-label={`Actions for ${campaign.name}`}
            data-testid={`row-menu-trigger-${campaign.id}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
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
          <div className="flex flex-col py-1 text-xs font-mono text-slate-700 w-44">
            {/* 1. Bid Threshold (Phase 5) */}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 transition-colors font-medium text-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                close();
                if (onBidThreshold) {
                  onBidThreshold(campaign);
                }
              }}
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Bid Threshold</span>
            </button>

            {/* 2. View Campaign (Phase 6 / D10) */}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 transition-colors font-medium text-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                close();
                router.push(`/campaigns/${campaign.id}`);
              }}
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View Campaign</span>
            </button>

            {/* 3. Hourly Tracking (Phase 7 / Q7) */}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 transition-colors font-medium text-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                close();
                if (onHourlyTracking) {
                  onHourlyTracking(campaign);
                }
              }}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Hourly Tracking</span>
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}

export default RowMenu;
