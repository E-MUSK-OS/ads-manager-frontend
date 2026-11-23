'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  Target,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  HeartHandshake,
  Users,
  Compass,
  Zap,
  Menu,
  X,
  Building2,
  Award,
} from 'lucide-react';

export default function AboutUsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);

  const values = [
    {
      title: 'Speed & Relentless Execution',
      tagline: 'We iterate relentlessly',
      description:
        'Amazon marketplace dynamics change every hour. We execute 60-minute bid synchronization and release weekly platform improvements to keep our sellers ahead of the competition.',
      icon: Zap,
    },
    {
      title: 'Customer Control Above All',
      tagline: 'No black-box guesswork',
      description:
        'We reject black-box algorithms that make unexplainable bid changes. Every automated multiplier, keyword bid, and negative addition is fully transparent and reviewable in your batch queue.',
      icon: Target,
    },
    {
      title: 'Transparent & Fair Pricing',
      tagline: 'Zero percentage-of-spend tax',
      description:
        'Legacy platforms penalize your success by taking a percentage of your total advertising spend. We believe that is wrong. We offer flat monthly subscriptions with zero spend penalties.',
      icon: HeartHandshake,
    },
    {
      title: 'Enterprise Data Isolation',
      tagline: 'Your data is strictly yours',
      description:
        'We never pool, monetize, or benchmark your search query data or campaign metrics across sellers. Your business performance remains strictly isolated with bank-grade 256-bit encryption.',
      icon: ShieldCheck,
    },
  ];

  const milestones = [
    {
      year: 'The Origin',
      title: '30+ Hours Lost Every Single Week',
      description:
        'Our founding team managed Amazon Sponsored Ads manually across dozens of brands. We spent 30+ hours a week exporting search term reports, computing placement multipliers in Excel, and reacting too late to overnight budget spikes.',
    },
    {
      year: 'The First Engine',
      title: 'Automated Placement Multipliers',
      description:
        'We built our first internal rule engine to dynamically adjust Top of Search multipliers based on true conversion rate deltas. Our initial accounts saw immediate reductions in wasted spend and dramatic increases in organic rank.',
    },
    {
      year: 'The Innovation',
      title: '24/7 Hourly Dayparting & Heatmaps',
      description:
        'We introduced real-time 168-hour dayparting heatmaps, allowing advertisers to concentrate budgets during peak converting hours and throttle bids during overnight lulls when clicks fail to convert.',
    },
    {
      year: 'Today & Beyond',
      title: 'A Unified Platform for High-Growth Sellers',
      description:
        'Today, AdsManager serves high-volume Amazon sellers and brand aggregators worldwide, managing algorithmic campaigns with zero black-box surprises and 100% human-in-the-loop control.',
    },
  ];

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
            <Link href="/features" className="hover:text-indigo-600 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </Link>
            <Link href="/about-us" className="text-indigo-600 font-semibold transition-colors">
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
              className="block py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
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
              className="block py-2 text-sm font-semibold text-indigo-600"
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium mb-4 shadow-2xs">
            <span className="size-1.5 rounded-full bg-indigo-600" />
            <span className="uppercase tracking-wider">About AdsManager</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            We&apos;re <span className="text-indigo-600">AdsManager</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Transforming the advertising landscape for online sellers. We combine programmatic bidding
            intelligence with deep Amazon marketplace expertise to help brands scale with precision and predictability.
          </p>

          {/* Micro Stat Highlights */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-slate-900">24/7</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Automated Execution</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-indigo-600">4</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Core Rule Engines</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-emerald-600">100%</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Seller Control</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-slate-900">0%</span>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Spend Surcharge</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MISSION & VISION
          ========================================================================= */}
      <section className="py-16 bg-slate-50 bg-graph-paper-faint">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="size-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                  <Compass className="size-6" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 block mb-2">
                  Our Mission
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Empowering Amazon Sellers with Algorithmic Superpowers
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Through precision placement multipliers, 24/7 dayparting heatmaps, and transparent condition
                  rules, we equip brand owners with the software tools they need to eliminate wasted ad spend,
                  accelerate organic rank, and achieve remarkable, sustainable growth.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Deterministic rules &bull; Zero black boxes</span>
              </div>
            </div>

            {/* Vision Card */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="size-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                  <Sparkles className="size-6" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 block mb-2">
                  Our Vision
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Revolutionizing Marketplace Advertising Through Transparency
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We envision an e-commerce ecosystem where Amazon sellers navigate high-stakes auctions with
                  absolute clarity. By replacing opaque agency retainers and percentage-of-spend penalties with
                  transparent software, advertisers can scale their brand with confidence.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Predictable bids &bull; Account isolation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. WHY WE BUILT ADSMANAGER (OUR STORY)
          ========================================================================= */}
      <section className="py-16 bg-white border-t border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 block mb-2">
              Our Story
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why We Built AdsManager
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              We were Amazon sellers and operators long before we were software engineers. We felt the pain firsthand.
            </p>
          </div>

          <div className="space-y-6">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="md:w-1/4">
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold text-indigo-600 inline-block shadow-2xs">
                    {m.year}
                  </span>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                    {m.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. WHAT WE STAND FOR (CORE VALUES)
          ========================================================================= */}
      <section className="py-16 bg-slate-50 bg-graph-paper-faint">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 block mb-2">
              Guiding Principles
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What We Stand For
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50/60 px-2.5 py-0.5 rounded-md border border-indigo-100">
                        {v.tagline}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CLOSING CTA BANNER
          ========================================================================= */}
      <section className="py-20 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 text-slate-900 border-t border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-graph-paper opacity-50 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-semibold mb-6 inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>14-Day Full-Access Free Trial · Zero Risk</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
            Ready to Scale Your Amazon Revenue?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Join hundreds of forward-thinking Amazon brand owners using AdsManager to automate advertising
            and scale profitably.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-colors text-center shadow-xs"
            >
              Contact Our Team
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Connects in &lt; 2 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Cancel anytime with 1 click
            </span>
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
              <Link href="/features" className="hover:text-indigo-600 transition-colors">
                Features Overview
              </Link>
              <Link href="/features" className="hover:text-indigo-600 transition-colors">
                Placement Rules
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
              <Link href="/about-us" className="text-indigo-600 font-semibold transition-colors">
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
              <span>Empowering Amazon Sellers Worldwide</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
