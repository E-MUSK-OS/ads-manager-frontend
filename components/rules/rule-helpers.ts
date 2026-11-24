import type { Condition, RuleAction, ScopeMode, RuleMeta, Operator } from './rules-types';

export function getOperatorSymbol(op: Operator | string): string {
  switch (op) {
    case 'GT':
      return '>';
    case 'LT':
      return '<';
    case 'GTE':
      return '≥';
    case 'LTE':
      return '≤';
    case 'EQ':
      return '=';
    case 'NEQ':
      return '≠';
    case 'BETWEEN':
      return 'between';
    default:
      return op;
  }
}

export function formatConditionBadge(
  condition: Condition,
  meta?: RuleMeta | null,
  currencySymbol: string = '₹'
): string {
  const metricLower = (condition.metric || '').toLowerCase();
  if (metricLower === 'purchases_flag') {
    return 'Purchases';
  }
  if (metricLower === 'out_of_budget') {
    return 'Out of Budget';
  }
  if (metricLower === 'campaign_active_status') {
    if (!condition.value) return 'Campaign Active Status';
    return `Campaign Status: ${condition.value}`;
  }
  if (metricLower === 'target_active_status') {
    return `Target Status: ${condition.value || 'All'}`;
  }
  if (metricLower === 'status') {
    const val = String(condition.value || 'Enabled').replace('_', ' ');
    return `Status: ${val}`;
  }
  if (metricLower === 'type' || metricLower === 'campaign_type') {
    const val = String(condition.value || 'Sponsored Products').replace(/_/g, ' ');
    return `Type: ${val}`;
  }
  if (metricLower === 'targeting_type') {
    const val = String(condition.value || 'Manual').replace(/_/g, ' ');
    return `Targeting: ${val}`;
  }
  if (metricLower === 'top_of_search_is') {
    const op = getOperatorSymbol(condition.op);
    return `Top of Search IS ${op} ${condition.value}%`;
  }

  const METRIC_LABELS: Record<string, { label: string; unit: 'money' | 'percent' | 'count' | 'ratio' }> = {
    impressions: { label: 'Impressions', unit: 'count' },
    roas: { label: 'ROAS', unit: 'ratio' },
    clicks: { label: 'Clicks', unit: 'count' },
    purchases: { label: 'Purchases', unit: 'count' },
    sales: { label: 'Sales', unit: 'money' },
    spend: { label: 'Spend', unit: 'money' },
    bid: { label: 'Bid', unit: 'money' },
    acos: { label: 'ACOS', unit: 'percent' },
    orders: { label: 'Orders', unit: 'count' },
    cpc: { label: 'CPC', unit: 'money' },
    ctr: { label: 'CTR', unit: 'percent' },
    budget: { label: 'Budget', unit: 'money' },
    time_in_budget: { label: 'Time in Budget', unit: 'count' },
    budget_usage: { label: 'Budget Usage', unit: 'percent' },
  };

  const metricLabel =
    meta?.metrics?.[condition.metric]?.label ||
    METRIC_LABELS[metricLower]?.label ||
    condition.metric;

  const opSymbol = getOperatorSymbol(condition.op);
  const condUnit = (condition as any).unit;
  const isPercentUnit = condUnit === 'PERCENT' || condUnit === 'Percentage';
  const unit = isPercentUnit ? 'percent' : (meta?.metrics?.[condition.metric]?.unit || METRIC_LABELS[metricLower]?.unit);

  if (condition.value === null || condition.value === undefined || Number.isNaN(condition.value)) {
    return `${metricLabel} ${opSymbol} —`;
  }

  if (condition.op === 'BETWEEN') {
    const maxVal = (condition as any).max_value ?? (condition as any).value_max;
    if (unit === 'money') {
      return `${metricLabel} between ${currencySymbol}${condition.value} - ${currencySymbol}${maxVal}`;
    }
    if (unit === 'percent' || isPercentUnit) {
      return `${metricLabel} between ${condition.value}% - ${maxVal}%`;
    }
    return `${metricLabel} between ${condition.value} - ${maxVal}`;
  }

  let formattedValue = '';
  if (unit === 'money') {
    formattedValue = `${currencySymbol}${condition.value}`;
  } else if (unit === 'percent' || isPercentUnit) {
    formattedValue = `${condition.value}%`;
  } else if (unit === 'ratio') {
    formattedValue = `${condition.value}×`;
  } else {
    formattedValue = `${condition.value}`;
  }

  return `${metricLabel} ${opSymbol} ${formattedValue}`;
}

