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
    if (metric.includes('_share') || metric.endsWith('_pct') || metric.includes('acos') || metric.includes('ctr') || metric.includes('cvr')) {
      return '%';
    }
    if (metric.includes('roas')) {
      return '×';
    }
    if (metric.includes('spend') || metric.includes('cpc') || metric.includes('revenue') || metric.includes('bid')) {
      return currencySymbol;
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
    const formatted = val.toLocaleString("en-IN", {
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
  return val.toLocaleString("en-IN");
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

  if (condition.metric === 'acos_vs_target') {
    const sign = condition.value > 0 ? `+${condition.value}` : `${condition.value}`;
    const offsetStr = condition.value !== 0 ? ` (${sign}%)` : '';
    return `ACOS ${opSymbol} Target ACOS${offsetStr}`;
  }
  if (condition.metric === 'out_of_budget_days') {
    return `Out of budget ${opSymbol} ${condition.value} days`;
  }
  if (condition.metric === 'entity_age_days') {
    return `Entity age ${opSymbol} ${condition.value} days`;
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

  if (matched.metric === 'acos_vs_target') {
    return `ACOS ${actualFormatted} ${opSymbol} Target ACOS threshold ${threshFormatted} ✓`;
  }
  if (matched.metric === 'out_of_budget_days') {
    return `Out of budget ${matched.actual ?? 0}d ${opSymbol} ${matched.threshold}d ✓`;
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

  if (actionType === 'ADD_AS_NEGATIVE') {
    const rawMatch = action.params?.match_type ? String(action.params.match_type).toUpperCase() : 'NEGATIVE_EXACT';
    const matchTypeTitle = rawMatch.includes('PHRASE') ? 'Phrase' : 'Exact';
    return `Add as Negative Targeting · ${matchTypeTitle}`;
  }

  if (actionType === 'PAUSE_TARGET' || actionType === 'PAUSE_CAMPAIGN') {
    return 'Pause';
  }

  if (actionType === 'ENABLE_CAMPAIGN') {
    return 'Enable campaign';
  }

  if (actionType === 'SET_BUDGET') {
    const val = action.params?.value;
    return val !== undefined && val !== null ? `Set daily budget to ${currencySymbol}${val}` : 'Set daily budget';
  }

  if (actionType === 'DECREASE_BID' || actionType === 'INCREASE_BID') {
    const direction = actionType === 'DECREASE_BID' ? 'Decrease' : 'Increase';
    if (action.params?.mode === 'amount') {
      const amount = action.params?.value;
      return amount !== undefined && amount !== null ? `${direction} bid by ${currencySymbol}${amount}` : `${direction} bid`;
    }
    const pct = action.params?.pct ?? action.params?.value ?? action.params?.percentage;
    return pct !== undefined && pct !== null ? `${direction} bid by ${pct}%` : `${direction} bid`;
  }

  if (actionType === 'INCREASE_BUDGET' || actionType === 'DECREASE_BUDGET') {
    const direction = actionType === 'INCREASE_BUDGET' ? 'Increase' : 'Decrease';
    if (action.params?.mode === 'amount') {
      const amount = action.params?.value;
      return amount !== undefined && amount !== null ? `${direction} daily budget by ${currencySymbol}${amount}` : `${direction} daily budget`;
    }
    const pct = action.params?.pct ?? action.params?.value ?? action.params?.percentage;
    return pct !== undefined && pct !== null ? `${direction} daily budget by ${pct}%` : `${direction} daily budget`;
  }

  if (actionType === 'INCREASE_PLACEMENT' || actionType === 'DECREASE_PLACEMENT') {
    const points = action.params?.points;
    const direction = actionType === 'INCREASE_PLACEMENT' ? 'Increase' : 'Decrease';
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

  if (actionType === 'ADD_AS_NEGATIVE') {
    const rawMatch = (action.params?.match_type as string)?.toUpperCase() || 'NEGATIVE_EXACT';
    const matchType = rawMatch.includes('PHRASE') ? 'phrase' : 'exact';
    let loc = '';
    if (adGroupName) {
      loc = adGroupName.toLowerCase().startsWith('ad group') ? `in ${adGroupName}` : `in Ad group ${adGroupName}`;
    } else if (campaignName) {
      loc = campaignName.toLowerCase().startsWith('campaign') ? `in ${campaignName}` : `in Campaign ${campaignName}`;
    }
    return `Add '${entityLabel}' as a negative ${matchType} keyword${loc ? ' ' + loc : ''}`;
  }

  if (actionType === 'PAUSE_TARGET') {
    return `Pause keyword '${entityLabel}'`;
  }

  if (actionType === 'PAUSE_CAMPAIGN') {
    return `Pause campaign '${campaignName || entityLabel}'`;
  }

  if (actionType === 'ENABLE_CAMPAIGN') {
    return `Enable campaign '${campaignName || entityLabel}'`;
  }

  if (actionType === 'SET_BUDGET') {
    const fromVal = action.from as number | undefined;
    const toVal = action.to as number | undefined;
    if (fromVal !== undefined && toVal !== undefined) {
      return `Set daily budget ${currencySymbol}${Math.round(fromVal)} → ${currencySymbol}${Math.round(toVal)}`;
    }
    return `Set daily budget to ${currencySymbol}${action.to}`;
  }

  if (actionType === 'DECREASE_BID' || actionType === 'INCREASE_BID') {
    const fromVal = action.from as number | undefined;
    const toVal = action.to as number | undefined;
    const direction = actionType === 'DECREASE_BID' ? 'Decrease' : 'Increase';
    const sign = actionType === 'DECREASE_BID' ? '−' : '+';
    const isAmount = action.params?.mode === 'amount';
    const val = action.params?.value ?? action.params?.pct ?? action.params?.percentage;

    if (fromVal !== undefined && toVal !== undefined) {
      const deltaStr = val !== undefined ? (isAmount ? ` (${sign}${currencySymbol}${val})` : ` (${sign}${val}%)`) : '';
      return `${direction} bid ${currencySymbol}${fromVal.toFixed(2)} → ${currencySymbol}${toVal.toFixed(2)}${deltaStr}`;
    }
    if (val !== undefined) {
      return isAmount ? `${direction} bid by ${currencySymbol}${val}` : `${direction} bid by ${val}%`;
    }
    return `${direction} bid`;
  }

  if (actionType === 'INCREASE_BUDGET' || actionType === 'DECREASE_BUDGET') {
    const fromVal = action.from as number | undefined;
    const toVal = action.to as number | undefined;
    const direction = actionType === 'INCREASE_BUDGET' ? 'Increase' : 'Decrease';
    const sign = actionType === 'INCREASE_BUDGET' ? '+' : '−';
    const isAmount = action.params?.mode === 'amount';
    const val = action.params?.value ?? action.params?.pct ?? action.params?.percentage;

    if (fromVal !== undefined && toVal !== undefined) {
      const deltaStr = val !== undefined ? (isAmount ? ` (${sign}${currencySymbol}${val})` : ` (${sign}${val}%)`) : '';
      return `${direction} daily budget ${currencySymbol}${Math.round(fromVal)} → ${currencySymbol}${Math.round(toVal)}${deltaStr}`;
    }
    if (val !== undefined) {
      return isAmount ? `${direction} daily budget by ${currencySymbol}${val}` : `${direction} daily budget by ${val}%`;
    }
    return `${direction} daily budget`;
  }

  if (actionType === 'INCREASE_PLACEMENT' || actionType === 'DECREASE_PLACEMENT') {
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
  return `≈ ${currencySymbol}${rounded.toLocaleString("en-IN")} spent with no sales in 30 days at this rate`;
}

export function describeEvidence(
  recOrEvidence: Recommendation | Evidence,
  currencySymbol: string = '₹'
): Array<{ label: string; value: string }> {
  const metrics = 'evidence' in recOrEvidence ? recOrEvidence.evidence.metrics : recOrEvidence.metrics;
  if (!metrics) return [];

  const spend = metrics.spend !== undefined && metrics.spend !== null
    ? `${currencySymbol}${Number(metrics.spend).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
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
    { label: 'Purchases (7d)', value: orders },
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
