import { MarketplaceRules } from './types/campaign';

/**
 * Format monetary amount with symbol and proper precision.
 * Returns '—' for null, undefined, or NaN (never NaN or $0.00 misleadingly).
 */
export function money(
  v: number | null | undefined,
  rules?: Partial<MarketplaceRules> | null,
  decimals = 2
): string {
  if (v === null || v === undefined || Number.isNaN(v)) {
    return '—';
  }

  const symbol = rules?.symbol ?? '$';
  const numFormatted = new Intl.NumberFormat(rules?.locale || 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);

  return `${symbol}${numFormatted}`;
}

/**
 * Format percentage.
 * Returns '—' for null, undefined, or NaN (never NaN%).
 */
export function pct(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) {
    return '—';
  }
  return `${v.toFixed(decimals)}%`;
}

/**
 * Format numeric ratio (e.g. ROAS).
 * Returns '—' for null, undefined, or NaN.
 */
export function ratio(v: number | null | undefined, decimals = 2, suffix = 'x'): string {
  if (v === null || v === undefined || Number.isNaN(v)) {
    return '—';
  }
  return `${v.toFixed(decimals)}${suffix}`;
}

/**
 * Format standard number with locale commas.
 * Returns '—' for null, undefined, or NaN.
 */
export function num(v: number | null | undefined, decimals?: number): string {
  if (v === null || v === undefined || Number.isNaN(v)) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
}
