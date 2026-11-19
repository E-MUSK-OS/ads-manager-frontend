import { apiClient } from './api-client';
import type {
  Meta,
  Rule,
  RuleDraft,
  ScopeMode,
  RulePreviewResponse,
  RecommendationsSummary,
  RecommendationsListResponse,
  Recommendation,
} from './types/recommendation';

export async function getRecommendationMeta(adsAccountId: number): Promise<Meta> {
  return apiClient<Meta>(`/recommendations/meta?ads_account_id=${adsAccountId}`);
}

export async function listRules(adsAccountId: number): Promise<Rule[]> {
  return apiClient<Rule[]>(`/recommendations/rules?ads_account_id=${adsAccountId}`);
}

export async function getRule(ruleId: number): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}`);
}

export async function createRule(
  adsAccountId: number,
  payload: RuleDraft
): Promise<{ rule: Rule; run?: { match_count?: number } | unknown }> {
  return apiClient<{ rule: Rule; run?: { match_count?: number } | unknown }>('/recommendations/rules', {
    method: 'POST',
    body: JSON.stringify({ ...payload, ads_account_id: adsAccountId }),
  });
}

export async function updateRule(ruleId: number, payload: RuleDraft): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRule(ruleId: number): Promise<{ status: string; id: number }> {
  return apiClient<{ status: string; id: number }>(`/recommendations/rules/${ruleId}`, {
    method: 'DELETE',
  });
}

export async function setRuleActive(ruleId: number, isActive: boolean): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function updateRuleScope(
  ruleId: number,
  scopeMode: ScopeMode,
  campaignIds: number[]
): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}/scope`, {
    method: 'PUT',
    body: JSON.stringify({ scope_mode: scopeMode, campaign_ids: campaignIds }),
  });
}

export async function duplicateRule(ruleId: number): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}/duplicate`, {
    method: 'POST',
  });
}

export async function bulkRulesAction(
  ids: number[],
  action: 'ENABLE' | 'DISABLE' | 'DELETE'
): Promise<Array<{ id: number; success: boolean; error?: string }>> {
  const res = await apiClient<{ results: Array<{ id: number; success: boolean; error?: string }> }>(
    '/recommendations/rules/bulk',
    {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    }
  );
  return res.results;
}

export async function previewRule(
  adsAccountId: number,
  rule: RuleDraft
): Promise<RulePreviewResponse> {
  return apiClient<RulePreviewResponse>('/recommendations/rules/preview', {
    method: 'POST',
    body: JSON.stringify({ ads_account_id: adsAccountId, rule }),
  });
}

export async function getRecommendationsSummary(
  adsAccountId: number
): Promise<RecommendationsSummary> {
  return apiClient<RecommendationsSummary>(
    `/recommendations/summary?ads_account_id=${adsAccountId}`
  );
}

export async function listRecommendations(
  adsAccountId: number,
  params: Record<string, string | number | undefined> = {}
): Promise<RecommendationsListResponse> {
  const query = new URLSearchParams({ ads_account_id: String(adsAccountId) });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  }
  return apiClient<RecommendationsListResponse>(`/recommendations?${query.toString()}`);
}

export async function runRecommendations(
  adsAccountId: number,
  ruleIds?: number[]
): Promise<{ created: number; expired: number; skipped: number; finished_at: string }> {
  return apiClient<{ created: number; expired: number; skipped: number; finished_at: string }>(
    '/recommendations/run',
    {
      method: 'POST',
      body: JSON.stringify({ ads_account_id: adsAccountId, rule_ids: ruleIds }),
    }
  );
}

export async function applyRecommendation(
  id: number,
  overrides?: Record<string, unknown>
): Promise<Recommendation> {
  return apiClient<Recommendation>(`/recommendations/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify({ overrides }),
  });
}

export async function dismissRecommendation(id: number, reason?: string): Promise<Recommendation> {
  return apiClient<Recommendation>(`/recommendations/${id}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function reopenRecommendation(id: number): Promise<Recommendation> {
  return apiClient<Recommendation>(`/recommendations/${id}/reopen`, {
    method: 'POST',
  });
}

export interface BulkApplyResultItem {
  id: number;
  status?: 'APPLIED' | 'FAILED' | 'STALE' | string;
  success: boolean;
  error?: string;
  changes?: Array<{ field: string; from: unknown; to: unknown }>;
  recommendation?: Recommendation;
}

export async function bulkRecommendationsAction(
  ids: number[],
  action: 'APPLY' | 'DISMISS',
  options?: { confirm?: boolean; idempotencyKey?: string }
): Promise<Array<BulkApplyResultItem>> {
  return apiClient<Array<BulkApplyResultItem>>('/recommendations/bulk', {
    method: 'POST',
    body: JSON.stringify({
      ids,
      action,
      confirm: options?.confirm,
      idempotency_key: options?.idempotencyKey,
    }),
  });
}
