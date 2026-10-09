"use client";

import { useState, useEffect, useCallback } from "react";
import { CampaignFilters } from "@/components/campaigns/campaign-filters";
import { getCampaignReport, bulkAction, duplicateCampaign } from "@/lib/api-client";
import { formatCurrency, formatPct, formatNumber, cn } from "@/lib/utils";
import { Play, Pause, Archive, Settings2, Copy } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  const [data, setData] = useState<any>({ items: [], totals: {}, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{status: number, detail: string} | null>(null);
  const [filters, setFilters] = useState<any>({
    page: 1,
    page_size: 50,
    sort: "spend",
    dir: "desc"
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Hardcoded for MVP, in real app would get from context/store
  const accountId = 1; 

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCampaignReport({ ads_account_id: accountId, ...filters });
      setData(res);
    } catch (err: any) {
      console.error("Failed to fetch campaigns", err);
      setError({
        status: err.status || 500,
        detail: err.body?.detail || err.message || "Internal server error"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, accountId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
    setSelectedIds(new Set());
  }, []);

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkAction({ ids: Array.from(selectedIds), action, value });
      fetchCampaigns();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk action failed", err);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateCampaign(id);
      fetchCampaigns();
    } catch (err) {
      console.error("Duplicate failed", err);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(data.items.map((i: any) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Failed to load campaigns</h2>
          <p className="mb-4">{error.detail} ({error.status})</p>
          <button 
            onClick={fetchCampaigns}
            className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and monitor your advertising campaigns.</p>
        </div>
        <Link 
          href="/campaigns/new" 
          className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          Create Campaign
        </Link>
      </div>

      <CampaignFilters filters={filters} onChange={handleFilterChange} />

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 p-3 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-indigo-700 px-2">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-indigo-200 mx-1"></div>
          <button onClick={() => handleBulkAction("ENABLE")} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
            <Play className="w-4 h-4 text-emerald-600" /> Enable
          </button>
          <button onClick={() => handleBulkAction("PAUSE")} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
            <Pause className="w-4 h-4 text-amber-600" /> Pause
          </button>
          <button onClick={() => handleBulkAction("ARCHIVE")} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
            <Archive className="w-4 h-4 text-slate-500" /> Archive
          </button>
        </div>
      )}

      <div className="bg-white border border-border-dim rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-border-dim uppercase">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                    checked={data.items.length > 0 && selectedIds.size === data.items.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold text-right">Budget</th>
                <th className="px-4 py-3 font-semibold text-right">Spend</th>
                <th className="px-4 py-3 font-semibold text-right">Sales</th>
                <th className="px-4 py-3 font-semibold text-right">ACOS</th>
                <th className="px-4 py-3 font-semibold text-center">Health</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading campaigns...</td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No campaigns found matching your filters.
                  </td>
                </tr>
              ) : (
                data.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link href={`/campaigns/${item.id}`} className="font-medium text-slate-900 hover:text-primary hover:underline">
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded-full font-medium text-[10px]",
                            item.state === "ENABLED" ? "bg-emerald-100 text-emerald-700" :
                            item.state === "PAUSED" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {item.state}
                          </span>
                          <span>•</span>
                          <span>{item.targeting_type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">
                      {formatCurrency(item.daily_budget)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-spend)]">
                      {formatCurrency(item.spend)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-sales)]">
                      {formatCurrency(item.sales)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.acos === null && item.spend > 0 ? (
                        <span className="text-red-500 font-medium text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-100">No sales</span>
                      ) : (
                        <span className="font-mono text-xs font-semibold">{formatPct(item.acos)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                        item.health === "HEALTHY" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        item.health === "NEEDS_ATTENTION" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        item.health === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {item.health === "HEALTHY" ? "Healthy" : 
                         item.health === "NEEDS_ATTENTION" ? "Review" : 
                         item.health === "CRITICAL" ? "Critical" : "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/campaigns/${item.id}`} className="p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded transition-colors" title="Settings">
                          <Settings2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDuplicate(item.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded transition-colors" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && data.items.length > 0 && (
              <tfoot className="bg-slate-50 font-semibold border-t border-border-dim">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-slate-700">Total ({data.total_count})</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-spend)]">{formatCurrency(data.totals?.spend)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-sales)]">{formatCurrency(data.totals?.sales)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {data.totals?.spend > 0 && !data.totals?.sales ? (
                      <span className="text-red-500 font-medium text-xs">No sales</span>
                    ) : (
                      formatPct(data.totals?.acos)
                    )}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}