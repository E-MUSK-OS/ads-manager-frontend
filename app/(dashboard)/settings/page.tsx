'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, getAmazonStatus, disconnectAmazonAds, AmazonStatusData } from '@/lib/api-client';
import { clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Plus,
  AlertTriangle,
  Globe,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface AdsAccountItem {
  id: number;
  marketplace: string;
  is_mock: boolean;
  profile_id?: string;
  amazon_account_name?: string;
  connection_status?: string;
  created_at: string;
}

export default function Settings() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AdsAccountItem[]>([]);
  const [amazonStatus, setAmazonStatus] = useState<AmazonStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  // Disconnect Confirmation Modal
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectingProfileId, setDisconnectingProfileId] = useState<string | undefined>(undefined);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = async () => {
    try {
      const [accsData, statusRes] = await Promise.all([
        apiClient<AdsAccountItem[]>('/ads-accounts').catch(() => []),
        getAmazonStatus().catch(() => null),
      ]);
      setAccounts(accsData || []);
      if (statusRes?.data) {
        setAmazonStatus(statusRes.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load settings data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDisconnectModal = (profileId?: string) => {
    setDisconnectingProfileId(profileId);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setError('');
    try {
      await disconnectAmazonAds(disconnectingProfileId);
      setDisconnectModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to disconnect Amazon Ads account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE') {
      setDeleteError("Please type 'DELETE' to confirm account deletion.");
      return;
    }
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await apiClient('/auth/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      clearTokens();
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-5 sm:py-8 px-3 sm:px-4">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Account Settings</h1>
      <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">
        Manage connected Amazon Advertising accounts, Login with Amazon (LWA) integration, and security credentials.
      </p>

      {error && (
        <div className="mb-6 p-4 border border-rose-200 bg-rose-50 rounded-md flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>{error}</div>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="bg-surface border border-border-dim rounded-lg shadow-xs overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-border-dim flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Connected Amazon Advertising Accounts
            </h2>
            <p className="text-xs text-slate-500">
              Authorized via Login with Amazon (LWA) &bull; Region: India (EU Endpoints)
            </p>
          </div>
          <Link
            href="/connect-amazon"
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-md hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Connect Account
          </Link>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading accounts...</div>
          ) : accounts.length === 0 && (!amazonStatus || !amazonStatus.connected) ? (
            <div className="py-8 text-center">
              <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-border-dim">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 mb-3">No advertising accounts connected yet.</p>
              <Link
                href="/connect-amazon"
                className="inline-flex text-xs font-semibold text-primary hover:underline"
              >
                Connect with Amazon Ads &rarr;
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border-dim">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {acc.amazon_account_name || `Amazon Account #${acc.id}`}
                      </span>
                      {acc.connection_status === 'connected' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                          Active Profile
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span>Marketplace: <strong className="text-slate-700">{acc.marketplace}</strong></span>
                      {acc.profile_id && <span>Profile ID: <code className="text-slate-600">{acc.profile_id}</code></span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                    {acc.connection_status === 'reauth_required' ? (
                      <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-800 rounded border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Re-authorization Required
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    )}

                    <button
                      onClick={() => openDisconnectModal(acc.profile_id)}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-surface border border-rose-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-base sm:text-lg font-semibold">Delete Account</h2>
          </div>
          <p className="text-xs text-rose-700 mt-1">
            Permanently delete your AdsManager account and all associated data.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-sm text-slate-700 mb-4">
            <p className="font-medium text-slate-900 mb-1">Warning: This action is permanent and irreversible.</p>
            <p className="text-xs text-slate-600">
              Deleting your account immediately purges all connected Amazon Ads credentials, OAuth tokens, campaign drafts, and stored analytics data. Any active automation rules will stop executing.
            </p>
          </div>

          {deleteError && (
            <div className="mb-4 p-3 border border-rose-200 bg-rose-50 rounded-md text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <form onSubmit={handleDeleteAccount} className="max-w-md space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              To confirm, type <span className="font-mono font-bold text-rose-700">DELETE</span> below:
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              disabled={deletingAccount}
              className="w-full px-3 py-2 border border-border-dim rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={deletingAccount || deleteConfirm !== 'DELETE'}
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {deletingAccount ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete my account
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-lg shadow-2xl border border-border-dim max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Disconnect Amazon Ads Account?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Disconnecting will remove your stored Amazon credentials and pause automated syncing. Your campaign history and analytics data will be safely preserved. You can reconnect at any time.
            </p>

            <div className="bg-slate-50 border border-border-dim rounded-md p-3 text-xs text-slate-500 mb-6 space-y-1">
              <p>&bull; No campaign or bid metrics will be deleted from your AdsManager history.</p>
              <p>&bull; Live campaigns running on Amazon are unaffected.</p>
              <p>&bull; Automated synchronization will remain paused until you reconnect.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(false)}
                disabled={isDisconnecting}
                className="px-4 py-2 border border-border-dim rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDisconnecting ? (
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
