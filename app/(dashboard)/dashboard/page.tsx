'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Plus, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [account, setAccount] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const accounts = await apiClient('/ads-accounts');
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const data = await apiClient('/metrics');
          setMetrics(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-pulse" />
          <div className="font-mono text-sm tracking-wider uppercase">Loading Workspace</div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="bg-surface border border-border-dim shadow-sm rounded-lg p-10 max-w-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-dim">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">No Active Integrations</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Connect your Amazon Ads account to initialize your command center. You will instantly see your spend, sales, and AI-driven optimizations mapped directly onto this grid.
          </p>
          <Link 
            href="/connect-amazon" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-surface font-medium rounded-md hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect Amazon Ads
          </Link>
        </div>
      </div>
    );
  }

  const totalSpend = metrics.reduce((acc, m) => acc + m.spend, 0);
  const totalSales = metrics.reduce((acc, m) => acc + m.sales, 0);
  const acos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
  const roas = totalSpend > 0 ? (totalSales / totalSpend) : 0;

  // Group by date for chart
  const dateMap: any = {};
  metrics.forEach(m => {
    if (!dateMap[m.date]) dateMap[m.date] = { date: m.date, spend: 0, sales: 0 };
    dateMap[m.date].spend += m.spend;
    dateMap[m.date].sales += m.sales;
  });
  
  const chartData = Object.values(dateMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Formatting utils
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Performance Overview</h1>
          <p className="text-sm text-slate-500 font-mono tracking-tight">TRAILING 90 DAYS // AGGREGATE</p>
        </div>
        <div className="text-sm font-medium text-slate-600 bg-surface px-4 py-2 border border-border-dim rounded-md shadow-sm">
          Last refreshed: Just now
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spend</div>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900">{formatCurrency(totalSpend)}</div>
        </div>
        
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900">{formatCurrency(totalSales)}</div>
        </div>
        
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ACOS</div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900">{formatNumber(acos)}%</div>
        </div>
        
        <div className="p-5 bg-surface shadow-sm rounded-md border border-border-dim relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ROAS</div>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900">{formatNumber(roas)}</div>
        </div>
      </div>

      {/* Chart directly on the grid stage */}
      <div className="p-6 bg-surface shadow-sm rounded-md border border-border-dim h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Spend vs Sales Velocity</h3>
          <div className="flex gap-4 text-sm font-medium">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Spend</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Sales</div>
          </div>
        </div>
        <div className="flex-1 min-h-0 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{fill: '#64748B'}} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
              <YAxis yAxisId="left" stroke="#94A3B8" tick={{fill: '#64748B'}} tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#0F172A', color: '#F8FAFC', borderRadius: '0.375rem', fontFamily: 'var(--font-mono)' }}
                itemStyle={{ color: '#F8FAFC' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#E11D48" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#E11D48' }} name="Spend" />
              <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#059669' }} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}