import { rulesApiClient as apiClient } from './rules-api-client';
import type {
  Rule,
  RuleDraft,
  RuleMeta,
  ScopeMode,
  AffectedParameter,
} from './rules-types';

export async function fetchRulesMeta(adsAccountId: number): Promise<RuleMeta> {
  return apiClient<RuleMeta>(`/recommendations/meta?ads_account_id=${adsAccountId}`);
}

export async function fetchRules(adsAccountId: number): Promise<Rule[]> {
  return apiClient<Rule[]>(`/recommendations/rules?ads_account_id=${adsAccountId}`);
}

export async function fetchRule(ruleId: number): Promise<Rule> {
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

export async function toggleRuleActive(ruleId: number, isActive: boolean): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function duplicateRule(ruleId: number): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}/duplicate`, {
    method: 'POST',
  });
}

export async function updateRuleScope(
  ruleId: number,
  scopeMode: ScopeMode,
  campaignIds: number[]
): Promise<Rule> {
  return apiClient<Rule>(`/recommendations/rules/${ruleId}/scope`, {
    method: 'PATCH',
    body: JSON.stringify({ scope_mode: scopeMode, campaign_ids: campaignIds }),
  });
}

export async function bulkRulesAction(
  ids: number[],
  action: 'ENABLE' | 'DISABLE' | 'DELETE'
): Promise<{ success: boolean; affected_count: number }> {
  return apiClient<{ success: boolean; affected_count: number }>('/recommendations/rules/bulk', {
    method: 'POST',
    body: JSON.stringify({ ids, action }),
  });
}

export async function listRuleHistory(
  adsAccountId: number,
  affectedParam?: AffectedParameter
): Promise<any[]> {
  const query = affectedParam ? `?affected_parameter=${affectedParam}&limit=50` : '?limit=50';
  const res = await apiClient<{ items: any[] }>(`/recommendations/list${query}`);
  return res.items || [];
}

export async function triggerRuleRun(
  adsAccountId: number,
  ruleIds?: number[],
  affectedParam?: AffectedParameter
): Promise<{ created: number; expired: number; skipped: number; finished_at: string }> {
  return apiClient<{ created: number; expired: number; skipped: number; finished_at: string }>(
    '/recommendations/run',
    {
      method: 'POST',
      body: JSON.stringify({
        ads_account_id: adsAccountId,
        rule_ids: ruleIds,
        affected_parameter: affectedParam,
      }),
    }
  );
}
