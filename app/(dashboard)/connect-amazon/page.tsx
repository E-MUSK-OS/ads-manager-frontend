'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Globe,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  connectAmazonAds,
  getAmazonAccounts,
  selectAmazonAccount,
  getAmazonStatus,
  disconnectAmazonAds,
  AmazonProfileItem,
  AmazonStatusData,
} from '@/lib/api-client';

function getFriendlyErrorMessage(reason: string | null): string {
  switch (reason) {
    case 'access_denied':
      return 'You cancelled the Amazon permission screen. To manage your ads with AdsManager, click Connect again and allow access.';
    case 'invalid_state':
      return 'The connection session expired or was already used. Click Connect again to start a fresh authorization.';
    case 'invalid_request':
      return 'Invalid or incomplete authorization parameters received from Amazon. Please try connecting again.';
    case 'token_exchange_failed':
      return 'Failed to exchange authorization tokens with Amazon. Please verify your Amazon Ads credentials and try again.';
    case 'amazon_api_error':
      return 'Amazon Advertising API was temporarily unreachable. Please try refreshing your profiles.';
    default:
      return reason
        ? `Connection was not completed (${reason}). Please click Connect to try again.`
        : 'Failed to complete Amazon Ads authorization. Please try again.';
  }
}

function ConnectAmazonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get('status');
  const reasonParam = searchParams.get('reason');
  const needsRefreshParam = searchParams.get('needs_profile_refresh');

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<AmazonStatusData | null>(null);

  // Profile picker state (for status === 'success')
  const [profiles, setProfiles] = useState<AmazonProfileItem[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [savingSelection, setSavingSelection] = useState(false);
  const [profilesError, setProfilesError] = useState('');

  // Disconnect confirmation modal state
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // General error banner
  const [errorBanner, setErrorBanner] = useState<string>(
    statusParam === 'error' ? getFriendlyErrorMessage(reasonParam) : ''
  );

  // 1. Load connection status on mount
  const loadStatus = async () => {
    try {
      const res = await getAmazonStatus();
      if (res?.data) {
        setConnectionStatus(res.data);
      }
    } catch {
      // Ignore initial error if not connected yet
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // 2. If statusParam === 'success', automatically fetch profiles for the picker
  const loadProfiles = async (forceRefresh: boolean = false) => {
    setLoadingProfiles(true);
    setProfilesError('');
    try {
      const res = await getAmazonAccounts(forceRefresh);
      const list = res.data?.profiles || [];
      setProfiles(list);

      // Auto-select the currently selected profile or the first selectable Indian profile
      const currentlySelected = list.find((p) => p.isSelected);
      if (currentlySelected && currentlySelected.isSelectable) {
        setSelectedProfileId(currentlySelected.profileId);
      } else {
        const firstIndian = list.find((p) => p.isSelectable);
        if (firstIndian) {
          setSelectedProfileId(firstIndian.profileId);
        }
      }
    } catch (err: any) {
      setProfilesError(err?.message || 'Failed to load Amazon advertiser profiles. Please click refresh.');
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (statusParam === 'success') {
      loadProfiles(needsRefreshParam === '1');
    }
  }, [statusParam, needsRefreshParam]);

  // 3. Initiate OAuth connect
  const handleConnect = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const res = await connectAmazonAds('EU');
      const authUrl = res.data?.authorizationUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL returned from server.');
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to initialize Amazon Ads authorization. Please check server settings.');
      setLoading(false);
    }
  };

  // 4. Submit selected profile
  const handleSelectProfile = async () => {
    if (!selectedProfileId) return;
    setSavingSelection(true);
    setProfilesError('');
    try {
      await selectAmazonAccount(selectedProfileId);
      // Navigate to campaigns on successful profile selection
      router.push('/campaigns');
    } catch (err: any) {
      setProfilesError(err?.message || 'Failed to link selected profile. Please try again.');
      setSavingSelection(false);
    }
  };

  // 5. Handle Disconnect
  const handleConfirmDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectAmazonAds();
      setShowDisconnectModal(false);
      setConnectionStatus(null);
      setProfiles([]);
      setSelectedProfileId('');
      // Clean query params if any
      router.replace('/connect-amazon');
      await loadStatus();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to disconnect Amazon Ads account.');
    } finally {
      setDisconnecting(false);
    }
  };

  const isSuccessView = statusParam === 'success';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Error banner from redirect or action */}
      {errorBanner && (
        <div className="mb-6 p-4 border border-rose-200 bg-rose-50 rounded-lg flex items-start gap-3 text-rose-800 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 text-sm leading-relaxed">
            <p className="font-semibold text-rose-900">Authorization Notice</p>
            <p>{errorBanner}</p>
          </div>
          <button
            onClick={() => setErrorBanner('')}
            className="text-xs text-rose-500 hover:text-rose-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW A: PROFILE PICKER (Shows after successful LWA return) */}
      {isSuccessView ? (
        <div className="bg-surface border border-border-dim shadow-xl rounded-lg p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-primary"></div>

          <div className="mb-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Select Your Amazon Advertising Profile
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Your Amazon account is connected. Choose the advertiser profile you want to manage in AdsManager.
              Only <strong>India (IN)</strong> profiles are eligible.
            </p>
          </div>

          {profilesError && (
            <div className="mb-6 p-3.5 border border-rose-200 bg-rose-50 rounded-md text-sm text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{profilesError}</span>
            </div>
          )}

          {loadingProfiles ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Retrieving advertiser profiles from Amazon...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-lg border border-border-dim p-6 mb-6">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-800 mb-1">No Advertiser Profiles Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Amazon documents that newly linked advertising profiles can take a few minutes to appear.
                If you just created your profile, click refresh below.
              </p>
              <button
                onClick={() => loadProfiles(true)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Profiles
              </button>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Available Profiles ({profiles.length})</span>
                <button
                  onClick={() => loadProfiles(true)}
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="space-y-3">
                {profiles.map((p) => {
                  const isSelectable = p.isSelectable;
                  const isChecked = selectedProfileId === p.profileId;

                  return (
                    <div
                      key={p.profileId}
                      onClick={() => isSelectable && setSelectedProfileId(p.profileId)}
                      className={`p-4 border rounded-lg transition-all flex items-start gap-4 ${
                        !isSelectable
                          ? 'bg-slate-50/60 border-slate-200 opacity-60 cursor-not-allowed'
                          : isChecked
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs cursor-pointer'
                          : 'border-border-dim bg-surface hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="amazon-profile"
                        value={p.profileId}
                        checked={isChecked}
                        disabled={!isSelectable}
                        onChange={() => setSelectedProfileId(p.profileId)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-slate-300"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate">
                            {p.accountName}
                          </span>
                          {isSelectable ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                              Eligible (India)
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                              Non-India ({p.countryCode})
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Marketplace: <strong className="text-slate-700">{p.countryCode}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Currency: <strong className="text-slate-700">{p.currencyCode}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.timezone}</span>
                          </div>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-400 font-mono">
                          Profile ID: {p.profileId}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSelectProfile}
                  disabled={!selectedProfileId || savingSelection}
                  className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-xs cursor-pointer"
                >
                  {savingSelection ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting Profile...
                    </>
                  ) : (
                    <>
                      Confirm &amp; Proceed to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW B: STANDARD CONNECT CARD */
        <div className="space-y-8">
          {/* Active Connection Banner (if already connected) */}
          {connectionStatus?.connected && (
            <div className="bg-surface border border-emerald-200 rounded-lg p-5 shadow-xs bg-emerald-50/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {connectionStatus.amazonAccountName || 'Amazon Advertising Connected'}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Region: {connectionStatus.region} (India) &bull; Profile ID: {connectionStatus.selectedProfileId || 'None'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/campaigns')}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    Go to Campaigns <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Disconnect
                  </button>
                </div>
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
              <h2 className="text-2xl font-bold tracking-tight mb-3 text-slate-900">
                Connect Amazon Advertising Account
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
                Authorize AdsManager via Login with Amazon (LWA) to manage your Amazon Sponsored Products campaigns,
                budgets, and real-time bid recommendations for India (INR ₹).
              </p>
            </div>

            {/* Truthful Permission Scope Bullets */}
            <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-lg border border-border-dim">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Authorization Scope (India &bull; EU Region)
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Performance Analytics:</strong> Read impressions, clicks, spend, and sales data directly from Amazon Advertising API.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Campaign Management:</strong> Synchronize campaigns, ad groups, budgets, bids, and targeting keywords on your behalf.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>One-Time Token Security:</strong> Refresh tokens are stored encrypted at rest. You can disconnect and revoke access at any time.
                </span>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={loading || fetchingStatus}
              className="w-full py-3.5 bg-[#FF9900] text-slate-900 font-bold rounded-md hover:bg-[#e68a00] disabled:opacity-50 transition-colors flex justify-center items-center gap-2 text-base shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  Redirecting to Login with Amazon...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Connect with Amazon Ads
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-lg shadow-2xl border border-border-dim max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Disconnect Amazon Ads?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Disconnecting will permanently remove stored Amazon OAuth tokens and pause automated syncing for this account.
            </p>

            <div className="bg-slate-50 border border-border-dim rounded-md p-3 text-xs text-slate-500 mb-6 space-y-1">
              <p>&bull; Your historical analytics and past campaign drafts remain safely preserved.</p>
              <p>&bull; No active campaigns on Amazon are deleted or modified.</p>
              <p>&bull; You can reconnect your Amazon account at any time.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnecting}
                className="px-4 py-2 border border-border-dim rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {disconnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Confirm Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConnectAmazon() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm">Loading Amazon connection...</p>
        </div>
      }
    >
      <ConnectAmazonContent />
    </Suspense>
  );
}
