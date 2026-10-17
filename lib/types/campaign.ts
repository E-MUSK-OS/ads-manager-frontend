export type Strategy = 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL';
export type Site = 'AMAZON_AND_BEYOND' | 'AMAZON_BUSINESS';
export type Match = 'BROAD' | 'PHRASE' | 'EXACT';
export type NegMatch = 'NEGATIVE_EXACT' | 'NEGATIVE_PHRASE';
export type CampaignState = 'ENABLED' | 'PAUSED' | 'ARCHIVED';
export type TargetingType = 'AUTO' | 'MANUAL';
export type HealthStatus = 'LEARNING' | 'BUDGET_LEAK' | 'SCALE' | 'HEALTHY' | string;

export interface MarketplaceRules {
  currency: string;
  symbol: string;
  locale: string;
  tz: string;
  min_budget: number;
  recommended_budget: number;
  min_bid: number;
  max_bid: number;
}

export interface AdsAccount {
  id: number;
  user_id: number;
  marketplace: string;
  account_name?: string;
  external_account_id?: string;
  is_connected?: boolean;
}

export interface ProductLite {
  id: number;
  asin: string;
  sku?: string | null;
  title: string;
  image_url: string | null;
  category?: string | null;
  price: number;
  rating_avg?: number;
  review_count?: number;
  eligible?: boolean;
  ineligible_reason?: string | null;
  active_campaign_count?: number;
}

