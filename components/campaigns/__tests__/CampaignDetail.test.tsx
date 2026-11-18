import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CampaignDetailPage, { CampaignDetailContent } from '@/app/(dashboard)/campaigns/[id]/page';
import * as apiClient from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockShowToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('@/lib/useActiveAccount', () => ({
  useActiveAccount: () => ({
    activeAccount: { id: 1, marketplace: 'IN', currency_code: 'INR' },
    todayInTz: () => '2026-11-18',
    rules: {
      min_daily_budget: 100,
      recommended_budget: 500,
      currency_symbol: '₹',
    },
  }),
}));

const mockCampaign = {
  id: 42,
  ads_account_id: 1,
  name: 'Diwali Festive SP Campaign',
  state: 'ENABLED' as const,
  delivery_status: 'DELIVERING',
  targeting_type: 'MANUAL' as const,
  campaign_type: 'SPONSORED_PRODUCTS',
  site: 'AMAZON_AND_BEYOND' as const,
  start_date: '2026-10-01',
  end_date: null,
  daily_budget: 650.0,
  bidding_strategy: 'DOWN_ONLY',
  spend: 12000.0,
  sales: 60000.0,
  impressions: 45000,
  clicks: 1500,
  orders: 120,
  acos: 20.0,
  roas: 5.0,
  cpc: 8.0,
  ctr: 3.33,
};

const mockSummary = {
  series: [
    {
      bucket: '2026-11-18',
      date: '2026-11-18',
      impressions: 5000,
      clicks: 150,
      spend: 1200.0,
      sales: 6000.0,
      orders: 12,
      acos: 20.0,
      roas: 5.0,
      cpc: 8.0,
      ctr: 3.0,
    },
  ],
  totals: {
    impressions: 45000,
    clicks: 1500,
    spend: 12000.0,
    sales: 60000.0,
    orders: 120,
    acos: 20.0,
    roas: 5.0,
    cpc: 8.0,
    ctr: 3.33,
  },
  previous_totals: {
    impressions: 40000,
    clicks: 1400,
    spend: 11000.0,
    sales: 55000.0,
    orders: 110,
    acos: 20.0,
    roas: 5.0,
    cpc: 7.85,
    ctr: 3.5,
  },
  delta_pct: {},
};

const mockAdGroups = [
  {
    id: 101,
    campaign_id: 42,
    name: 'Festive Sweets Ad Group',
    state: 'ENABLED',
    default_bid: 15.0,
    spend: 12000.0,
    sales: 60000.0,
    impressions: 45000,
    clicks: 1500,
    orders: 120,
    acos: 20.0,
    roas: 5.0,
    cpc: 8.0,
    ctr: 3.33,
    products_count: 3,
  },
];

const mockPlacements = [
  {
    placement: 'TOP_OF_SEARCH' as const,
    label: 'Top of search (first page)',
    modifier_pct: 50,
    base_bid: 15.0,
    max_effective_bid: 22.5,
    impressions: 20000,
    clicks: 800,
    spend: 7000.0,
    sales: 42000.0,
    orders: 85,
    ctr: 4.0,
    cpc: 8.75,
    cvr: 10.6,
    acos: 16.67,
    roas: 6.0,
  },
  {
    placement: 'PRODUCT_PAGES' as const,
    label: 'Product pages',
    modifier_pct: 0,
    base_bid: 15.0,
    max_effective_bid: 15.0,
    impressions: 15000,
    clicks: 400,
    spend: 3000.0,
    sales: 12000.0,
    orders: 25,
    ctr: 2.67,
    cpc: 7.5,
    cvr: 6.25,
    acos: 25.0,
    roas: 4.0,
  },
  {
    placement: 'REST_OF_SEARCH' as const,
    label: 'Rest of search',
    modifier_pct: 0,
    base_bid: 15.0,
    max_effective_bid: 15.0,
    impressions: 10000,
    clicks: 300,
    spend: 2000.0,
    sales: 6000.0,
    orders: 10,
    ctr: 3.0,
    cpc: 6.67,
    cvr: 3.33,
    acos: 33.33,
    roas: 3.0,
  },
];

const mockHistory = [
  {
    id: 'hist_1',
    event_type: 'BUDGET_UPDATE',
    event_title: 'Daily Budget Updated',
    description: 'Budget changed from ₹500.00 to ₹650.00',
    previous_value: '500.0',
    new_value: '650.0',
    created_at: '2026-11-18T05:00:00Z',
    user_id: 1,
  },
];

