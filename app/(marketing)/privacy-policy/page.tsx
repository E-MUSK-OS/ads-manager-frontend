'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  Trash2,
  FileText,
  Mail,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);

  const tableOfContents = [
    { id: 'introduction', label: '1. Introduction & Scope' },
    { id: 'information-we-collect', label: '2. Information We Collect' },
    { id: 'amazon-api-data', label: '3. Amazon Advertising API Data Protection' },
    { id: 'how-we-use-data', label: '4. How We Use Your Information' },
    { id: 'ai-processing', label: '5. AI Processing & Large Language Models' },
    { id: 'security-standards', label: '6. Security, Storage & Encryption' },
    { id: 'data-retention', label: '7. Data Retention & Deletion Policy' },
    { id: 'subprocessors', label: '8. Third-Party Subprocessors' },
    { id: 'your-rights', label: '9. Your Rights & Data Portability' },
    { id: 'contact-us', label: '10. Contact Us & Privacy Requests' },
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
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <ThemeToggle mobile />
              {authToken ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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
          2. PAGE HERO BANNER
          ========================================================================= */}
      <section className="relative py-12 md:py-16 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-graph-paper opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to AdsManager</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-semibold mb-3">
                <ShieldCheck className="size-3.5" />
                <span>LEGAL &amp; DATA GOVERNANCE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Learn how AdsManager collects, protects, and governs your Amazon Advertising data with
                bank-grade encryption, complete seller isolation, and zero third-party data monetization.
              </p>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-500 shrink-0">
              <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                Last Updated: November 2026
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-600" />
                Amazon API Data Compliant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN CONTENT: DUAL COLUMN LAYOUT
          ========================================================================= */}
      <main className="flex-1 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* =====================================================================
                LEFT COLUMN: STICKY TABLE OF CONTENTS & QUICK SUMMARY
                ===================================================================== */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              {/* Navigation Card */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between lg:pointer-events-none pb-3 border-b border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-indigo-600" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      On This Page
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 lg:hidden text-xs text-indigo-600 font-semibold">
                    <span>{mobileTocOpen ? 'Hide' : 'Jump to section'}</span>
                    {mobileTocOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </button>
                <nav className={`mt-3 flex flex-col gap-1.5 text-xs ${mobileTocOpen ? 'flex' : 'hidden lg:flex'}`}>
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setMobileTocOpen(false)}
                      className="px-2.5 py-1.5 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Security Assurance Badge Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  <Lock className="size-4 text-emerald-600" />
                  <span>Privacy Guarantees</span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Zero Data Brokering:</strong> We
                      never sell, rent, or trade your advertising metrics.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Siloed Data Isolation:</strong>{' '}
                      Your advertising data is never pooled or benchmarked across sellers.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Instant Disconnect:</strong>{' '}
                      Disconnecting your account immediately purges stored OAuth tokens and halts sync while preserving historical reporting.
                    </span>
                  </div>
                </div>
              </div>

              {/* Support Contact Prompt */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 text-xs text-slate-700">
                <span className="font-semibold text-indigo-950 dark:text-indigo-200 block mb-1">
                  Questions about our security practices?
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-2.5">
                  Our Data Protection team is ready to assist with privacy audits, compliance documentation, or deletion requests.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  <Mail className="size-3.5" />
                  <span>Contact Data Protection Officer</span>
                </Link>
              </div>
            </aside>

            {/* =====================================================================
                RIGHT COLUMN: POLICY SECTIONS
                ===================================================================== */}
            <article className="lg:col-span-8 p-6 sm:p-10 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-10 text-sm leading-relaxed text-slate-700">
              {/* SECTION 1 */}
              <section id="introduction" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 01
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  1. Introduction &amp; Scope
                </h2>
                <p>
                  This Privacy Policy outlines how AdsManager (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                  &ldquo;our&rdquo;) collects, processes, stores, and safeguards personal data and
                  advertising account metrics when you access our web application, analytics dashboards,
                  automated bidding tools, and customer support channels.
                </p>
                <p>
                  AdsManager is an independent third-party software provider that integrates with the official
                  Amazon Advertising API to deliver campaign visualization, automated placement rules, budget
                  guardrails, and search term optimization. We operate strictly as a data processor for
                  authorized Amazon advertisers.
                </p>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 2 */}
              <section id="information-we-collect" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 02
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  2. Information We Collect
                </h2>
                <p>
                  We collect only the minimum required information necessary to provide our campaign
                  management services:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      a. Account &amp; Identity Information
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Your full name, business email address, company name, and encrypted authentication
                      credentials generated during registration or Google OAuth login.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      b. Amazon Advertising Account &amp; Performance Data
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      When you authorize AdsManager via Login with Amazon (LWA), we retrieve your advertising
                      profiles, campaign identifiers, ad groups, targeting parameters, placement multipliers,
                      historical spend, attributed sales, clicks, impressions, conversion counts, ACoS, and ROAS.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      c. Billing &amp; Payment Records
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Subscription status, invoice history, and billing addresses. All payment card details are
                      handled directly by our PCI-DSS certified payment processor (Stripe). We never process or
                      store raw credit card numbers on our servers.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      d. System Logs &amp; Audit Trail
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      IP addresses, browser client user-agents, rule trigger execution logs, and API request
                      timestamps collected strictly for system stability, security auditing, and fraud prevention.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 3: HIGHLIGHTED AMAZON API DATA PROTECTION */}
              <section id="amazon-api-data" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 03
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  3. Amazon Advertising API Data Protection
                </h2>
                <p>
                  AdsManager strictly adheres to Amazon&apos;s Data Protection Policy, Amazon Advertising API
                  Developer License Agreement, and Acceptable Use Policy:
                </p>

                {/* Callout Box */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Strict Seller Isolation &amp; Zero Data Monetization</span>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-emerald-900 space-y-1.5 leading-relaxed">
                    <li>
                      <strong>No Data Brokering:</strong> We do NOT sell, rent, license, or monetize Amazon
                      advertising data, search terms, or bid values to any third party.
                    </li>
                    <li>
                      <strong>No Cross-Account Intelligence:</strong> Your campaign metrics are isolated in your
                      own database partition. We never aggregate or benchmark your conversion data to train public
                      models or sell competitive intelligence to other sellers.
                    </li>
                    <li>
                      <strong>Strict Purpose Limitation:</strong> Amazon Advertising data is utilized solely to
                      display analytics, execute user-configured automation rules, and generate optimization
                      recommendations for your account.
                    </li>
                  </ul>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 4 */}
              <section id="how-we-use-data" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 04
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  4. How We Use Your Information
                </h2>
                <p>We process collected data exclusively for the following authorized operational purposes:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>
                    Rendering customized advertising dashboards, metric heatmaps, and placement efficiency reports.
                  </li>
                  <li>
                    Evaluating user-defined automated rules (Placement multipliers, Budget usage throttles, Target
                    bid shifts, and Search Term harvesting).
                  </li>
                  <li>
                    Dispatching authorized bid updates and campaign status changes directly to the Amazon Ads API.
                  </li>
                  <li>
                    Displaying transparent audit logs of all automated actions and threshold evaluations.
                  </li>
                  <li>
                    Delivering account security alerts, billing notifications, and customer support communications.
                  </li>
                </ul>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 5 */}
              <section id="ai-processing" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 05
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  5. AI Processing &amp; Large Language Models
                </h2>
                <p>
                  AdsManager utilizes enterprise AI language model APIs to provide natural language campaign
                  summaries and optimization suggestions. When generating recommendations:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>
                    Only aggregated, anonymized metric totals (e.g. 30-day spend totals and campaign counts) are
                    passed into the context window.
                  </li>
                  <li>
                    Personal customer information, credit card numbers, and raw seller identity details are strictly
                    excluded from AI prompts.
                  </li>
                  <li>
                    Under enterprise zero-data-retention agreements, customer data sent via our AI endpoints is
                    <strong> not used to train or fine-tune public foundation models</strong>.
                  </li>
                </ul>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 6 */}
              <section id="security-standards" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 06
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  6. Security, Storage &amp; Encryption
                </h2>
                <p>
                  We maintain robust administrative, technical, and physical safeguards designed to protect your data
                  against unauthorized access, alteration, or disclosure:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Lock className="size-3.5 text-indigo-600" />
                      Encryption at Rest
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      All Amazon OAuth tokens and database records are encrypted at rest using authenticated
                      cryptography (AES-128 Fernet / AES-256).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-indigo-600" />
                      Encryption in Transit
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      All inbound browser connections and outbound Amazon Advertising API communications enforce TLS
                      1.3 encryption with strict HTTPS.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 7 */}
              <section id="data-retention" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 07
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  7. Data Retention &amp; Deletion Policy
                </h2>
                <p>
                  We retain advertising performance data only for as long as your AdsManager account remains active
                  and authorized:
                </p>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Trash2 className="size-4 text-rose-600" />
                    <span>Instant Account Disconnect &amp; Permanent Erasure</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    You can disconnect your Amazon Advertising account at any time from your settings panel.
                    Disconnecting an account immediately purges and nullifies stored OAuth refresh tokens, stopping all automated sync.
                    Historical campaign reporting metrics are preserved for your review unless you submit a full account deletion request.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    To request permanent erasure of all historical campaign metrics, logs, and user records, submit a data deletion request through our{' '}
                    <Link href="/contact" className="text-indigo-600 underline font-medium hover:text-indigo-800">
                      Contact &amp; Privacy Request Form
                    </Link>{' '}
                    or email our Data Protection Officer at{' '}
                    <a href="mailto:privacy@netutechno.com" className="text-indigo-600 underline font-mono font-medium hover:text-indigo-800">
                      privacy@netutechno.com
                    </a>. All data is permanently purged within 30 days of verified request receipt.
                  </p>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 8 */}
              <section id="subprocessors" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 08
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  8. Third-Party Subprocessors
                </h2>
                <p>
                  We partner with vetted, industry-leading infrastructure providers subject to strict confidentiality
                  and data processing agreements:
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 font-mono text-[11px] text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Subprocessor</th>
                        <th className="py-2.5 px-3">Service Role</th>
                        <th className="py-2.5 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">PostgreSQL Managed Cloud</td>
                        <td className="py-2.5 px-3">Encrypted database storage</td>
                        <td className="py-2.5 px-3">United States / Global</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">Stripe, Inc.</td>
                        <td className="py-2.5 px-3">PCI-compliant subscription billing</td>
                        <td className="py-2.5 px-3">United States</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">Cloud Hosting Infrastructure</td>
                        <td className="py-2.5 px-3">Application compute &amp; API routing</td>
                        <td className="py-2.5 px-3">Global Edge Network</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 9 */}
              <section id="your-rights" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 09
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  9. Your Rights &amp; Data Portability
                </h2>
                <p>
                  Depending on your jurisdiction (including GDPR, CCPA, and applicable data privacy regulations), you
                  possess the following statutory rights regarding your personal information:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li><strong>Right to Access:</strong> Request a copy of the personal data we store about you.</li>
                  <li><strong>Right to Correction:</strong> Rectify inaccurate or incomplete account details.</li>
                  <li><strong>Right to Erasure:</strong> Request permanent deletion of all stored account information.</li>
                  <li><strong>Right to Restrict Processing:</strong> Pause automated data evaluation and rules.</li>
                  <li><strong>Revoke API Access:</strong> You can revoke AdsManager&apos;s API authorization directly at any time from your Amazon Advertising Console under &ldquo;Manage App Permissions&rdquo;.</li>
                </ul>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 10 */}
              <section id="contact-us" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 10
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  10. Contact Us &amp; Privacy Requests
                </h2>
                <p>
                  If you have questions regarding this Privacy Policy, wish to exercise your data subject rights, or
                  need compliance documentation, please reach out directly:
                </p>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Privacy &amp; Data Protection:</span>{' '}
                    <span className="text-indigo-600 font-bold">privacy@netutechno.com</span>
                  </div>
                  <div>
                    <span className="text-slate-500">General Support:</span>{' '}
                    <span className="text-slate-800">support@netutechno.com</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Platform:</span>{' '}
                    <span className="text-slate-800">AdsManager Software Platform</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans pt-1">
                    Response time: We acknowledge and review all data requests within 48 business hours.
                  </div>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

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
              <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
                Transparent Pricing
              </Link>
            </div>

            {/* Column 3: Resources & Support */}
            <div className="flex flex-col gap-2">
              <span className="font-mono font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Company &amp; Support
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
                Create Account
              </Link>
            </div>

            {/* Column 4: Legal */}
            <div className="flex flex-col gap-2">
              <span className="font-mono font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Legal
              </span>
              <Link href="/privacy-policy" className="text-indigo-600 font-semibold transition-colors">
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
              <span>Enterprise-Grade Privacy &amp; Data Isolation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
