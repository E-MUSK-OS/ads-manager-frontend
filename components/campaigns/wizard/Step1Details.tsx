'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Check, Info } from 'lucide-react';
import { checkCampaignName, getCampaignSuggestions, getCampaignSettings } from '@/lib/api-client';
import type {
  CampaignDraft,
  MarketplaceRules,
  SuggestionsResponse,
  Site,
  Strategy,
  TargetingType,
} from '@/lib/types/campaign';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { PercentInput } from '@/components/ui/PercentInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { FieldError } from '@/components/ui/FieldError';
import { RadioCard } from '@/components/ui/RadioCard';

interface Step1DetailsProps {
  draft: CampaignDraft;
  onChange: (updated: Partial<CampaignDraft['details']>) => void;
  rules: MarketplaceRules;
  countryName: string;
  errors: Record<string, string>;
  todayStr: string;
}

export function Step1Details({
  draft,
  onChange,
  rules,
  countryName,
  errors,
  todayStr,
}: Step1DetailsProps) {
  const d = draft.details;

  // Live name check
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [defaultTargetAcos, setDefaultTargetAcos] = useState<number>(25);

  useEffect(() => {
    if (draft.accountId) {
      getCampaignSuggestions(draft.accountId)
        .then(setSuggestions)
        .catch(() => {});
      getCampaignSettings()
        .then((s) => {
          if (s.default_target_acos) setDefaultTargetAcos(s.default_target_acos);
        })
        .catch(() => {});
    }
  }, [draft.accountId]);

  useEffect(() => {
    const trimmed = d.name.trim();
    if (!trimmed || !draft.accountId) {
      setNameAvailable(null);
      return;
    }

    setNameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkCampaignName(draft.accountId, trimmed);
        setNameAvailable(res.available);
      } catch {
        setNameAvailable(null);
      } finally {
        setNameChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [d.name, draft.accountId]);

  // Monthly budget plan calculation
  const handleMonthlyToggle = (checked: boolean) => {
    if (checked) {
      const startMonth = d.startDate ? new Date(d.startDate).getMonth() : new Date().getMonth();
      const startYear = d.startDate ? new Date(d.startDate).getFullYear() : new Date().getFullYear();
      const daysInMonth = new Date(startYear, startMonth + 1, 0).getDate();
      const monthly = d.dailyBudget ? Math.round(d.dailyBudget * daysInMonth) : 1000;
      const daily = Math.round((monthly / daysInMonth) * 100) / 100;
      onChange({ monthlyPlan: true, monthlyBudget: monthly, dailyBudget: daily });
    } else {
      onChange({ monthlyPlan: false, monthlyBudget: null });
    }
  };

  const handleMonthlyAmountChange = (monthly: number | null) => {
    if (!monthly || monthly <= 0) {
      onChange({ monthlyBudget: monthly, dailyBudget: null });
      return;
    }
    const startMonth = d.startDate ? new Date(d.startDate).getMonth() : new Date().getMonth();
    const startYear = d.startDate ? new Date(d.startDate).getFullYear() : new Date().getFullYear();
    const daysInMonth = new Date(startYear, startMonth + 1, 0).getDate();
    const daily = Math.round((monthly / daysInMonth) * 100) / 100;
    onChange({ monthlyBudget: monthly, dailyBudget: daily });
  };

  const handleApplySuggestion = () => {
    if (suggestions?.recommended_daily_budget?.median) {
      onChange({ dailyBudget: suggestions.recommended_daily_budget.median });
    } else {
      onChange({ dailyBudget: rules.recommended_budget });
    }
  };

  const suggestedLow = suggestions?.recommended_daily_budget?.low ?? rules.min_budget;
  const suggestedHigh = suggestions?.recommended_daily_budget?.high ?? rules.recommended_budget * 2;

  return (
    <div className="space-y-6 font-mono text-xs text-text-main">
      {/* Basic Configuration Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-4">
        <div className="border-b border-border-dim pb-3">
          <span className="font-bold uppercase tracking-wider text-slate-800 text-sm">
            Basic Configuration
          </span>
          <p className="text-slate-500 text-xs mt-0.5">
            Identify your campaign, set duration, and determine daily ad spend limits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campaign Name */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="camp-name" className="text-slate-600 uppercase text-[11px] font-medium">
                Campaign Name <span className="text-spend">*</span>
              </label>
              {nameChecking ? (
                <span className="text-[10px] text-slate-400">Checking availability...</span>
              ) : nameAvailable === false ? (
                <span className="text-[10px] text-spend font-semibold">This name is already used</span>
              ) : nameAvailable === true && d.name.trim().length > 0 ? (
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Available
                </span>
              ) : null}
            </div>
            <input
              id="camp-name"
              type="text"
              maxLength={128}
              value={d.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={`w-full px-3 py-1.5 border rounded bg-white text-xs font-mono focus:outline-hidden ${
                errors.name || nameAvailable === false
                  ? 'border-spend focus:border-spend'
                  : 'border-border-dim focus:border-primary'
              }`}
              placeholder="e.g. SP - Running Shoes - Q4"
              aria-invalid={!!errors.name || nameAvailable === false}
            />
            <FieldError error={errors.name} />
          </div>

          {/* Country (Read-Only) */}
          <div>
            <label className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Country
            </label>
            <div className="px-3 py-1.5 border border-border-dim rounded bg-slate-50 text-slate-700 font-medium">
              {countryName} ({rules.currency})
            </div>
          </div>

          {/* Daily Budget */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="camp-budget" className="text-slate-600 uppercase text-[11px] font-medium">
                Daily Budget <span className="text-spend">*</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={d.monthlyPlan}
                  onChange={(e) => handleMonthlyToggle(e.target.checked)}
                  className="rounded border-border-dim text-primary focus:ring-primary h-3 w-3"
                />
                <span>Plan monthly</span>
              </label>
            </div>

            {d.monthlyPlan ? (
              <div className="space-y-1.5">
                <MoneyInput
                  id="camp-monthly-budget"
                  value={d.monthlyBudget}
                  onChange={handleMonthlyAmountChange}
                  currencySymbol={rules.symbol}
                  min={rules.min_budget * 28}
                  placeholder="Monthly total"
                  className={errors.daily_budget ? 'border-spend' : ''}
                />
                {d.dailyBudget && (
                  <span className="text-[11px] text-primary font-medium block">
                    ≈ {rules.symbol}{d.dailyBudget.toFixed(2)}/day
                  </span>
                )}
              </div>
            ) : (
              <MoneyInput
                id="camp-budget"
                value={d.dailyBudget}
                onChange={(val) => onChange({ dailyBudget: val })}
                currencySymbol={rules.symbol}
                min={rules.min_budget}
                placeholder={`Min ${rules.symbol}${rules.min_budget}`}
                className={errors.daily_budget ? 'border-spend' : ''}
              />
            )}
            <FieldError error={errors.daily_budget} />

            {/* Suggested budget hint */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Suggested: {rules.symbol}{suggestedLow} – {rules.symbol}{suggestedHigh}
              </span>
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="text-primary hover:underline font-medium text-[10px]"
              >
                Use suggestion
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Start Date <span className="text-spend">*</span>
            </label>
            <DatePicker
              value={d.startDate}
              minDate={todayStr}
              onChange={(val) => onChange({ startDate: val })}
              error={errors.start_date}
            />
            <FieldError error={errors.start_date} />
          </div>

          {/* End Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 uppercase text-[11px] font-medium">
                End Date
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={d.endDate === null}
                  onChange={(e) => onChange({ endDate: e.target.checked ? null : d.startDate })}
                  className="rounded border-border-dim text-primary focus:ring-primary h-3 w-3"
                />
                <span>No end date</span>
              </label>
            </div>
            {d.endDate !== null ? (
              <DatePicker
                value={d.endDate}
                minDate={d.startDate || todayStr}
                onChange={(val) => onChange({ endDate: val })}
                error={errors.end_date}
              />
            ) : (
              <div className="px-3 py-1.5 border border-border-dim rounded bg-slate-50 text-slate-400">
                Runs indefinitely
              </div>
            )}
            <FieldError error={errors.end_date} />
          </div>

          {/* Target ACOS (%) */}
          <div className="md:col-span-2">
            <label htmlFor="camp-target-acos" className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
              Target ACOS (%) (Optional)
            </label>
            <PercentInput
              id="camp-target-acos"
              value={d.targetAcos}
              onChange={(val) => onChange({ targetAcos: val })}
              placeholder={`Default: ${defaultTargetAcos}%`}
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Used for automated health score labels and future bid optimizations. Default: {defaultTargetAcos}%.
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Settings Card */}
      <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-5 space-y-5">
        <div className="border-b border-border-dim pb-3">
          <span className="font-bold uppercase tracking-wider text-slate-800 text-sm">
            Advanced Settings
          </span>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure ad groups, marketplace channels, targeting mode, and bidding algorithms
          </p>
        </div>

        {/* Campaign Setup Mode */}
        <div>
          <label className="block text-slate-600 uppercase text-[11px] mb-1.5 font-medium">
            Campaign Setup
          </label>
          <div className="grid grid-cols-2 gap-3">
            <RadioCard
              selected={true}
              onClick={() => {}}
              title="Standard"
              description="Customize all settings, ad groups, targeting, and placement adjustments."
            />
            <RadioCard
              selected={false}
              disabled={true}
              onClick={() => {}}
              title="Preset (Beta)"
              description="Pre-configured campaign parameters optimized for new product launches (Coming soon)."
            />
          </div>
        </div>

        {/* Ad Group Name */}
        <div>
          <label htmlFor="camp-adgroup-name" className="block text-slate-600 uppercase text-[11px] mb-1 font-medium">
            Ad Group Name <span className="text-spend">*</span>
          </label>
          <input
            id="camp-adgroup-name"
            type="text"
            maxLength={128}
            value={d.adGroupName}
            onChange={(e) => onChange({ adGroupName: e.target.value })}
            className={`w-full px-3 py-1.5 border rounded bg-white text-xs font-mono focus:outline-hidden ${
              errors.ad_group_name ? 'border-spend' : 'border-border-dim focus:border-primary'
            }`}
          />
          <FieldError error={errors.ad_group_name} />
        </div>

        {/* Sites */}
        <div>
          <label className="block text-slate-600 uppercase text-[11px] mb-1.5 font-medium">
            Placement Sites
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RadioCard
              selected={d.site === 'AMAZON_AND_BEYOND'}
              onClick={() => onChange({ site: 'AMAZON_AND_BEYOND' })}
              title="Amazon and beyond"
              description="Ads appear on Amazon retail and Amazon Business, plus select external apps and partner sites."
            />
            <RadioCard
              selected={d.site === 'AMAZON_BUSINESS'}
              onClick={() => onChange({ site: 'AMAZON_BUSINESS' })}
              title="Amazon Business"
              description="B2B campaign strategy; ads appear exclusively to verified Amazon Business shoppers."
            />
          </div>
        </div>

        {/* Targeting Type */}
        <div>
          <label className="block text-slate-600 uppercase text-[11px] mb-1.5 font-medium">
            Targeting Strategy
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RadioCard
              selected={d.targetingType === 'AUTO'}
              onClick={() => onChange({ targetingType: 'AUTO' })}
              title="Automatic targeting"
              description="Amazon targets relevant keywords and complementary products automatically based on your product details."
            />
            <RadioCard
              selected={d.targetingType === 'MANUAL'}
              onClick={() => onChange({ targetingType: 'MANUAL' })}
              title="Manual targeting"
              description="You select specific search keywords or competitor products and set granular bids on each."
            />
          </div>
        </div>

        {/* Bidding Strategy Radio Cards */}
        <div>
          <label className="block text-slate-600 uppercase text-[11px] mb-1.5 font-medium">
            Campaign Bidding Strategy
          </label>
          <div className="space-y-2">
            <RadioCard
              selected={d.strategy === 'AUTO_FOR_SALES'}
              onClick={() => onChange({ strategy: 'AUTO_FOR_SALES' })}
              title="Dynamic bids – up and down (AUTO_FOR_SALES)"
              description="Amazon raises bids by up to 100% on any placement when a click is more likely to convert to a sale, and lowers them when less likely."
            />
            <RadioCard
              selected={d.strategy === 'LEGACY_FOR_SALES'}
              onClick={() => onChange({ strategy: 'LEGACY_FOR_SALES' })}
              title="Dynamic bids – down only (LEGACY_FOR_SALES)"
              description="Amazon lowers your bids in real time when a click is less likely to result in a sale. Never increases bids."
            />
            <RadioCard
              selected={d.strategy === 'MANUAL'}
              onClick={() => onChange({ strategy: 'MANUAL' })}
              title="Fixed bids (MANUAL)"
              description="Amazon uses your exact bid for every auction, adjusted only by the placement percentages you configure below."
            />
          </div>
        </div>

        {/* Placement Adjustments (0–900%) */}
        <div className="border border-border-dim rounded p-4 bg-slate-50/50 space-y-3">
          <div>
            <span className="font-semibold text-slate-800 uppercase text-[11px] tracking-wider block">
              Placement Bid Adjustments (0–900%)
            </span>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Enter a percentage to increase your base bids on specific high-converting Amazon placements.
              Example: +50% on top of search turns a {rules.symbol}4.00 bid into {rules.symbol}6.00 there.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="top-placement" className="block text-slate-500 text-[10px] uppercase mb-1">
                Top of search (%)
              </label>
              <input
                id="top-placement"
                type="number"
                min={0}
                max={900}
                value={d.placements.top ?? ''}
                onChange={(e) =>
                  onChange({
                    placements: {
                      ...d.placements,
                      top: e.target.value === '' ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="0"
                className={`w-full px-2.5 py-1.5 border rounded bg-white text-xs font-mono ${
                  errors.placement_top ? 'border-spend' : 'border-border-dim'
                }`}
              />
              <FieldError error={errors.placement_top} />
            </div>

            <div>
              <label htmlFor="rest-placement" className="block text-slate-500 text-[10px] uppercase mb-1">
                Rest of search (%)
              </label>
              <input
                id="rest-placement"
                type="number"
                min={0}
                max={900}
                value={d.placements.rest ?? ''}
                onChange={(e) =>
                  onChange({
                    placements: {
                      ...d.placements,
                      rest: e.target.value === '' ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="0"
                className={`w-full px-2.5 py-1.5 border rounded bg-white text-xs font-mono ${
                  errors.placement_rest ? 'border-spend' : 'border-border-dim'
                }`}
              />
              <FieldError error={errors.placement_rest} />
            </div>

            <div>
              <label htmlFor="product-page-placement" className="block text-slate-500 text-[10px] uppercase mb-1">
                Product pages (%)
              </label>
              <input
                id="product-page-placement"
                type="number"
                min={0}
                max={900}
                value={d.placements.productPage ?? ''}
                onChange={(e) =>
                  onChange({
                    placements: {
                      ...d.placements,
                      productPage: e.target.value === '' ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="0"
                className={`w-full px-2.5 py-1.5 border rounded bg-white text-xs font-mono ${
                  errors.placement_product_page ? 'border-spend' : 'border-border-dim'
                }`}
              />
              <FieldError error={errors.placement_product_page} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
