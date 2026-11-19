import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RuleForm, getDefaultActionForParam } from '../RuleForm';
import type { Meta } from '@/lib/types/recommendation';

const mockMeta: Meta = {
  date_filters: { LAST_30_DAYS: 'Last 30 Days', LAST_7_DAYS: 'Last 7 Days' },
  metrics: {
    spend: { label: 'Spend', unit: 'money' },
    clicks: { label: 'Clicks', unit: 'count' },
    orders: { label: 'Orders', unit: 'count' },
    acos: { label: 'ACOS', unit: 'percent' },
  },
  operators: {
    GTE: { label: 'Greater Than or Equal To', symbol: '≥' },
    LTE: { label: 'Less Than or Equal To', symbol: '≤' },
  },
  affected_parameters: {
    TARGETING: { label: 'Targeting', available: true },
    CAMPAIGN: { label: 'Campaign', available: true },
    SEARCH_TERM: { label: 'Search Term', available: true },
  },
  actions: {
    TARGETING: {
      INCREASE_BID: {
        label: 'Increase bid',
        params: { pct: { type: 'percent', default: 10, min: 1, max: 500 } },
      },
      DECREASE_BID: {
        label: 'Decrease bid',
        params: { pct: { type: 'percent', default: 10, min: 1, max: 90 } },
      },
    },
    CAMPAIGN: {
      INCREASE_BUDGET: {
        label: 'Increase daily budget',
        params: { pct: { type: 'percent', default: 10, min: 1, max: 500 } },
      },
      DECREASE_BUDGET: {
        label: 'Decrease daily budget',
        params: { pct: { type: 'percent', default: 10, min: 1, max: 90 } },
      },
    },
    SEARCH_TERM: {
      ADD_AS_NEGATIVE: {
        label: 'Add as Negative Targeting',
        params: {
          match_type: { type: 'enum', options: ['NEGATIVE_EXACT', 'NEGATIVE_PHRASE'], default: 'NEGATIVE_EXACT' },
          level: { type: 'enum', options: ['AD_GROUP', 'CAMPAIGN'], default: 'AD_GROUP' },
        },
      },
    },
  },
  templates: [],
  limits: {
    max_conditions: 6,
    max_actions: 4,
    max_rules_per_account: 50,
    name_max: 60,
    max_open_per_rule: 200,
    cooldown_days: 7,
  },
  currency: { symbol: '₹', locale: 'en-IN', code: 'INR' },
};

describe('RuleForm (R1.1 Fixes)', () => {
  it('derives default action from meta registry for each affected parameter', () => {
    const targetingDef = getDefaultActionForParam('TARGETING', mockMeta);
    expect(targetingDef.type).toBe('INCREASE_BID');
    expect(targetingDef.params).toEqual({ pct: 10 });

    const campaignDef = getDefaultActionForParam('CAMPAIGN', mockMeta);
    expect(campaignDef.type).toBe('INCREASE_BUDGET');
    expect(campaignDef.params).toEqual({ pct: 10 });

    const searchDef = getDefaultActionForParam('SEARCH_TERM', mockMeta);
    expect(searchDef.type).toBe('ADD_AS_NEGATIVE');
    expect(searchDef.params).toEqual({ match_type: 'NEGATIVE_EXACT', level: 'AD_GROUP' });
  });

  it('defaults new form to TARGETING and first allowed action INCREASE_BID', () => {
    render(
      <RuleForm
        adsAccountId={12}
        existingRules={[]}
        meta={mockMeta}
        currencySymbol="₹"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
        onSubmit={vi.fn()}
      />
    );

    const paramSelect = screen.getByLabelText(/Affected Parameter/i) as HTMLSelectElement;
    expect(paramSelect.value).toBe('TARGETING');

    // Action should be INCREASE_BID
    expect(screen.getByText(/Increase bid/i)).toBeDefined();
  });

  it('resets action to parameter default when affected parameter changes', async () => {
    render(
      <RuleForm
        adsAccountId={12}
        existingRules={[]}
        meta={mockMeta}
        currencySymbol="₹"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
        onSubmit={vi.fn()}
      />
    );

    const paramSelect = screen.getByLabelText(/Affected Parameter/i) as HTMLSelectElement;

    // Change to CAMPAIGN
    fireEvent.change(paramSelect, { target: { value: 'CAMPAIGN' } });

    // Confirm dialog appears because actions had an initial action
    const confirmBtn = screen.getByRole('button', { name: /Change & Clear Actions/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(paramSelect.value).toBe('CAMPAIGN');
      expect(screen.getByText(/Increase daily budget/i)).toBeDefined();
    });

    // Change to SEARCH_TERM
    fireEvent.change(paramSelect, { target: { value: 'SEARCH_TERM' } });
    const confirmBtn2 = screen.getByRole('button', { name: /Change & Clear Actions/i });
    fireEvent.click(confirmBtn2);

    await waitFor(() => {
      expect(paramSelect.value).toBe('SEARCH_TERM');
      expect(screen.getByText(/Add as Negative Targeting/i)).toBeDefined();
    });
  });

  it('submits a valid payload matching backend schema for preview and creation', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({ rule: {} });

    render(
      <RuleForm
        adsAccountId={12}
        existingRules={[]}
        meta={mockMeta}
        currencySymbol="₹"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
        onSubmit={handleSubmit}
      />
    );

    // Enter name
    const nameInput = screen.getByPlaceholderText(/e\.g\. Pause zero-order search terms/i);
    fireEvent.change(nameInput, { target: { value: 'Valid Test Rule' } });

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Save Rule/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.name).toBe('Valid Test Rule');
    expect(payload.affected_parameter).toBe('TARGETING');
    expect(payload.actions[0].type).toBe('INCREASE_BID');
    expect(payload.actions[0].params).toEqual({ pct: 10 });
    expect(payload.conditions[0].metric).toBe('spend');
    expect(payload.conditions[0].op).toBe('GTE');
  });

  it('enforces single action for TARGETING rules (Add Action button not shown)', () => {
    render(
      <RuleForm
        adsAccountId={12}
        existingRules={[]}
        meta={mockMeta}
        currencySymbol="₹"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
        onSubmit={vi.fn()}
      />
    );

    // "Add Action" button should not be present because TARGETING only permits 1 action
    expect(screen.queryByRole('button', { name: /Add Action/i })).toBeNull();
  });

  it('renders display-only notice and submits empty actions when out_of_budget_days is present', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({ rule: {} });

    render(
      <RuleForm
        adsAccountId={12}
        existingRules={[]}
        initialDraft={{
          name: 'Campaign OOB Watcher',
          affected_parameter: 'CAMPAIGN',
          conditions: [{ metric: 'out_of_budget_days', op: 'GTE', value: 3 }],
          actions: [],
        }}
        meta={mockMeta}
        currencySymbol="₹"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        isSaving={false}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByText(/Display-Only Rule/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Add Action/i })).toBeNull();

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Save Rule/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.actions).toEqual([]);
    expect(payload.conditions[0].metric).toBe('out_of_budget_days');
  });
});
