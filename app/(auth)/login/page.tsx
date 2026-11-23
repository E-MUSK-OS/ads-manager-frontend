'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { setTokens } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ id_token: tokenResponse.access_token }),
        });
        setTokens(data.access_token, data.refresh_token);

        // Check if user has ads accounts to route properly
        const accounts = await apiClient('/ads-accounts');
        if (accounts && accounts.length > 0) {
          window.location.href = '/campaigns';
        } else {
          window.location.href = '/connect-amazon';
        }
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      setTokens(data.access_token, data.refresh_token);
      window.location.href = '/campaigns';
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 bg-graph-paper-faint text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 p-4 sm:p-6 lg:p-8">
      {/* =========================================================================
          TOP NAV / BRAND IDENTIFIER
          ========================================================================= */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-4 sm:mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <SlidersHorizontal className="size-4" />
          </div>
          <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
            Ads<span className="text-indigo-600">Manager</span>
          </span>
        </Link>
      </header>

      {/* =========================================================================
          MAIN AUTH CARD (SPLIT-SCREEN 2-COLUMN)
          ========================================================================= */}
      <main className="max-w-5xl w-full mx-auto my-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* -----------------------------------------------------------------------
            LEFT PANEL: TECHNICAL BRAND & CAPABILITY SHOWCASE
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle top edge technical highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 opacity-80" />

          {/* Top Section: Category Badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-indigo-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Amazon Ads Automation Suite</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mt-6 mb-3">
              The High-Precision Amazon PPC Command Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Placement bidding rules, hourly dayparting heatmaps, and budget guardrails executing 24/7 without black-box surprises.
            </p>

            {/* Brand Performance Stats (Micro KPI Cards) */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                <span className="font-mono text-lg font-bold text-white">24/7</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Dayparting</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                <span className="font-mono text-lg font-bold text-indigo-400">4</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Rule Engines</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                <span className="font-mono text-lg font-bold text-emerald-400">100%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">User Control</span>
              </div>
            </div>

            {/* Capability Badges with Pulsing Dots */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300 font-medium">
                <span className="size-1.5 rounded-full bg-indigo-400" /> Placement Rules
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Hourly Dayparting
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300 font-medium">
                <span className="size-1.5 rounded-full bg-cyan-400" /> Search Term Harvest
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300 font-medium">
                <span className="size-1.5 rounded-full bg-amber-400" /> Budget Throttle
              </span>
            </div>
          </div>

          {/* Bottom Section: Trust & Security Assurance */}
          <div className="pt-6 mt-8 border-t border-slate-800/80 flex items-center gap-2.5 text-slate-400 text-xs relative z-10">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>256-bit encryption &bull; Direct Seller Central OAuth 2.0</span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT PANEL: AUTHENTICATION FORM
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to your AdsManager account to access your command center.
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-6 p-4 border border-rose-200 bg-rose-50/90 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold text-rose-900 text-xs uppercase tracking-wider font-mono">
                  Authentication Failed
                </span>
                <span className="text-rose-700 mt-0.5 text-xs">{error}</span>
              </div>
            </div>
          )}

          {/* Google Sign-In Action */}
          <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Section Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-mono uppercase tracking-wider">
              or sign in with email
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </main>

      {/* =========================================================================
          FOOTER LEGAL NOTE
          ========================================================================= */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 mt-4 sm:mt-6 text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          By signing in, you agree to our{' '}
          <Link href="/terms-of-service" className="text-slate-600 hover:text-indigo-600 underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="text-slate-600 hover:text-indigo-600 underline">
            Privacy Policy
          </Link>
          .
        </span>
        <span>Independent Amazon PPC Automation Platform</span>
      </footer>
    </div>
  );
}
