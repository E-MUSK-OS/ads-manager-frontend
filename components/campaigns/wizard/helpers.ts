import type {
  CampaignDraft,
  CampaignCreatePayload,
  AdsAccount,
  MarketplaceRules,
  SuggestionsResponse,
  Strategy,
  Site,
} from '@/lib/types/campaign';
import { todayIn } from '@/lib/useActiveAccount';

export function defaultDraft(
  account: AdsAccount | null,
  rules: MarketplaceRules,
  suggestions?: SuggestionsResponse | null
): CampaignDraft {
  const tz = rules?.tz || 'America/Los_Angeles';
  const now = new Date();

  // Date formatting in marketplace timezone
  const todayStr = todayIn(tz);

  // Formatted date-stamp for names: dd/MM/yyyy HH:mm
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const stamp = `${day}/${month}/${year} ${hours}:${mins}`;

  const defaultBid = suggestions?.suggested_bids?.regular_days ?? Math.max(1.0, rules?.min_bid || 0.02);

  return {
    version: 1,
    accountId: account?.id ?? 0,
    step: 1,
    maxStepReached: 1,
    details: {
      name: `Campaign - ${stamp}`,
      startDate: todayStr,
      endDate: null,
      dailyBudget: null,
      monthlyPlan: false,
      monthlyBudget: null,
      targetAcos: null,
      adGroupName: `Ad group - ${stamp}`,
      site: 'AMAZON_AND_BEYOND',
      targetingType: 'AUTO',
      strategy: 'AUTO_FOR_SALES',
      placements: {
        top: null,
        rest: null,
        productPage: null,
      },
    },
    products: {
      selected: [],
    },
    targeting: {
      bidMode: 'DEFAULT',
      defaultBid: defaultBid,
      autoGroups: [
        { key: 'CLOSE_MATCH', enabled: true, bid: defaultBid },
        { key: 'LOOSE_MATCH', enabled: true, bid: defaultBid },
        { key: 'SUBSTITUTES', enabled: true, bid: defaultBid },
        { key: 'COMPLEMENTS', enabled: true, bid: defaultBid },
      ],
      manualTab: 'KEYWORDS',
      keywords: [],
      targets: [],
    },
    negatives: {
      keywords: [],
      brands: [],
      asins: [],
    },
  };
}

export function toPayload(d: CampaignDraft, rules?: MarketplaceRules): CampaignCreatePayload {
  const t = d.targeting;
  const isAuto = d.details.targetingType === 'AUTO';
  const byGroup = isAuto && t.bidMode === 'BY_GROUP';
  const enabledGroups = t.autoGroups.filter((g) => g.enabled);

  const defaultBid = byGroup
    ? enabledGroups.length
      ? Math.min(...enabledGroups.map((g) => g.bid ?? 0))
      : 0
    : t.defaultBid ?? 0;

  return {
    ads_account_id: d.accountId,
    name: d.details.name.trim(),
    campaign_type: 'SPONSORED_PRODUCTS',
    targeting_type: d.details.targetingType,
    site: d.details.site,
    state: 'ENABLED',
    start_date: d.details.startDate,
    end_date: d.details.endDate || undefined,
    daily_budget: d.details.dailyBudget ?? 0,
    target_acos: d.details.targetAcos ?? undefined,
    bidding_strategy: d.details.strategy,
    placement_top_pct: d.details.placements.top ?? 0,
    placement_rest_pct: d.details.placements.rest ?? 0,
    placement_product_page_pct: d.details.placements.productPage ?? 0,
    product_ids: d.products.selected.map((p) => p.id),
    ad_groups: [
      {
        name: d.details.adGroupName.trim(),
        default_bid: defaultBid,
        keywords:
          d.details.targetingType === 'MANUAL'
            ? t.keywords.map((k) => ({
                keyword_text: k.text,
                match_type: k.match,
                bid: k.bid ?? undefined,
              }))
            : [],
        targets: isAuto
          ? enabledGroups.map((g) => ({
              kind: 'AUTO_GROUP' as const,
              value: g.key,
              bid: byGroup ? g.bid ?? undefined : undefined,
            }))
          : t.targets.map((x) => ({
              kind: x.kind,
              value: x.value,
              bid: x.bid ?? undefined,
            })),
      },
    ],
    negative_keywords: d.negatives.keywords.map((n) => ({
      keyword_text: n.text,
      match_type: n.match,
    })),
    negative_asins: d.negatives.asins,
    negative_brands: d.negatives.brands,
  };
}

