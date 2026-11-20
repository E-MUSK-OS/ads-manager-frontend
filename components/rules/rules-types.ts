export type RuleSection = 'all' | 'placement' | 'budget' | 'targeting' | 'search_term';

export type AffectedParameter = 'CAMPAIGN' | 'PLACEMENT' | 'TARGETING' | 'SEARCH_TERM';

export type Operator = 'LT' | 'LTE' | 'GTE' | 'GT' | 'EQ' | 'NEQ' | 'BETWEEN';

export interface Condition {
  metric: string;
  op: Operator;
  value: number | null;
}

export interface RuleAction {
  type: string;
  params: Record<string, any>;
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
  created_at?: string;
  updated_at?: string;
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

export interface RuleMeta {
  date_filters: Record<string, string>;
  metrics: Record<string, { label: string; unit: 'count' | 'money' | 'percent' | 'ratio' }>;
  operators: Record<string, { label: string; symbol: string }>;
  affected_parameters: Record<string, { label: string; available: boolean }>;
  actions: Record<string, Record<string, { label: string; params: Record<string, any> }>>;
}

export interface SectionConfig {
  id: RuleSection;
  label: string;
  affectedParameter: AffectedParameter;
  title: string;
  description: string;
}
