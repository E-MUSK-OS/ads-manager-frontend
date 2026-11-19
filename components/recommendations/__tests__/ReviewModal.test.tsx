import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewModal } from '../ReviewModal';
import type { Recommendation } from '@/lib/types/recommendation';

describe('ReviewModal (Phase N4 / Advertise IQ Parity)', () => {
  const mockRec1: Recommendation = {
    id: 101,
    ads_account_id: 1,
    rule_id: 1,
    rule_name: 'High ACOS Bid Reduction',
    source: 'RULE',
    affected_parameter: 'TARGETING',
    entity_type: 'target',
    entity_id: 501,
    entity_label: 'wireless headphones',
    campaign_id: 10,
    campaign_name: 'Audio Campaign',
    ad_group_id: 20,
    ad_group_name: 'Audio AG',
    evidence: {
      metrics: { spend: 1500, orders: 2, clicks: 45, acos: 65 },
      matched: [],
      current: { bid: 25.0, state: 'ENABLED', match_type: 'EXACT' },
      confidence: { clicks: 45, reference_cvr: 0.05, p_value: 0.02, level: 'HIGH', label: 'Strong evidence' },
      date_window: { start: '2026-11-10', end: '2026-11-17', days: 7, label: 'Last 7 days' },
    },
    suggested_actions: [
      { type: 'DECREASE_BID', params: { pct: 15 }, from: 25.0, to: 21.25 },
    ],
    status: 'OPEN',
    dedupe_key: 'r:101',
    created_at: new Date().toISOString(), // Recent -> NEW tag
    resolved_at: null,
    resolved_by: null,
  };

  const mockRec2: Recommendation = {
    id: 102,
    ads_account_id: 1,
    rule_id: 2,
    rule_name: 'Bleeding Target Pauser',
    source: 'RULE',
    affected_parameter: 'TARGETING',
    entity_type: 'target',
    entity_id: 501, // Same entity -> conflicting!
    entity_label: 'wireless headphones',
    campaign_id: 10,
    campaign_name: 'Audio Campaign',
    ad_group_id: 20,
    ad_group_name: 'Audio AG',
    evidence: {
      metrics: { spend: 2100, orders: 0, clicks: 60 },
      matched: [],
      current: { bid: 25.0, state: 'ENABLED', match_type: 'EXACT' },
      confidence: { clicks: 60, reference_cvr: 0.05, p_value: 0.01, level: 'HIGH', label: 'Strong evidence' },
      date_window: { start: '2026-11-10', end: '2026-11-17', days: 7, label: 'Last 7 days' },
    },
    suggested_actions: [
      { type: 'PAUSE_TARGET', params: {}, from: 'ENABLED', to: 'PAUSED' },
    ],
    status: 'OPEN',
    dedupe_key: 'r:102',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // > 24h ago -> OLD tag
    resolved_at: null,
    resolved_by: null,
    conflicts_with: [101],
  };

  const mockRec3: Recommendation = {
    id: 103,
    ads_account_id: 1,
    rule_id: 3,
    rule_name: 'Scale Winning Campaign',
    source: 'RULE',
    affected_parameter: 'CAMPAIGN',
    entity_type: 'campaign',
    entity_id: 12,
    entity_label: 'Bestseller Electronics',
    campaign_id: 12,
    campaign_name: 'Bestseller Electronics',
    ad_group_id: null,
    ad_group_name: null,
    evidence: {
      metrics: { spend: 800, orders: 15, clicks: 120, acos: 18.5 },
      matched: [],
      current: { daily_budget: 500.0, state: 'ENABLED' },
      date_window: { start: '2026-11-10', end: '2026-11-17', days: 7, label: 'Last 7 days' },
    },
    suggested_actions: [
      { type: 'INCREASE_BUDGET', params: { mode: 'amount', value: 100 }, from: 500.0, to: 600.0 },
    ],
    status: 'OPEN',
    dedupe_key: 'r:103',
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolved_by: null,
  };

  it('renders review table with reference tool columns, tags, and metrics', () => {
    render(
      <ReviewModal
        open={true}
        onClose={vi.fn()}
        selectedRecs={[mockRec1]}
        currencySymbol="₹"
        onApply={vi.fn()}
        isApplying={false}
      />
    );

    // Modal title & subtitle
    expect(screen.getByText('Review & Apply Recommendations')).toBeDefined();
    expect(screen.getByText('1 selected')).toBeDefined();

    // NEW tag (created_at is recent)
    expect(screen.getByText('NEW')).toBeDefined();

    // Campaign and target info
    expect(screen.getAllByText('Audio Campaign').length).toBeGreaterThan(0);
    expect(screen.getByText('wireless headphones')).toBeDefined();
    expect(screen.getByText('Ad group: Audio AG')).toBeDefined();

    // Match type
    expect(screen.getByText('EXACT')).toBeDefined();

    // Old -> New comparison
    expect(screen.getByText('₹25.00')).toBeDefined();
    expect(screen.getByText('₹21.25')).toBeDefined();
    expect(screen.getByText('Delta: -₹3.75')).toBeDefined();

    // Spend, Purchases, ACOS
    expect(screen.getAllByText('₹1500.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // purchases
    expect(screen.getByText('65.0%')).toBeDefined(); // ACOS

    // History link
    expect(screen.getAllByText('History').length).toBeGreaterThan(0);

    // Apply button
    const applyBtn = screen.getByRole('button', { name: /Apply \(1\) to Amazon/i }) as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(false);
  });

  it('Q15: renders impact figures with labelled 30d estimate for zero-order rules and budget delta', () => {
    render(
      <ReviewModal
        open={true}
        onClose={vi.fn()}
        selectedRecs={[mockRec2, mockRec3]}
        currencySymbol="₹"
        onApply={vi.fn()}
        isApplying={false}
      />
    );

    // mockRec2 has orders = 0, spend = 2100 over 7 days -> 30d estimate = (2100/7)*30 = 9000
    expect(screen.getByText(/Spend at this rate: ₹9000\.00 per 30 days/i)).toBeDefined();
    expect(screen.getAllByText('Estimate').length).toBeGreaterThan(0);

    // mockRec3 has budget change from 500 to 600 -> +₹100.00/day
    expect(screen.getByText(/Budget delta: \+₹100\.00\/day/i)).toBeDefined();

    // Summary Card
    expect(screen.getByText('Spend at Stake')).toBeDefined();
    expect(screen.getAllByText('Purchases (7d)').length).toBeGreaterThan(0);
    expect(screen.getByText('Net Daily Budget Delta')).toBeDefined();
    expect(screen.getByText('Bleeding 30d Run-Rate')).toBeDefined();
    expect(screen.getByText('+₹100.00/day')).toBeDefined();
    expect(screen.getByText('₹9000.00')).toBeDefined();

    // OLD tag for mockRec2 (>24h old)
    expect(screen.getByText('OLD')).toBeDefined();
  });

  it('Q20: defaults ranking by spend at stake descending and toggles sort', () => {
    // mockRec1 spend: 1500, mockRec2 spend: 2100, mockRec3 spend: 800
    render(
      <ReviewModal
        open={true}
        onClose={vi.fn()}
        selectedRecs={[mockRec1, mockRec2, mockRec3]}
        currencySymbol="₹"
        onApply={vi.fn()}
        isApplying={false}
      />
    );

    const spendCells = screen.getAllByText(/₹(2100|1500|800)\.00/);
    // Highest spend first (2100 before 1500 before 800)
    expect(spendCells[0].textContent).toContain('2100');

    // Click Spend header to toggle ascending
    const spendHeader = screen.getByText('Spend');
    fireEvent.click(spendHeader);

    const updatedSpendCells = screen.getAllByText(/₹(2100|1500|800)\.00/);
    expect(updatedSpendCells[0].textContent).toContain('800');
  });

  it('filters items by parameter tabs and in-modal search', () => {
    render(
      <ReviewModal
        open={true}
        onClose={vi.fn()}
        selectedRecs={[mockRec1, mockRec3]}
        currencySymbol="₹"
        onApply={vi.fn()}
        isApplying={false}
      />
    );

    expect(screen.getByText('wireless headphones')).toBeDefined();
    expect(screen.getAllByText('Bestseller Electronics').length).toBeGreaterThan(0);

    // Click "Campaigns (1)" tab
    const campTab = screen.getByRole('button', { name: /Campaigns \(1\)/i });
    fireEvent.click(campTab);

    expect(screen.queryByText('wireless headphones')).toBeNull();
    expect(screen.getAllByText('Bestseller Electronics').length).toBeGreaterThan(0);

    // Click "All" tab
    const allTab = screen.getByRole('button', { name: /All \(2\)/i });
    fireEvent.click(allTab);

    // Search for "headphones"
    const searchInput = screen.getByPlaceholderText(/Search target, campaign, rule\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'headphones' } });

    expect(screen.getByText('wireless headphones')).toBeDefined();
    expect(screen.queryByText('Bestseller Electronics')).toBeNull();
  });

  it('detects mutual conflict between selected items and disables Apply button', () => {
    const rec1WithConflict = { ...mockRec1, conflicts_with: [102] };
    render(
      <ReviewModal
        open={true}
        onClose={vi.fn()}
        selectedRecs={[rec1WithConflict, mockRec2]}
        currencySymbol="₹"
        onApply={vi.fn()}
        isApplying={false}
      />
    );

    expect(screen.getByText(/Conflict detected in selection/i)).toBeDefined();
    const applyBtn = screen.getByRole('button', { name: /Apply \(2\) to Amazon/i }) as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(true);
  });

  it('renders per-item batch results (applied / stale / failed) after onApply', async () => {
    const onApplyMock = vi.fn().mockResolvedValue([
      { id: 101, status: 'APPLIED', success: true },
    ]);

    render(
      <ReviewModal
        open={true}
        onClose={vi.fn()}
        selectedRecs={[mockRec1]}
        currencySymbol="₹"
        onApply={onApplyMock}
        isApplying={false}
      />
    );

    const applyBtn = screen.getByRole('button', { name: /Apply \(1\) to Amazon/i });
    fireEvent.click(applyBtn);

    const confirmBtn = screen.getByRole('button', { name: /Yes, apply \(1\) to Amazon/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText('Application Results')).toBeDefined();
    expect(screen.getByText('Applied successfully to Amazon Ads')).toBeDefined();
    expect(screen.getByRole('button', { name: /Done/i })).toBeDefined();
  });
});
