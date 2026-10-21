import { describe, it, expect } from 'vitest';
import {
  describeCondition,
  describeRuleAction,
  describeScopeBadge,
  getMetricUnitAdornment,
  describeConditionMatched,
  describeRecommendationAction,
  describeEvidence,
  describeEvidenceSummary,
  describeProjection,
} from '../describe';
import type { Meta, Condition, RuleAction, SuggestedAction, Recommendation } from '@/lib/types/recommendation';

const mockMetaINR: Meta = {
  date_filters: { LAST_30_DAYS: 'Last 30 Days' },
  metrics: {
    spend: { label: 'Spend', unit: 'money' },
    clicks: { label: 'Clicks', unit: 'count' },
    orders: { label: 'Orders', unit: 'count' },
    acos: { label: 'ACOS', unit: 'percent' },
    roas: { label: 'ROAS', unit: 'ratio' },
  },
  operators: {
    GTE: { label: 'Greater than or equal to', symbol: '≥' },
    LTE: { label: 'Less than or equal to', symbol: '≤' },
    GT: { label: 'Greater than', symbol: '>' },
    LT: { label: 'Less than', symbol: '<' },
    EQ: { label: 'Equal to', symbol: '=' },
  },
  affected_parameters: {
    SEARCH_TERM: { label: 'Search term', available: true },
    TARGETING: { label: 'Targeting', available: true },
  },
  actions: {
    SEARCH_TERM: {
      add_negative_search_term: {
        label: 'Add as Negative Targeting',
        params: { match_type: { type: 'enum', options: ['EXACT', 'PHRASE'] } },
      },
    },
    TARGETING: {
      decrease_bid: {
        label: 'Decrease bid',
        params: { percentage: { type: 'percent', min: 1, max: 90 } },
      },
      pause_target: {
        label: 'Pause targeting',
        params: {},
      },
    },
  },
  templates: [],
  limits: {
    max_conditions: 6,
    max_actions: 4,
    max_rules_per_account: 50,
    name_max: 100,
    max_open_per_rule: 200,
    cooldown_days: 7,
  },
  currency: { symbol: '₹', locale: 'en-IN', code: 'INR' },
};

const mockMetaUSD: Meta = {
  ...mockMetaINR,
  currency: { symbol: '$', locale: 'en-US', code: 'USD' },
};

