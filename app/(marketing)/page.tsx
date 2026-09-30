import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="flex justify-between items-center p-6 border-b border-border-dim bg-surface">
        <div className="font-mono text-xl font-bold tracking-tight">AdsManager</div>
        <nav className="flex gap-6 items-center">
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</Link>
          <div className="w-px h-4 bg-slate-300"></div>
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign in</Link>
          <Link href="/signup" className="text-sm font-medium bg-primary text-surface px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">Get started</Link>
        </nav>
      </header>

      <main className="flex-1 bg-graph-paper-faint">
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-3xl">
            Precision control for Amazon Advertising.
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl">
            Stop relying on delayed reports and gut feelings. Connect your Amazon Ads account to instantly visualize spend efficiency, automate bids, and let AI surface real profit opportunities on a live data grid.
          </p>
          <div className="flex gap-4 mb-16">
            <Link href="/signup" className="px-6 py-3 bg-primary text-surface font-medium rounded-md hover:bg-indigo-600 transition-colors">
              Connect Amazon Ads
            </Link>
          </div>
          
          {/* Mock Dashboard Snapshot embedded in the Hero */}
          <div className="w-full bg-surface border border-border-dim shadow-xl rounded-lg overflow-hidden flex flex-col max-w-5xl text-left">
            <div className="border-b border-border-dim bg-slate-50 p-4 flex gap-4 items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="font-mono text-xs text-slate-500 tracking-wider">COMMAND CENTER // LIVE METRICS</div>
            </div>
            
            <div className="flex bg-graph-paper min-h-[400px]">
              {/* Sidebar mock */}
              <div className="w-48 border-r border-border-dim bg-surface/80 p-4 flex flex-col gap-2">
                <div className="text-xs font-mono text-slate-500 mb-2">VIEWS</div>
                <div className="text-sm font-medium bg-slate-100 p-2 rounded">Overview</div>
                <div className="text-sm font-medium p-2 text-slate-600">Campaigns</div>
                <div className="text-sm font-medium p-2 text-slate-600">AI Insights</div>
              </div>
              
              {/* Main content mock */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* Metric Cards integrated onto the grid */}
                  <div className="bg-surface border border-border-dim p-4 rounded-md shadow-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Spend</div>
                    <div className="text-2xl font-mono font-bold text-spend">$12,450.00</div>
                  </div>
                  <div className="bg-surface border border-border-dim p-4 rounded-md shadow-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sales</div>
                    <div className="text-2xl font-mono font-bold text-sales">$48,230.00</div>
                  </div>
                  <div className="bg-surface border border-border-dim p-4 rounded-md shadow-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ACOS</div>
                    <div className="text-2xl font-mono font-bold">25.8%</div>
                  </div>
                  <div className="bg-surface border border-border-dim p-4 rounded-md shadow-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ROAS</div>
                    <div className="text-2xl font-mono font-bold">3.87</div>
                  </div>
                </div>
                
                {/* Chart Mock */}
                <div className="h-64 border border-border-dim bg-surface rounded-md shadow-sm p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-graph-paper opacity-50 pointer-events-none"></div>
                  <div className="relative z-10 flex h-full items-end gap-2 px-4 pt-8">
                    {/* Simulated bars */}
                    <div className="flex-1 flex gap-1 items-end h-[60%]"><div className="w-1/2 bg-spend h-full"></div><div className="w-1/2 bg-sales h-[120%]"></div></div>
                    <div className="flex-1 flex gap-1 items-end h-[70%]"><div className="w-1/2 bg-spend h-full"></div><div className="w-1/2 bg-sales h-[140%]"></div></div>
                    <div className="flex-1 flex gap-1 items-end h-[50%]"><div className="w-1/2 bg-spend h-full"></div><div className="w-1/2 bg-sales h-[180%]"></div></div>
                    <div className="flex-1 flex gap-1 items-end h-[80%]"><div className="w-1/2 bg-spend h-full"></div><div className="w-1/2 bg-sales h-[110%]"></div></div>
                    <div className="flex-1 flex gap-1 items-end h-[90%]"><div className="w-1/2 bg-spend h-full"></div><div className="w-1/2 bg-sales h-[130%]"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border-dim py-8 text-center text-sm text-slate-500 bg-surface">
        <div className="flex gap-4 justify-center mb-4">
          <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link>
        </div>
        &copy; {new Date().getFullYear()} AdsManager. All rights reserved.
      </footer>
    </div>
  );
}