'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class RulesApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: { field: string; message: string }[] = [],
    public body: unknown = null
  ) {
    super(message);
    this.name = 'RulesApiError';
  }
}

function getLocalAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

function clearLocalTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

function parseDetail(detail: unknown): { message: string; fields: { field: string; message: string }[] } {
  if (typeof detail === 'string') return { message: detail, fields: [] };
  if (Array.isArray(detail)) {
    const fields = detail.map((d: any) => {
      if (d && typeof d === 'object') {
        if (d.field !== undefined) {
          return { field: String(d.field), message: String(d.message || 'Invalid value') };
        }
        const locStr = Array.isArray(d.loc) ? d.loc.slice(1).join('.') : '';
        return { field: locStr, message: String(d.msg ?? 'Invalid value') };
      }
      return { field: '', message: 'Invalid value' };
    });
    return { message: fields[0]?.message ?? 'Validation failed', fields };
  }
  return { message: 'Something went wrong', fields: [] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rulesApiClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getLocalAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    clearLocalTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new RulesApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    const bodyObj = (body && typeof body === 'object') ? (body as { detail?: unknown }) : {};
    const { message, fields } = parseDetail(bodyObj.detail);
    throw new RulesApiError(message, response.status, fields, body);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}
