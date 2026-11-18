import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HourlyModal } from '../HourlyModal';
import * as apiClient from '@/lib/api-client';

// Mock active account
vi.mock('@/lib/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: { id: 1, name: 'India Test Store', seller_name: 'India Test Store', marketplace_id: 'A21TJRUUN4KGV', country_code: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
    accounts: [],
    activeAccountId: 1,
    rules: {
      currency: 'INR',
      symbol: '₹',
      locale: 'en-IN',
      tz: 'Asia/Kolkata',
      min_budget: 100,
      recommended_budget: 500,
      min_bid: 1,
      max_bid: 5000,
    },
    loading: false,
    error: null,
    refreshAccounts: vi.fn(),
    setActiveAccountId: vi.fn(),
    todayInTz: () => '2026-11-18',
  }),
}));

// Mock recharts for JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  getHourlyStatus: vi.fn(),
  getHourlySummary: vi.fn(),
  getHourlyTrends: vi.fn(),
  getHourlyMatrix: vi.fn(),
}));

describe('HourlyModal (Phase 7 / D14 / 7.4)', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders honest unconnected empty state when stream is not configured', async () => {
    vi.mocked(apiClient.getHourlyStatus).mockResolvedValueOnce({
      is_connected: false,
      status: 'NOT_CONFIGURED',
      subscribed_at: null,
      last_message_at: null,
      message_count: 0,
    });
    vi.mocked(apiClient.getHourlySummary).mockResolvedValueOnce({
      is_connected: false,
      has_data: false,
      start: '2026-11-12',
      end: '2026-11-18',
      totals: {},
    });
    vi.mocked(apiClient.getHourlyTrends).mockResolvedValueOnce({
      is_connected: false,
      has_data: false,
      series: [],
      peaks_and_lows: {},
    });
    vi.mocked(apiClient.getHourlyMatrix).mockResolvedValueOnce({
      is_connected: false,
      has_data: false,
      metric: 'sales',
      start: '2026-11-12',
      end: '2026-11-18',
      dates: [],
      rows: [],
      summary_row: { date: 'Total', hours: {}, daily_total: 0 },
      min_value: 0,
      max_value: 0,
    });

    render(<HourlyModal {...defaultProps} />);

    // Header checks
    expect(screen.getByText('Hourly Performance Tracking')).toBeDefined();
    expect(screen.getByText('₹ INR')).toBeDefined();
    expect(screen.getByText('All Sponsored Products Campaigns')).toBeDefined();

    // Honest empty state
    await waitFor(() => {
      expect(screen.getByText('Hourly data is not connected yet')).toBeDefined();
    });
    expect(
      screen.getByText(/Hourly intra-day tracking requires a live/)
    ).toBeDefined();
    expect(
      screen.getByText(/Per project guidelines, hourly metrics are never derived, fabricated, or estimated/)
    ).toBeDefined();

    // Verify NO download or export buttons exist
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map((b) => (b.textContent || '').toLowerCase());
    expect(buttonTexts.some((t) => t.includes('download') || t.includes('export') || t.includes('csv'))).toBe(false);
  });

  it('renders honest connected but no data empty state', async () => {
    vi.mocked(apiClient.getHourlyStatus).mockResolvedValueOnce({
      is_connected: true,
      status: 'ACTIVE',
      subscribed_at: '2026-11-15T00:00:00Z',
      last_message_at: '2026-11-18T10:00:00Z',
      message_count: 0,
    });
    vi.mocked(apiClient.getHourlySummary).mockResolvedValueOnce({
      is_connected: true,
      has_data: false,
      start: '2026-11-12',
      end: '2026-11-18',
      totals: {},
    });
    vi.mocked(apiClient.getHourlyTrends).mockResolvedValueOnce({
      is_connected: true,
      has_data: false,
      series: [],
      peaks_and_lows: {},
    });
    vi.mocked(apiClient.getHourlyMatrix).mockResolvedValueOnce({
      is_connected: true,
      has_data: false,
      metric: 'sales',
      start: '2026-11-12',
      end: '2026-11-18',
      dates: [],
      rows: [],
      summary_row: { date: 'Total', hours: {}, daily_total: 0 },
      min_value: 0,
      max_value: 0,
    });

    render(
      <HourlyModal
        {...defaultProps}
        campaignId={101}
        campaignName="Sponsored Products - Summer Sale"
      />
    );

    expect(screen.getByText('Sponsored Products - Summer Sale')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('No hourly data for this period')).toBeDefined();
    });
  });

  it('renders full connected view with KPIs, trends, Peak/Low facts, and heatmap', async () => {
    vi.mocked(apiClient.getHourlyStatus).mockResolvedValueOnce({
      is_connected: true,
      status: 'ACTIVE',
      subscribed_at: '2026-11-15T00:00:00Z',
      last_message_at: '2026-11-18T10:00:00Z',
      message_count: 50,
    });
    vi.mocked(apiClient.getHourlySummary).mockResolvedValueOnce({
      is_connected: true,
      has_data: true,
      start: '2026-11-12',
      end: '2026-11-18',
      totals: {
        impressions: 12000,
        clicks: 450,
        spend: 2250.0,
        orders: 30,
        sales: 15000.0,
        ctr: 3.75,
        cpc: 5.0,
        roas: 6.67,
        acos: 15.0,
      },
    });
    vi.mocked(apiClient.getHourlyTrends).mockResolvedValueOnce({
      is_connected: true,
      has_data: true,
      series: Array.from({ length: 24 }).map((_, h) => ({
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        impressions: 500,
        clicks: 20,
        spend: 100.0,
        orders: 1,
        sales: h === 14 ? 5000.0 : 400.0,
        ctr: 4.0,
        cpc: 5.0,
        roas: 4.0,
        acos: 25.0,
      })),
      peaks_and_lows: {
        sales: {
          peak_hour: 14,
          peak_label: '14:00',
          peak_value: 5000.0,
          low_hour: 3,
          low_label: '03:00',
          low_value: 0.0,
        },
      },
    });
    vi.mocked(apiClient.getHourlyMatrix).mockResolvedValueOnce({
      is_connected: true,
      has_data: true,
      metric: 'sales',
      start: '2026-11-17',
      end: '2026-11-18',
      dates: ['2026-11-17', '2026-11-18'],
      rows: [
        {
          date: '2026-11-17',
          hours: { '14': 2500 },
          daily_total: 2500,
        },
        {
          date: '2026-11-18',
          hours: { '14': 2500 },
          daily_total: 2500,
        },
      ],
      summary_row: {
        date: 'Total',
        hours: { '14': 5000 },
        daily_total: 5000,
      },
      min_value: 0,
      max_value: 2500,
    });

    const { container } = render(<HourlyModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Hourly Performance Trends (00:00 – 23:00)')).toBeDefined();
    });

    // Check KPI cards
    expect(screen.getAllByText('Impressions').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Clicks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Spend').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sales').length).toBeGreaterThanOrEqual(1);

    // Plain fact peak & low badges (max & min facts, not recommendations)
    expect(screen.getByText(/Peak: 14:00/)).toBeDefined();
    expect(screen.getByText(/Low: 03:00/)).toBeDefined();

    // Heatmap elements
    expect(screen.getByText('Date × Hour Matrix Heatmap')).toBeDefined();
    expect(screen.getByText('Lower')).toBeDefined();
    expect(screen.getByText('Higher')).toBeDefined();

    // Footer note
    expect(
      screen.getByText(/Hourly data collected since subscription time. Orders use Amazon 7-day attribution/)
    ).toBeDefined();

    // Verify NO Best/Worst wording exists
    const textContent = container.textContent?.toLowerCase() || '';
    expect(textContent.includes('best')).toBe(false);
    expect(textContent.includes('worst')).toBe(false);
    expect(textContent.includes('recommendation')).toBe(false);
    expect(textContent.includes('dayparting strategy')).toBe(false);
  });
});
