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

export interface Evidence {
  metrics: Record<string, number | null>;
  matched: Array<{ metric: string; op: string; threshold: number; actual: number | null }>;
  current: Record<string, string | number | null>;
  projection?: Projection | null;
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

export interface RulePreviewResponse {
  match_count: number;
  evaluated_entities: number;
  sample: Array<Record<string, unknown>>;
}
