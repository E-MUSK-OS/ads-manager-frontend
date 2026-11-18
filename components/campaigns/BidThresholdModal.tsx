'use client';

import React, { useState, useEffect } from 'react';
import { X, Sliders, AlertCircle, Info, RotateCw, Check, Trash2 } from 'lucide-react';
import {
  getCampaignBidThreshold,
  putCampaignBidThreshold,
  deleteCampaignBidThreshold,
} from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

interface BidThresholdModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  onSuccess?: () => void;
}

export function BidThresholdModal({
  open,
  onClose,
  campaignId,
  campaignName,
  onSuccess,
}: BidThresholdModalProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [minBid, setMinBid] = useState<string>('');
  const [maxBid, setMaxBid] = useState<string>('');
  const [targetAcos, setTargetAcos] = useState<string>('');
  const [hasSavedThreshold, setHasSavedThreshold] = useState(false);

  // Fetch saved threshold whenever the modal opens
  useEffect(() => {
    if (!open || !campaignId) return;

    let active = true;
    setLoading(true);
    setError(null);

    getCampaignBidThreshold(campaignId)
      .then((data) => {
        if (!active) return;
        if (data) {
          setMinBid(data.min_bid !== null && data.min_bid !== undefined ? String(data.min_bid) : '');
          setMaxBid(data.max_bid !== null && data.max_bid !== undefined ? String(data.max_bid) : '');
          setTargetAcos(data.target_acos !== null && data.target_acos !== undefined ? String(data.target_acos) : '');
          setHasSavedThreshold(true);
        } else {
          setMinBid('');
          setMaxBid('');
          setTargetAcos('');
          setHasSavedThreshold(false);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to load saved bid thresholds.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, campaignId]);

  if (!open) return null;

  // Validation
  const minVal = minBid.trim() !== '' ? Number(minBid) : null;
  const maxVal = maxBid.trim() !== '' ? Number(maxBid) : null;
  const acosVal = targetAcos.trim() !== '' ? Number(targetAcos) : null;

  let validationError: string | null = null;
  if (minVal !== null && isNaN(minVal)) {
    validationError = 'Min Bid must be a valid number.';
  } else if (maxVal !== null && isNaN(maxVal)) {
    validationError = 'Max Bid must be a valid number.';
  } else if (acosVal !== null && isNaN(acosVal)) {
    validationError = 'Target ACOS must be a valid number.';
  } else if (minVal !== null && minVal < 0) {
    validationError = 'Min Bid must be greater than or equal to ₹0.';
  } else if (maxVal !== null && maxVal < 0) {
    validationError = 'Max Bid must be greater than or equal to ₹0.';
  } else if (minVal !== null && maxVal !== null && minVal > maxVal) {
    validationError = 'Min Bid cannot exceed Max Bid.';
  } else if (acosVal !== null && (acosVal < 0 || acosVal > 100)) {
    validationError = 'Target ACOS must be between 0% and 100%.';
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    setSaving(true);
    setError(null);

    try {
      await putCampaignBidThreshold(campaignId, {
        min_bid: minVal,
        max_bid: maxVal,
        target_acos: acosVal,
      });

      showToast({
        title: 'Bid thresholds saved',
        message: 'Saved in AdsManager. Not applied to Amazon.',
        type: 'success',
      });

      setHasSavedThreshold(true);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save bid thresholds.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearInputs = async () => {
    setMinBid('');
    setMaxBid('');
    setTargetAcos('');

    if (hasSavedThreshold) {
      setClearing(true);
      try {
        await deleteCampaignBidThreshold(campaignId);
        setHasSavedThreshold(false);
        showToast({
          title: 'Thresholds cleared',
          message: 'Saved in AdsManager. Not applied to Amazon.',
          type: 'info',
        });
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err?.message || 'Failed to clear saved thresholds on server.');
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs font-mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bid-threshold-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 id="bid-threshold-title" className="text-sm font-bold text-slate-900 tracking-tight">
                Bid Threshold
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs" title={campaignName}>
              Campaign: <span className="font-semibold text-slate-700">{campaignName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-semibold">Saved in AdsManager. Not applied to Amazon.</span>
            <p className="text-amber-700 mt-0.5">
              These threshold guardrails are stored locally for monitoring and reporting. They will not automatically adjust your live Amazon bids.
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <RotateCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading threshold values...</span>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {validationError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Min Bid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Bid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 5.00"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Max Bid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Bid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50.00"
                    value={maxBid}
                    onChange={(e) => setMaxBid(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Target ACOS */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target ACOS
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 25.0"
                    value={targetAcos}
                    onChange={(e) => setTargetAcos(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearInputs}
                disabled={clearing || saving || (!minBid && !maxBid && !targetAcos && !hasSavedThreshold)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 border border-slate-300 hover:border-rose-300 rounded-md transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {clearing ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Clear Inputs</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || clearing || !!validationError}
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default BidThresholdModal;
