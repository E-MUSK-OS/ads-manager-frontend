import { getAccessToken, clearTokens } from './auth';
import type {
  CampaignCreatePayload,
  CampaignCreateResult,
  CampaignItem,
  CampaignReportResponse,
  CampaignSummaryResponse,
  CampaignAlert,
  UserCampaignSettings,
  SuggestionsResponse,
  CampaignState,
  ProductSearchResponse,
  ProductLookupResponse,
  ForecastResponse,
  BidSuggestionsResponse,
  NegativeSuggestion,
  CampaignDraftRecord,
  CampaignDraft,
} from './types/campaign';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: FieldError[] = [],
    public body: unknown = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ServiceErrorItem {
  field?: string | number;
  message?: string;
  loc?: Array<string | number>;
  msg?: string;
}

function parseDetail(detail: unknown): { message: string; fields: FieldError[] } {
  if (typeof detail === 'string') return { message: detail, fields: [] };
  if (Array.isArray(detail)) {
    const fields: FieldError[] = detail.map((d: unknown) => {
      const item = (d && typeof d === 'object') ? (d as ServiceErrorItem) : {};
      if (item.field !== undefined) {
        return { field: String(item.field), message: String(item.message || 'Invalid value') };
      }
      const locStr = Array.isArray(item.loc) ? item.loc.slice(1).join('.') : '';
      return { field: locStr, message: String(item.msg ?? 'Invalid value') };
    });
    return { message: fields[0]?.message ?? 'Validation failed', fields };
  }
  return { message: 'Something went wrong', fields: [] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    const bodyObj = (body && typeof body === 'object') ? (body as { detail?: unknown }) : {};
    const { message, fields } = parseDetail(bodyObj.detail);
    throw new ApiError(message, response.status, fields, body);
  }
  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export type QueryValue = string | number | boolean | string[] | undefined | null;

function buildQuery(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      if (Array.isArray(v)) {
        v.forEach((val) => query.append(k, String(val)));
      } else {
        query.append(k, String(v));
      }
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function getCampaignReport(
  params: Record<string, QueryValue>,
  signal?: AbortSignal
): Promise<CampaignReportResponse> {
  return apiClient<CampaignReportResponse>(`/campaigns/report${buildQuery(params)}`, { signal });
}

export async function getCampaignSummary(
  params: Record<string, QueryValue>,
  signal?: AbortSignal
): Promise<CampaignSummaryResponse> {
  return apiClient<CampaignSummaryResponse>(`/campaigns/summary${buildQuery(params)}`, { signal });
}

export async function getCampaignAlerts(
  accountId: number,
  signal?: AbortSignal
): Promise<CampaignAlert[]> {
  return apiClient<CampaignAlert[]>(`/campaigns/alerts?ads_account_id=${accountId}`, { signal });
}

export async function getCampaignSettings(
  signal?: AbortSignal
): Promise<UserCampaignSettings> {
  return apiClient<UserCampaignSettings>(`/campaigns/settings/campaigns`, { signal });
}

export async function updateCampaignSettings(
  data: UserCampaignSettings,
  signal?: AbortSignal
): Promise<UserCampaignSettings> {
  return apiClient<UserCampaignSettings>(`/campaigns/settings/campaigns`, {
    method: 'PUT',
    body: JSON.stringify(data),
    signal,
  });
}

export async function getCampaignSuggestions(
  accountId: number,
  productIds: number[] = [],
  signal?: AbortSignal
): Promise<SuggestionsResponse> {
  const query = new URLSearchParams({ ads_account_id: accountId.toString() });
  if (productIds.length) {
    query.append('product_ids', productIds.join(','));
  }
  return apiClient<SuggestionsResponse>(`/campaigns/suggestions?${query.toString()}`, { signal });
}

export async function getCampaign(
  id: number,
  signal?: AbortSignal
): Promise<CampaignItem> {
  return apiClient<CampaignItem>(`/campaigns/${id}`, { signal });
}

export async function createCampaign(
  data: CampaignCreatePayload,
  signal?: AbortSignal
): Promise<CampaignCreateResult> {
  return apiClient<CampaignCreateResult>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
}

export async function validateCampaign(
  data: CampaignCreatePayload,
  signal?: AbortSignal
): Promise<{ ok: boolean; errors: FieldError[]; warnings: Array<{ field?: string; message: string }> }> {
  return apiClient('/campaigns/validate', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
}

export async function bulkAction(
  data: { ids: number[]; action: string; value?: number },
  signal?: AbortSignal
): Promise<{ results: Array<{ id: number; ok: boolean; error?: string }> }> {
  return apiClient('/campaigns/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
}

export async function duplicateCampaign(
  id: number,
  signal?: AbortSignal
): Promise<CampaignItem> {
  return apiClient<CampaignItem>(`/campaigns/${id}/duplicate`, { method: 'POST', signal });
}

export async function updateCampaignState(
  id: number,
  state: CampaignState,
  signal?: AbortSignal
): Promise<CampaignItem> {
  return apiClient<CampaignItem>(`/campaigns/${id}/state`, {
    method: 'PUT',
    body: JSON.stringify({ state }),
    signal,
  });
}

export async function updateCampaignBudget(
  id: number,
  daily_budget: number,
  signal?: AbortSignal
): Promise<CampaignItem> {
  return apiClient<CampaignItem>(`/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ daily_budget }),
    signal,
  });
}

export async function searchProducts(
  params: {
    ads_account_id: number;
    q?: string;
    targeting_type?: string;
    sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
    page?: number;
    page_size?: number;
  },
  signal?: AbortSignal
): Promise<ProductSearchResponse> {
  return apiClient<ProductSearchResponse>(`/products/search${buildQuery(params)}`, { signal });
}

export async function lookupProducts(
  ads_account_id: number,
  asins: string[],
  signal?: AbortSignal
): Promise<ProductLookupResponse> {
  return apiClient<ProductLookupResponse>('/products/lookup', {
    method: 'POST',
    body: JSON.stringify({ ads_account_id, asins }),
    signal,
  });
}

export async function getBidSuggestions(
  payload: {
    ads_account_id: number;
    product_ids?: number[];
    keywords?: Array<{ keyword_text: string; match_type: string }>;
  },
  signal?: AbortSignal
): Promise<BidSuggestionsResponse> {
  return apiClient<BidSuggestionsResponse>('/campaigns/bid-suggestions', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

export async function getCampaignForecast(
  payload: {
    ads_account_id: number;
    product_ids?: number[];
    daily_budget?: number | null;
    default_bid?: number | null;
    targeting_type?: 'AUTO' | 'MANUAL' | null;
    target_count?: number | null;
  },
  signal?: AbortSignal
): Promise<ForecastResponse> {
  return apiClient<ForecastResponse>('/campaigns/forecast', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

export async function getNegativeSuggestions(
  accountId: number,
  productIds: number[] = [],
  signal?: AbortSignal
): Promise<NegativeSuggestion[]> {
  const query = new URLSearchParams({ ads_account_id: accountId.toString() });
  if (productIds.length) {
    query.append('product_ids', productIds.join(','));
  }
  return apiClient<NegativeSuggestion[]>(`/campaigns/negative-suggestions?${query.toString()}`, { signal });
}

export async function searchBrands(
  q: string,
  signal?: AbortSignal
): Promise<string[]> {
  return apiClient<string[]>(`/campaigns/brands?q=${encodeURIComponent(q)}`, { signal });
}

export async function checkCampaignName(
  accountId: number,
  name: string,
  signal?: AbortSignal
): Promise<{ available: boolean }> {
  return apiClient<{ available: boolean }>(
    `/campaigns/name-check?ads_account_id=${accountId}&name=${encodeURIComponent(name)}`,
    { signal }
  );
}

export async function getCampaignDrafts(
  accountId: number,
  signal?: AbortSignal
): Promise<CampaignDraftRecord[]> {
  return apiClient<CampaignDraftRecord[]>(`/campaign-drafts?ads_account_id=${accountId}`, { signal });
}

export async function createCampaignDraft(
  payload: { ads_account_id: number; name: string; step: number; payload: CampaignDraft },
  signal?: AbortSignal
): Promise<CampaignDraftRecord> {
  return apiClient<CampaignDraftRecord>('/campaign-drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

export async function updateCampaignDraft(
  id: number,
  payload: { name?: string; step?: number; payload?: CampaignDraft },
  signal?: AbortSignal
): Promise<CampaignDraftRecord> {
  return apiClient<CampaignDraftRecord>(`/campaign-drafts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    signal,
  });
}

export async function deleteCampaignDraft(
  id: number,
  signal?: AbortSignal
): Promise<void> {
  return apiClient<void>(`/campaign-drafts/${id}`, {
    method: 'DELETE',
    signal,
  });
}

export async function syncAdsAccount(
  accountId: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; message?: string }> {
  return apiClient(`/ads-accounts/${accountId}/sync`, { method: 'POST', signal });
}

export async function getCampaignAdGroups(
  campaignId: number,
  start?: string,
  end?: string,
  signal?: AbortSignal
): Promise<import('./types/campaign').AdGroupItem[]> {
  const query = buildQuery({ start, end });
  return apiClient<import('./types/campaign').AdGroupItem[]>(`/campaigns/${campaignId}/ad-groups${query}`, { signal });
}

export async function patchAdGroup(
  id: number,
  data: { name?: string; default_bid?: number; state?: string },
  signal?: AbortSignal
): Promise<import('./types/campaign').AdGroupItem> {
  return apiClient<import('./types/campaign').AdGroupItem>(`/ad-groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    signal,
  });
}

export async function getKeywords(
  adGroupId: number,
  signal?: AbortSignal
): Promise<import('./types/campaign').KeywordItem[]> {
  return apiClient<import('./types/campaign').KeywordItem[]>(`/keywords?ad_group_id=${adGroupId}`, { signal });
}

export async function patchKeyword(
  id: number,
  data: { bid?: number; state?: string },
  signal?: AbortSignal
): Promise<import('./types/campaign').KeywordItem> {
  return apiClient<import('./types/campaign').KeywordItem>(`/keywords/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    signal,
  });
}

export async function createKeyword(
  data: { ad_group_id: number; keyword_text: string; match_type: string; bid?: number },
  signal?: AbortSignal
): Promise<import('./types/campaign').KeywordItem> {
  return apiClient<import('./types/campaign').KeywordItem>('/keywords', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
}

export async function getSearchTerms(
  campaignId: number,
  signal?: AbortSignal
): Promise<import('./types/campaign').SearchTermItem[]> {
  return apiClient<import('./types/campaign').SearchTermItem[]>(`/search-terms?campaign_id=${campaignId}`, { signal });
}

export async function getNegativeKeywords(
  campaignId: number,
  signal?: AbortSignal
): Promise<import('./types/campaign').NegativeKeywordItem[]> {
  return apiClient<import('./types/campaign').NegativeKeywordItem[]>(`/campaigns/${campaignId}/negative-keywords`, { signal });
}

export async function createNegativeKeyword(
  campaignId: number,
  data: { keyword_text: string; match_type: string },
  signal?: AbortSignal
): Promise<import('./types/campaign').NegativeKeywordItem> {
  return apiClient<import('./types/campaign').NegativeKeywordItem>(`/campaigns/${campaignId}/negative-keywords`, {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
}

export async function deleteNegativeKeyword(
  campaignId: number,
  nkId: number,
  signal?: AbortSignal
): Promise<void> {
  return apiClient<void>(`/campaigns/${campaignId}/negative-keywords/${nkId}`, {
    method: 'DELETE',
    signal,
  });
}

export async function patchCampaign(
  id: number,
  data: Partial<Record<string, unknown>>,
  signal?: AbortSignal
): Promise<CampaignItem> {
  return apiClient<CampaignItem>(`/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    signal,
  });
}
