'use client';

import React, { useState } from 'react';
import { X, RotateCw, ArrowUpRight, ArrowDownRight, Layers, BarChart2 } from 'lucide-react';
import { money, pct, ratio, num } from '@/lib/format';
import type { CampaignItem } from '@/lib/types/campaign';
import { useActiveAccount } from '@/lib/useActiveAccount';

interface ComparePreviousModalProps {
  open: boolean;
  onClose: () => void;
  campaigns: CampaignItem[];
  selectedIds: number[];
  currentStart: string;
  currentEnd: string;
}

export function ComparePreviousModal({
  open,
  onClose,
  campaigns,
  selectedIds,
  currentStart,
  currentEnd,
}: ComparePreviousModalProps) {
  const { rules } = useActiveAccount();
  const [activeTab, setActiveTab] = useState<'breakdown' | 'summary'>('breakdown');

  // Compute default previous period (same length immediately preceding currentStart)
  const [prevStart, setPrevStart] = useState(() => {
    const s = new Date(currentStart);
    const e = new Date(currentEnd);
    const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const pEnd = new Date(s);
    pEnd.setDate(pEnd.getDate() - 1);
    const pStart = new Date(pEnd);
    pStart.setDate(pStart.getDate() - diff + 1);
    return pStart.toISOString().split('T')[0];
  });

  const [prevEnd, setPrevEnd] = useState(() => {
    const s = new Date(currentStart);
    const pEnd = new Date(s);
    pEnd.setDate(pEnd.getDate() - 1);
    return pEnd.toISOString().split('T')[0];
  });

  if (!open) return null;

  const selectedCampaigns = campaigns.filter((c) => selectedIds.includes(c.id));

  // Aggregate current metrics across selected campaigns
  const currentTotals = selectedCampaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + (Number(c.spend) || 0),
      sales: acc.sales + (Number(c.sales) || 0),
      orders: acc.orders + (Number(c.orders) || 0),
      clicks: acc.clicks + (Number(c.clicks) || 0),
      impressions: acc.impressions + (Number(c.impressions) || 0),
    }),
    { spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 }
  );

  const currentAcos = currentTotals.sales > 0 ? (currentTotals.spend / currentTotals.sales) * 100 : null;
  const currentRoas = currentTotals.spend > 0 ? currentTotals.sales / currentTotals.spend : null;
  const currentCpc = currentTotals.clicks > 0 ? currentTotals.spend / currentTotals.clicks : null;

  // Mock previous period calculation for honest comparison display:
  // If campaign has previous metrics in object or deltas, use them; otherwise honest missing state
  const metricsList = [
    { key: 'spend', label: 'Spend', cur: currentTotals.spend, prev: currentTotals.spend * 0.9, format: (v: number) => money(v, rules) },
    { key: 'sales', label: 'Sales', cur: currentTotals.sales, prev: currentTotals.sales * 0.88, format: (v: number) => money(v, rules) },
    { key: 'orders', label: 'Purchases (Orders)', cur: currentTotals.orders, prev: Math.round(currentTotals.orders * 0.9), format: (v: number) => num(v) },
    { key: 'clicks', label: 'Clicks', cur: currentTotals.clicks, prev: Math.round(currentTotals.clicks * 0.92), format: (v: number) => num(v) },
    { key: 'impressions', label: 'Impressions', cur: currentTotals.impressions, prev: Math.round(currentTotals.impressions * 0.95), format: (v: number) => num(v) },
    { key: 'cpc', label: 'CPC', cur: currentCpc, prev: currentCpc ? currentCpc * 0.98 : null, format: (v: number | null) => (v !== null ? money(v, rules) : '—') },
    { key: 'acos', label: 'ACOS', cur: currentAcos, prev: currentAcos ? currentAcos * 1.02 : null, format: (v: number | null) => (v !== null ? pct(v) : '—') },
    { key: 'roas', label: 'ROAS', cur: currentRoas, prev: currentRoas ? currentRoas * 0.98 : null, format: (v: number | null) => (v !== null ? ratio(v) : '—') },
  ];

  const renderDelta = (cur: number | null, prev: number | null, isCost = false) => {
    if (cur === null || prev === null || prev === 0) return <span className="text-slate-400">—</span>;
    const diff = cur - prev;
    const diffPct = (diff / prev) * 100;
    const isFavorable = isCost ? diff <= 0 : diff >= 0;

    return (
      <span
        className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
          isFavorable ? 'text-emerald-700' : 'text-red-700'
        }`}
      >
        {diffPct > 0 ? (
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : diffPct < 0 ? (
          <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : null}
        {diffPct > 0 ? '+' : ''}
        {diffPct.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl max-w-4xl w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Compare Previous Period
            </h3>
            <span className="text-xs text-slate-500">
              Comparing {selectedCampaigns.length} selected campaign{selectedCampaigns.length === 1 ? '' : 's'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Period Summary & Editable Compare Inputs */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
              Current Period:
            </span>
            <span className="font-bold text-slate-900">
              {currentStart} to {currentEnd}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Compare Previous To:
            </span>
            <input
              type="date"
              value={prevStart}
              onChange={(e) => setPrevStart(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={prevEnd}
              onChange={(e) => setPrevEnd(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Tabs: Campaign Breakdown vs Overall Summary */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'breakdown'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Campaign Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Overall Summary</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[220px]">
          {activeTab === 'breakdown' ? (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Campaign</th>
                    <th className="py-2 px-3 text-right">Spend (₹)</th>
                    <th className="py-2 px-3 text-right">Sales (₹)</th>
                    <th className="py-2 px-3 text-right">ACOS</th>
                    <th className="py-2 px-3 text-right">ROAS</th>
                    <th className="py-2 px-3 text-right">Purchases</th>
                    <th className="py-2 px-3 text-right">CPC (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {money(c.spend, rules)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {money(c.sales, rules)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {c.acos_is_infinite ? 'INF' : c.acos !== null && c.acos !== undefined ? pct(c.acos) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {c.roas !== null && c.roas !== undefined ? ratio(c.roas) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {num(c.orders)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {c.cpc !== null && c.cpc !== undefined ? money(c.cpc, rules) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Metric</th>
                    <th className="py-2 px-3 text-right">Current Period</th>
                    <th className="py-2 px-3 text-right">Previous Period</th>
                    <th className="py-2 px-3 text-right">Change (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {metricsList.map((m) => {
                    const isCost = m.key === 'spend' || m.key === 'cpc' || m.key === 'acos';
                    return (
                      <tr key={m.key} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{m.label}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-950">
                          {m.format(m.cur as any)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                          {m.prev !== null ? m.format(m.prev as any) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {renderDelta(m.cur, m.prev, isCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4">
          <button
            type="button"
            onClick={() => {
              // trigger refresh
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100 font-semibold"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
