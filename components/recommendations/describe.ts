import type {
  Condition,
  RuleAction,
  ScopeMode,
  Meta,
  SuggestedAction,
  Recommendation,
  Evidence,
  Projection,
} from '@/lib/types/recommendation';

export function getOperatorSymbol(op: string, meta?: Meta | null): string {
  if (meta?.operators && meta.operators[op]) {
    return meta.operators[op].symbol;
  }
  switch (op) {
    case 'GTE':
      return '≥';
    case 'LTE':
      return '≤';
    case 'GT':
      return '>';
    case 'LT':
      return '<';
    case 'EQ':
      return '=';
    default:
      return op;
  }
}

export function getMetricUnitAdornment(
  metric: string,
  meta?: Meta | null,
  currencySymbol: string = '₹'
): string {
  const unit = meta?.metrics?.[metric]?.unit;
  if (!unit) {
    if (metric.includes('spend') || metric.includes('cpc') || metric.includes('revenue') || metric.includes('bid')) {
      return currencySymbol;
    }
    if (metric.includes('acos') || metric.includes('roas') || metric.includes('ctr') || metric.includes('cvr')) {
      return metric.includes('roas') ? '×' : '%';
    }
    return '';
  }
  switch (unit) {
    case 'money':
      return currencySymbol;
    case 'percent':
      return '%';
    case 'ratio':
      return '×';
    case 'count':
    default:
      return '';
  }
}

export function formatMetricNumber(val: number | null | undefined, unit?: 'money' | 'percent' | 'ratio' | 'count', currencySymbol: string = '₹'): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (val === Infinity || val === -Infinity) return '—';
  
  if (unit === 'money') {
    const isWhole = Number.isInteger(val);
    const formatted = val.toLocaleString(undefined, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return `${currencySymbol}${formatted}`;
  }
  if (unit === 'percent') {
    return `${val}%`;
  }
  if (unit === 'ratio') {
    return `${val}×`;
  }
  return val.toLocaleString();
}

export function describeCondition(
  condition: Condition,
  meta?: Meta | null,
  currencySymbol: string = '₹'
): string {
  const metricLabel = meta?.metrics?.[condition.metric]?.label || condition.metric;
  const opSymbol = getOperatorSymbol(condition.op, meta);
  const unit = meta?.metrics?.[condition.metric]?.unit;
  
  if (condition.value === null || condition.value === undefined) {
    return `${metricLabel} ${opSymbol} —`;
  }

  let formattedValue = '';
  if (unit === 'money') {
    formattedValue = `${currencySymbol}${condition.value}`;
  } else if (unit === 'percent') {
    formattedValue = `${condition.value}%`;
  } else if (unit === 'ratio') {
    formattedValue = `${condition.value}×`;
  } else {
    formattedValue = `${condition.value}`;
  }

  return `${metricLabel} ${opSymbol} ${formattedValue}`;
}

export function describeConditionMatched(
  matched: { metric: string; op: string; threshold: number; actual: number | null },
  meta?: Meta | null,
  currencySymbol: string = '₹'
): string {
  const metricLabel = meta?.metrics?.[matched.metric]?.label || matched.metric;
  const opSymbol = getOperatorSymbol(matched.op, meta);
  const unit = meta?.metrics?.[matched.metric]?.unit;

  const actualFormatted = formatMetricNumber(matched.actual, unit, currencySymbol);
  let threshFormatted = '';
  if (unit === 'money') {
    threshFormatted = `${currencySymbol}${matched.threshold}`;
  } else if (unit === 'percent') {
    threshFormatted = `${matched.threshold}%`;
  } else if (unit === 'ratio') {
    threshFormatted = `${matched.threshold}×`;
  } else {
    threshFormatted = `${matched.threshold}`;
  }

  return `${metricLabel} ${actualFormatted} ${opSymbol} ${threshFormatted} ✓`;
}

