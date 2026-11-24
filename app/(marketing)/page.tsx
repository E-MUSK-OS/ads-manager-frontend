'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import {
  SlidersHorizontal,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Percent,
  Check,
  X,
  Menu,
  Activity,
  DollarSign,
  Cpu,
  Filter,
  Play,
  Pause,
  Lock,
  ExternalLink,
  Database,
  AlertTriangle,
  Workflow,
  Boxes,
  FileSpreadsheet,
  Gauge,
} from 'lucide-react';

/**
 * ScrollReveal: Lightweight native IntersectionObserver wrapper for smooth
 * scroll-triggered entrance animations (fade in + slide up) as the user scrolls down.
 * Always fails open and checks immediate visibility to prevent blank screen issues.
 */
function ScrollReveal({
  children,
  className = '',
  delay = 0,
  initialVisible = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  initialVisible?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialVisible) return;
    if (typeof window === 'undefined') return;

    const el = ref.current;
    if (!el) return;

    // 1. Immediate check if element is already in or near viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 150 && rect.bottom > -150) {
      setIsVisible(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // 2. High sensitivity with 120px lookahead margin
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0,
        rootMargin: '120px 0px 120px 0px',
      }
    );

    observer.observe(el);

    // 3. Guaranteed safety fallback: never leave content permanently hidden
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [initialVisible]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.99]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function MarketingHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hero Simulator Tab
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<'placement' | 'dayparting' | 'harvest' | 'budget'>('placement');
  const [selectedDaypartingWindow, setSelectedDaypartingWindow] = useState<'overnight' | 'morning' | 'midday' | 'prime'>('prime');
  
  // Interactive Calculator State
  const [monthlySpend, setMonthlySpend] = useState<number>(35000);
  const [currentAcos, setCurrentAcos] = useState<number>(32);

  // --- NEW UNIQUE INTERACTIVE COMPONENTS STATES AFTER CALCULATOR ---
  
  // 1. Account Profit Protection Radar Selected Leak
  const [activeLeak, setActiveLeak] = useState<number>(0);
  const [simulatedSealActive, setSimulatedSealActive] = useState<boolean>(false);

  // 2. Interactive 24-Hour Dayparting Time Dial
  const [interactiveHour, setInteractiveHour] = useState<number>(20); // 20:00 (Prime)

  // 3. Search Term Sieve Product Category
  const [sieveProduct, setSieveProduct] = useState<'matcha' | 'pillow' | 'earbuds'>('matcha');

  // 4. Interactive Human Batch Review Queue Simulation
  const [selectedBatchItems, setSelectedBatchItems] = useState<number[]>([1, 2, 3, 4]);
  const [batchStatus, setBatchStatus] = useState<'pending' | 'applying' | 'applied'>('pending');

  // 5. Comparison View Mode (Seller Central vs AdsManager)
  const [comparisonMode, setComparisonMode] = useState<'adsmanager' | 'sellercentral'>('adsmanager');

  // 6. Active Seller Profile Tab
  const [activeSellerTab, setActiveSellerTab] = useState<number>(0);

  // 7. FAQ Filter & Accordion State
  const [faqCategory, setFaqCategory] = useState<'all' | 'architecture' | 'dayparting' | 'pricing'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Calculator Math
  const calculatedSavings = Math.round(monthlySpend * 0.142);
  const targetAcos = Math.max(12, Math.round(currentAcos * 0.74));
  const hoursSavedWeekly = Math.max(4, Math.round((monthlySpend / 5000) * 1.8));

  // Dayparting Dial Math & Content
  const getDaypartStats = (hour: number) => {
    if (hour >= 1 && hour <= 6) {
      return {
        label: 'Overnight Freeze',
        multiplier: '-50%',
        multiplierClass: 'text-amber-600 bg-amber-50 border-amber-200',
        cvr: '2.4%',
        intent: 'Late night browsing & bot crawling. CVR drops severely.',
        action: 'Bids dampened by 50% · Preserving ₹480/night',
        status: 'THROTTLED',
        badgeColor: 'bg-amber-500',
        arcDegree: 25,
      };
    } else if (hour >= 7 && hour <= 11) {
      return {
        label: 'Morning Ramp',
        multiplier: '+15%',
        multiplierClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        cvr: '14.8%',
        intent: 'Shoppers researching items on mobile commute & morning routine.',
        action: 'Moderate bid boost to capture initial brand discovery.',
        status: 'ELEVATED',
        badgeColor: 'bg-indigo-500',
        arcDegree: 60,
      };
    } else if (hour >= 12 && hour <= 17) {
      return {
        label: 'Workday Flow',
        multiplier: '1.0x Baseline',
        multiplierClass: 'text-slate-700 bg-slate-100 border-slate-300',
        cvr: '11.5%',
        intent: 'Steady desktop and mobile browsing with moderate purchasing.',
        action: 'Target bids held at baseline standard pricing.',
        status: 'STANDARD',
        badgeColor: 'bg-slate-400',
        arcDegree: 50,
      };
    } else {
      return {
        label: 'Prime Shopping Window',
        multiplier: '+75% Surge',
        multiplierClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        cvr: '26.8%',
        intent: 'Evening household peak: highest buy-box conversion velocity.',
        action: 'Aggressive Top of Search placement surge to capture #1 rank.',
        status: 'SURGE ACTIVE',
        badgeColor: 'bg-emerald-500',
        arcDegree: 90,
      };
    }
  };

  const currentHourStats = getDaypartStats(interactiveHour);

  // Batch queue simulation handler
  const handleApplyBatch = () => {
    setBatchStatus('applying');
    setTimeout(() => {
      setBatchStatus('applied');
    }, 800);
  };

  const handleResetBatch = () => {
    setBatchStatus('pending');
    setSelectedBatchItems([1, 2, 3, 4]);
  };

  const toggleBatchItem = (id: number) => {
    if (selectedBatchItems.includes(id)) {
      setSelectedBatchItems(selectedBatchItems.filter((i) => i !== id));
    } else {
      setSelectedBatchItems([...selectedBatchItems, id]);
    }
  };

  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('accessToken'));
    }
  }, []);

  const getToken = () => authToken;

  // Sieve Products Data
  const sieveData = {
    matcha: {
      name: 'Organic Ceremonial Matcha 100g',
      asin: 'B08XYZ100M',
      promoted: [
        { query: 'ceremonial grade matcha powder organic', orders: 24, acos: '14.2%', bid: '₹18.40' },
        { query: 'first harvest uji matcha tea', orders: 18, acos: '16.5%', bid: '₹16.90' },
        { query: 'unsweetened matcha latte powder', orders: 12, acos: '18.1%', bid: '₹15.20' },
      ],
      negated: [
        { query: 'free matcha recipes pdf', clicks: 28, spend: '₹340', reason: 'Zero Intent / Non-Commercial' },
        { query: 'bulk wholesale green tea 50kg', clicks: 19, spend: '₹280', reason: 'B2B Quantity Mismatch' },
        { query: 'sugared sweet cafe matcha syrup', clicks: 22, spend: '₹310', reason: 'Wrong Product Form' },
      ],
    },
    pillow: {
      name: 'Ergonomic Cervical Contour Pillow',
      asin: 'B09PLW200P',
      promoted: [
        { query: 'orthopedic neck pillow side sleeper', orders: 31, acos: '12.8%', bid: '₹22.50' },
        { query: 'cervical support contour pillow memory foam', orders: 22, acos: '15.4%', bid: '₹20.00' },
        { query: 'cooling gel pillow for neck pain', orders: 15, acos: '17.0%', bid: '₹19.20' },
      ],
      negated: [
        { query: 'cheap inflatable travel pillow', clicks: 34, spend: '₹420', reason: 'Budget Mismatch' },
        { query: 'how to fix neck pain exercise', clicks: 26, spend: '₹360', reason: 'Informational Query' },
        { query: 'pillow case cover 2 pack only', clicks: 21, spend: '₹290', reason: 'Accessory Only' },
      ],
    },
    earbuds: {
      name: 'ANC Wireless Sport Earbuds IPX7',
      asin: 'B07EAR800B',
      promoted: [
        { query: 'waterproof running earbuds with ear hooks', orders: 42, acos: '13.9%', bid: '₹28.00' },
        { query: 'active noise cancelling sport headphones', orders: 29, acos: '16.1%', bid: '₹25.40' },
        { query: 'workout bluetooth earphones sweatproof', orders: 20, acos: '17.8%', bid: '₹24.00' },
      ],
      negated: [
        { query: 'replacement silicone ear tips size small', clicks: 41, spend: '₹490', reason: 'Spare Parts Query' },
        { query: 'wired 3.5mm jack studio headphones', clicks: 27, spend: '₹350', reason: 'Wrong Connection Type' },
        { query: 'free mp3 music download app', clicks: 33, spend: '₹410', reason: 'Digital Content Intent' },
      ],
    },
  };

  // Profit Leaks Radar Data (Interactive Replacement for Telemetry Deep-Dive)
  const profitLeaks = [
    {
      id: 0,
      tag: 'LEAK #01 · BUDGET PACING',
      title: '10:00 AM Out-of-Budget Starvation',
      subtitle: 'Daily budget depleted before prime evening buying window',
      icon: Clock,
      severity: 'High Bleed',
      severityColor: 'bg-rose-50 text-rose-700 border-rose-200',
      bleed: {
        headline: 'The Seller Central Default Bleed',
        description: 'Morning window shoppers and low-intent scrollers click on broad keywords, exhausting 100% of your daily budget by 10:30 AM. When high-converting shoppers arrive from 7:00 PM to 11:00 PM, your campaigns are paused with an Out of Budget warning.',
        wastedSpend: '₹18,500 / mo',
        lostOrders: '34 Orders / wk',
        eveningAvailability: '0% (Paused)',
      },
      seal: {
        headline: 'AdsManager Autonomous Dayparting & Pacing',
        description: 'The rule engine throttles overnight bids by -50% and reserves 65% of campaign budget for high-velocity prime hours (18:00 - 23:00). If high ROAS (≥ 4.5x) is detected before 14:00, automated budget expansion unlocks extra capital without exceeding your hard ceiling.',
        ruleSnippet: 'IF hour IN [01:00-06:00] THEN bid_multiplier = -50%; IF roas >= 4.5x & spend_velocity > 80% THEN expand_budget(+₹1,000, max: ₹5,000);',
        recoveredProfit: '₹42,000 / mo',
        roasLift: '+38% Evening Lift',
        eveningAvailability: '100% Active',
      },
    },
    {
      id: 1,
      tag: 'LEAK #02 · PLACEMENT MISALLOCATION',
      title: 'Top-of-Search Starvation on Detail Pages',
      subtitle: 'Overpaying for 4% detail pages while 24% Top-of-Search is underbid',
      icon: Target,
      severity: 'Critical Margin Loss',
      severityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      bleed: {
        headline: 'The Seller Central Default Bleed',
        description: 'Amazon lumps Product Detail Pages and Top of Search under the same base bid. Amazon algorithms push cheap impressions onto competitor detail pages with 4.1% CVR, while your first-page Top of Search gets zero impression share.',
        wastedSpend: '₹26,800 / mo',
        lostOrders: '52 Orders / wk',
        cvrImbalance: '4.1% CVR vs 24.8% CVR',
      },
      seal: {
        headline: 'AdsManager Dynamic Placement Multiplier Engine',
        description: 'Our engine keeps product detail pages at 0% baseline while deploying a +85% to +120% multiplier directly to Top of Search when conversion velocity exceeds 18%. Every ad dollar concentrates where buyers actually checkout.',
        ruleSnippet: 'IF placement.tos.cvr > 18% & roas >= 4.0 THEN set_multiplier(PLACEMENT_TOP, +95%, max_cpc: ₹28.00);',
        recoveredProfit: '₹58,400 / mo',
        roasLift: '+62% High-ROAS TOS Share',
        cvrImbalance: '24.8% Dominant CVR',
      },
    },
    {
      id: 2,
      tag: 'LEAK #03 · SEARCH TERM CANNIBALIZATION',
      title: 'Broad vs Exact Keyword Self-Bidding',
      subtitle: 'Broad campaigns bidding against your own Exact campaigns on the same query',
      icon: Search,
      severity: 'Silent CPC Inflation',
      severityColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      bleed: {
        headline: 'The Seller Central Default Bleed',
        description: 'When a search term converts in an Auto or Broad campaign, sellers manually copy it to an Exact campaign. But they forget to add it as a negative match in the broad campaign. Both campaigns now bid against each other in the auction, inflating CPC by 25%.',
        wastedSpend: '₹14,200 / mo',
        lostOrders: 'Higher Cost / Order',
        cannibalizationRate: '42% Overlap',
      },
      seal: {
        headline: 'Automated 1-Click Search Term Harvesting & Isolation',
        description: 'As soon as a search query hits 3 conversions with ACoS under target, AdsManager mints the keyword into your dedicated Exact match ad group and simultaneously injects a Negative Exact match into the source campaign.',
        ruleSnippet: 'IF query.orders >= 3 & query.acos < 22% THEN mint_exact(target_bid: 1.1x) AND add_negative_exact(source_campaign);',
        recoveredProfit: '₹31,000 / mo',
        roasLift: '-24% Lower Blended CPC',
        cannibalizationRate: '0% Self-Bidding',
      },
    },
    {
      id: 3,
      tag: 'LEAK #04 · ATTRIBUTION DELAY PANIC',
      title: 'False Alarm Bid Slashes on Sales Lag',
      subtitle: 'Slashing bids on normal 48-hour Amazon sales reporting delay',
      icon: ShieldCheck,
      severity: 'Momentum Destruction',
      severityColor: 'bg-blue-50 text-blue-700 border-blue-200',
      bleed: {
        headline: 'The Seller Central Default Bleed',
        description: 'Amazon Advertising takes up to 48-72 hours to attribute completed orders to ad clicks. Human sellers log in on Monday, see high spend and zero reported orders for Sunday, panic, and cut bids by 40% — choking off organic ranking momentum.',
        wastedSpend: 'Lost BSR Rank',
        lostOrders: 'Rank Drop on Core ASINs',
        falseCutRate: '100% Premature Bid Cuts',
      },
      seal: {
        headline: 'Multi-Window Baseline Smoothing & Recency Dampening',
        description: 'AdsManager blends 7-day, 14-day, and 30-day performance medians with a 48-hour grace window. The engine never reacts to 1-day attribution noise, ensuring bids remain stable while sales catch up in Amazon’s reporting system.',
        ruleSnippet: 'baseline_cvr = median(trailing_7d, trailing_14d, trailing_30d); IF report_age < 48h THEN apply_smoothing_factor(0.85);',
        recoveredProfit: 'Rank Velocity Preserved',
        roasLift: 'Zero False Panic Cuts',
        falseCutRate: '0% Premature Slashes',
      },
    },
  ];

  // FAQ List with Categories
  const faqList = [
    {
      category: 'architecture',
      question: 'How does AdsManager connect to my Amazon Ads account?',
      answer: 'AdsManager connects using Amazon’s official Advertising API with secure OAuth authentication. You sign in directly through Amazon, granting advertising permissions only. We never request or store your Amazon Seller Central login credentials.',
    },
    {
      category: 'pricing',
      question: 'Do you charge a percentage of my ad spend?',
      answer: 'No. Unlike legacy enterprise software or agencies that penalize your growth by taxing 2% to 4% of ad spend, AdsManager charges transparent flat pricing. You keep 100% of your ad profits.',
    },
    {
      category: 'architecture',
      question: 'Is AdsManager officially affiliated with Amazon?',
      answer: 'No. AdsManager is an independent analytics, reporting, and campaign optimization software platform. We connect directly to the official Amazon Advertising API, but AdsManager is not affiliated with, endorsed by, or an official partner of Amazon.com, Inc. or any of its subsidiaries.',
    },
    {
      category: 'dayparting',
      question: 'Can I override or pause automated rules at any time?',
      answer: 'Yes. You maintain 100% control. Every automated rule can be paused or edited instantly with a single toggle. You can also run rules in "Recommendation Mode" where changes must be approved by you in the batch review modal.',
    },
    {
      category: 'dayparting',
      question: 'How granular is the hourly dayparting schedule?',
      answer: 'AdsManager provides a complete 168-hour continuous matrix (24 hours a day across all 7 days of the week). You can customize every single hour independently to boost bids during peak shopping windows or throttle spend during overnight dead hours.',
    },
    {
      category: 'architecture',
      question: 'Which Amazon advertising formats are supported?',
      answer: 'AdsManager supports Sponsored Products (SP), Sponsored Brands (SB), and Sponsored Display (SD) across all standard targeting modes including keyword targeting, product/ASIN targeting, auto-targeting, and category targeting.',
    },
  ];

  const filteredFaqs = faqCategory === 'all' ? faqList : faqList.filter((f) => f.category === faqCategory);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* =========================================================================
          1. HEADER NAVIGATION
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="size-4" />
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
              Ads<span className="text-indigo-600">Manager</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link href="/" className="text-indigo-600 font-semibold transition-colors">
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
                className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
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
              className="block py-2 text-sm font-semibold text-indigo-600"
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
                  className="w-full py-2 text-center text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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

      <main className="flex-1">
        {/* =========================================================================
            3. HERO SECTION
            ========================================================================= */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-white border-b border-slate-200">
          <div className="absolute inset-0 bg-graph-paper opacity-50 pointer-events-none" />

          {/* Floating Subtle Micro-Cards */}
          <div className="hidden lg:block absolute top-12 xl:top-20 2xl:top-28 left-4 xl:left-8 2xl:left-12 z-10 animate-float-subtle">
            <div className="p-3 bg-white/95 backdrop-blur-md rounded-xl border border-indigo-200/90 shadow-md flex items-center gap-3 text-xs font-mono">
              <div className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Amazon Marketing Stream</div>
                <div className="text-slate-900 font-bold">120ms Latency · Real-Time Bids</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            {/* Eyebrow & Hero Title (Immediately Visible on Page Load) */}
            <div className="w-full flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-indigo-700 text-xs font-mono font-semibold mb-6 shadow-2xs">
                <span className="size-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>Deterministic PPC Architecture · Zero Black-Box Guesswork</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.12]">
                Automate Amazon PPC With{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 dark:from-indigo-400 dark:via-indigo-300 dark:to-violet-300">
                  Mathematical Precision
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed mx-auto">
                Stop losing 30% of your advertising budget to late-night click bleed and unprofitable product detail pages. 
                Deploy 24/7 placement multipliers, hourly dayparting, and search term auto-harvesting with 100% transparent rules.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-sm hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('interactive-simulator');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Try Live Simulator</span>
                  <ChevronDown className="size-4 text-slate-400" />
                </button>
              </div>

              {/* Micro Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Zero Credit Card Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Official Amazon Advertising API</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Human-in-the-Loop Review Queue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Instant 1-Click Rollback</span>
                </div>
              </div>
            </div>

            {/* =========================================================================
                4. HERO INTERACTIVE LIVE ENGINE COCKPIT (Immediately Visible on Page Load)
                ========================================================================= */}
            <div className="w-full max-w-5xl">
              <div id="interactive-simulator" className="scroll-mt-28 mt-14 w-full rounded-xl border border-slate-300 bg-white shadow-xl overflow-hidden text-left">
                <div className="bg-slate-100/90 text-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 rounded-full bg-rose-500/80" />
                    <div className="size-3 rounded-full bg-amber-500/80" />
                    <div className="size-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-[11px] font-bold text-slate-700 tracking-wide">
                      ADSMANAGER // RULE EXECUTION ENGINE (SIMULATION)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-Time Stream Active (168h Matrix)</span>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSimulatorTab('placement')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activeSimulatorTab === 'placement'
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Layers className="size-3.5" />
                    <span>1. Placement Multiplier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSimulatorTab('dayparting')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activeSimulatorTab === 'dayparting'
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Clock className="size-3.5" />
                    <span>2. Hourly Dayparting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSimulatorTab('harvest')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activeSimulatorTab === 'harvest'
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Search className="size-3.5" />
                    <span>3. Search Term Harvesting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSimulatorTab('budget')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activeSimulatorTab === 'budget'
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <DollarSign className="size-3.5" />
                    <span>4. Budget Guardrails</span>
                  </button>
                </div>

                {/* Dynamic Stage */}
                <div className="p-5 sm:p-6 bg-slate-50/60">
                  {activeSimulatorTab === 'placement' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Dynamic Placement Multiplier Engine
                          </h4>
                          <p className="text-xs text-slate-600">
                            Isolates Top-of-Search conversion efficiency from unprofitable product pages in real-time.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold self-start sm:self-auto">
                          +44% Conversion Gain
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 rounded-lg bg-white border-2 border-indigo-500 shadow-xs relative">
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-600 text-white">
                            HIGH EFFICIENCY
                          </span>
                          <div className="text-xs font-mono font-bold text-slate-700">Top of Search (First Page)</div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-mono font-bold text-indigo-600">+115%</span>
                            <span className="text-[11px] font-mono text-slate-500">Multiplier</span>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono space-y-1 text-slate-600">
                            <div className="flex justify-between"><span>CVR:</span><strong className="text-emerald-600">22.4%</strong></div>
                            <div className="flex justify-between"><span>ACoS:</span><strong className="text-indigo-600">18.2%</strong></div>
                            <div className="flex justify-between"><span>Imp. Share:</span><strong>74.8%</strong></div>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
                          <div className="text-xs font-mono font-bold text-slate-700">Product Detail Pages</div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-mono font-bold text-slate-500">0%</span>
                            <span className="text-[11px] font-mono text-slate-400">Baseline</span>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono space-y-1 text-slate-600">
                            <div className="flex justify-between"><span>CVR:</span><span className="text-slate-600">7.1%</span></div>
                            <div className="flex justify-between"><span>ACoS:</span><span className="text-amber-600">38.4%</span></div>
                            <div className="flex justify-between"><span>Imp. Share:</span><span>21.0%</span></div>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
                          <div className="text-xs font-mono font-bold text-slate-700">Rest of Search</div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-mono font-bold text-slate-500">0%</span>
                            <span className="text-[11px] font-mono text-slate-400">Standard</span>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono space-y-1 text-slate-600">
                            <div className="flex justify-between"><span>CVR:</span><span className="text-slate-600">11.8%</span></div>
                            <div className="flex justify-between"><span>ACoS:</span><span className="text-slate-700">28.9%</span></div>
                            <div className="flex justify-between"><span>Imp. Share:</span><span>34.2%</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-md bg-slate-100/90 text-slate-800 border border-slate-200/80 text-xs font-mono flex items-center justify-between">
                        <span className="truncate">
                          <span className="text-indigo-600 font-bold">RULE_TRIGGER:</span> IF CVR(Top of Search) &gt; 18% THEN SET Multiplier = +115%
                        </span>
                        <span className="text-emerald-700 font-bold shrink-0 ml-2">● EXECUTED</span>
                      </div>
                    </div>
                  )}

                  {activeSimulatorTab === 'dayparting' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            168-Hour Precision Dayparting Heatmap
                          </h4>
                          <p className="text-xs text-slate-600">
                            Concentrates budget during peak conversion hours, throttling bids when shoppers browse without buying.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-emerald-700 font-bold">168 Active Hourly Cells</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDaypartingWindow('overnight')}
                          className={`p-3 rounded-lg border text-left font-mono transition-all ${
                            selectedDaypartingWindow === 'overnight'
                              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">01:00 - 06:00</div>
                          <div className="font-bold text-sm">Overnight Freeze</div>
                          <div className="text-xs text-amber-700 mt-1 font-semibold">-50% Multiplier</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedDaypartingWindow('morning')}
                          className={`p-3 rounded-lg border text-left font-mono transition-all ${
                            selectedDaypartingWindow === 'morning'
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">07:00 - 11:00</div>
                          <div className="font-bold text-sm">Morning Ramp</div>
                          <div className="text-xs text-indigo-700 mt-1 font-semibold">+10% Multiplier</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedDaypartingWindow('midday')}
                          className={`p-3 rounded-lg border text-left font-mono transition-all ${
                            selectedDaypartingWindow === 'midday'
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">12:00 - 17:00</div>
                          <div className="font-bold text-sm">Workday Flow</div>
                          <div className="text-xs text-slate-600 mt-1 font-semibold">1.0x Baseline</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedDaypartingWindow('prime')}
                          className={`p-3 rounded-lg border text-left font-mono transition-all ${
                            selectedDaypartingWindow === 'prime'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">18:00 - 23:00</div>
                          <div className="font-bold text-sm">Prime Shopping</div>
                          <div className="text-xs text-emerald-700 mt-1 font-semibold">+35% Surge Bid</div>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-indigo-600" />
                          <span>
                            {selectedDaypartingWindow === 'overnight' && 'Overnight Window: Clicks have 2.8% conversion. Bids throttled by 50%.'}
                            {selectedDaypartingWindow === 'morning' && 'Morning Window: High search intent beginning. Bids bumped by 10%.'}
                            {selectedDaypartingWindow === 'midday' && 'Midday Window: Stable conversion baseline across desktop & mobile.'}
                            {selectedDaypartingWindow === 'prime' && 'Prime Window: Highest conversion velocity (26.4%). Max bid multiplier deployed.'}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-600">Saved: ₹18,400 / month</span>
                      </div>
                    </div>
                  )}

                  {activeSimulatorTab === 'harvest' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Search Term Harvesting &amp; Negative Isolation
                          </h4>
                          <p className="text-xs text-slate-600">
                            Auto-graduates profitable customer queries into exact campaigns, negating them from broad matches.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-mono font-bold">
                          Zero Manual Spreadsheets
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs font-mono">
                          <div className="flex items-center gap-3 truncate">
                            <span className="size-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              1
                            </span>
                            <span className="font-semibold text-slate-900 truncate">
                              Broad Search Query: &quot;electrolyte hydration tablets sugar free&quot;
                            </span>
                          </div>
                          <span className="text-slate-500 shrink-0">14 Orders · 14.8% ACoS</span>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3 text-xs font-mono">
                          <div className="flex items-center gap-3 truncate">
                            <Check className="size-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-emerald-900 truncate">
                              ACTION: Promoted to Exact Match Target in [Exact-SP-Electrolytes]
                            </span>
                          </div>
                          <span className="font-bold text-emerald-700 shrink-0">Bid: ₹16.50</span>
                        </div>

                        <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-3 text-xs font-mono">
                          <div className="flex items-center gap-3 truncate">
                            <X className="size-4 text-rose-600 shrink-0" />
                            <span className="font-semibold text-rose-900 truncate">
                              ISOLATION: Added as Negative Exact in source Broad Campaign
                            </span>
                          </div>
                          <span className="font-bold text-rose-700 shrink-0">Cannibalization Blocked</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSimulatorTab === 'budget' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Budget Velocity &amp; Out-of-Budget Protection
                          </h4>
                          <p className="text-xs text-slate-600">
                            Automatically scales winning budgets before noon caps, resetting them at midnight to protect cash flow.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold">
                          100% In-Budget Uptime
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                          <div className="text-[11px] font-mono text-slate-500 uppercase">Daily Budget</div>
                          <div className="text-xl font-mono font-bold text-slate-900 mt-1">₹3,500.00</div>
                          <div className="text-[10px] font-mono text-indigo-600 mt-1 font-semibold">Base Limit</div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                          <div className="text-[11px] font-mono text-slate-500 uppercase">Spend Velocity</div>
                          <div className="text-xl font-mono font-bold text-amber-600 mt-1">91.4% by 14:00</div>
                          <div className="text-[10px] font-mono text-amber-700 mt-1 font-semibold">Impending Cap</div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-white border border-emerald-300 bg-emerald-50/30">
                          <div className="text-[11px] font-mono text-emerald-700 uppercase font-semibold">Automated Inject</div>
                          <div className="text-xl font-mono font-bold text-emerald-700 mt-1">+₹1,200.00</div>
                          <div className="text-[10px] font-mono text-emerald-600 mt-1 font-semibold">ROAS Condition: 4.8x</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-md bg-slate-100/90 text-slate-800 border border-slate-200/80 text-xs font-mono flex items-center justify-between">
                        <span className="truncate">
                          <span className="text-emerald-700 font-bold">SAFETY_GUARD:</span> Daily Budget Ceiling Max: ₹6,000.00 · Never exceeds cap
                        </span>
                        <span className="text-emerald-700 font-bold shrink-0 ml-2">● PROTECTED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. INTERACTIVE ROI & WASTED SPEND CALCULATOR (Scroll Revealed)
            ========================================================================= */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">
                  Interactive ROI Calculator
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Calculate Your Recovered Ad Spend
                </h2>
                <p className="text-base text-slate-600 mt-3">
                  Adjust the sliders below to estimate the capital preserved by eliminating dead-hour bids and unoptimized placements.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Input Sliders */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Slider 1: Monthly Spend */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                          Monthly Amazon Ad Spend
                        </label>
                        <span className="text-base font-mono font-bold text-indigo-600">
                          ₹{monthlySpend.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5000}
                        max={250000}
                        step={5000}
                        value={monthlySpend}
                        onChange={(e) => setMonthlySpend(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>₹5,000</span>
                        <span>₹1,00,000</span>
                        <span>₹2,50,000+</span>
                      </div>
                    </div>

                    {/* Slider 2: Current ACoS */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                          Current Blended ACoS
                        </label>
                        <span className="text-base font-mono font-bold text-slate-900">
                          {currentAcos}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={55}
                        step={1}
                        value={currentAcos}
                        onChange={(e) => setCurrentAcos(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>15% (Tight Margin)</span>
                        <span>35% (Average)</span>
                        <span>55% (High Bleed)</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                      <Sparkles className="size-4 text-indigo-600 shrink-0" />
                      <span>
                        Based on verified placement multiplier optimizations and 168-hour dayparting throttling benchmarks.
                      </span>
                    </div>
                  </div>

                  {/* Right: Dynamic Computed Metrics */}
                  <div className="lg:col-span-5 p-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex flex-col justify-between space-y-6 shadow-xs">
                    <div>
                      <div className="text-[11px] font-mono text-indigo-700 font-bold uppercase tracking-wider">
                        Estimated Monthly Bleed Eliminated
                      </div>
                      <div className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-600 mt-1">
                        ₹{calculatedSavings.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Reinvested directly into high-ROAS Top of Search targets.
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Projected ACoS</div>
                        <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">{targetAcos}%</div>
                        <div className="text-[10px] font-mono text-emerald-600 font-bold">↓ {currentAcos - targetAcos}% drop</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Hours Saved</div>
                        <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">{hoursSavedWeekly}h / mo</div>
                        <div className="text-[10px] font-mono text-indigo-600 font-bold">Zero CSV reports</div>
                      </div>
                    </div>

                    <Link
                      href="/signup"
                      className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs text-white text-center transition-colors shadow-xs"
                    >
                      Lock In These Savings With Free Trial
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            6. NEW UNIQUE COMPONENT: THE 4-PILLAR PROFIT LEAK RADAR & REAL-TIME SEAL (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-white border-b border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-graph-paper-faint opacity-60 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold mb-3 shadow-2xs">
                  <ShieldCheck className="size-3.5" />
                  <span>ACCOUNT PROFIT PROTECTION RADAR</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  The 4 Silent Profit Leaks Costing Amazon Sellers 28% of Ad Spend
                </h2>
                <p className="text-base text-slate-600 mt-4 leading-relaxed">
                  Click any profit leak below to see how standard Seller Central campaigns bleed cash — and how AdsManager’s automated engine seals it with mathematical certainty.
                </p>
              </div>
            </ScrollReveal>

            {/* 4 Interactive Profit Leak Selectors */}
            <ScrollReveal delay={120}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {profitLeaks.map((leak, idx) => {
                  const isActive = activeLeak === idx;
                  const Icon = leak.icon;
                  return (
                    <button
                      key={leak.id}
                      type="button"
                      onClick={() => {
                        setActiveLeak(idx);
                        setSimulatedSealActive(false);
                      }}
                      className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between gap-3 ${
                        isActive
                          ? 'bg-white text-slate-900 border-2 border-indigo-600 shadow-md ring-2 ring-indigo-600/10 scale-102'
                          : 'bg-white/80 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
                            isActive ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>
                        {isActive ? (
                          <span className="relative flex size-2.5 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                          </span>
                        ) : (
                          <span className="size-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      <div>
                        <div
                          className={`text-[10px] font-mono font-bold tracking-tight uppercase ${
                            isActive ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        >
                          {leak.tag}
                        </div>
                        <div className={`text-sm font-bold mt-0.5 line-clamp-1 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                          {leak.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {leak.subtitle}
                        </div>
                      </div>

                      <div
                        className={`text-[10px] font-mono px-2 py-0.5 rounded truncate border ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {leak.severity}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Selected Leak Deep Dive Comparison */}
            <ScrollReveal delay={200}>
              <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl overflow-hidden ring-1 ring-slate-900/5">
                {/* Header Bar */}
                <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-900 tracking-wide uppercase">
                      DIAGNOSTIC &amp; RESOLUTION: {profitLeaks[activeLeak].title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">Live Status:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold font-mono text-[10px]">
                      SEALED &amp; AUTOMATED
                    </span>
                  </div>
                </div>

                {/* Two-Column Comparison */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white">
                  {/* Left: The Seller Central Bleed */}
                  <div className="p-5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-rose-200/80">
                      <div className="flex items-center gap-2 text-rose-800 min-w-0">
                        <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                        <span className="font-bold text-xs uppercase tracking-wide font-mono break-words">
                          {profitLeaks[activeLeak].bleed.headline}
                        </span>
                      </div>
                      <span className="self-start sm:self-auto shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        UNCHECKED DRAIN
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                      {profitLeaks[activeLeak].bleed.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div className="p-3 bg-white rounded-lg border border-rose-200 text-center font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">Monthly Bleed</div>
                        <div className="text-sm font-bold text-rose-700 mt-1 truncate">
                          {profitLeaks[activeLeak].bleed.wastedSpend}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-rose-200 text-center font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">Lost Margin</div>
                        <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                          {profitLeaks[activeLeak].bleed.lostOrders}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-rose-200 text-center font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">Impact Metric</div>
                        <div className="text-sm font-bold text-rose-600 mt-1 truncate">
                          {'eveningAvailability' in profitLeaks[activeLeak].bleed ? profitLeaks[activeLeak].bleed.eveningAvailability : 'cvrImbalance' in profitLeaks[activeLeak].bleed ? profitLeaks[activeLeak].bleed.cvrImbalance : 'cannibalizationRate' in profitLeaks[activeLeak].bleed ? profitLeaks[activeLeak].bleed.cannibalizationRate : profitLeaks[activeLeak].bleed.falseCutRate}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: AdsManager Autonomous Seal */}
                  <div className="p-5 rounded-xl bg-indigo-50/40 border border-indigo-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-indigo-200/80">
                      <div className="flex items-center gap-2 text-indigo-900 min-w-0">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-xs uppercase tracking-wide font-mono break-words">
                          {profitLeaks[activeLeak].seal.headline}
                        </span>
                      </div>
                      <span className="self-start sm:self-auto shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        AUTONOMOUS FIX
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                      {profitLeaks[activeLeak].seal.description}
                    </p>

                    {/* Code / Rule Execution Card */}
                    <div className="p-3 rounded-lg bg-white border border-indigo-200 shadow-2xs font-mono text-xs">
                      <div className="flex items-center justify-between text-[10px] text-indigo-700 font-bold mb-1.5 pb-1 border-b border-indigo-100">
                        <span>ACTIVE RULE PATTERN</span>
                        <span className="text-emerald-600">● 24/7 ENFORCED</span>
                      </div>
                      <div className="text-slate-800 font-medium text-[11px] leading-relaxed break-words">
                        {profitLeaks[activeLeak].seal.ruleSnippet}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="p-3 bg-white rounded-lg border border-indigo-200 text-center font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">Recovered</div>
                        <div className="text-sm font-bold text-emerald-700 mt-1 truncate">
                          {profitLeaks[activeLeak].seal.recoveredProfit}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-indigo-200 text-center font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">Efficiency Lift</div>
                        <div className="text-sm font-bold text-indigo-700 mt-1 truncate">
                          {profitLeaks[activeLeak].seal.roasLift}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-indigo-200 text-center font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">Verified State</div>
                        <div className="text-sm font-bold text-emerald-700 mt-1 truncate">
                          {'eveningAvailability' in profitLeaks[activeLeak].seal ? profitLeaks[activeLeak].seal.eveningAvailability : 'cvrImbalance' in profitLeaks[activeLeak].seal ? profitLeaks[activeLeak].seal.cvrImbalance : 'cannibalizationRate' in profitLeaks[activeLeak].seal ? profitLeaks[activeLeak].seal.cannibalizationRate : profitLeaks[activeLeak].seal.falseCutRate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Interactive Action Bar */}
                <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                    <Sparkles className="size-4 text-indigo-600 shrink-0" />
                    <span>Tested across 85+ active catalog campaigns with zero manual spreadsheet intervention.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSimulatedSealActive(true)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      {simulatedSealActive ? (
                        <>
                          <Check className="size-3.5" />
                          <span>Sealed in 4.2ms (200 OK)</span>
                        </>
                      ) : (
                        <>
                          <Zap className="size-3.5" />
                          <span>Simulate Rule Trigger</span>
                        </>
                      )}
                    </button>
                    <Link
                      href="/signup"
                      className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                    >
                      Seal All 4 Leaks Free
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            7. NEW UNIQUE COMPONENT: 24-HOUR RADAR DAYPARTING TIME DIAL (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold mb-3">
                  <Clock className="size-3.5" />
                  <span>168-HOUR INTERACTIVE DAYPARTING DIAL</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Scrub the Clock: See Bids Adapt Across 24 Hours
                </h2>
                <p className="text-base text-slate-600 mt-4 leading-relaxed">
                  Amazon conversion rates fluctuate wildly by time of day. Drag the interactive hourly slider below
                  to watch the multiplier calculate live and protect your profit margin.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 shadow-md">
                {/* Interactive Clock Scrub Bar */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                        Selected Time of Day (24-Hour Cycle):
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-sm">
                        {interactiveHour.toString().padStart(2, '0')}:00 {interactiveHour >= 12 ? 'PM' : 'AM'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${currentHourStats.multiplierClass}`}>
                      Multiplier: {currentHourStats.multiplier}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={23}
                    step={1}
                    value={interactiveHour}
                    onChange={(e) => setInteractiveHour(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                    <span>00:00 (Midnight)</span>
                    <span>06:00 (Dawn)</span>
                    <span>12:00 (Noon)</span>
                    <span>18:00 (Evening)</span>
                    <span>23:00 (Late Night)</span>
                  </div>
                </div>

                {/* Dynamic 3-Column Radar Display */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Column 1: Dial Gauge Meter */}
                  <div className="lg:col-span-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex flex-col justify-between items-center text-center shadow-xs">
                    <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 pb-2 border-b border-slate-200">
                      <span>CONVERSION VELOCITY METER</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">{currentHourStats.status}</span>
                    </div>

                    <div className="my-6 relative size-36 flex items-center justify-center">
                      <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-indigo-600 stroke-current transition-all duration-300"
                          strokeDasharray={`${currentHourStats.arcDegree}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-mono font-extrabold text-slate-900">
                          {currentHourStats.cvr}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Avg CVR</span>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-600 w-full pt-3 border-t border-slate-200">
                      Window: <strong className="text-indigo-600 font-bold">{currentHourStats.label}</strong>
                    </div>
                  </div>

                  {/* Column 2: Intent & Automated Response */}
                  <div className="lg:col-span-8 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Shopper Behavioral Intent Analysis
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {currentHourStats.intent}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs font-mono">
                        <span className="font-bold text-slate-700 shrink-0">Automated Bidding Action:</span>
                        <span className="text-indigo-600 font-semibold break-words">{currentHourStats.action}</span>
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        Rule matrix automatically adjusts target bids in the background without needing manual alarms or midnight Seller Central logins.
                      </div>
                    </div>

                    {/* 4 Quick Jump Preset Buttons */}
                    <div className="pt-2">
                      <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Quick Jump to Hour:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setInteractiveHour(3)}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all border text-center ${
                            interactiveHour === 3 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          03:00 (Overnight)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInteractiveHour(9)}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all border text-center ${
                            interactiveHour === 9 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          09:00 (Morning)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInteractiveHour(14)}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all border text-center ${
                            interactiveHour === 14 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          14:00 (Midday)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInteractiveHour(20)}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all border text-center ${
                            interactiveHour === 20 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          20:00 (Prime Peak)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            8. NEW UNIQUE COMPONENT: SEARCH TERM SIEVE & NEGATIVE ISOLATOR (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/70 dark:border-blue-500/50 dark:text-blue-300 text-xs font-mono font-bold mb-3 shadow-2xs">
                  <Filter className="size-3.5" />
                  <span>INTERACTIVE KEYWORD SIEVE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Watch Non-Converting Queries Get Auto-Negated
                </h2>
                <p className="text-base text-slate-600 mt-4 leading-relaxed">
                  Select a product from our catalog below to see live search terms filtered: converting gems get promoted
                  to exact matches, while irrelevant bleeders are instantly neutralized.
                </p>
              </div>
            </ScrollReveal>

            {/* Product Switcher Bar */}
            <ScrollReveal delay={80}>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                <button
                  type="button"
                  onClick={() => setSieveProduct('matcha')}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                    sieveProduct === 'matcha'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🍵 Organic Ceremonial Matcha
                </button>
                <button
                  type="button"
                  onClick={() => setSieveProduct('pillow')}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                    sieveProduct === 'pillow'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🛏️ Cervical Memory Foam Pillow
                </button>
                <button
                  type="button"
                  onClick={() => setSieveProduct('earbuds')}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                    sieveProduct === 'earbuds'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🎧 Waterproof Sport Earbuds
                </button>
              </div>
            </ScrollReveal>

            {/* Sieve Results Split Visual */}
            <ScrollReveal delay={150}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Bucket: Auto-Promoted Converting Gems */}
                <div className="p-6 rounded-2xl bg-emerald-50/40 border border-emerald-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Auto-Harvested Exact Matches</h4>
                        <div className="text-[10px] font-mono text-emerald-700 font-semibold">Orders &ge; 3 · ACoS &lt; 25%</div>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      MINTED AS TARGETS
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sieveData[sieveProduct].promoted.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white border border-emerald-200 shadow-2xs text-xs font-mono">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="truncate">&quot;{item.query}&quot;</span>
                          <span className="text-emerald-700 shrink-0 ml-2">Bid: {item.bid}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                          <span>Attributed Orders: <strong className="text-slate-800">{item.orders}</strong></span>
                          <span>ACoS: <strong className="text-emerald-600">{item.acos}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] font-mono text-emerald-800 pt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Graduated into dedicated Exact Match campaign automatically.</span>
                  </div>
                </div>

                {/* Right Bucket: Auto-Negated Bleeder Queries */}
                <div className="p-6 rounded-2xl bg-rose-50/40 border border-rose-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-rose-200">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✕
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Auto-Negated Wasted Bleeders</h4>
                        <div className="text-[10px] font-mono text-rose-700 font-semibold">Clicks &gt; 15 · 0 Purchases</div>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                      BLOCKED PERMANENTLY
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sieveData[sieveProduct].negated.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white border border-rose-200 shadow-2xs text-xs font-mono">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="truncate">&quot;{item.query}&quot;</span>
                          <span className="text-rose-700 shrink-0 ml-2">Wasted: {item.spend}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                          <span>Clicks with 0 Orders: <strong className="text-slate-800">{item.clicks}</strong></span>
                          <span className="text-rose-600 font-semibold">{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] font-mono text-rose-800 pt-2 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    <span>Added as Negative Exact to stop repeat click draining.</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            9. NEW UNIQUE COMPONENT: HUMAN-IN-THE-LOOP BATCH REVIEW SIMULATOR (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold mb-3">
                  <ShieldCheck className="size-3.5" />
                  <span>HUMAN-IN-THE-LOOP CONTROL</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Try Applying a Batch Review Queue
                </h2>
                <p className="text-base text-slate-600 mt-4 leading-relaxed">
                  We never make silent, mysterious changes to your Amazon account. Test our batch review modal right here:
                  inspect proposed adjustments, toggle items, and apply them with one click.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden">
                {/* Modal Simulation Header */}
                <div className="bg-slate-100/90 text-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="size-3 rounded-full bg-indigo-600" />
                    <span className="font-mono text-xs font-bold text-slate-900 tracking-wide">
                      BATCH CHANGE REVIEW QUEUE // 4 PROPOSED ACTIONS
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-500">Total Selected:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{selectedBatchItems.length} / 4 Items</span>
                  </div>
                </div>

                {/* Table of Proposed Items */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 uppercase">
                        <th className="py-3 px-4 w-12 text-center">Select</th>
                        <th className="py-3 px-4">Campaign Target</th>
                        <th className="py-3 px-4">Rule Trigger</th>
                        <th className="py-3 px-4">Current Value</th>
                        <th className="py-3 px-4">Proposed Value</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Row 1 */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedBatchItems.includes(1)}
                            onChange={() => toggleBatchItem(1)}
                            disabled={batchStatus !== 'pending'}
                            className="size-4 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          SP-AnkleWeights-Hero
                          <div className="text-[10px] text-slate-500 font-normal">Placement Multiplier</div>
                        </td>
                        <td className="py-3.5 px-4 text-indigo-700 font-semibold">TOS CVR &gt; 22% &amp; ROAS 4.6x</td>
                        <td className="py-3.5 px-4 text-slate-500">TOS: 0%</td>
                        <td className="py-3.5 px-4 text-emerald-700 font-bold">TOS: +45%</td>
                        <td className="py-3.5 px-4">
                          {batchStatus === 'pending' && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">PENDING</span>}
                          {batchStatus === 'applying' && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 animate-pulse">APPLYING...</span>}
                          {batchStatus === 'applied' && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">✓ APPLIED (200 OK)</span>}
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedBatchItems.includes(2)}
                            onChange={() => toggleBatchItem(2)}
                            disabled={batchStatus !== 'pending'}
                            className="size-4 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          SP-RunningBelts-Broad
                          <div className="text-[10px] text-slate-500 font-normal">Negative Keyword</div>
                        </td>
                        <td className="py-3.5 px-4 text-rose-700 font-semibold">Clicks &gt; 20 AND Orders = 0</td>
                        <td className="py-3.5 px-4 text-slate-500">Broad Target</td>
                        <td className="py-3.5 px-4 text-rose-700 font-bold">Negate &quot;free bib&quot;</td>
                        <td className="py-3.5 px-4">
                          {batchStatus === 'pending' && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">PENDING</span>}
                          {batchStatus === 'applying' && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 animate-pulse">APPLYING...</span>}
                          {batchStatus === 'applied' && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">✓ APPLIED (200 OK)</span>}
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedBatchItems.includes(3)}
                            onChange={() => toggleBatchItem(3)}
                            disabled={batchStatus !== 'pending'}
                            className="size-4 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          SP-ErgoChair-Auto
                          <div className="text-[10px] text-slate-500 font-normal">Search Term Harvest</div>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">Orders &ge; 5 AND ACoS &lt; 18%</td>
                        <td className="py-3.5 px-4 text-slate-500">Auto Campaign</td>
                        <td className="py-3.5 px-4 text-emerald-700 font-bold">Exact: &quot;lumbar cushion&quot;</td>
                        <td className="py-3.5 px-4">
                          {batchStatus === 'pending' && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">PENDING</span>}
                          {batchStatus === 'applying' && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 animate-pulse">APPLYING...</span>}
                          {batchStatus === 'applied' && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">✓ APPLIED (200 OK)</span>}
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedBatchItems.includes(4)}
                            onChange={() => toggleBatchItem(4)}
                            disabled={batchStatus !== 'pending'}
                            className="size-4 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          SP-YogaMats-Exact
                          <div className="text-[10px] text-slate-500 font-normal">Daily Budget Guard</div>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">Spend &gt; 85% by 13:00 (ROAS 4.8x)</td>
                        <td className="py-3.5 px-4 text-slate-500">₹2,500.00 / day</td>
                        <td className="py-3.5 px-4 text-emerald-700 font-bold">₹3,200.00 / day</td>
                        <td className="py-3.5 px-4">
                          {batchStatus === 'pending' && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">PENDING</span>}
                          {batchStatus === 'applying' && <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 animate-pulse">APPLYING...</span>}
                          {batchStatus === 'applied' && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">✓ APPLIED (200 OK)</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Action Bar Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-600">
                    {batchStatus === 'pending' && 'Changes are held in memory until approved.'}
                    {batchStatus === 'applying' && 'Dispatched to Amazon Advertising API (84ms)...'}
                    {batchStatus === 'applied' && 'All 4 changes confirmed live on Amazon with rollback token created.'}
                  </span>

                  <div className="flex items-center gap-3">
                    {batchStatus === 'applied' ? (
                      <button
                        type="button"
                        onClick={handleResetBatch}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-xs"
                      >
                        Reset Queue Demo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyBatch}
                        disabled={selectedBatchItems.length === 0 || batchStatus === 'applying'}
                        className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-50"
                      >
                        {batchStatus === 'applying' ? 'Applying to Amazon...' : `Apply ${selectedBatchItems.length} Changes`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            10. NEW UNIQUE COMPONENT: THE SELLER CENTRAL NIGHTMARE VS ADSMANAGER FLOW (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold mb-3">
                  <Cpu className="size-3.5" />
                  <span>OPERATIONAL COMPARISON</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Manual Seller Central vs. AdsManager Flow
                </h2>
                <p className="text-base text-slate-600 mt-4 leading-relaxed">
                  Toggle between the standard manual nightmare and our automated workflow to see why high-volume sellers switch.
                </p>

                {/* Mode Toggle Switch */}
                <div className="mt-8 inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setComparisonMode('adsmanager')}
                    className={`px-5 py-2.5 rounded-lg transition-all ${
                      comparisonMode === 'adsmanager'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚡ AdsManager Autonomous Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMode('sellercentral')}
                    className={`px-5 py-2.5 rounded-lg transition-all ${
                      comparisonMode === 'sellercentral'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚠️ Manual Seller Central Chaos
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Dynamic Comparison Panel */}
            <ScrollReveal delay={120}>
              {comparisonMode === 'adsmanager' ? (
                <div className="p-8 rounded-3xl bg-white text-slate-900 border-2 border-indigo-500/30 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-mono text-emerald-700 font-bold uppercase tracking-wider">
                        ● SYSTEM RUNNING AUTONOMOUSLY
                      </span>
                      <h3 className="text-2xl font-bold mt-1 text-slate-900">Peace of Mind with Mathematical Precision</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                      Zero Overnight Alarms Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-xs font-mono text-indigo-600 font-bold uppercase">Continuous Hourly Dayparting</div>
                      <div className="text-sm font-bold text-slate-900">168-Hour Precision Multipliers</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Bids throttle automatically during midnight dead hours, preserving cash flow for evening buying surges.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-xs font-mono text-emerald-700 font-bold uppercase">Automated Harvest Pipeline</div>
                      <div className="text-sm font-bold text-slate-900">Zero Manual CSV VLOOKUPs</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Converting customer search terms graduate directly into exact matches with source broad negation.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-xs font-mono text-indigo-600 font-bold uppercase">Deterministic Safety Caps</div>
                      <div className="text-sm font-bold text-slate-900">Hard Bid Floors &amp; Ceilings</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Every single rule has hard upper limits to prevent rogue bids or unexpected budget spikes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-rose-50/70 text-slate-900 border border-rose-200 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-rose-200">
                    <div>
                      <span className="text-xs font-mono text-rose-700 font-bold uppercase tracking-wider">
                        ⚠️ MANUAL SELLER CENTRAL REALITY
                      </span>
                      <h3 className="text-2xl font-bold mt-1 text-slate-900">30+ Hours Lost to Manual Spreadsheets</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-mono font-bold">
                      High Human Fatigue &amp; Error
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="p-5 rounded-xl bg-white border border-rose-200 space-y-2">
                      <div className="text-xs font-mono text-rose-700 font-bold uppercase">Midnight Budget Bleed</div>
                      <div className="text-sm font-semibold text-slate-900">No Native Dayparting</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Seller Central cannot schedule hourly bid adjustments. You either wake up at 2:00 AM or let budget bleed away.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-rose-200 space-y-2">
                      <div className="text-xs font-mono text-rose-700 font-bold uppercase">Manual Excel Hell</div>
                      <div className="text-sm font-semibold text-slate-900">Downloading Search Term CSVs</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Exporting 40MB spreadsheets every Monday, running VLOOKUPs, and hand-copying negative keywords.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-rose-200 space-y-2">
                      <div className="text-xs font-mono text-rose-700 font-bold uppercase">Out-of-Budget Caps</div>
                      <div className="text-sm font-semibold text-slate-900">Paused by 1:00 PM</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Your best-selling campaigns run out of daily budget midday, missing prime evening sales completely.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            11. REAL VERIFIED SELLER IMPACT STORIES (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">
                  Verified Seller Metrics
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-2">
                  What Scaling Looks Like in Production
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Tab Selectors */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveSellerTab(0)}
                      className={`w-full p-4 rounded-xl text-left font-mono transition-all border ${
                        activeSellerTab === 0
                          ? 'bg-white text-slate-900 border-2 border-indigo-600 shadow-sm ring-1 ring-indigo-600/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className={`text-[10px] uppercase font-semibold ${activeSellerTab === 0 ? 'text-indigo-600' : 'text-slate-400'}`}>HEALTH &amp; WELLNESS</div>
                      <div className="text-sm font-bold mt-0.5 text-slate-900">8-Figure Supplement Brand</div>
                      <div className="text-xs text-emerald-700 mt-1 font-bold">ACoS: 34.8% &rarr; 22.4%</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSellerTab(1)}
                      className={`w-full p-4 rounded-xl text-left font-mono transition-all border ${
                        activeSellerTab === 1
                          ? 'bg-white text-slate-900 border-2 border-indigo-600 shadow-sm ring-1 ring-indigo-600/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className={`text-[10px] uppercase font-semibold ${activeSellerTab === 1 ? 'text-indigo-600' : 'text-slate-400'}`}>CONSUMER ELECTRONICS</div>
                      <div className="text-sm font-bold mt-0.5 text-slate-900">Multi-Brand Aggregator</div>
                      <div className="text-xs text-emerald-700 mt-1 font-bold">ROAS: 2.8x &rarr; 4.6x</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSellerTab(2)}
                      className={`w-full p-4 rounded-xl text-left font-mono transition-all border ${
                        activeSellerTab === 2
                          ? 'bg-white text-slate-900 border-2 border-indigo-600 shadow-sm ring-1 ring-indigo-600/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className={`text-[10px] uppercase font-semibold ${activeSellerTab === 2 ? 'text-indigo-600' : 'text-slate-400'}`}>HOME &amp; KITCHEN</div>
                      <div className="text-sm font-bold mt-0.5 text-slate-900">Category Top 50 Brand</div>
                      <div className="text-xs text-emerald-700 mt-1 font-bold">Top of Search Share: 78%</div>
                    </button>
                  </div>

                  {/* Right: Selected Case Study Metrics */}
                  <div className="lg:col-span-8 p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-6">
                    {activeSellerTab === 0 && (
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">85 Active Campaigns across US &amp; UK</h4>
                            <div className="text-xs text-slate-500 font-mono">Monthly Ad Spend: ₹45,00,000+</div>
                          </div>
                          <span className="self-start sm:self-auto shrink-0 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                            VERIFIED PRODUCTION METRICS
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic font-serif">
                          &quot;Before AdsManager, our Sunday overnight bleed was out of control. We routinely spent ₹40,000 between midnight and 5:00 AM on clicks with a 2% conversion rate. AdsManager’s automated dayparting schedule clamped down overnight bids and reinvested the cash into 7:00 PM evening surges. Our ACoS dropped 12 points in 40 days.&quot;
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">ACoS Drop</div>
                            <div className="text-lg font-bold text-emerald-600 mt-0.5 truncate">-12.4%</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Monthly Recovered</div>
                            <div className="text-lg font-bold text-indigo-600 mt-0.5 truncate">₹4,20,000</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Manual Hours</div>
                            <div className="text-lg font-bold text-slate-900 mt-0.5 truncate">0 hrs/wk</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSellerTab === 1 && (
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">320+ Active ASINs across 3 Brands</h4>
                            <div className="text-xs text-slate-500 font-mono">Consumer Electronics &amp; Accessories</div>
                          </div>
                          <span className="self-start sm:self-auto shrink-0 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                            AGGREGATOR VERIFIED
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic font-serif">
                          &quot;Black-box AI platforms cost us an extra 3% of ad spend and randomly overbid ₹60 on broad queries. With AdsManager, our brand directors configure exact rule templates with hard floor and ceiling caps. We review proposed changes every morning in the batch review queue before applying them in one click.&quot;
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Blended ROAS</div>
                            <div className="text-lg font-bold text-emerald-600 mt-0.5 truncate">+64%</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Runaway Spikes</div>
                            <div className="text-lg font-bold text-indigo-600 mt-0.5 truncate">0 Incidents</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Audit Transparency</div>
                            <div className="text-lg font-bold text-slate-900 mt-0.5 truncate">100%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSellerTab === 2 && (
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">Dominating Top 15 Search Terms</h4>
                            <div className="text-xs text-slate-500 font-mono">Home &amp; Ergonomic Furniture</div>
                          </div>
                          <span className="self-start sm:self-auto shrink-0 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                            CATEGORY LEADER
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic font-serif">
                          &quot;Top-of-search placement multipliers completely changed our organic rank velocity. By boosting first-page bids dynamically during high conversion hours and setting product detail pages to 0%, our primary ASIN reached position #1 organic rank on our highest search-volume target.&quot;
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Top of Search Share</div>
                            <div className="text-lg font-bold text-emerald-600 mt-0.5 truncate">78%</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Organic Sales Lift</div>
                            <div className="text-lg font-bold text-indigo-600 mt-0.5 truncate">+48%</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Negative Queries</div>
                            <div className="text-lg font-bold text-slate-900 mt-0.5 truncate">410 Isolated</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            12. INTERACTIVE FAQ WITH CATEGORY FILTER (Scroll Revealed)
            ========================================================================= */}
        <section id="faq" className="py-24 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={0}>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">
                  Frequently Asked Questions
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Everything You Need to Know
                </h2>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <button
                  type="button"
                  onClick={() => setFaqCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                    faqCategory === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Questions
                </button>
                <button
                  type="button"
                  onClick={() => setFaqCategory('architecture')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                    faqCategory === 'architecture'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Architecture &amp; API
                </button>
                <button
                  type="button"
                  onClick={() => setFaqCategory('dayparting')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                    faqCategory === 'dayparting'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Rules &amp; Dayparting
                </button>
                <button
                  type="button"
                  onClick={() => setFaqCategory('pricing')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                    faqCategory === 'pricing'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Pricing &amp; Terms
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="flex flex-col gap-3">
                {filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4.5 text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`size-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${
                          openFaqIndex === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-4.5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* =========================================================================
            13. HIGH-IMPACT CLOSING CALL TO ACTION (Scroll Revealed)
            ========================================================================= */}
        <section className="py-24 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 text-slate-900 border-t border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-graph-paper opacity-50 pointer-events-none" />

          <ScrollReveal delay={0}>
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-semibold mb-6 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>14-Day Full-Access Free Trial · Zero Risk</span>
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight text-slate-900">
                Take Complete Control of Your Amazon Ads Today
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Eliminate wasted overnight clicks, optimize Top of Search placements, and scale with mathematical certainty.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm transition-colors text-center shadow-xs"
                >
                  Schedule an Architecture Demo
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-500">
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
          </ScrollReveal>
        </section>
      </main>

      {/* =========================================================================
          14. FOOTER & MANDATORY TRADEMARK DISCLAIMER
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
              <Link href="/terms-of-service" className="hover:text-indigo-600 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Prominent Legal Disclaimer as requested by User */}
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
              <span>Built for High-Precision Amazon Sellers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
