import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BidThresholdModal } from '../BidThresholdModal';
import * as apiClient from '@/lib/api-client';

const mockShowToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  getCampaignBidThreshold: vi.fn(),
  putCampaignBidThreshold: vi.fn(),
  deleteCampaignBidThreshold: vi.fn(),
}));

describe('BidThresholdModal (Phase 5 / D9)', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    campaignId: 42,
    campaignName: 'Test SP Campaign',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, campaign name, and honest banner', async () => {
    vi.mocked(apiClient.getCampaignBidThreshold).mockResolvedValueOnce(null);

    render(<BidThresholdModal {...defaultProps} />);

    expect(screen.getByText('Bid Threshold')).toBeDefined();
    expect(screen.getByText('Test SP Campaign')).toBeDefined();
    expect(screen.getByText('Saved in AdsManager. Not applied to Amazon.')).toBeDefined();

    await waitFor(() => {
      expect(apiClient.getCampaignBidThreshold).toHaveBeenCalledWith(42);
    });
  });

  it('populates saved values when reopening with existing threshold', async () => {
    vi.mocked(apiClient.getCampaignBidThreshold).mockResolvedValueOnce({
      id: 1,
      campaign_id: 42,
      min_bid: 12.5,
      max_bid: 55.0,
      target_acos: 22.5,
    });

    render(<BidThresholdModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 5.00')).toHaveProperty('value', '12.5');
      expect(screen.getByPlaceholderText('e.g. 50.00')).toHaveProperty('value', '55');
      expect(screen.getByPlaceholderText('e.g. 25.0')).toHaveProperty('value', '22.5');
    });
  });

  it('validates min bid cannot exceed max bid', async () => {
    vi.mocked(apiClient.getCampaignBidThreshold).mockResolvedValueOnce(null);

    render(<BidThresholdModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading threshold values...')).toBeNull();
    });

    const minInput = screen.getByPlaceholderText('e.g. 5.00');
    const maxInput = screen.getByPlaceholderText('e.g. 50.00');

    fireEvent.change(minInput, { target: { value: '60' } });
    fireEvent.change(maxInput, { target: { value: '20' } });

    expect(screen.getByText('Min Bid cannot exceed Max Bid.')).toBeDefined();
    expect(screen.getByText('Apply').closest('button')?.disabled).toBe(true);
  });

  it('validates target ACOS must be between 0 and 100', async () => {
    vi.mocked(apiClient.getCampaignBidThreshold).mockResolvedValueOnce(null);

    render(<BidThresholdModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading threshold values...')).toBeNull();
    });

    const acosInput = screen.getByPlaceholderText('e.g. 25.0');
    fireEvent.change(acosInput, { target: { value: '150' } });

    expect(screen.getByText('Target ACOS must be between 0% and 100%.')).toBeDefined();
    expect(screen.getByText('Apply').closest('button')?.disabled).toBe(true);
  });

  it('calls putCampaignBidThreshold on Apply and triggers success toast', async () => {
    vi.mocked(apiClient.getCampaignBidThreshold).mockResolvedValueOnce(null);
    vi.mocked(apiClient.putCampaignBidThreshold).mockResolvedValueOnce({
      id: 2,
      campaign_id: 42,
      min_bid: 10,
      max_bid: 40,
      target_acos: 20,
    });

    render(<BidThresholdModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading threshold values...')).toBeNull();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. 5.00'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 50.00'), { target: { value: '40' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 25.0'), { target: { value: '20' } });

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(apiClient.putCampaignBidThreshold).toHaveBeenCalledWith(42, {
        min_bid: 10,
        max_bid: 40,
        target_acos: 20,
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Bid thresholds saved',
          message: 'Saved in AdsManager. Not applied to Amazon.',
        })
      );
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('clears inputs and deletes saved threshold from server on Clear Inputs', async () => {
    vi.mocked(apiClient.getCampaignBidThreshold).mockResolvedValueOnce({
      id: 1,
      campaign_id: 42,
      min_bid: 15,
      max_bid: 45,
      target_acos: 25,
    });
    vi.mocked(apiClient.deleteCampaignBidThreshold).mockResolvedValueOnce();

    render(<BidThresholdModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 5.00')).toHaveProperty('value', '15');
    });

    fireEvent.click(screen.getByText('Clear Inputs'));

    await waitFor(() => {
      expect(apiClient.deleteCampaignBidThreshold).toHaveBeenCalledWith(42);
      expect(screen.getByPlaceholderText('e.g. 5.00')).toHaveProperty('value', '');
      expect(screen.getByPlaceholderText('e.g. 50.00')).toHaveProperty('value', '');
      expect(screen.getByPlaceholderText('e.g. 25.0')).toHaveProperty('value', '');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Thresholds cleared',
        })
      );
    });
  });
});
