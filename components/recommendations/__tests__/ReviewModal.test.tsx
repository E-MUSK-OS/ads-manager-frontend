import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewModal } from '../ReviewModal';
import type { Recommendation } from '@/lib/types/recommendation';

describe('ReviewModal (Phase R4.6)', () => {
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
      current: { bid: 25.0, state: 'ENABLED' },
      confidence: { clicks: 45, reference_cvr: 0.05, p_value: 0.02, level: 'HIGH', label: 'High statistical confidence' },
      date_window: { start: '2026-11-10', end: '2026-11-17', days: 7, label: 'Last 7 days' },
    },
    suggested_actions: [
      { type: 'DECREASE_BID', params: { pct: 15 }, from: 25.0, to: 21.25 },
    ],
    status: 'OPEN',
    dedupe_key: 'r:101',
    created_at: new Date().toISOString(),
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
      metrics: { spend: 2000, orders: 0, clicks: 60 },
      matched: [],
      current: { bid: 25.0, state: 'ENABLED' },
      confidence: { clicks: 60, reference_cvr: 0.05, p_value: 0.01, level: 'HIGH', label: 'High confidence' },
    },
    suggested_actions: [
      { type: 'PAUSE_TARGET', params: {}, from: 'ENABLED', to: 'PAUSED' },
    ],
    status: 'OPEN',
    dedupe_key: 'r:102',
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolved_by: null,
    conflicts_with: [101],
  };

  it('renders review table with old -> new comparison and metrics', () => {
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

    expect(screen.getByText('Review & Apply Recommendations')).toBeDefined();
    expect(screen.getByText('wireless headphones')).toBeDefined();
    expect(screen.getByText('High ACOS Bid Reduction')).toBeDefined();
    expect(screen.getByText('₹25.00')).toBeDefined();
    expect(screen.getByText('₹21.25')).toBeDefined();
    expect(screen.getByText('Spend:')).toBeDefined();
    expect(screen.getByText('₹1500.00')).toBeDefined();
    expect(screen.getByText('HIGH')).toBeDefined();
    const applyBtn = screen.getByRole('button', { name: /Apply \(1\) to Amazon/i }) as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(false);
  });

  it('detects mutual conflict between selected items and disables Apply button', () => {
    // Both items selected and rec2 has conflicts_with: [101]
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
    // Apply button must be disabled when conflicts exist
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

    // Confirm dialog confirm button
    const confirmBtn = screen.getByRole('button', { name: /Yes, apply \(1\) to Amazon/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText('Application Results')).toBeDefined();
    expect(screen.getByText('Applied successfully to Amazon Ads')).toBeDefined();
    expect(screen.getByRole('button', { name: /Done/i })).toBeDefined();
  });
});
