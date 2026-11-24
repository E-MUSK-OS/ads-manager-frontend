import React, { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RulePreview } from '../RulePreview';
import { RuleTable } from '../RuleTable';
import { RecommendationCard } from '../RecommendationCard';
import { OutcomeModal } from '../OutcomeModal';
import * as recommendationsApi from '@/lib/recommendations-api';
import type { Rule, RuleDraft, Meta, Recommendation } from '@/lib/types/recommendation';

const mockMeta: Meta = {
  date_filters: { LAST_30_DAYS: 'Last 30 Days' },
  metrics: {
    spend: { label: 'Spend', unit: 'money' },
    orders: { label: 'Purchases (7d)', unit: 'count' },
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
        params: { mode: { type: 'enum', default: 'percent' }, value: { type: 'percent', default: 20 } },
      },
    },
  },
  templates: [],
  limits: {
    max_conditions: 5,
    max_actions: 1,
    max_rules_per_account: 20,
    name_max: 100,
    max_open_per_rule: 200,
    cooldown_days: 7,
  },
  currency: { symbol: '₹', locale: 'en-IN', code: 'INR' },
};

describe('Phase N5 Extras (Q12, Q13, Q14, Q16, Q17, Q19)', () => {
  it('Q14 & Q16: RulePreview displays server warnings and backtest card', async () => {
    vi.spyOn(recommendationsApi, 'previewRule').mockResolvedValueOnce({
      match_count: 3,
      evaluated_entities: 50,
      sample: [
        {
          id: 101,
          label: 'running shoes',
          metrics: { spend: 450, orders: 0 },
          suggested_actions: [{ type: 'DECREASE_BID', from: 15, to: 12 }],
        },
      ],
      funnel: {
        entities_in_scope: 50,
        enabled_campaigns_count: 5,
        total_campaigns_count: 5,
        excluded_campaign_not_enabled: 0,
        excluded_target_not_enabled: 0,
        no_traffic: 0,
        below_min_clicks: 0,
        conditions: [],
        skipped_bid_unknown: 0,
        skipped_already_at_limit: 0,
        skipped_no_target_acos: 0,
        final_candidates: 3,
        suppressed_already_open: 0,
        suppressed_cooldown: 0,
        suppressed: 0,
        created_open: 3,
        date_window: { start: '2026-10-20', end: '2026-11-19', days: 30, label: '30d' },
        evaluated_at: '2026-11-19T00:00:00Z',
        config_status_text: 'Preview: 3 matches',
      },
      warnings: [
        'Contradiction detected: conditions for orders cannot be simultaneously satisfied',
        'Overlap warning: rule shares scope with active rule "Bleeding Targets"',
      ],
      backtest: {
        eligible: true,
        matched_count: 2,
        next_7d_spend: 320.5,
        next_7d_orders: 4,
        next_7d_sales: 1200.0,
      },
    });

    const draft: RuleDraft = {
      name: 'Test Rule',
      affected_parameter: 'TARGETING',
      date_filter: 'LAST_30_DAYS',
      min_clicks: 10,
      conditions: [{ metric: 'spend', op: 'GTE', value: 100 }],
      actions: [{ type: 'DECREASE_BID', params: { mode: 'percent', value: 20 } }],
      scope_mode: 'ALL',
      campaign_ids: [],
    };

    render(
      <RulePreview
        adsAccountId={12}
        ruleDraft={draft}
        meta={mockMeta}
        currencySymbol="₹"
      />
    );

    // Verify warnings rendered
    await waitFor(() => {
      expect(screen.getByText('Rule Warnings')).toBeDefined();
      expect(
        screen.getByText(/Contradiction detected: conditions for orders/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Overlap warning: rule shares scope/i)
      ).toBeDefined();
    });

    // Verify backtest rendered
    expect(screen.getByText(/Backtest \(If Run 7 Days Ago\)/i)).toBeDefined();
    expect(screen.getByText(/₹320.50/)).toBeDefined();
    expect(screen.getByText(/4 purchases/i)).toBeDefined();
  });

  it('Q17: RuleTable provides Run now and Clone actions', async () => {
    const mockRule: Rule = {
      id: 99,
      name: 'High ACOS Keywords',
      affected_parameter: 'TARGETING',
      date_filter: 'LAST_30_DAYS',
      min_clicks: 10,
      conditions: [{ metric: 'spend', op: 'GTE', value: 50 }],
      actions: [{ type: 'DECREASE_BID', params: { mode: 'percent', value: 15 } }],
      scope_mode: 'ALL',
      campaign_ids: [],
      is_active: true,
      last_run_at: '2026-11-19T00:00:00Z',
      last_match_count: 5,
      open_count: 3,
    };

    const onRunNow = vi.fn().mockResolvedValue(undefined);
    const onCloneRule = vi.fn().mockResolvedValue(undefined);

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
        onRunNow={onRunNow}
        onCloneRule={onCloneRule}
      />
    );

    const runBtn = screen.getByTitle('Run now');
    const cloneBtn = screen.getByTitle('Clone rule');

    expect(runBtn).toBeDefined();
    expect(cloneBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(runBtn);
    });
    expect(onRunNow).toHaveBeenCalledWith(mockRule);

    await act(async () => {
      fireEvent.click(cloneBtn);
    });
    expect(onCloneRule).toHaveBeenCalledWith(mockRule);
  });

  it('Q17: RecommendationCard supports Snooze for 7/14/30 days', async () => {
    const mockRec: Recommendation = {
      id: 10,
      ads_account_id: 12,
      rule_id: 99,
      rule_name: 'High ACOS Keywords',
      source: 'RULE',
      affected_parameter: 'TARGETING',
      entity_type: 'target',
      entity_id: 501,
      entity_label: 'wireless headphones',
      campaign_id: 1,
      campaign_name: 'Audio Campaign',
      ad_group_id: 1,
      ad_group_name: 'Headphones',
      evidence: {
        metrics: { spend: 320, orders: 1 },
        matched: [],
        current: {},
        snoozed_until: null,
      },
      suggested_actions: [{ type: 'DECREASE_BID', params: { pct: 20 }, from: 20, to: 16 }],
      status: 'OPEN',
      dedupe_key: 'target:501:bid',
      created_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null,
    };

    const onSnooze = vi.fn().mockResolvedValue(undefined);

    render(
      <RecommendationCard
        rec={mockRec}
        meta={mockMeta}
        currencySymbol="₹"
        isSelected={false}
        isProcessing={false}
        isStale={false}
        onToggleSelect={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={onSnooze}
        onReopen={vi.fn()}
        onReanalyse={vi.fn()}
      />
    );

    const snoozeBtn = screen.getByRole('button', { name: /snooze/i });
    expect(snoozeBtn).toBeDefined();
    fireEvent.click(snoozeBtn);

    // Check popover options
    expect(screen.getByText('7 days')).toBeDefined();
    expect(screen.getByText('14 days')).toBeDefined();
    expect(screen.getByText('30 days')).toBeDefined();

    fireEvent.click(screen.getByText('14 days'));
    expect(onSnooze).toHaveBeenCalledWith(10, 14);
  });

  it('Q17 & Q19: RecommendationCard renders Undo and Outcome buttons on APPLIED recommendation', async () => {
    const mockRec: Recommendation = {
      id: 20,
      ads_account_id: 12,
      rule_id: 99,
      rule_name: 'High ACOS Keywords',
      source: 'RULE',
      affected_parameter: 'TARGETING',
      entity_type: 'target',
      entity_id: 501,
      entity_label: 'wireless headphones',
      campaign_id: 1,
      campaign_name: 'Audio Campaign',
      ad_group_id: 1,
      ad_group_name: 'Headphones',
      evidence: {
        metrics: { spend: 320, orders: 1 },
        matched: [],
        current: {},
      },
      suggested_actions: [{ type: 'DECREASE_BID', params: { pct: 20 }, from: 20, to: 16 }],
      status: 'APPLIED',
      dedupe_key: 'target:501:bid',
      created_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      resolved_by: 1,
    };

    const onUndo = vi.fn().mockResolvedValue(undefined);
    const onViewOutcome = vi.fn();

    render(
      <RecommendationCard
        rec={mockRec}
        meta={mockMeta}
        currencySymbol="₹"
        isSelected={false}
        isProcessing={false}
        isStale={false}
        onToggleSelect={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        onUndo={onUndo}
        onViewOutcome={onViewOutcome}
        onReopen={vi.fn()}
        onReanalyse={vi.fn()}
      />
    );

    const outcomeBtn = screen.getByRole('button', { name: /outcome/i });
    const undoBtn = screen.getByRole('button', { name: /undo/i });

    expect(outcomeBtn).toBeDefined();
    expect(undoBtn).toBeDefined();

    fireEvent.click(outcomeBtn);
    expect(onViewOutcome).toHaveBeenCalledWith(20);

    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledWith(20);
  });

  it('Q19: OutcomeModal displays before/after metrics and mandatory disclaimer note', async () => {
    vi.spyOn(recommendationsApi, 'getRecommendationOutcome').mockResolvedValueOnce({
      eligible: true,
      recommendation_id: 20,
      applied_at: '2026-11-12T10:00:00Z',
      before_window: { start: '2026-11-05', end: '2026-11-11', days: 7 },
      after_window: { start: '2026-11-12', end: '2026-11-18', days: 7 },
      before: {
        spend: 500.0,
        orders: 5,
        sales: 2500.0,
        acos: 20.0,
        clicks: 100,
        impressions: 2000,
        cpc: 5.0,
        ctr: 5.0,
        cvr: 5.0,
      },
      after: {
        spend: 400.0,
        orders: 6,
        sales: 3000.0,
        acos: 13.3,
        clicks: 90,
        impressions: 2100,
        cpc: 4.44,
        ctr: 4.29,
        cvr: 6.67,
      },
      delta: {
        spend_diff: -100.0,
        spend_change_pct: -20.0,
        orders_diff: 1,
        orders_change_pct: 20.0,
        sales_diff: 500.0,
        sales_change_pct: 20.0,
        acos_diff: -6.7,
      },
      disclaimer: 'Before/after comparison, not proof of cause',
    });

    render(
      <OutcomeModal
        open={true}
        onClose={vi.fn()}
        recommendationId={20}
        currencySymbol="₹"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Performance Outcome (7d Before vs 7d After)')).toBeDefined();
      expect(screen.getByText(/₹500.00/)).toBeDefined();
      expect(screen.getByText(/₹400.00/)).toBeDefined();
      expect(screen.getByText(/₹2500.00/)).toBeDefined();
      expect(screen.getByText(/₹3000.00/)).toBeDefined();
      expect(
        screen.getByText(/Before\/after comparison, not proof of cause/i)
      ).toBeDefined();
    });
  });
});
