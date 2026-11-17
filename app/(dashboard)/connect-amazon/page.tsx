'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Target, CheckCircle2, AlertCircle, Shield, Trash2, RefreshCw } from 'lucide-react';

interface AdsAccountItem {
  id: number;
  marketplace: string;
  is_mock: boolean;
  profile_id?: string;
  amazon_account_name?: string;
  connection_status?: string;
  created_at: string;
}

export default function ConnectAmazon() {
  const [loading, setLoading] = useState(false);
  const [providerMode, setProviderMode] = useState<'mock' | 'amazon'>('mock');
  const [accounts, setAccounts] = useState<AdsAccountItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      // Determine provider mode (mock or amazon)
      const modeRes = await apiClient<{ provider: 'mock' | 'amazon' }>('/ads-accounts/provider-mode').catch(() => ({ provider: 'mock' as const }));
      setProviderMode(modeRes.provider || 'mock');

      // Fetch existing connected accounts
      const existingAccounts = await apiClient<AdsAccountItem[]>('/ads-accounts').catch(() => []);
      setAccounts(existingAccounts || []);
    } catch (err: unknown) {
      console.error('Failed to load accounts or provider mode', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      if (providerMode === 'amazon') {
        // Amazon live mode: request authorized URL and redirect to Amazon LWA
        const res = await apiClient<{ url: string }>('/ads-accounts/amazon/authorize-url');
        if (res?.url) {
          window.location.href = res.url;
        } else {
          throw new Error('Received invalid authorization URL from backend');
        }
      } else {
        // Mock demo mode: populate mock advertiser dataset
        await apiClient('/ads-accounts/connect', {
          method: 'POST',
          body: JSON.stringify({ marketplace: 'IN' }),
        });
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize integration. Please try again.');
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this Amazon Ads account? Stored tokens and credentials will be permanently purged.')) {
      return;
    }
    setDisconnectingId(accountId);
    try {
      await apiClient(`/ads-accounts/${accountId}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect account');
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Provider Mode Banner */}
      <div className="mb-6 flex justify-between items-center bg-surface border border-border-dim rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Provider Integration Mode:</span>
          {providerMode === 'amazon' ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Amazon Ads Live (LWA)
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Demo mode: sample data
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {providerMode === 'amazon' ? 'Real LWA OAuth 2.0 Enabled' : 'Synthetic Data Seeder'}
        </div>
      </div>

      {/* Existing Connected Accounts */}
      {accounts.length > 0 && (
        <div className="mb-8 bg-surface border border-border-dim rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Connected Ads Accounts</h3>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-4 border border-border-dim rounded-md bg-slate-50/50"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {acc.amazon_account_name || `Amazon Ads Account #${acc.id}`}
                  </div>
                  <div className="text-xs text-slate-500 flex gap-3 mt-1">
                    <span>Marketplace: <strong className="text-slate-700">{acc.marketplace}</strong></span>
                    {acc.profile_id && <span>Profile ID: {acc.profile_id}</span>}
                    <span>Type: {acc.is_mock ? 'Mock Account' : 'Live Amazon Account'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {acc.connection_status === 'reauth_required' ? (
                    <span className="text-xs font-medium px-2 py-1 bg-rose-100 text-rose-700 rounded border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Re-auth Required
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  )}

                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    disabled={disconnectingId === acc.id}
                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors text-xs flex items-center gap-1"
                    title="Disconnect and purge tokens"
                  >
                    {disconnectingId === acc.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Connect Card */}
      <div className="bg-surface border border-border-dim shadow-xl rounded-lg p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>

        <div className="mb-8 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-dim">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            {providerMode === 'amazon' ? 'Connect Amazon Advertising Account' : 'Connect Demo Advertising Account'}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
            {providerMode === 'amazon'
              ? 'Authorize AdsManager via Login with Amazon (LWA) to manage your Amazon Advertising campaigns, budgets, and bid optimizations.'
              : 'Explore AdsManager features with simulated Amazon advertising data in demo mode.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-rose-200 bg-rose-50 rounded-md flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Truthful Permission Scope Bullets */}
        <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-lg border border-border-dim">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Authorization &amp; Permissions Scope
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Performance Analytics:</strong> Retrieve campaign performance metrics, impressions, clicks, spend, and sales data.
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Campaign Management:</strong> Create and modify campaigns, ad groups, budgets, bids, and keywords on your behalf.
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Automated Bid Optimization:</strong> Apply AI recommendations and automated rules to adjust bids and negative keywords.
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>OAuth 2.0 Security:</strong> Secure token exchange with encryption at rest. You can disconnect or revoke access at any time.
            </span>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading || fetching}
          className="w-full py-3.5 bg-[#FF9900] text-slate-900 font-bold rounded-md hover:bg-[#e68a00] disabled:opacity-50 transition-colors flex justify-center items-center gap-2 text-base shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              {providerMode === 'amazon' ? 'Redirecting to Login with Amazon...' : 'Generating sample dataset...'}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {providerMode === 'amazon' ? 'Authorize with Login with Amazon' : 'Connect Sample Account (Demo)'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
