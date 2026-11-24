'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  Scale,
  ShieldAlert,
  Lock,
  FileText,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TermsOfServicePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);

  const tableOfContents = [
    { id: 'acceptance', label: '1. Acceptance & Service Scope' },
    { id: 'service-description', label: '2. Platform Capabilities & Tools' },
    { id: 'amazon-integration', label: '3. Amazon Advertising API Integration' },
    { id: 'independent-disclaimer', label: '4. Independent Platform Disclaimer' },
    { id: 'subscription-billing', label: '5. Subscriptions, Fees & Billing' },
    { id: 'acceptable-use', label: '6. Acceptable Use Policy' },
    { id: 'advertising-risks', label: '7. Advertising Performance & Marketplace Risks' },
    { id: 'liability', label: '8. Limitation of Liability' },
    { id: 'intellectual-property', label: '9. Intellectual Property & License' },
    { id: 'termination', label: '10. Termination & Disconnection' },
    { id: 'governing-law', label: '11. Governing Law & Dispute Resolution' },
    { id: 'contact', label: '12. Legal Contact Information' },
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
                <Scale className="size-3.5" />
                <span>LEGAL // TERMS OF SERVICE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Terms of Service
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Review the terms and conditions governing your use of AdsManager, our automated Amazon
                advertising tools, billing policies, and API integration responsibilities.
              </p>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-500 shrink-0">
              <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                Last Updated: November 2026
              </span>
              <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3 text-indigo-600" />
                Commercial SaaS Agreement
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

              {/* Commercial Terms Summary Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  <Lock className="size-4 text-indigo-600" />
                  <span>Key Commercial Terms</span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Flat-Rate Pricing:</strong> We do
                      not charge a percentage of your Amazon ad spend.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-semibold">User Controls Bids:</strong> All
                      rule criteria and bid ceilings remain strictly under your control.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-semibold">No Lock-in:</strong> Cancel your
                      subscription or disconnect API access at any time.
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Support Prompt */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 text-xs text-slate-700">
                <span className="font-semibold text-indigo-950 dark:text-indigo-200 block mb-1">
                  Need legal or contractual clarification?
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-2.5">
                  Reach our legal operations team directly for enterprise vendor agreements or security reviews.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  <Mail className="size-3.5" />
                  <span>Contact Legal Team</span>
                </Link>
              </div>
            </aside>

            {/* =====================================================================
                RIGHT COLUMN: TERMS SECTIONS
                ===================================================================== */}
            <article className="lg:col-span-8 p-6 sm:p-10 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-10 text-sm leading-relaxed text-slate-700">
              {/* SECTION 1 */}
              <section id="acceptance" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 01
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  1. Acceptance &amp; Service Scope
                </h2>
                <p>
                  These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding contract between you
                  (&ldquo;Customer&rdquo;, &ldquo;User&rdquo;, or &ldquo;you&rdquo;) and AdsManager
                  (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your
                  access to and utilization of the AdsManager web application, automation engines, analytics
                  dashboards, and related APIs.
                </p>
                <p>
                  By creating an account, connecting an Amazon Advertising profile via Login with Amazon (LWA), or
                  initiating an automated rule, you explicitly acknowledge that you have read, understood, and agree
                  to be bound by these Terms and our{' '}
                  <Link href="/privacy-policy" className="text-indigo-600 hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  . If you do not agree to these Terms, you must not access or use the Platform.
                </p>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 2 */}
              <section id="service-description" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 02
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  2. Platform Capabilities &amp; Tools
                </h2>
                <p>
                  AdsManager provides software-as-a-service (SaaS) tools designed for Amazon sellers, vendors, and
                  authorized agencies, including:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>
                    <strong>Automated Placement Bidding:</strong> Adjusting Top of Search and Product Detail Page bid
                    multipliers based on conversion rate and ACoS triggers.
                  </li>
                  <li>
                    <strong>Budget Guardrails:</strong> Automatic budget scaling when campaigns reach designated usage
                    thresholds and pausing spend to prevent bleeders.
                  </li>
                  <li>
                    <strong>Targeting &amp; Keyword Rules:</strong> Granular bid adjustments for exact, phrase, and
                    broad match targets and ASIN-level campaigns.
                  </li>
                  <li>
                    <strong>Search Term Intelligence:</strong> Automatic harvesting of converting customer queries and
                    negating zero-purchase non-converting bleeders.
                  </li>
                  <li>
                    <strong>Hourly Dayparting:</strong> Setting custom 24-hour bid multiplier schedules to reflect peak
                    and off-peak customer buying patterns.
                  </li>
                  <li>
                    <strong>Optimization Recommendations:</strong> Algorithmic bid suggestions with transparent batch
                    review modals before any changes are committed.
                  </li>
                </ul>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 3: AMAZON INTEGRATION */}
              <section id="amazon-integration" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 03
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  3. Amazon Advertising API Integration &amp; Authorization
                </h2>
                <p>
                  By authenticating your Amazon Advertising account through our platform, you represent, warrant,
                  and agree that:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      a. Managerial Authority &amp; Compliance
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      You are the registered owner of, or possess explicit legal authorization to manage and alter,
                      the connected Amazon Seller Central or Vendor Central advertising accounts. You agree to comply
                      at all times with the Amazon Advertising Agreement and Amazon Brand Guidelines.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      b. Programmatic API Execution Grant
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      You grant AdsManager revocable permission to communicate with the Amazon Advertising API on your
                      behalf to read advertising performance metrics and programmatically execute bid updates, budget
                      adjustments, keyword additions, and negative search term placements in accordance with your manual
                      inputs or enabled automated rules.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900">
                      c. Revocation of Authorization
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      You may revoke AdsManager’s authorization at any moment either through the account settings
                      inside AdsManager or directly within your Amazon Advertising Console under &ldquo;Manage App
                      Permissions&rdquo;.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 4: MANDATORY INDEPENDENT DISCLAIMER (PROMINENT) */}
              <section id="independent-disclaimer" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 04
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  4. Independent Platform Disclaimer
                </h2>

                {/* Prominent Warning Callout */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300">
                    <ShieldAlert className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Not An Official Amazon Partner</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    AdsManager is an independent third-party software application developed for Amazon sellers and
                    brands. <strong>AdsManager is not affiliated with, endorsed by, sponsored by, or an official
                    partner of Amazon.com, Inc. or any of its subsidiaries or affiliates.</strong>
                  </p>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Amazon, Amazon Advertising, Sponsored Products, Sponsored Brands, Sponsored Display, and all
                    associated logos, brand names, and marks are registered trademarks of Amazon.com, Inc. or its
                    affiliates. Any reference to Amazon or its trademarked services is solely descriptive and identifies
                    the third-party advertising environment that our tools optimize.
                  </p>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 5 */}
              <section id="subscription-billing" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 05
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  5. Subscriptions, Fees &amp; Billing
                </h2>
                <p>
                  AdsManager operates on a recurring software subscription model:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>
                    <strong>Transparent Flat-Rate Tiers:</strong> We believe you should keep 100% of your growth. We
                    do not assess commissions, percentages of your ad spend, or revenue penalties as your advertising
                    scales.
                  </li>
                  <li>
                    <strong>Payment Processing:</strong> All subscription charges are handled through Stripe.
                    Payments are due in advance on a monthly or annual cycle.
                  </li>
                  <li>
                    <strong>Cancellation &amp; Refunds:</strong> You may cancel your subscription at any time through
                    your Billing settings. Upon cancellation, your subscription remains active until the conclusion of
                    the current paid period. Subscriptions are non-refundable except where mandated by statutory law.
                  </li>
                </ul>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 6 */}
              <section id="acceptable-use" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 06
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  6. Acceptable Use Policy
                </h2>
                <p>You agree not to misuse the AdsManager platform. Specifically, you must not:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>
                    Use the platform to execute automated bidding strategies that violate Amazon Advertising Terms or
                    deceptive advertising policies.
                  </li>
                  <li>
                    Attempt to reverse engineer, decompile, scrape, or extract source code or proprietary heuristics from
                    our software.
                  </li>
                  <li>
                    Interfere with, overload, or bypass rate limits on our backend systems or the Amazon Ads API.
                  </li>
                  <li>
                    Share account credentials or enable unauthorized third-party access to confidential client datasets.
                  </li>
                </ul>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 7: ADVERTISING OUTCOMES & MARKETPLACE RISKS */}
              <section id="advertising-risks" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 07
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  7. Advertising Performance &amp; Marketplace Risks
                </h2>
                <p>
                  While AdsManager provides analytical insights, rule-based automations, and recommendations designed
                  to enhance campaign efficiency, advertising performance is inherently dependent upon marketplace
                  dynamics:
                </p>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <AlertCircle className="size-4 text-indigo-600" />
                    <span>No Guarantee of Sales, Conversion Rates, or ACoS</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    E-commerce advertising results depend on product demand, competitor bidding fluctuations, retail
                    buy-box eligibility, listing content quality, inventory availability, and Amazon’s internal auction
                    algorithms. <strong>We do not guarantee specific sales revenues, conversion lifts, or ACoS
                    reductions.</strong>
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    You maintain sole responsibility for establishing your bid ceilings, placement multiplier limits,
                    and campaign budgets. You should monitor active rules regularly through the platform dashboard.
                  </p>
                </div>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 8: LIMITATION OF LIABILITY */}
              <section id="liability" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 08
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  8. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by applicable law, in no event shall AdsManager, its founders,
                  officers, directors, employees, or contractors be liable for any indirect, incidental, special,
                  consequential, exemplary, or punitive damages, including loss of profits, advertising spend
                  discrepancies, Amazon account suspension, loss of business goodwill, or operational interruptions.
                </p>
                <p>
                  Our total cumulative liability arising out of or related to these Terms or the Platform shall be
                  strictly limited to the aggregate subscription fees paid by you to AdsManager during the three (3)
                  months immediately preceding the event giving rise to liability.
                </p>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 9 */}
              <section id="intellectual-property" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 09
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  9. Intellectual Property &amp; User Data Ownership
                </h2>
                <p>
                  <strong>Platform Ownership:</strong> AdsManager and its software code, UI designs, rule execution
                  architecture, documentation, and trademarks remain the exclusive intellectual property of AdsManager.
                </p>
                <p>
                  <strong>Customer Data Ownership:</strong> You retain all ownership, rights, and title to your Amazon
                  advertising campaign metrics, search term records, product catalog identifiers, and business data.
                  We process this information strictly to provide service functionality in accordance with our{' '}
                  <Link href="/privacy-policy" className="text-indigo-600 hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 10 */}
              <section id="termination" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 10
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  10. Termination &amp; Disconnection
                </h2>
                <p>
                  Either party may terminate this agreement at any time. You can disconnect your Amazon Advertising
                  accounts from the settings interface, which immediately invalidates and deletes your stored OAuth
                  refresh tokens.
                </p>
                <p>
                  We reserve the right to suspend or terminate accounts that breach these Terms, fail to satisfy
                  subscription fees, or violate Amazon Advertising API policies. Upon termination, your right to access
                  the Platform ceases immediately.
                </p>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 11 */}
              <section id="governing-law" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 11
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  11. Governing Law &amp; Dispute Resolution
                </h2>
                <p>
                  These Terms and any dispute or claim arising out of or related to their subject matter shall be
                  governed by and construed in accordance with applicable commercial laws, without regard to conflict
                  of law principles.
                </p>
                <p>
                  Prior to initiating formal legal proceedings, the parties agree to seek informal resolution in good
                  faith by notifying each other in writing. If a dispute cannot be resolved informally within thirty
                  (30) business days, it shall be submitted to the competent courts of jurisdiction.
                </p>
              </section>

              <hr className="border-slate-200" />

              {/* SECTION 12 */}
              <section id="contact" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Section 12
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  12. Legal Contact Information
                </h2>
                <p>
                  For legal inquiries, compliance audits, or formal communications regarding these Terms of Service,
                  please contact our legal department:
                </p>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Legal Department:</span>{' '}
                    <span className="text-indigo-600 font-bold">legal@adsmanager.com</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Billing Support:</span>{' '}
                    <span className="text-slate-800">billing@adsmanager.com</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Service:</span>{' '}
                    <span className="text-slate-800">AdsManager Software Platform</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans pt-1">
                    Formal legal notices must be delivered via email to legal@adsmanager.com.
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
              <Link href="/privacy-policy" className="hover:text-indigo-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-indigo-600 font-semibold transition-colors">
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
              <span>Transparent &amp; Fair Commercial Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