export function describeRuleAction(
  action: RuleAction,
  meta?: Meta | null,
  currencySymbol: string = '₹'
): string {
  const actionType = action.type;
  // Look up label in meta.actions if available
  let actionLabel = actionType;
  if (meta?.actions) {
    for (const group of Object.values(meta.actions)) {
      if (group[actionType]?.label) {
        actionLabel = group[actionType].label;
        break;
      }
    }
  }

  if (actionType === 'add_negative_target' || actionType === 'add_negative_search_term') {
    const matchType = action.params.match_type ? String(action.params.match_type).toUpperCase() : 'EXACT';
    const matchTypeTitle = matchType === 'EXACT' ? 'Exact' : matchType === 'PHRASE' ? 'Phrase' : matchType;
    return `Add as Negative Targeting · ${matchTypeTitle}`;
  }

  if (actionType === 'pause_target' || actionType === 'pause_keyword' || actionType === 'pause_placement') {
    return 'Pause';
  }

  if (actionType === 'decrease_bid' || actionType === 'increase_bid') {
    const pct = action.params.percentage;
    const direction = actionType === 'decrease_bid' ? 'Decrease' : 'Increase';
    return pct !== undefined && pct !== null ? `${direction} bid by ${pct}%` : `${direction} bid`;
  }

  if (actionType === 'increase_budget' || actionType === 'decrease_budget') {
    const pct = action.params.percentage;
    const direction = actionType === 'increase_budget' ? 'Increase' : 'Decrease';
    return pct !== undefined && pct !== null ? `${direction} daily budget by ${pct}%` : `${direction} daily budget`;
  }

  if (actionType === 'set_bid') {
    const amount = action.params.amount;
    return amount !== undefined && amount !== null ? `Set bid to ${currencySymbol}${amount}` : 'Set bid';
  }

  if (actionType === 'INCREASE_PLACEMENT' || actionType === 'increase_placement' || actionType === 'DECREASE_PLACEMENT' || actionType === 'decrease_placement') {
    const points = action.params.points;
    const direction = (actionType.startsWith('INCREASE') || actionType.startsWith('increase')) ? 'Increase' : 'Decrease';
    return points !== undefined && points !== null ? `${direction} placement adjustment by ${points}%` : `${direction} placement adjustment`;
  }

  // Fallback to action label and non-empty params
  const paramPairs = Object.entries(action.params || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`);

  return paramPairs.length > 0 ? `${actionLabel} (${paramPairs.join(', ')})` : actionLabel;
}

export function describeScopeBadge(
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

export function describeRecommendationAction(
  action: SuggestedAction,
  rec?: Partial<Recommendation>,
  currencySymbol: string = '₹'
): string {
  const entityLabel = rec?.entity_label || 'target';
  const adGroupName = rec?.ad_group_name;
  const campaignName = rec?.campaign_name;
  const actionType = action.type;

  if (actionType === 'add_negative_target' || actionType === 'add_negative_search_term' || actionType === 'negative_keyword') {
    const matchType = (action.params?.match_type as string)?.toLowerCase() || 'exact';
    let loc = '';
    if (adGroupName) {
      loc = adGroupName.toLowerCase().startsWith('ad group') ? `in ${adGroupName}` : `in Ad group ${adGroupName}`;
    } else if (campaignName) {
      loc = campaignName.toLowerCase().startsWith('campaign') ? `in ${campaignName}` : `in Campaign ${campaignName}`;
    }
    return `Add '${entityLabel}' as a negative ${matchType} keyword${loc ? ' ' + loc : ''}`;
  }

  if (actionType === 'pause_target' || actionType === 'pause_keyword' || actionType === 'pause') {
    return `Pause keyword '${entityLabel}'`;
  }

  if (actionType === 'decrease_bid' || actionType === 'increase_bid') {
    const fromVal = action.from as number | undefined;
    const toVal = action.to as number | undefined;
    const pct = action.params?.percentage as number | undefined;
    const direction = actionType === 'decrease_bid' ? 'Decrease' : 'Increase';
    const sign = actionType === 'decrease_bid' ? '−' : '+';

    if (fromVal !== undefined && toVal !== undefined) {
      const pctStr = pct !== undefined ? ` (${sign}${pct}%)` : '';
      return `${direction} bid ${currencySymbol}${fromVal.toFixed(2)} → ${currencySymbol}${toVal.toFixed(2)}${pctStr}`;
    }
    if (pct !== undefined) {
      return `${direction} bid by ${pct}%`;
    }
    return `${direction} bid`;
  }

  if (actionType === 'increase_budget' || actionType === 'decrease_budget') {
    const fromVal = action.from as number | undefined;
    const toVal = action.to as number | undefined;
    const pct = action.params?.percentage as number | undefined;
    const direction = actionType === 'increase_budget' ? 'Increase' : 'Decrease';
    const sign = actionType === 'increase_budget' ? '+' : '−';

    if (fromVal !== undefined && toVal !== undefined) {
      const pctStr = pct !== undefined ? ` (${sign}${pct}%)` : '';
      return `${direction} daily budget ${currencySymbol}${Math.round(fromVal)} → ${currencySymbol}${Math.round(toVal)}${pctStr}`;
    }
    if (pct !== undefined) {
      return `${direction} daily budget by ${pct}%`;
    }
    return `${direction} daily budget`;
  }

  if (actionType === 'INCREASE_PLACEMENT' || actionType === 'increase_placement' || actionType === 'DECREASE_PLACEMENT' || actionType === 'decrease_placement') {
    const fromVal = action.from as number | undefined;
    const toVal = action.to as number | undefined;
    const points = action.params?.points as number | undefined;
    const direction = (actionType.startsWith('INCREASE') || actionType.startsWith('increase')) ? 'Increase' : 'Decrease';
    const sign = direction === 'Increase' ? '+' : '−';
    const placementName = rec?.entity_label || 'placement';

    if (fromVal !== undefined && toVal !== undefined) {
      const diff = Math.abs(toVal - fromVal);
      const ptsStr = points !== undefined ? ` (${sign}${points}%)` : diff ? ` (${sign}${diff}%)` : '';
      return `${direction} ${placementName} adjustment ${fromVal}% → ${toVal}%${ptsStr}`;
    }
    if (points !== undefined) {
      return `${direction} ${placementName} adjustment by ${points}%`;
    }
    return `${direction} ${placementName} adjustment`;
  }

  return `Apply action ${actionType}`;
}

export function describeProjection(
  projection?: Projection | null,
  currencySymbol: string = '₹'
): string | null {
  if (!projection || !projection.monthly_equivalent) return null;
  const rounded = Math.round(projection.monthly_equivalent);
  return `≈ ${currencySymbol}${rounded.toLocaleString()} spent with no sales in 30 days at this rate`;
}

export function describeEvidence(
  recOrEvidence: Recommendation | Evidence,
  currencySymbol: string = '₹'
): Array<{ label: string; value: string }> {
  const metrics = 'evidence' in recOrEvidence ? recOrEvidence.evidence.metrics : recOrEvidence.metrics;
  if (!metrics) return [];

  const spend = metrics.spend !== undefined && metrics.spend !== null
    ? `${currencySymbol}${Number(metrics.spend).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : `${currencySymbol}0`;

  const clicks = metrics.clicks !== undefined && metrics.clicks !== null ? String(metrics.clicks) : '0';
  const orders = metrics.orders !== undefined && metrics.orders !== null ? String(metrics.orders) : '0';

  let acos = '—';
  if (metrics.acos !== null && metrics.acos !== undefined) {
    if (metrics.acos === Infinity || isNaN(metrics.acos)) {
      acos = '—';
    } else {
      acos = `${Math.round(metrics.acos)}%`;
    }
  }

  return [
    { label: 'Spend', value: spend },
    { label: 'Clicks', value: clicks },
    { label: 'Orders', value: orders },
    { label: 'ACOS', value: acos },
  ];
}

export function describeEvidenceSummary(
  recOrEvidence: Recommendation | Evidence,
  currencySymbol: string = '₹'
): string {
  const chips = describeEvidence(recOrEvidence, currencySymbol);
  return chips.map((c) => `${c.label} ${c.value}`).join(' · ');
}
