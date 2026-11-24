'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);

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
            <Link href="/pricing" className="text-indigo-600 font-semibold transition-colors">
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
              className="block py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-indigo-600"
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium mb-4 shadow-2xs">
            <span className="size-1.5 rounded-full bg-indigo-600" />
            <span className="uppercase tracking-wider">Transparent Pricing</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Simple, Flat <span className="text-indigo-600">Subscriptions</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Zero percentage-of-ad-spend penalties. We never punish your growth. Choose the plan that fits
            your monthly advertising volume.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>All plans include a 14-day free trial &bull; No credit card required</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PRICING CARDS
          ========================================================================= */}
      <section className="py-16 bg-slate-50 bg-graph-paper-faint flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Starter Plan
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Essential placement and bidding automation for emerging Amazon sellers.
                </p>

                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-mono text-slate-900">&#8377;2,499</span>
                    <span className="text-sm font-sans text-slate-500">/month</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">Billed monthly</span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Up to &#8377;5,00,000 monthly ad spend</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Top-of-Search placement rules</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Hourly dayparting heatmaps</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Search term auto-harvesting</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Standard email support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl text-center transition-colors block"
              >
                Choose Starter
              </Link>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="bg-white rounded-2xl border-2 border-indigo-600 p-8 shadow-md flex flex-col justify-between relative hover:shadow-lg transition-all">
              <div className="absolute -top-3.5 right-6 bg-indigo-600 text-white px-3 py-0.5 text-[11px] font-mono font-bold tracking-wider uppercase rounded-full shadow-xs">
                MOST POPULAR
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Growth Plan
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Advanced 24/7 rule engines &amp; human-in-the-loop batch review for scaling brands.
                </p>

                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-mono text-slate-900">&#8377;7,999</span>
                    <span className="text-sm font-sans text-slate-500">/month</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">Billed monthly</span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Up to &#8377;25,00,000 monthly spend</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>All 4 automation engines (Placement, Budget, Targeting, Search)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>60-minute real-time rule polling</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Human-in-the-loop batch review queue</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Priority live chat &amp; email support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl text-center shadow-xs transition-colors block"
              >
                Choose Pro (14-Day Free Trial)
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Custom Plan
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                <p className="text-xs text-slate-500 mb-6">
                  For brand aggregators, large catalogs, and high-spend advertising portfolios.
                </p>

                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">Custom</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">Tailored to your catalog size</span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Unlimited monthly ad spend</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Custom rule frequency &amp; custom API integration</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Multi-brand &amp; multi-country console</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Dedicated account strategist &amp; SLA</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Custom invoicing &amp; volume discounts</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl text-center transition-colors block shadow-xs"
              >
                Contact Enterprise Sales
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 font-mono">
            Prices in INR. GST as applicable. 100% money-back guarantee within the first 30 days.
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FOOTER
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
              <Link href="/pricing" className="text-indigo-600 font-semibold transition-colors">
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
              <span>Predictable &amp; Honest Subscriptions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
