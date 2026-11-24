import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectAmazon from '../page';
import Settings from '../../settings/page';
import * as apiClient from '@/lib/api-client';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock API client
vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof apiClient>();
  return {
    ...actual,
    connectAmazonAds: vi.fn(),
    getAmazonAccounts: vi.fn(),
    selectAmazonAccount: vi.fn(),
    getAmazonStatus: vi.fn(),
    disconnectAmazonAds: vi.fn(),
    apiClient: vi.fn(),
  };
});

describe('ConnectAmazon (Phase N2 Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.mocked(apiClient.getAmazonStatus).mockResolvedValue({
      success: true,
      message: 'Status ok',
      data: {
        connected: false,
        connectionStatus: 'NOT_CONNECTED',
        amazonAccountName: null,
        selectedProfileId: null,
        region: 'EU',
        connectedAt: null,
        tokenExpiresAt: null,
      },
    });
  });

  it('renders connect view and handles OAuth button click', async () => {
    delete (window as any).location;
    window.location = { href: '' } as any;

    vi.mocked(apiClient.connectAmazonAds).mockResolvedValueOnce({
      success: true,
      message: 'Auth URL generated',
      data: {
        authorizationUrl: 'https://eu.account.amazon.com/ap/oa?client_id=123&state=teststate',
        region: 'EU',
      },
    });

    render(<ConnectAmazon />);

    expect(screen.getByText('Connect Amazon Advertising Account')).toBeDefined();
    const connectBtn = screen.getByRole('button', { name: /Connect with Amazon Ads/i });
    expect(connectBtn).toBeDefined();

    await waitFor(() => {
      expect(connectBtn.hasAttribute('disabled')).toBe(false);
    });

    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(apiClient.connectAmazonAds).toHaveBeenCalledWith('EU');
      expect(window.location.href).toBe('https://eu.account.amazon.com/ap/oa?client_id=123&state=teststate');
    });
  });

  it('displays clear human-friendly text for error code access_denied', async () => {
    mockSearchParams = new URLSearchParams('status=error&reason=access_denied');

    render(<ConnectAmazon />);

    await waitFor(() => {
      expect(
        screen.getByText(/You cancelled the Amazon permission screen/i)
      ).toBeDefined();
    });
  });

  it('displays clear human-friendly text for error code invalid_state', async () => {
    mockSearchParams = new URLSearchParams('status=error&reason=invalid_state');

    render(<ConnectAmazon />);

    await waitFor(() => {
      expect(
        screen.getByText(/The connection session expired or was already used/i)
      ).toBeDefined();
    });
  });

  it('displays clear human-friendly text for error code token_exchange_failed', async () => {
    mockSearchParams = new URLSearchParams('status=error&reason=token_exchange_failed');

    render(<ConnectAmazon />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to exchange authorization tokens with Amazon/i)
      ).toBeDefined();
    });
  });

  it('renders profile picker on status=success with Indian profiles selectable and non-IN disabled', async () => {
    mockSearchParams = new URLSearchParams('status=success');

    vi.mocked(apiClient.getAmazonAccounts).mockResolvedValueOnce({
      success: true,
      message: 'Profiles loaded',
      data: {
        profiles: [
          {
            profileId: '12345678901234',
            accountName: 'NETU TECHNO Official Store',
            countryCode: 'IN',
            currencyCode: 'INR',
            timezone: 'Asia/Kolkata',
            marketplace: 'IN',
            isSelected: false,
            isSelectable: true,
          },
          {
            profileId: '98765432109876',
            accountName: 'NETU TECHNO US Store',
            countryCode: 'US',
            currencyCode: 'USD',
            timezone: 'America/Los_Angeles',
            marketplace: 'US',
            isSelected: false,
            isSelectable: false,
          },
        ],
        count: 2,
      },
    });

    vi.mocked(apiClient.selectAmazonAccount).mockResolvedValueOnce({
      success: true,
      message: 'Profile selected',
      data: {
        profileId: '12345678901234',
        accountName: 'NETU TECHNO Official Store',
        countryCode: 'IN',
        currencyCode: 'INR',
        timezone: 'Asia/Kolkata',
        marketplace: 'IN',
        isSelected: true,
        isSelectable: true,
      },
    });

    render(<ConnectAmazon />);

    expect(screen.getByText('Select Your Amazon Advertising Profile')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('NETU TECHNO Official Store')).toBeDefined();
      expect(screen.getByText('NETU TECHNO US Store')).toBeDefined();
    });

    expect(screen.getByText('Eligible (India)')).toBeDefined();
    expect(screen.getByText('Non-India (US)')).toBeDefined();

    // Select Indian profile and submit
    const submitBtn = screen.getByRole('button', { name: /Confirm & Proceed to Dashboard/i });
    expect(submitBtn).toBeDefined();
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.selectAmazonAccount).toHaveBeenCalledWith('12345678901234');
      expect(mockPush).toHaveBeenCalledWith('/campaigns');
    });
  });

  it('shows honest empty state notice when Amazon returns 0 profiles', async () => {
    mockSearchParams = new URLSearchParams('status=success');

    vi.mocked(apiClient.getAmazonAccounts).mockResolvedValueOnce({
      success: true,
      message: 'No profiles',
      data: {
        profiles: [],
        count: 0,
      },
    });

    render(<ConnectAmazon />);

    await waitFor(() => {
      expect(screen.getByText('No Advertiser Profiles Found')).toBeDefined();
      expect(screen.getByText(/newly linked advertising profiles can take a few minutes to appear/i)).toBeDefined();
    });
  });
});

describe('Settings Page (Phase N2 Disconnect & Badge)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.apiClient).mockImplementation(async (url: string) => {
      if (url === '/ads-accounts') {
        return [
          {
            id: 1,
            marketplace: 'IN',
            is_mock: false,
            profile_id: '12345678901234',
            amazon_account_name: 'NETU TECHNO Official Store',
            connection_status: 'connected',
            created_at: '2026-11-24T10:00:00Z',
          },
        ];
      }
      return [];
    });
    vi.mocked(apiClient.getAmazonStatus).mockResolvedValue({
      success: true,
      message: 'Status ok',
      data: {
        connected: true,
        connectionStatus: 'CONNECTED',
        amazonAccountName: 'NETU TECHNO Official Store',
        selectedProfileId: '12345678901234',
        region: 'EU',
        connectedAt: '2026-11-24T10:00:00Z',
        tokenExpiresAt: '2026-11-24T11:00:00Z',
      },
    });
    vi.mocked(apiClient.disconnectAmazonAds).mockResolvedValue({
      success: true,
      message: 'Disconnected successfully',
      data: {
        connected: false,
        connectionStatus: 'NOT_CONNECTED',
      },
    });
  });

  it('renders connected badge and opens disconnect modal stating history preservation', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Connected Amazon Advertising Accounts')).toBeDefined();
      expect(screen.getByText('NETU TECHNO Official Store')).toBeDefined();
      expect(screen.getByText('Connected')).toBeDefined();
    });

    // Click Disconnect
    const disconnectBtn = screen.getByRole('button', { name: /Disconnect/i });
    fireEvent.click(disconnectBtn);

    // Modal opens
    expect(screen.getByText('Disconnect Amazon Ads Account?')).toBeDefined();
    expect(
      screen.getByText(/Your campaign history and analytics data will be safely preserved/i)
    ).toBeDefined();

    // Confirm Disconnect
    const confirmBtn = screen.getByRole('button', { name: /Confirm Disconnect/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.disconnectAmazonAds).toHaveBeenCalledWith('12345678901234');
    });
  });
});
