import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RuleTable } from '../RuleTable';
import { RulePreview } from '../RulePreview';
import type { Rule, RuleDraft, Meta } from '@/lib/types/recommendation';
import * as recommendationsApi from '@/lib/recommendations-api';

const mockMeta: Meta = {
  date_filters: { LAST_30_DAYS: 'Last 30 Days' },
  metrics: {
    spend: { label: 'Spend', unit: 'money' },
    orders: { label: 'Orders', unit: 'count' },
  },
  operators: {
    GTE: { label: 'Greater Than or Equal To', symbol: '≥' },
    LTE: { label: 'Less Than or Equal To', symbol: '≤' },
  },
  affected_parameters: {
    TARGETING: { label: 'Targeting', available: true },
  },
  actions: {
    TARGETING: {
      DECREASE_BID: {
        label: 'Decrease bid',
        params: { pct: { type: 'percent', default: 20, min: 1, max: 90 } },
      },
    },
  },
  templates: [],
  limits: {
    max_conditions: 5,
    max_actions: 2,
    max_rules_per_account: 20,
    name_max: 100,
    max_open_per_rule: 200,
    cooldown_days: 7,
  },
  currency: { symbol: '₹', locale: 'en-IN', code: 'INR' },
};

describe('Rule Funnel (Phase R2)', () => {
  it('renders status text from stored last_funnel in RuleTable', () => {
    const mockRule: Rule = {
      id: 42,
      name: 'Bleeding Targets Rule',
      affected_parameter: 'TARGETING',
      date_filter: 'LAST_30_DAYS',
      min_clicks: 10,
      conditions: [{ metric: 'spend', op: 'GTE', value: 100 }],
      actions: [{ type: 'DECREASE_BID', params: { pct: 20 } }],
      is_active: true,
      scope_mode: 'ALL',
      campaign_ids: [],
      last_run_at: '2026-11-18T11:15:00Z',
      last_match_count: 0,
      open_count: 0,
      last_funnel: {
        entities_in_scope: 96,
        enabled_campaigns_count: 9,
        total_campaigns_count: 9,
        excluded_campaign_not_enabled: 0,
        excluded_target_not_enabled: 0,
        no_traffic: 0,
        below_min_clicks: 0,
        conditions: [
          { index: 0, metric: 'spend', op: 'GTE', threshold: 100, passed: 25, failed: 71 },
          { index: 1, metric: 'orders', op: 'LTE', threshold: 0, passed: 0, failed: 25 },
        ],
        skipped_bid_unknown: 0,
        skipped_already_at_limit: 0,
        skipped_no_target_acos: 0,
        final_candidates: 0,
        suppressed_already_open: 0,
        suppressed_cooldown: 0,
        suppressed: 0,
        created_open: 0,
        date_window: { start: '2026-11-11', end: '2026-11-17', days: 7, label: '11 - 17 Nov 2026' },
        evaluated_at: '2026-11-18T16:45:00+05:30',
        config_status_text: 'Evaluated 18 Nov, 16:45 IST: 0 recommendations — 25 of 96 targets passed spend, none passed orders (11 - 17 Nov 2026)',
      },
    };

    render(
      <RuleTable
        rules={[mockRule]}
        meta={mockMeta}
        currencySymbol="₹"
        selectedIds={new Set()}
        onToggleSelectRow={vi.fn()}
        onSelectAll={vi.fn()}
        onClearSelection={vi.fn()}
        onToggleActive={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
        onAssignScope={vi.fn()}
        onBrowseTemplates={vi.fn()}
        onBuildCustom={vi.fn()}
        onBulkAction={vi.fn()}
        onExportSelected={vi.fn()}
      />
    );

    expect(screen.getByText('Bleeding Targets Rule')).toBeDefined();
    expect(
      screen.getByText('Evaluated 18 Nov, 16:45 IST: 0 recommendations — 25 of 96 targets passed spend, none passed orders (11 - 17 Nov 2026)')
    ).toBeDefined();
  });

  it('renders summary text and tip in RulePreview when preview API returns funnel', async () => {
    const draft: RuleDraft = {
      name: 'Bleeding Draft',
      affected_parameter: 'TARGETING',
      date_filter: 'LAST_30_DAYS',
      min_clicks: 50,
      conditions: [
        { metric: 'spend', op: 'GTE', value: 100 },
        { metric: 'orders', op: 'LTE', value: 0 },
      ],
      actions: [{ type: 'DECREASE_BID', params: { pct: 20 } }],
    };

    vi.spyOn(recommendationsApi, 'previewRule').mockResolvedValue({
      match_count: 0,
      evaluated_entities: 96,
      sample: [],
      funnel: {
        entities_in_scope: 96,
        enabled_campaigns_count: 9,
        total_campaigns_count: 9,
        excluded_campaign_not_enabled: 0,
        excluded_target_not_enabled: 0,
        no_traffic: 0,
        below_min_clicks: 0,
        conditions: [
          { index: 0, metric: 'spend', op: 'GTE', threshold: 100, passed: 25, failed: 71 },
          { index: 1, metric: 'orders', op: 'LTE', threshold: 0, passed: 0, failed: 25 },
        ],
        skipped_bid_unknown: 0,
        skipped_already_at_limit: 0,
        skipped_no_target_acos: 0,
        final_candidates: 0,
        suppressed_already_open: 0,
        suppressed_cooldown: 0,
        suppressed: 0,
        created_open: 0,
        date_window: { start: '2026-11-11', end: '2026-11-17', days: 7, label: '11 - 17 Nov 2026' },
        evaluated_at: '2026-11-18T16:45:00+05:30',
        summary_text: '0 items match right now. 96 targets in 9 enabled campaigns; 25 spent at least ₹100; none of those had orders = 0 and 50+ clicks.',
        tip: 'Lower the click condition or widen the date range.',
      },
    });

    render(
      <RulePreview
        adsAccountId={12}
        ruleDraft={draft}
        currencySymbol="₹"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('0 items match right now')).toBeDefined();
    });

    expect(
      screen.getByText('0 items match right now. 96 targets in 9 enabled campaigns; 25 spent at least ₹100; none of those had orders = 0 and 50+ clicks.')
    ).toBeDefined();

    expect(
      screen.getByText('Lower the click condition or widen the date range.')
    ).toBeDefined();
  });
});
