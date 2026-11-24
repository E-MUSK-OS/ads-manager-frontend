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
  Building2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import TermsOfService from '@/components/terms-of-service';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginInWithGoogle, setLoginInWithGoogle] = useState(false);
  const [googleAuthToken, setGoogleAuthToken] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        setGoogleAuthToken(tokenResponse.access_token);
        setIsTermsOpen(true);
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  // 1. When user clicks "Create account" on the form:
  const handleOpenTerms = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // DO NOT call apiClient yet — open modal for terms agreement
    setIsTermsOpen(true);
  };

  // 2. Only called when user checks the box AND clicks "Accept & Create Account":
  const executeSignup = async () => {
    setLoading(true);
    try {
      if (loginInWithGoogle && googleAuthToken) {
        // A. Create account with Google token
        await apiClient('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ id_token: googleAuthToken, company_name: company }),
        });
        window.location.href = '/campaigns';
        return; // Skip the rest since Google login handles everything
      }

      // A. Create account
      await apiClient('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, company_name: company }),
      });

      // B. Auto login
      const data = await apiClient('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      });
      setTokens(data.access_token, data.refresh_token);

      // C. Close modal and redirect
      setIsTermsOpen(false);
      window.location.href = '/campaigns';
    } catch (err: any) {
      setIsTermsOpen(false); // Close so they can see error on the form
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                <span>14-Day Full-Featured Free Trial</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mt-6 mb-3">
                Scale Your Amazon Revenue with Algorithmic Precision
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Automate top-of-search multipliers, harvest profitable search terms, and protect margins with 24/7 automated guardrails.
              </p>

              {/* Brand Stats Grid (Micro KPI Cards) */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="font-mono text-lg font-bold text-white">14d</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Free Trial</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="font-mono text-lg font-bold text-emerald-400">0%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Spend Fee</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="font-mono text-lg font-bold text-indigo-400">3 min</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Fast Setup</span>
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
                  <span className="size-1.5 rounded-full bg-cyan-400" /> Negative Harvester
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300 font-medium">
                  <span className="size-1.5 rounded-full bg-amber-400" /> Human Batch Review
                </span>
              </div>
            </div>

            {/* Bottom Section: Trust & Security Assurance */}
            <div className="pt-6 mt-8 border-t border-slate-800/80 flex items-center gap-2.5 text-slate-400 text-xs relative z-10">
              <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
              <span>No credit card required &bull; 100% Seller data isolation</span>
            </div>
          </div>

          {/* -----------------------------------------------------------------------
              RIGHT PANEL: REGISTRATION FORM
              ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Initialize your workspace
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Start your 14-day full access trial. No credit card required.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-4 border border-rose-200 bg-rose-50/90 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-rose-900 text-xs uppercase tracking-wider font-mono">
                    Signup Failed
                  </span>
                  <span className="text-rose-700 mt-0.5 text-xs">{error}</span>
                </div>
              </div>
            )}

            {/* Google Sign-Up Action */}
            <button
              type="button"
              onClick={() => {
                setLoginInWithGoogle(true);
                googleLogin();
              }}
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
                or register with work email
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Signup Form */}
            <form onSubmit={handleOpenTerms} className="flex flex-col gap-4">
              {/* Company Name Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Company / Brand Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Acme Brands Inc."
                  />
                </div>
              </div>

              {/* Work Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password (min. 8 characters)
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Remember me on this browser</span>
                </label>
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
                    <span>Provisioning Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-8 text-center text-xs text-slate-500">
              Already registered?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </main>

        {/* =========================================================================
            FOOTER LEGAL NOTE
            ========================================================================= */}
        <footer className="max-w-5xl w-full mx-auto text-center py-4 mt-4 sm:mt-6 text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            By creating an account, you agree to our{' '}
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

      {/* Modal Dialog for Terms Agreement */}
      <TermsOfService
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={executeSignup}
      />
    </>
  );
}
