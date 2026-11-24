'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  Target,
  Zap,
  Clock,
  Search,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Eye,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  Sliders,
  DollarSign,
  Filter,
} from 'lucide-react';

export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);
  const [activeTab, setActiveTab] = useState<'all' | 'campaigns' | 'keywords' | 'analytics' | 'safeguards'>('all');

  const categories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'campaigns', label: 'Campaign & Bidding Automation' },
    { id: 'keywords', label: 'Search Term & Keyword Intel' },
    { id: 'analytics', label: 'Real-Time Analytics & Profit' },
    { id: 'safeguards', label: 'Safeguards & Human Control' },
  ];

  const features = [
    // Category: campaigns
    {
      category: 'campaigns',
      categoryLabel: 'Campaign & Bidding',
      title: 'Placement Bidding Multipliers',
      description:
        'Automatically calculate and apply percentage multipliers (up to 900%) for Top of Search and Product Pages based on placement-specific ACoS and conversion rate deltas.',
      icon: Target,
      badge: 'Core Engine',
      metrics: 'Up to 900% bid boost',
    },
    {
      category: 'campaigns',
      categoryLabel: 'Campaign & Bidding',
      title: '24/7 Hourly Dayparting & Heatmaps',
      description:
        'Boost bids during peak shopping hours when customer conversion rate is highest, and throttle bids during quiet overnight hours to stop wasted budget.',
      icon: Clock,
      badge: '24/7 Automation',
      metrics: 'Hourly precision (00:00–23:00)',
    },
    {
      category: 'campaigns',
      categoryLabel: 'Campaign & Bidding',
      title: 'Algorithmic Budget Throttling',
      description:
        'Automatically scale daily budgets on high-performing campaigns while capping or pausing campaigns that hit safety spend limits before overspending.',
      icon: DollarSign,
      badge: 'Margin Guard',
      metrics: 'Real-time spend tracking',
    },
    {
      category: 'campaigns',
      categoryLabel: 'Campaign & Bidding',
      title: 'Targeting & Keyword Bid Rules',
      description:
        'Define rules using multi-condition logic (ACoS, ROAS, Spend, Impressions, CTR) to incrementally increase, decrease, or reset keyword bids by fixed currency or percentage.',
      icon: Sliders,
      badge: 'Automated Rules',
      metrics: 'Percentage & Fixed adjustments',
    },
    {
      category: 'campaigns',
      categoryLabel: 'Campaign & Bidding',
      title: 'Automated Campaign Scheduling',
      description:
        'Activate or pause specific campaigns on chosen days of the week or promotional windows, ensuring peak holiday budgets are deployed precisely when needed.',
      icon: Zap,
      badge: 'Scheduling',
      metrics: 'Day-of-week recurrence',
    },
    {
      category: 'campaigns',
      categoryLabel: 'Campaign & Bidding',
      title: 'Product Ad Attribution Tracking',
      description:
        'Isolate ad performance by parent SKU and ASIN to understand exact advertising ROI, margin contribution, and organic rank impact across your catalog.',
      icon: Layers,
      badge: 'Attribution',
      metrics: 'SKU & ASIN level breakdown',
    },

    // Category: keywords
    {
      category: 'keywords',
      categoryLabel: 'Keyword Intelligence',
      title: 'Search Term Auto-Harvesting',
      description:
        'Automatically discover real customer queries from broad and auto campaigns meeting your order and conversion criteria, graduating them directly into exact match targets.',
      icon: Search,
      badge: 'Auto-Harvesting',
      metrics: 'Zero manual spreadsheet work',
    },
    {
      category: 'keywords',
      categoryLabel: 'Keyword Intelligence',
      title: 'Negative Keyword Auto-Isolation',
      description:
        'Detect bleeding search terms that cross your spend or click thresholds without converting, instantly adding them as negative exact keywords to eliminate waste.',
      icon: Filter,
      badge: 'Waste Prevention',
      metrics: 'Instant negative exact sync',
    },
    {
      category: 'keywords',
      categoryLabel: 'Keyword Intelligence',
      title: 'Match Type Expansion & Migration',
      description:
        'Systematically promote proven search terms across Broad, Phrase, and Exact match ad groups with automated negative cross-pollination to prevent self-cannibalization.',
      icon: TrendingUp,
      badge: 'Scale Engine',
      metrics: 'Prevents keyword cannibalization',
    },
    {
      category: 'keywords',
      categoryLabel: 'Keyword Intelligence',
      title: 'Keyword Search Term Funneling',
      description:
        'Map the customer journey from discovery to high-intent conversion queries with automated keyword funnel progression and bid tiering.',
      icon: BarChart3,
      badge: 'Funnel Intel',
      metrics: 'Full query lifecycle tracking',
    },

    // Category: analytics
    {
      category: 'analytics',
      categoryLabel: 'Analytics & Reporting',
      title: 'Live Command Center Dashboard',
      description:
        'High-density dashboard monitoring Spend, Sales, ACoS, ROAS, and live campaign status with instant hourly sync across all active ad accounts.',
      icon: BarChart3,
      badge: 'Real-Time',
      metrics: 'Real-time KPI visualization',
    },
    {
      category: 'analytics',
      categoryLabel: 'Analytics & Reporting',
      title: 'Hourly Heatmaps & Conversion Curves',
      description:
        'Visual 7x24 heatmap matrix revealing your true sales peaks, click velocity, and optimal bidding windows based on actual order timestamps.',
      icon: Clock,
      badge: 'Visual Heatmap',
      metrics: '168-hour performance grid',
    },
    {
      category: 'analytics',
      categoryLabel: 'Analytics & Reporting',
      title: 'Audit Trail & Complete Change History',
      description:
        'Every single bid change, multiplier update, and negative keyword addition is permanently logged with the trigger condition, timestamp, and API status.',
      icon: RotateCcw,
      badge: '100% Transparent',
      metrics: 'Complete rollback audit log',
    },
    {
      category: 'analytics',
      categoryLabel: 'Analytics & Reporting',
      title: 'Multi-Account & Marketplace Switcher',
      description:
        'Seamlessly switch between North American, European, and Asian Amazon marketplaces or manage multiple brands from one unified session.',
      icon: SlidersHorizontal,
      badge: 'Global Scale',
      metrics: 'Multi-brand & Multi-region',
    },

    // Category: safeguards
    {
      category: 'safeguards',
      categoryLabel: 'Safeguards & Control',
      title: 'Human-in-the-Loop Batch Review Queue',
      description:
        'Review and approve algorithmic bid adjustments before they touch your live Amazon account. Compare old vs. new values and projected spend impact.',
      icon: Eye,
      badge: 'Human Control',
      metrics: 'Zero surprise bid changes',
    },
    {
      category: 'safeguards',
      categoryLabel: 'Safeguards & Control',
      title: 'Absolute Bid Ceilings & Floors',
      description:
        'Hard safety limits configured at the account and campaign levels ensure algorithms can never bid higher than your pre-approved maximum threshold.',
      icon: ShieldCheck,
      badge: 'Budget Guard',
      metrics: 'Enforced maximum CPC limits',
    },
    {
      category: 'safeguards',
      categoryLabel: 'Safeguards & Control',
      title: 'Rule Blackout & Conflict Prevention',
      description:
        'Intelligent safety checks prevent overlapping rules from conflicting or bidding against each other on the same targeting entity.',
      icon: AlertTriangle,
      badge: 'Conflict Engine',
      metrics: 'Automated conflict detection',
    },
    {
      category: 'safeguards',
      categoryLabel: 'Safeguards & Control',
      title: 'Enterprise Seller Data Isolation',
      description:
        'Your advertising performance data, search queries, and product metrics are strictly isolated with AES-256 encryption. We never broker or share data.',
      icon: Lock,
      badge: 'Data Security',
      metrics: '100% Private seller silo',
    },
  ];

  const filteredFeatures =
    activeTab === 'all' ? features : features.filter((f) => f.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* =========================================================================
          1. HEADER NAVIGATION
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal className="size-4" />
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
              Ads<span className="text-indigo-600">Manager</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-indigo-600 font-semibold transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </Link>
            <Link href="/about-us" className="hover:text-indigo-600 transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">
              Contact Us
            </Link>
          </nav>

          {/* Action CTAs */}
          {authToken ? (
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          )}

          {/* Mobile Actions: Theme Toggle & Menu Button */}
          <div className="md:hidden flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              Home
            </Link>
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-indigo-600"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              Pricing
            </Link>
            <Link
              href="/about-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              Contact Us
            </Link>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <ThemeToggle mobile />
              {authToken ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative pt-16 pb-12 sm:pt-20 sm:pb-16 bg-white border-b border-slate-200 bg-graph-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium mb-4 shadow-2xs">
            <span className="size-1.5 rounded-full bg-indigo-600" />
            <span className="uppercase tracking-wider">Complete Capabilities Overview</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Every Tool You Need to{' '}
            <span className="text-indigo-600">Scale on Amazon</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            One unified automation command center designed to optimize placement multipliers, execute 24/7
            hourly dayparting, harvest winning search terms, and enforce strict margin safeguards.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors text-center shadow-xs"
            >
              Talk to Specialist
            </Link>
          </div>

          {/* Metrics summary bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-slate-900">4</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Rule Engines</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-indigo-600">24/7</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Hourly Dayparting</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-emerald-600">100%</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Human Control</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-slate-900">0%</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Ad Spend Cut</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CATEGORY FILTER TABS
          ========================================================================= */}
      <section className="sticky top-16 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURES GRID
          ========================================================================= */}
      <section className="py-16 bg-slate-50 bg-graph-paper-faint flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Icon className="size-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-mono font-medium">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                      {f.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span className="text-indigo-600 font-semibold">{f.categoryLabel}</span>
                    <span className="text-[11px] text-slate-400">{f.metrics}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. DEEP DIVE: ARCHITECTURE & SAFETY
          ========================================================================= */}
      <section className="py-16 bg-white border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 block mb-2">
              Autonomous Yet Completely Controlled
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              A Platform Built for Maximum Impact, Zero Surprises
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated 60-Min Polling</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rules evaluate your Amazon ad metrics every hour. Bids adjust up or down continuously based
                on real-time data instead of stale weekly averages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Granular Placement Multipliers</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Separately optimize Top of Search vs Product Detail Pages. Never overpay for generic placement
                traffic that fails to convert.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Human Batch Approvals</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You retain ultimate authority. Run rules in preview mode, inspect proposed bid delta tables,
                and push updates with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CLOSING CTA BANNER
          ========================================================================= */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Put These Automation Engines to Work?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8">
            Start scaling your Amazon ad revenue today with automated placement multipliers, 24/7 dayparting,
            and complete seller account isolation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Get Started in 3 Minutes</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-700 transition-colors text-center"
            >
              View Transparent Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Column 1: Brand Info */}
            <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-mono text-base font-bold text-slate-900">
                <div className="size-6 rounded bg-indigo-600 flex items-center justify-center text-white">
                  <SlidersHorizontal className="size-3.5" />
                </div>
                <span>AdsManager</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-xs">
                Intelligent Amazon PPC automation platform. Setting the standard for high-precision
                placement, budget, and targeting rules.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="flex flex-col gap-2">
              <span className="font-mono font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Product
              </span>
              <Link href="/features" className="text-indigo-600 font-semibold transition-colors">
                Features Overview
              </Link>
              <Link href="/features" className="hover:text-indigo-600 transition-colors">
                Placement Multipliers
              </Link>
              <Link href="/features" className="hover:text-indigo-600 transition-colors">
                Hourly Dayparting
              </Link>
              <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
                Transparent Pricing
              </Link>
            </div>

            {/* Column 3: Company & Support */}
            <div className="flex flex-col gap-2">
              <span className="font-mono font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Company
              </span>
              <Link href="/about-us" className="hover:text-indigo-600 transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                Contact Support
              </Link>
              <Link href="/login" className="hover:text-indigo-600 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-indigo-600 transition-colors">
                Create Free Account
              </Link>
            </div>

            {/* Column 4: Legal */}
            <div className="flex flex-col gap-2">
              <span className="font-mono font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Legal
              </span>
              <Link href="/privacy-policy" className="hover:text-indigo-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-indigo-600 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Prominent Legal Disclaimer */}
          <div className="pt-8 border-t border-slate-200 flex flex-col gap-3 text-slate-400 text-[11px] leading-relaxed">
            <p>
              <strong className="text-slate-500 font-semibold">Disclaimer:</strong> AdsManager is an
              independent analytics, reporting, and campaign optimization software platform developed
              for Amazon advertisers and e-commerce sellers. AdsManager is not affiliated with,
              associated with, authorized by, endorsed by, or in any way officially connected with
              Amazon.com, Inc. or any of its subsidiaries or affiliates. Amazon, Amazon Advertising,
              Sponsored Products, Sponsored Brands, Sponsored Display, and all related names, marks,
              emblems, and images are registered trademarks of Amazon.com, Inc. or its affiliates.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-slate-400 font-mono text-[10px]">
              <span>&copy; {new Date().getFullYear()} AdsManager Platform. All rights reserved.</span>
              <span>Algorithmic Precision for High-Growth Amazon Sellers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
