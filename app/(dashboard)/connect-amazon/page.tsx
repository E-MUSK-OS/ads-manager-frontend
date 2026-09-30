'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Target, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ConnectAmazon() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      // Calls our backend which mocks the LWA flow + populates 90 days of data
      await apiClient('/ads-accounts/connect', { method: 'POST' });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to initialize integration. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <div className="bg-surface border border-border-dim shadow-xl rounded-lg p-10 max-w-lg w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>
        
        <div className="mb-8 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-dim">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Amazon Ads Integration</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Authorize AdsManager to securely connect to your Amazon Advertising API via Login with Amazon (LWA). 
            This will initiate the download of your historical metrics.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-rose-200 bg-rose-50 rounded-md flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Read-only access to campaign performance
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Manage automation rules and bid modifiers
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Secure OAuth 2.0 connection
          </div>
        </div>

        <button 
          onClick={handleConnect} 
          disabled={loading}
          className="w-full py-3 bg-[#FF9900] text-slate-900 font-bold rounded-md hover:bg-[#e68a00] disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              Synchronizing data...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Connect with Amazon
            </>
          )}
        </button>
      </div>
    </div>
  );
}