export const STEP_OF = (f: string): 1 | 2 | 3 | 4 | 5 => {
  if (
    /^(name|campaign_type|targeting_type|site|start_date|end_date|daily_budget|target_acos|bidding_strategy|placement_)/.test(
      f
    ) ||
    /^ad_groups\.\d+\.name$/.test(f)
  ) {
    return 1;
  }
  if (f.startsWith('product_ids')) return 2;
  if (f.startsWith('ad_groups')) return 3;
  if (/^negative_/.test(f)) return 4;
  return 5;
};

export interface StepValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export function validateStep(
  step: number,
  draft: CampaignDraft,
  rules: MarketplaceRules,
  todayStr: string
): StepValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (step === 1) {
    if (!draft.details.name.trim()) {
      errors.name = 'Campaign name is required.';
    } else if (draft.details.name.trim().length > 128) {
      errors.name = 'Campaign name must be 128 characters or fewer.';
    }

    if (draft.details.dailyBudget === null || draft.details.dailyBudget === undefined) {
      errors.daily_budget = 'Daily budget is required.';
    } else if (draft.details.dailyBudget < rules.min_budget) {
      errors.daily_budget = `Minimum daily budget is ${rules.symbol}${rules.min_budget}`;
    } else if (draft.details.dailyBudget < rules.recommended_budget) {
      warnings.push(`Amazon recommends at least ${rules.symbol}${rules.recommended_budget}/day in this marketplace.`);
    }

    if (!draft.details.startDate) {
      errors.start_date = 'Start date is required.';
    } else if (draft.details.startDate < todayStr) {
      errors.start_date = 'Start date cannot be in the past.';
    }

    if (draft.details.endDate && draft.details.endDate < draft.details.startDate) {
      errors.end_date = 'End date cannot be earlier than start date.';
    }

    if (!draft.details.adGroupName.trim()) {
      errors.ad_group_name = 'Ad group name is required.';
    } else if (draft.details.adGroupName.trim().length > 128) {
      errors.ad_group_name = 'Ad group name must be 128 characters or fewer.';
    }

    const { top, rest, productPage } = draft.details.placements;
    if (top !== null && (top < 0 || top > 900 || !Number.isInteger(top))) {
      errors.placement_top = 'Enter a whole number from 0 to 900';
    }
    if (rest !== null && (rest < 0 || rest > 900 || !Number.isInteger(rest))) {
      errors.placement_rest = 'Enter a whole number from 0 to 900';
    }
    if (productPage !== null && (productPage < 0 || productPage > 900 || !Number.isInteger(productPage))) {
      errors.placement_product_page = 'Enter a whole number from 0 to 900';
    }
  } else if (step === 2) {
    if (draft.products.selected.length === 0) {
      errors.products = 'Please select at least one product to continue.';
    }
    const ineligible = draft.products.selected.filter((p) => p.eligible === false);
    if (ineligible.length > 0) {
      errors.products = `${ineligible.length} selected product(s) are ineligible for advertising.`;
    }

    // Cannibalisation soft warning
    const inActiveCampaigns = draft.products.selected.filter(
      (p) => (p.active_campaign_count || 0) > 0
    );
    if (inActiveCampaigns.length > 0) {
      warnings.push(
        `${inActiveCampaigns.length} of these products are already in active ${draft.details.targetingType.toLowerCase()} campaigns.`
      );
    }
  } else if (step === 3) {
    const isAuto = draft.details.targetingType === 'AUTO';
    if (isAuto) {
      if (draft.targeting.bidMode === 'DEFAULT') {
        const bid = draft.targeting.defaultBid;
        if (bid === null || bid === undefined || isNaN(bid)) {
          errors.default_bid = 'Default bid is required.';
        } else if (bid < rules.min_bid || bid > rules.max_bid) {
          errors.default_bid = `Bid must be between ${rules.symbol}${rules.min_bid} and ${rules.symbol}${rules.max_bid}`;
        }
      } else {
        const enabledGroups = draft.targeting.autoGroups.filter((g) => g.enabled);
        if (enabledGroups.length === 0) {
          errors.auto_groups = 'At least one targeting group must be enabled.';
        }
        for (const g of enabledGroups) {
          if (g.bid === null || g.bid === undefined || isNaN(g.bid)) {
            errors[`auto_group_${g.key}`] = `${g.key} requires a bid.`;
          } else if (g.bid < rules.min_bid || g.bid > rules.max_bid) {
            errors[`auto_group_${g.key}`] = `Bid must be between ${rules.symbol}${rules.min_bid} and ${rules.symbol}${rules.max_bid}`;
          }
        }
      }
    } else {
      // Manual targeting
      const bid = draft.targeting.defaultBid;
      if (bid === null || bid === undefined || isNaN(bid)) {
        errors.default_bid = 'Default bid is required.';
      } else if (bid < rules.min_bid || bid > rules.max_bid) {
        errors.default_bid = `Bid must be between ${rules.symbol}${rules.min_bid} and ${rules.symbol}${rules.max_bid}`;
      }

      const totalTargets = draft.targeting.keywords.length + draft.targeting.targets.length;
      if (totalTargets === 0) {
        errors.targeting = 'Manual targeting requires at least one keyword or product target.';
      }

      // Check keywords bids
      for (const kw of draft.targeting.keywords) {
        if (kw.bid !== null && kw.bid !== undefined) {
          if (kw.bid < rules.min_bid || kw.bid > rules.max_bid) {
            errors[`kw_${kw.id}`] = `Bid must be between ${rules.symbol}${rules.min_bid} and ${rules.symbol}${rules.max_bid}`;
          }
        }
      }

      if (draft.targeting.keywords.length > 0 && draft.targeting.keywords.length < 30) {
        warnings.push('Amazon recommends at least 30 keywords for manual campaigns.');
      }
    }

    if (
      draft.details.dailyBudget &&
      draft.targeting.defaultBid &&
      draft.details.dailyBudget < draft.targeting.defaultBid * 10
    ) {
      warnings.push('Your budget may be spent after fewer than 10 clicks.');
    }
  } else if (step === 4) {
    // Conflict checks
    const selectedAsins = new Set(draft.products.selected.map((p) => p.asin.toUpperCase()));
    for (const asin of draft.negatives.asins) {
      if (selectedAsins.has(asin.toUpperCase())) {
        errors[`neg_asin_${asin}`] = `Cannot exclude advertised ASIN "${asin}".`;
      }
    }

    // Exact negative equals exact positive
    const positiveExact = new Set(
      draft.targeting.keywords
        .filter((k) => k.match === 'EXACT')
        .map((k) => k.text.trim().toLowerCase())
    );
    for (const nk of draft.negatives.keywords) {
      if (nk.match === 'NEGATIVE_EXACT' && positiveExact.has(nk.text.trim().toLowerCase())) {
        errors[`neg_kw_${nk.id}`] = `Exact negative keyword "${nk.text}" conflicts with a targeted exact keyword.`;
      } else if (nk.match === 'NEGATIVE_PHRASE') {
        const negWords = nk.text.trim().toLowerCase();
        for (const posKw of draft.targeting.keywords) {
          if (posKw.text.trim().toLowerCase().includes(negWords)) {
            warnings.push(`Negative phrase "${nk.text}" will block targeted keyword "${posKw.text}".`);
          }
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}
