import { getAccessToken, clearTokens } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const isAuthEndpoint = endpoint.startsWith('/auth/');

  if (response.status === 401 && !isAuthEndpoint) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'An error occurred');
  }

  return response.json();
}

export async function getCampaignReport(params: Record<string, any>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      if (Array.isArray(v)) {
        v.forEach((val) => query.append(k, val.toString()));
      } else {
        query.append(k, v.toString());
      }
    }
  }
  return apiClient(`/campaigns/report?${query.toString()}`);
}

export async function getCampaignSummary(params: Record<string, any>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      if (Array.isArray(v)) {
        v.forEach((val) => query.append(k, val.toString()));
      } else {
        query.append(k, v.toString());
      }
    }
  }
  return apiClient(`/campaigns/summary?${query.toString()}`);
}

export async function getCampaignAlerts(accountId: number) {
  return apiClient(`/campaigns/alerts?ads_account_id=${accountId}`);
}

export async function getCampaignSettings() {
  return apiClient(`/campaigns/settings/campaigns`);
}

export async function getCampaignSuggestions(accountId: number, productIds: number[] = []) {
  const query = new URLSearchParams({ ads_account_id: accountId.toString() });
  if (productIds.length) {
    query.append("product_ids", productIds.join(","));
  }
  return apiClient(`/campaigns/suggestions?${query.toString()}`);
}

export async function getCampaign(id: number) {
  return apiClient(`/campaigns/${id}`);
}

export async function createCampaign(data: any) {
  return apiClient("/campaigns", { method: "POST", body: JSON.stringify(data) });
}

export async function validateCampaign(data: any) {
  return apiClient("/campaigns/validate", { method: "POST", body: JSON.stringify(data) });
}

export async function bulkAction(data: any) {
  return apiClient("/campaigns/bulk", { method: "POST", body: JSON.stringify(data) });
}

export async function duplicateCampaign(id: number) {
  return apiClient(`/campaigns/${id}/duplicate`, { method: "POST" });
}

export async function updateCampaignState(id: number, state: string) {
  return apiClient(`/campaigns/${id}/state`, { method: "PUT", body: JSON.stringify({ state }) });
}

export async function updateCampaignSettings(data: any) {
  return apiClient(`/campaigns/settings/campaigns`, { method: "PUT", body: JSON.stringify(data) });
}
