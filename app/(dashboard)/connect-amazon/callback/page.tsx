'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      setErrorMessage(
        errorDesc || error || 'Amazon authorization was cancelled or denied by the user.'
      );
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing required authorization parameters (code or state).');
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    async function exchangeToken() {
      try {
        // Exchange code for tokens and ingest profiles via backend
        await apiClient('/ads-accounts/amazon/callback', {
          method: 'POST',
          body: JSON.stringify({ code, state }),
        });

        setStatus('success');
        // Brief pause so user sees success confirmation before dashboard navigation
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to complete Amazon account connection. Please try again.');
      }
    }

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center p-4">
      <div className="bg-surface border border-border-dim shadow-xl rounded-lg p-10 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            <h2 className="text-xl font-bold tracking-tight">Connecting your Amazon Account</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Exchanging authorization code and retrieving your advertising profiles...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Connected Successfully!</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your Amazon Advertising profiles have been linked. Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Connection Failed</h2>
            <p className="text-sm text-rose-700 bg-rose-50 p-3 rounded-md border border-rose-200 w-full text-left">
              {errorMessage}
            </p>
            <div className="pt-2 w-full">
              <Link
                href="/connect-amazon"
                className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-md hover:bg-indigo-600 transition-colors inline-block text-sm"
              >
                Try Again
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AmazonCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading callback...</span>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