describe('describe.ts helpers', () => {
  describe('Unit adornments for INR (₹) and USD ($)', () => {
    it('returns correct adornments for money metrics in INR', () => {
      expect(getMetricUnitAdornment('spend', mockMetaINR, '₹')).toBe('₹');
      expect(getMetricUnitAdornment('spend', null, '₹')).toBe('₹');
    });

    it('returns correct adornments for money metrics in USD', () => {
      expect(getMetricUnitAdornment('spend', mockMetaUSD, '$')).toBe('$');
      expect(getMetricUnitAdornment('cpc', null, '$')).toBe('$');
    });

    it('returns correct adornments for percent and ratio metrics', () => {
      expect(getMetricUnitAdornment('acos', mockMetaINR)).toBe('%');
      expect(getMetricUnitAdornment('roas', mockMetaINR)).toBe('×');
      expect(getMetricUnitAdornment('clicks', mockMetaINR)).toBe('');
    });
  });

  describe('describeCondition', () => {
    it('formats condition text in INR (₹)', () => {
      const cond: Condition = { metric: 'spend', op: 'GTE', value: 20 };
      expect(describeCondition(cond, mockMetaINR, '₹')).toBe('Spend ≥ ₹20');
    });

    it('formats condition text in USD ($)', () => {
      const cond: Condition = { metric: 'spend', op: 'GTE', value: 5 };
      expect(describeCondition(cond, mockMetaUSD, '$')).toBe('Spend ≥ $5');
    });

    it('formats percent and count conditions correctly', () => {
      const acosCond: Condition = { metric: 'acos', op: 'GT', value: 45 };
      expect(describeCondition(acosCond, mockMetaINR)).toBe('ACOS > 45%');

      const clicksCond: Condition = { metric: 'clicks', op: 'LT', value: 10 };
      expect(describeCondition(clicksCond, mockMetaINR)).toBe('Clicks < 10');
    });

    it('handles empty/null value gracefully', () => {
      const emptyCond: Condition = { metric: 'spend', op: 'LTE', value: null };
      expect(describeCondition(emptyCond, mockMetaINR)).toBe('Spend ≤ —');
    });
  });

  describe('describeRuleAction', () => {
    it('formats negative search term action with match type', () => {
      const action: RuleAction = {
        type: 'add_negative_search_term',
        params: { match_type: 'EXACT' },
      };
      expect(describeRuleAction(action, mockMetaINR)).toBe('Add as Negative Targeting · Exact');
    });

    it('formats decrease bid action with percentage', () => {
      const action: RuleAction = {
        type: 'decrease_bid',
        params: { percentage: 20 },
      };
      expect(describeRuleAction(action, mockMetaINR)).toBe('Decrease bid by 20%');
    });

    it('formats pause target action', () => {
      const action: RuleAction = {
        type: 'pause_target',
        params: {},
      };
      expect(describeRuleAction(action, mockMetaINR)).toBe('Pause');
    });

    it('formats increase budget action', () => {
      const action: RuleAction = {
        type: 'increase_budget',
        params: { percentage: 20 },
      };
      expect(describeRuleAction(action, mockMetaINR)).toBe('Increase daily budget by 20%');
    });

    it('formats placement adjustment actions', () => {
      const incAction: RuleAction = {
        type: 'INCREASE_PLACEMENT',
        params: { points: 25 },
      };
      expect(describeRuleAction(incAction, mockMetaINR)).toBe('Increase placement adjustment by 25%');

      const decAction: RuleAction = {
        type: 'DECREASE_PLACEMENT',
        params: { points: 15 },
      };
      expect(describeRuleAction(decAction, mockMetaINR)).toBe('Decrease placement adjustment by 15%');
    });
  });

  describe('describeScopeBadge', () => {
    it('formats ALL scope', () => {
      const badge = describeScopeBadge('ALL');
      expect(badge.label).toBe('All campaigns');
      expect(badge.mode).toBe('ALL');
    });

    it('formats INCLUDE scope with counts', () => {
      const badge = describeScopeBadge('INCLUDE', [101, 102, 103]);
      expect(badge.label).toBe('Include 3');
      expect(badge.count).toBe(3);
    });

    it('formats EXCLUDE scope with counts', () => {
      const badge = describeScopeBadge('EXCLUDE', [201, 202]);
      expect(badge.label).toBe('Exclude 2');
      expect(badge.count).toBe(2);
    });
  });

  describe('describeConditionMatched', () => {
    it('formats matched condition with actual vs threshold', () => {
      const matched = { metric: 'spend', op: 'GTE', threshold: 20, actual: 182 };
      expect(describeConditionMatched(matched, mockMetaINR, '₹')).toBe('Spend ₹182 ≥ ₹20 ✓');
    });
  });

  describe('describeRecommendationAction', () => {
    it('formats negative keyword sentence', () => {
      const action: SuggestedAction = {
        type: 'add_negative_search_term',
        params: { match_type: 'exact' },
      };
      const rec: Partial<Recommendation> = {
        entity_label: 'yoga mat cheap',
        ad_group_name: 'Ad group X',
      };
      expect(describeRecommendationAction(action, rec, '₹')).toBe(
        "Add 'yoga mat cheap' as a negative exact keyword in Ad group X"
      );
    });

    it('formats bid decrease sentence', () => {
      const action: SuggestedAction = {
        type: 'decrease_bid',
        params: { percentage: 20 },
        from: 6.0,
        to: 4.8,
      };
      expect(describeRecommendationAction(action, {}, '₹')).toBe(
        'Decrease bid ₹6.00 → ₹4.80 (−20%)'
      );
    });

    it('formats pause keyword sentence', () => {
      const action: SuggestedAction = {
        type: 'pause_keyword',
        params: {},
      };
      const rec: Partial<Recommendation> = {
        entity_label: 'cheap mat',
      };
      expect(describeRecommendationAction(action, rec, '₹')).toBe("Pause keyword 'cheap mat'");
    });

    it('formats budget increase sentence', () => {
      const action: SuggestedAction = {
        type: 'increase_budget',
        params: { percentage: 20 },
        from: 500,
        to: 600,
      };
      expect(describeRecommendationAction(action, {}, '₹')).toBe(
        'Increase daily budget ₹500 → ₹600 (+20%)'
      );
    });

    it('formats placement adjustment sentences', () => {
      const incAction: SuggestedAction = {
        type: 'INCREASE_PLACEMENT',
        params: { points: 25 },
        from: 0,
        to: 25,
      };
      const topRec: Partial<Recommendation> = { entity_label: 'Top of Search' };
      expect(describeRecommendationAction(incAction, topRec, '₹')).toBe(
        'Increase Top of Search adjustment 0% → 25% (+25%)'
      );

      const decAction: SuggestedAction = {
        type: 'DECREASE_PLACEMENT',
        params: { points: 20 },
        from: 50,
        to: 30,
      };
      const prodRec: Partial<Recommendation> = { entity_label: 'Product Pages' };
      expect(describeRecommendationAction(decAction, prodRec, '₹')).toBe(
        'Decrease Product Pages adjustment 50% → 30% (−20%)'
      );
    });
  });

  describe('describeEvidence and projection', () => {
    it('formats evidence chips correctly', () => {
      const evidence = {
        metrics: { spend: 120, clicks: 24, orders: 0, acos: null },
        matched: [],
        current: {},
      };
      const chips = describeEvidence(evidence, '₹');
      expect(chips).toEqual([
        { label: 'Spend', value: '₹120' },
        { label: 'Clicks', value: '24' },
        { label: 'Orders', value: '0' },
        { label: 'ACOS', value: '—' },
      ]);
      expect(describeEvidenceSummary(evidence, '₹')).toBe('Spend ₹120 · Clicks 24 · Orders 0 · ACOS —');
    });

    it('formats projection line correctly', () => {
      const projection = { days: 30, spend_in_period: 540, monthly_equivalent: 540 };
      expect(describeProjection(projection, '₹')).toBe(
        '≈ ₹540 spent with no sales in 30 days at this rate'
      );
    });
  });
});
