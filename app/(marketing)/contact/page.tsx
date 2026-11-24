'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  Mail,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);

  // Form State matching all fields in user image
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [monthlySpend, setMonthlySpend] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (phone && phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);

    try {
      await apiClient('/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          company,
          monthlySpend,
          topic,
          message,
        }),
      });

      setSent(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setMonthlySpend('');
      setTopic('');
      setMessage('');
    } catch (err: any) {
      // In case backend mock/endpoint is offline, still provide an informative message or fallback
      setError(
        err.message || 'Failed to submit message. Please try again or reach out to our support email directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-graph-paper text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
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
            <Link href="/contact" className="text-indigo-600 font-semibold transition-colors">
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
              className="block py-2 text-sm font-semibold text-indigo-600"
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
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-slate-200 text-indigo-700 text-xs font-mono font-medium mb-4 shadow-xs">
            <span className="size-1.5 rounded-full bg-indigo-600" />
            <span className="uppercase tracking-wider">Contact Us</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Let&apos;s <span className="text-indigo-600">Talk</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about pricing, features, or how AdsManager fits your Amazon business?
            Our team of Amazon advertising experts is here to help.
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN CONTENT: DUAL COLUMN (FORM + INFO CARDS)
          ========================================================================= */}
      <section className="pb-16 sm:pb-24 flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* -------------------------------------------------------------------
                LEFT COLUMN: SEND US A MESSAGE FORM (COL 7)
                ------------------------------------------------------------------- */}
            <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Send Us a Message
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>
              </div>

              {sent ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="size-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent Successfully!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                    Thank you for contacting AdsManager. One of our Amazon advertising specialists
                    will review your inquiry and follow up within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="p-3.5 border border-rose-200 bg-rose-50 rounded-xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
                      <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Work Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Phone Number
                        </label>
                        {phone && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {phone.length}/10 digits
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const numeric = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(numeric);
                        }}
                        placeholder="10-digit number"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 3: Company Name & Monthly Ad Spend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Your Brand"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Monthly Ad Spend
                      </label>
                      <select
                        value={monthlySpend}
                        onChange={(e) => setMonthlySpend(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                      >
                        <option value="">Select range</option>
                        <option value="under $5000">under $5000</option>
                        <option value="$5000-$20,000">$5000-$20,000</option>
                        <option value="$20,000-$100,000">$20,000-$100,000</option>
                        <option value="$100,000-$500,000">$100,000-$500,000</option>
                        <option value="$500,000+">$500,000+</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: What can we help you with? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      What can we help you with?
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    >
                      <option value="">Select a topic</option>
                      <option value="Platform Demo & Walkthrough">Platform Demo &amp; Walkthrough</option>
                      <option value="Pricing & Custom Enterprise Plans">Pricing &amp; Custom Enterprise Plans</option>
                      <option value="Automated Bidding Rules Inquiry">Automated Bidding Rules Inquiry</option>
                      <option value="Hourly Dayparting & API Setup">Hourly Dayparting &amp; API Setup</option>
                      <option value="Technical Support & Integration">Technical Support &amp; Integration</option>
                      <option value="Other Inquiries">Other Inquiries</option>
                    </select>
                  </div>

                  {/* Row 5: Message */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your business and what you're looking to achieve..."
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* -------------------------------------------------------------------
                RIGHT COLUMN: CONTACT DETAILS & HUMAN SUPPORT CARDS (COL 5)
                ------------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Card 1: Talk to a Human */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Talk to a Human</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Our team is made up of Amazon advertising experts who&apos;ve managed millions in
                  ad spend. We speak your language.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Typical response: under 4 hours</span>
                </div>
              </div>

              {/* Card 2: Contact Details */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-slate-900">Contact Details</h3>

                {/* Email */}
                <div className="flex items-start gap-3.5 text-sm text-slate-600">
                  <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </span>
                    <a
                      href="mailto:support@adsmanager.io"
                      className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      support@adsmanager.io
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5 text-sm text-slate-600">
                  <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </span>
                    <div className="font-mono text-sm text-slate-900 flex flex-col gap-0.5 mt-0.5">
                      <span>+1 (800) 492-3829</span>
                      <span>+1 (555) 019-2834</span>
                    </div>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start gap-3.5 text-sm text-slate-600">
                  <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Support Hours
                    </span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      Mon–Fri, 9:00 AM – 6:00 PM EST
                    </span>
                  </div>
                </div>

                {/* Headquarters */}
                <div className="flex items-start gap-3.5 text-sm text-slate-600">
                  <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Headquarters
                    </span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      Surat, Gujarat, India
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
              <Link href="/contact" className="text-indigo-600 font-semibold transition-colors">
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
              <span>Fast &amp; Dedicated Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
