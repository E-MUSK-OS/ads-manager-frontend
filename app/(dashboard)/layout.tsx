'use client';

import { clearTokens } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Target, Settings, LogOut, ChevronDown, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { getRecommendationsSummary } from '@/lib/recommendations-api';
import React, { useState, useEffect } from 'react';

function AccountSwitcher() {
  const { accounts, account, setActiveAccountId, loading } = useActiveAccount();

  if (loading) {
    return <span className="text-xs font-mono text-slate-400">Loading account...</span>;
  }

  if (accounts.length === 0) {
    return (
      <Link href="/connect-amazon" className="text-xs font-medium text-primary hover:underline">
        Connect Amazon Ads
      </Link>
    );
  }

  // Deduplicate accounts: keep unique by profile_id if present, else by id
  const seenProfiles = new Set<string>();
  const uniqueAccounts: typeof accounts = [];
  for (const acc of accounts) {
    const key = acc.profile_id ? `prof_${acc.profile_id}` : `id_${acc.id}`;
    if (!seenProfiles.has(key)) {
      seenProfiles.add(key);
      uniqueAccounts.push(acc);
    }
  }

  // Count names to detect collision for appending profile_id suffix
  const nameCounts: Record<string, number> = {};
  uniqueAccounts.forEach((a) => {
    const rawName = a.amazon_account_name || a.account_name || 'Amazon Account';
    nameCounts[rawName] = (nameCounts[rawName] || 0) + 1;
  });

  const formatAccountLabel = (a: (typeof accounts)[0]) => {
    const name = a.amazon_account_name || a.account_name || 'Amazon Account';
    const hasCollision = (nameCounts[name] || 0) > 1 && Boolean(a.profile_id);
    const suffix = hasCollision && a.profile_id ? ` (${a.profile_id.slice(-4)})` : '';
    const mp = (a.marketplace || 'IN').toUpperCase();
    return `${name}${suffix} · ${mp} · INR`;
  };

  if (uniqueAccounts.length === 1) {
    const acc = uniqueAccounts[0];
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-border-dim font-mono text-xs text-text-main font-medium">
        <span>{formatAccountLabel(acc)}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={account?.id ?? uniqueAccounts[0]?.id}
        onChange={(e) => setActiveAccountId(Number(e.target.value))}
        className="text-xs font-mono font-medium pl-2.5 pr-6 py-1 bg-slate-100 hover:bg-slate-200 border border-border-dim rounded-md text-text-main outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none transition-colors"
      >
        {uniqueAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {formatAccountLabel(a)}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account } = useActiveAccount();
  const [openCount, setOpenCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const fetchOpenCount = async () => {
      if (!account?.id) {
        if (active) setOpenCount(0);
        return;
      }
      try {
        const s = await getRecommendationsSummary(account.id);
        if (active) setOpenCount(s.open || 0);
      } catch {
        // ignore background fetch error
      }
    };

    const timer = setTimeout(() => {
      fetchOpenCount();
    }, 0);

    const handleChanged = () => {
      fetchOpenCount();
    };

    window.addEventListener('recommendations:changed', handleChanged);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('recommendations:changed', handleChanged);
    };
  }, [account]);

  const handleLogout = () => {
    clearTokens();
    window.location.href = '/login';
  };

  const navLinks = [
    { href: '/campaigns', label: 'Campaigns', icon: Target },
    { href: '/recommendations', label: 'Recommendations', icon: Sparkles, badge: openCount },
    { href: '/rules', label: 'Rules', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar System */}
      <aside className="w-64 bg-surface border-r border-border-dim flex flex-col z-20 shadow-sm">
        <div className="h-14 flex items-center px-6 border-b border-border-dim">
          <div className="font-mono font-bold tracking-tight text-lg text-primary">AdsManager</div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-slate-100 text-primary font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {Boolean(link.badge && link.badge > 0) && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-indigo-50 text-primary border border-indigo-200">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border-dim flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Workspace /</span>
            <AccountSwitcher />
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/settings" 
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              title="Account settings & Amazon connection"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
            <div className="w-px h-4 bg-slate-200"></div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content injected here on top of the graph paper background */}
        <div className="flex-1 overflow-auto relative">
          <div className="fixed inset-0 bg-graph-paper pointer-events-none opacity-60 z-0"></div>
          <div className="relative z-10 p-8 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
