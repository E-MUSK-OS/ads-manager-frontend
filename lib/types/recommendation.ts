export type AffectedParameter = 'CAMPAIGN' | 'PLACEMENT' | 'TARGETING' | 'SEARCH_TERM';

export type Operator = 'LT' | 'LTE' | 'GTE' | 'GT' | 'EQ';

export interface Condition {
  metric: string;
  op: Operator;
  value: number | null;
}

export interface RuleAction {
  type: string;
  params: Record<string, string | number | null>;
}

export type ScopeMode = 'ALL' | 'INCLUDE' | 'EXCLUDE';

export interface Rule {
  id: number;
  name: string;
  affected_parameter: AffectedParameter;
  date_filter: string;
  min_clicks: number;
  conditions: Condition[];
  actions: RuleAction[];
  is_active: boolean;
  scope_mode: ScopeMode;
  campaign_ids: number[];
  last_run_at: string | null;
  last_match_count: number;
  open_count: number;
  last_funnel?: RuleFunnel | null;
}

export interface RuleDraft {
  id?: number;
  name: string;
  affected_parameter: AffectedParameter;
  date_filter: string;
  min_clicks: number;
  conditions: Condition[];
  actions: RuleAction[];
  is_active?: boolean;
  scope_mode?: ScopeMode;
  campaign_ids?: number[];
  template_key?: string | null;
}

export interface ParamSchema {
  type: 'enum' | 'money' | 'percent' | 'int';
  options?: string[];
  default?: string | number;
  label?: string;
  min?: number;
  max?: number;
  optional?: boolean;
}

export interface Template {
  key: string;
  category: string;
  name: string;
  description: string;
  affected_parameter: AffectedParameter;
  date_filter: string;
  min_clicks: number;
  conditions: Array<{ metric: string; op: Operator; value: number }>;
  actions: Array<{ type: string; params: Record<string, string | number> }>;
  available: boolean;
  unavailable_reason?: string;
  requires?: string;
}

export interface Limits {
  max_conditions: number;
  max_actions: number;
  max_rules_per_account: number;
  name_max: number;
  max_open_per_rule: number;
  cooldown_days: number;
}

export interface Meta {
  date_filters: Record<string, string>;
  metrics: Record<string, { label: string; unit: 'count' | 'money' | 'percent' | 'ratio' }>;
  operators: Record<string, { label: string; symbol: string }>;
  affected_parameters: Record<string, { label: string; available: boolean }>;
  actions: Record<string, Record<string, { label: string; params: Record<string, ParamSchema> }>>;
  templates: Template[];
  limits: Limits;
  currency: { symbol: string; locale: string; code?: string };
}

export interface Projection {
  days: number;
  spend_in_period: number;
  monthly_equivalent: number;
}

export interface ConfidenceInfo {
  clicks: number;
  reference_cvr: number;
  p_value: number;
  level: 'LOW_DATA' | 'MEDIUM' | 'HIGH';
  label: string;
}

export interface DateWindowInfo {
  start: string;
  end: string;
  days: number;
  label: string;
  has_conversion_metrics?: boolean;
}

export interface Evidence {
  metrics: Record<string, number | null>;
  matched: Array<{ metric: string; op: string; threshold: number; actual: number | null; target_acos?: number; offset?: number }>;
  current: Record<string, string | number | null>;
  projection?: Projection | null;
  date_window?: DateWindowInfo;
  confidence?: ConfidenceInfo;
  tracked_since?: string;
}

export interface SuggestedAction {
  type: string;
  params: Record<string, unknown>;
  from?: unknown;
  to?: unknown;
}

export interface Recommendation {
  id: number;
  ads_account_id: number;
  rule_id: number | null;
  rule_name: string;
  source: string;
  affected_parameter: AffectedParameter;
  entity_type: 'campaign' | 'target' | 'search_term' | 'placement';
  entity_id: number | null;
  entity_label: string;
  campaign_id: number;
  campaign_name?: string | null;
  ad_group_id: number | null;
  ad_group_name?: string | null;
  evidence: Evidence;
  suggested_actions: SuggestedAction[];
  status: 'OPEN' | 'APPLIED' | 'DISMISSED' | 'EXPIRED' | 'FAILED';
  dedupe_key: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
  apply_result?: {
    changes?: Array<{ field: string; from: unknown; to: unknown }>;
    notes?: string[];
    reason?: string;
    dismiss_reason?: string;
    error?: string;
  } | null;
  conflicts_with?: number[];
}

export interface RecommendationsSummary {
  open: number;
  applied_30d: number;
  dismissed_30d: number;
  last_run_at: string | null;
}

export interface RecommendationsListResponse {
  items: Recommendation[];
  total_count: number;
  counts: {
    OPEN: number;
    APPLIED: number;
    DISMISSED: number;
    EXPIRED: number;
    FAILED: number;
  };
}

export interface RuleFunnelCondition {
  index: number;
  metric: string;
  op: string;
  threshold: number;
  passed: number;
  failed: number;
}

export interface RuleFunnel {
  entities_in_scope: number;
  enabled_campaigns_count: number;
  total_campaigns_count: number;
  excluded_campaign_not_enabled: number;
  excluded_target_not_enabled: number;
  no_traffic: number;
  below_min_clicks: number;
  conditions: RuleFunnelCondition[];
  skipped_bid_unknown: number;
  skipped_already_at_limit: number;
  skipped_no_target_acos: number;
  final_candidates: number;
  suppressed_already_open: number;
  suppressed_cooldown: number;
  suppressed: number;
  created_open: number;
  date_window: {
    start: string;
    end: string;
    days: number;
    label: string;
  };
  evaluated_at: string;
  summary_text?: string;
  config_status_text?: string;
  tip?: string;
  notice?: string;
}

export interface RulePreviewResponse {
  match_count: number;
  evaluated_entities: number;
  sample: Array<Record<string, unknown>>;
  funnel?: RuleFunnel | null;
}