describe('CampaignDetailPage (/campaigns/[id])', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'getCampaign').mockResolvedValue(mockCampaign as any);
    vi.spyOn(apiClient, 'getCampaignSummary').mockResolvedValue(mockSummary as any);
    vi.spyOn(apiClient, 'getCampaignAdGroups').mockResolvedValue(mockAdGroups as any);
    vi.spyOn(apiClient, 'getCampaignPlacements').mockResolvedValue(mockPlacements as any);
    vi.spyOn(apiClient, 'getCampaignHistory').mockResolvedValue(mockHistory as any);
    vi.spyOn(apiClient, 'patchCampaign').mockResolvedValue({ ...mockCampaign, daily_budget: 750.0 } as any);
    vi.spyOn(apiClient, 'updateCampaignState').mockResolvedValue({ ...mockCampaign, state: 'PAUSED' } as any);
  });

  it('renders campaign header, status badge, metadata, and back link', async () => {
    render(<CampaignDetailContent params={{ id: '42' }} />);

    expect(await screen.findByText('Diwali Festive SP Campaign')).toBeDefined();
    expect(screen.getByText('Back to Campaigns')).toBeDefined();
    expect(screen.getByText('DELIVERING')).toBeDefined();
    expect(screen.getByText('Sponsored Products')).toBeDefined();
    expect(screen.getByText('Manual Targeting')).toBeDefined();
    expect(screen.getByText('Start: 2026-10-01')).toBeDefined();
    expect(screen.getByText('End: No end date')).toBeDefined();
  });

  it('renders the 4 Amazon-console tabs per Q13', async () => {
    render(<CampaignDetailContent params={{ id: '42' }} />);

    expect(await screen.findByRole('tab', { name: /Ad groups/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Placements/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Settings/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /History/i })).toBeDefined();
  });

  it('renders the Ad groups table with metrics and counts', async () => {
    render(<CampaignDetailContent params={{ id: '42' }} />);

    expect(await screen.findByText('Festive Sweets Ad Group')).toBeDefined();
    expect(screen.getByText('Showing 1 of 1 ad groups')).toBeDefined();
  });

  it('renders Placements tab as strictly READ-ONLY per Q13', async () => {
    render(<CampaignDetailContent params={{ id: '42' }} />);

    const placementsTab = await screen.findByRole('tab', { name: /Placements/i });
    fireEvent.click(placementsTab);

    expect(await screen.findByText('Placement Modifiers & Performance (Read-Only)')).toBeDefined();
    expect(screen.getByText('Top of search (first page)')).toBeDefined();
    expect(screen.getByText('+50%')).toBeDefined();
    expect(screen.getByText('Product pages')).toBeDefined();
    expect(screen.getByText('Rest of search')).toBeDefined();
    // Confirms NO save buttons exist in placements tab
    expect(screen.queryByRole('button', { name: /Save Placements/i })).toBeNull();
  });

  it('renders Settings tab and opens Q6 confirmation dialog before saving', async () => {
    render(<CampaignDetailContent params={{ id: '42' }} />);

    const settingsTab = await screen.findByRole('tab', { name: /Settings/i });
    fireEvent.click(settingsTab);

    expect(await screen.findByText('Campaign Settings')).toBeDefined();
    expect(screen.getByText('Dynamic bids - down only')).toBeDefined();

    // Change strategy to Up and Down
    const upDownRadio = screen.getByDisplayValue('UP_AND_DOWN');
    fireEvent.click(upDownRadio);

    // Click Save to Amazon Ads
    const saveBtn = screen.getByRole('button', { name: /Save to Amazon Ads/i });
    fireEvent.click(saveBtn);

    // Q6 Confirmation dialog should appear
    expect(await screen.findByText('Confirm Amazon Ads Campaign Changes')).toBeDefined();
    expect(screen.getByText(/Bidding Strategy: DOWN_ONLY → UP_AND_DOWN/i)).toBeDefined();

    // Confirm save
    const confirmBtn = screen.getByRole('button', { name: 'Confirm & Save to Amazon' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.patchCampaign).toHaveBeenCalledWith(42, expect.objectContaining({
        bidding_strategy: 'UP_AND_DOWN',
      }));
    });
  });

  it('renders History tab with audit events', async () => {
    render(<CampaignDetailContent params={{ id: '42' }} />);

    const historyTab = await screen.findByRole('tab', { name: /History/i });
    fireEvent.click(historyTab);

    expect(await screen.findByText('Campaign History')).toBeDefined();
    expect(screen.getByText('Daily Budget Updated')).toBeDefined();
    expect(screen.getByText('Budget changed from ₹500.00 to ₹650.00')).toBeDefined();
  });
});
