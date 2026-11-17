'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle2, AlertCircle, Trash2, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadAccounts = async () => {
    try {
      const data = await apiClient<AdsAccountItem[]>('/ads-accounts');
      setAccounts(data || []);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Disconnect this Amazon Ads account? All stored tokens and associated local data will be removed.')) {
      return;
    }
    setDisconnectingId(accountId);
    setError('');
    try {
      await apiClient(`/ads-accounts/${accountId}`, { method: 'DELETE' });
      await loadAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect account');
    } finally {
      setDisconnectingId(null);
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Account Settings</h1>
      <p className="text-sm text-slate-500 mb-8">Manage connected Amazon Advertising accounts and security credentials.</p>

      {error && (
        <div className="mb-6 p-4 border border-rose-200 bg-rose-50 rounded-md flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="bg-surface border border-border-dim rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-border-dim flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Connected Amazon Advertising Accounts</h2>
            <p className="text-xs text-slate-500">Accounts authorized via Login with Amazon (LWA) or demo data.</p>
          </div>
          <Link
            href="/connect-amazon"
            className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-md hover:bg-indigo-600 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Connect Account
          </Link>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading accounts...</div>
          ) : accounts.length === 0 ? (
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
                <div key={acc.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {acc.amazon_account_name || `Account #${acc.id}`}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-4 mt-1">
                      <span>Marketplace: <strong className="text-slate-700">{acc.marketplace}</strong></span>
                      {acc.profile_id && <span>Profile ID: {acc.profile_id}</span>}
                      <span>Type: {acc.is_mock ? 'Mock Account' : 'Live Amazon Account'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                      onClick={() => handleDisconnect(acc.id)}
                      disabled={disconnectingId === acc.id}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {disconnectingId === acc.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
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
      <div className="bg-surface border border-rose-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-semibold">Delete Account</h2>
          </div>
          <p className="text-xs text-rose-700 mt-1">
            Permanently delete your AdsManager account and all associated data.
          </p>
        </div>

        <div className="p-6">
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
              className="px-4 py-2 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
    </div>
  );
}