export interface ProductSearchResponse {
  items: ProductLite[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface ProductLookupResponse {
  found: ProductLite[];
  not_found: string[];
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  organic_sales: number;
  ctr: number | null;
  cpc: number | null;
  cvr: number | null;
  acos: number | null;
  roas: number | null;
  tacos: number | null;
}

export interface CampaignItem extends CampaignMetrics {
  id: number;
  ads_account_id: number;
  name: string;
  state: CampaignState;
  targeting_type: TargetingType;
  campaign_type: string;
  site: Site;
  start_date: string;
  end_date: string | null;
  daily_budget: number;
  target_acos: number | null;
  bidding_strategy: Strategy;
  placement_top_pct: number;
  placement_rest_pct: number;
  placement_product_page_pct: number;
  status_label?: string;
  health: HealthStatus;
  health_label?: string;
  health_color?: 'red' | 'amber' | 'green' | 'blue' | 'slate';
  budget_utilization?: number | null;
  ad_group_count?: number;
  keyword_count?: number;
}

export interface ReportTotals extends CampaignMetrics {
  campaign_count?: number;
}

export interface CampaignReportResponse {
  items: CampaignItem[];
  totals: ReportTotals;
  total_count: number;
  page: number;
  page_size: number;
}

export interface SummarySeriesItem {
  bucket: string;
  date?: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  organic_sales?: number;
  ctr: number | null;
  cpc: number | null;
  cvr: number | null;
  acos: number | null;
  roas: number | null;
  tacos?: number | null;
}

export interface CampaignSummaryResponse {
  series: SummarySeriesItem[];
  previous_series?: SummarySeriesItem[];
  totals: Record<string, number | null>;
}

export interface CampaignAlert {
  id: number;
  name: string;
  reason: string;
  spend: number;
  sales: number;
  acos: number | null;
  action_suggested?: string;
}

export interface HealthRuleCondition {
  metric: string;
  op: '>' | '>=' | '<' | '<=' | '==';
  value: number | string;
}

export interface HealthRule {
  key: string;
  name: string;
  color: 'red' | 'amber' | 'green' | 'blue' | 'slate';
  enabled: boolean;
  match: 'ALL' | 'ANY';
  conditions: HealthRuleCondition[];
}

export interface UserCampaignSettings {
  acos_low: number;
  acos_high: number;
  default_target_acos: number;
  bid_limit_acos: number | null;
  health_rules?: HealthRule[] | null;
}

export interface CampaignDraftRecord {
  id: number;
  user_id: number;
  ads_account_id: number;
  name: string;
  step: number;
  payload: CampaignDraft;
  created_at: string;
  updated_at: string;
}

export interface CampaignDraft {
  version: 1;
  accountId: number;
  step: 1 | 2 | 3 | 4 | 5;
  maxStepReached: number;
  details: {
    name: string;
    startDate: string;
    endDate: string | null;
    dailyBudget: number | null;
    monthlyPlan: boolean;
    monthlyBudget: number | null;
    targetAcos: number | null;
    adGroupName: string;
    site: Site;
    targetingType: 'AUTO' | 'MANUAL';
    strategy: Strategy;
    placements: {
      top: number | null;
      rest: number | null;
      productPage: number | null;
    };
  };
  products: {
    selected: ProductLite[];
  };
  targeting: {
    bidMode: 'DEFAULT' | 'BY_GROUP';
    defaultBid: number | null;
    autoGroups: {
      key: 'CLOSE_MATCH' | 'LOOSE_MATCH' | 'SUBSTITUTES' | 'COMPLEMENTS';
      enabled: boolean;
      bid: number | null;
    }[];
    manualTab: 'KEYWORDS' | 'PRODUCTS';
    keywords: {
      id: string;
      text: string;
      match: Match;
      bid: number | null;
    }[];
    targets: {
      id: string;
      kind: 'ASIN' | 'CATEGORY';
      value: string;
      bid: number | null;
    }[];
  };
  negatives: {
    keywords: {
      id: string;
      text: string;
      match: NegMatch;
    }[];
    brands: string[];
    asins: string[];
  };
}

export interface KeywordPayload {
  keyword_text: string;
  match_type: Match;
  bid?: number;
}

export interface TargetPayload {
  kind: 'AUTO_GROUP' | 'ASIN' | 'CATEGORY';
  value: string;
  bid?: number;
}

export interface NegativeKeywordPayload {
  keyword_text: string;
  match_type: NegMatch;
}

export interface AdGroupPayload {
  name: string;
  default_bid: number;
  keywords: KeywordPayload[];
  targets: TargetPayload[];
}

export interface CampaignCreatePayload {
  ads_account_id: number;
  name: string;
  campaign_type: 'SPONSORED_PRODUCTS';
  targeting_type: 'AUTO' | 'MANUAL';
  site: Site;
  state: 'ENABLED' | 'PAUSED';
  start_date: string;
  end_date?: string;
  daily_budget: number;
  target_acos?: number;
  bidding_strategy: Strategy;
  placement_top_pct: number;
  placement_rest_pct: number;
  placement_product_page_pct: number;
  product_ids: number[];
  ad_groups: AdGroupPayload[];
  negative_keywords: NegativeKeywordPayload[];
  negative_asins: string[];
  negative_brands: string[];
}

export interface CampaignCreateResult {
  id: number;
  name: string;
  state: string;
  status_label: string;
  warnings: Array<{ field?: string; message: string }>;
}

export interface ForecastResponse {
  period: 'weekly';
  clicks: { low: number; high: number } | null;
  orders: { low: number; high: number } | null;
  spend: { low: number; high: number } | null;
  basis: 'history' | 'default';
  is_estimate: true;
}

export interface BidSuggestionKeywordResult {
  keyword_text: string;
  match_type: Match;
  low: number;
  median: number;
  high: number;
}

export interface BidSuggestionsResponse {
  items: BidSuggestionKeywordResult[];
  auto_groups: Record<string, { low: number; median: number; high: number }>;
}

export interface NegativeSuggestion {
  keyword_text: string;
  clicks: number;
  spend: number;
  reason: string;
}

export interface SuggestionsResponse {
  recommended_daily_budget?: {
    low: number;
    median: number;
    high: number;
  };
  suggested_bids?: {
    regular_days: number;
    peak_days: number;
  };
}

export interface AdGroupItem extends CampaignMetrics {
  id: number;
  campaign_id: number;
  name: string;
  state: string;
  default_bid: number;
  external_id?: string | null;
}

export interface KeywordItem {
  id: number;
  ad_group_id: number;
  keyword_text: string;
  match_type: Match;
  state: string;
  bid: number | null;
  external_id?: string | null;
}

export interface SearchTermItem {
  id: number;
  search_term: string;
  campaign_id: number;
  ad_group_id: number;
  keyword_id: number;
  clicks: number;
  impressions: number;
  spend: number;
  sales: number;
  date: string;
}

export interface NegativeKeywordItem {
  id: number;
  campaign_id: number;
  keyword_text: string;
  match_type: NegMatch;
  created_at?: string;
}