export function formatActionBadge(
  action: RuleAction,
  meta?: RuleMeta | null,
  currencySymbol: string = '₹'
): string {
  const actionType = action.type;
  const typeUpper = (actionType || '').toUpperCase();

  if (typeUpper.includes('INCREASE') && typeUpper.includes('PLACEMENT')) {
    const points = action.params?.points ?? action.params?.value ?? 10;
    const scope = action.params?.placement_position || action.params?.scope;
    const scopeStr = scope ? ` (${scope})` : '';
    return `Increase placement by ${points}%${scopeStr}`;
  }

  if (typeUpper.includes('DECREASE') && typeUpper.includes('PLACEMENT')) {
    const points = action.params?.points ?? action.params?.value ?? 10;
    const scope = action.params?.placement_position || action.params?.scope;
    const scopeStr = scope ? ` (${scope})` : '';
    return `Decrease placement by ${points}%${scopeStr}`;
  }

  if (typeUpper.includes('INCREASE') && typeUpper.includes('BUDGET')) {
    const pct = action.params?.pct;
    if (pct !== undefined && pct !== null) {
      return `Increase budget by ${pct}%`;
    }
    const amt = action.params?.amount ?? action.params?.value ?? 10;
    return `Increase budget by ${currencySymbol}${amt}`;
  }

  if (typeUpper.includes('DECREASE') && typeUpper.includes('BUDGET')) {
    const pct = action.params?.pct;
    if (pct !== undefined && pct !== null) {
      return `Decrease budget by ${pct}%`;
    }
    const amt = action.params?.amount ?? action.params?.value ?? 10;
    return `Decrease budget by ${currencySymbol}${amt}`;
  }

  if (typeUpper.includes('SET') && typeUpper.includes('BUDGET')) {
    const pct = action.params?.pct;
    if (pct !== undefined && pct !== null) {
      return `Set budget to ${pct}%`;
    }
    const amt = action.params?.amount ?? action.params?.value ?? 10;
    return `Set budget to ${currencySymbol}${amt}`;
  }

  if (typeUpper.includes('ENABLE') && typeUpper.includes('CAMPAIGN')) {
    return 'Enable campaign';
  }

  if (typeUpper.includes('PAUSE') && typeUpper.includes('CAMPAIGN')) {
    return 'Pause campaign';
  }

  if (typeUpper.includes('ENABLE') && typeUpper.includes('AD_GROUP')) {
    return 'Enable ad group';
  }

  if (typeUpper.includes('PAUSE') && typeUpper.includes('AD_GROUP')) {
    return 'Pause ad group';
  }

  if (typeUpper.includes('ENABLE') && (typeUpper.includes('TARGET') || typeUpper.includes('KEYWORD'))) {
    return 'Enable target';
  }

  if (typeUpper.includes('PAUSE') && (typeUpper.includes('TARGET') || typeUpper.includes('KEYWORD'))) {
    return 'Pause target';
  }

  if (typeUpper.includes('SET') && typeUpper.includes('BID')) {
    const isPct = action.params?.unit === 'PERCENT' || (action.params?.pct !== undefined && action.params?.pct !== null);
    const val = isPct ? action.params?.pct : (action.params?.amount ?? action.params?.value ?? 10);
    return isPct ? `Set bid to ${val}%` : `Set bid to ${currencySymbol}${val}`;
  }

  if (typeUpper.includes('INCREASE') && typeUpper.includes('BID')) {
    const isPct = action.params?.unit === 'PERCENT' || (action.params?.pct !== undefined && action.params?.pct !== null);
    const val = isPct ? action.params?.pct : (action.params?.amount ?? action.params?.value ?? 10);
    const scope = action.params?.target_scope || action.params?.scope;
    const scopeStr = scope ? ` (${scope})` : '';
    return isPct ? `Increase bid by ${val}%${scopeStr}` : `Increase bid by ${currencySymbol}${val}${scopeStr}`;
  }

  if (typeUpper.includes('DECREASE') && typeUpper.includes('BID')) {
    const isPct = action.params?.unit === 'PERCENT' || (action.params?.pct !== undefined && action.params?.pct !== null);
    const val = isPct ? action.params?.pct : (action.params?.amount ?? action.params?.value ?? 10);
    const scope = action.params?.target_scope || action.params?.scope;
    const scopeStr = scope ? ` (${scope})` : '';
    return isPct ? `Decrease bid by ${val}%${scopeStr}` : `Decrease bid by ${currencySymbol}${val}${scopeStr}`;
  }

  if (typeUpper.includes('PAUSE')) {
    return 'Pause target';
  }

  if (typeUpper.includes('ADD_AS_NEGATIVE') || typeUpper.includes('NEGATIVE')) {
    const matchType = action.params?.match_type ? String(action.params.match_type).replace('NEGATIVE_', '') : 'EXACT';
    return `Add as Negative (${matchType})`;
  }

  if (typeUpper.includes('ADD_AS_TARGETING') || typeUpper.includes('TARGETING')) {
    const matchType = action.params?.match_type || 'EXACT';
    return `Add as Targeting (${matchType})`;
  }

  if (typeUpper.includes('CREATE_CAMPAIGN') || typeUpper.includes('CREATE CAMPAIGN')) {
    const matchType = action.params?.match_type || 'EXACT';
    return `Create Campaign (${matchType})`;
  }

  return actionType;
}

export function formatScopeBadge(
  scopeMode: ScopeMode,
  campaignIds?: number[]
): { label: string; count: number; mode: ScopeMode } {
  const count = campaignIds?.length ?? 0;
  if (scopeMode === 'ALL') {
    return { label: 'All campaigns', count: 0, mode: 'ALL' };
  }
  if (scopeMode === 'INCLUDE') {
    return { label: `Include ${count}`, count, mode: 'INCLUDE' };
  }
  return { label: `Exclude ${count}`, count, mode: 'EXCLUDE' };
}

export function formatDateIN(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return '—';
  }
}
