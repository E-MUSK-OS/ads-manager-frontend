'use client';
import { clearTokens } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Target, Hash, Search, 
  Bot, Settings, FileText, CreditCard, LogOut, Zap
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearTokens();
    window.location.href = '/login';
  };

  const navGroups = [
    {
      title: 'Overview',
      links: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Advertising',
      links: [
        { href: '/campaigns', label: 'Campaigns', icon: Target },
        { href: '/keywords', label: 'Keywords', icon: Hash },
        { href: '/search-terms', label: 'Search Terms', icon: Search }
      ]
    },
    {
      title: 'Intelligence',
      links: [
        { href: '/ai-insights', label: 'AI Insights', icon: Bot },
        { href: '/automation-rules', label: 'Automation', icon: Zap }
      ]
    },
    {
      title: 'Configuration',
      links: [
        { href: '/reports', label: 'Reports', icon: FileText },
        { href: '/billing', label: 'Billing', icon: CreditCard },
        { href: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar System */}
      <aside className="w-64 bg-surface border-r border-border-dim flex flex-col z-20 shadow-sm">
        <div className="h-14 flex items-center px-6 border-b border-border-dim">
          <div className="font-mono font-bold tracking-tight text-lg text-primary">AdsManager</div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="px-3 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {group.title}
              </div>
              {group.links.map(link => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-slate-100 text-primary' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border-dim flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Workspace /</span>
            <span className="text-sm font-medium text-slate-900">Current Account</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/connect-amazon" 
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              Integrations
            </Link>
            <div className="w-px h-4 bg-slate-200"></div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </header>

        {/* Dynamic Page Content injected here on top of the graph paper background */}
        <div className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-graph-paper pointer-events-none opacity-60"></div>
          <div className="relative z-10 p-8 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}