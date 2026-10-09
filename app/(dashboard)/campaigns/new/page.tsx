"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/api-client";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    targeting_type: "AUTO",
    daily_budget: 10,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    bidding_strategy: "DYNAMIC_DOWN_ONLY"
  });

  const accountId = 1; // Hardcoded for MVP

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const payload: any = {
        ads_account_id: accountId,
        ...formData,
        product_ids: [1], // Mock product
        ad_groups: [{
          name: "Default Ad Group",
          default_bid: 1.0,
          keywords: []
        }]
      };
      if (!payload.end_date) delete payload.end_date;

      await createCampaign(payload);
      router.push("/campaigns");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link href="/campaigns" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to campaigns
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Campaign</h1>
        <p className="text-slate-500 mt-1">Configure your advertising campaign settings and targeting.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Error creating campaign</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-border-dim shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 border-b border-border-dim pb-4">Basic Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="e.g. Q4 Holiday Sale"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date (Optional)</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={formData.end_date}
                  onChange={e => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Budget</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input 
                  type="number" 
                  required
                  min="1"
                  step="0.01"
                  className="w-full pl-7 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={formData.daily_budget}
                  onChange={e => setFormData({...formData, daily_budget: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border-dim shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 border-b border-border-dim pb-4">Targeting Strategy</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Targeting Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, targeting_type: "AUTO"})}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.targeting_type === "AUTO" 
                      ? "border-primary bg-indigo-50/50 ring-1 ring-primary shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <h3 className={cn("font-medium", formData.targeting_type === "AUTO" ? "text-primary" : "text-slate-900")}>Automatic</h3>
                  <p className="text-sm text-slate-500 mt-1">Amazon targets your ads to relevant searches.</p>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, targeting_type: "MANUAL"})}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.targeting_type === "MANUAL" 
                      ? "border-primary bg-indigo-50/50 ring-1 ring-primary shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <h3 className={cn("font-medium", formData.targeting_type === "MANUAL" ? "text-primary" : "text-slate-900")}>Manual</h3>
                  <p className="text-sm text-slate-500 mt-1">You choose exact keywords or products.</p>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Bidding Strategy</label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                value={formData.bidding_strategy}
                onChange={e => setFormData({...formData, bidding_strategy: e.target.value})}
              >
                <option value="DYNAMIC_DOWN_ONLY">Dynamic bids - down only</option>
                <option value="DYNAMIC_UP_DOWN">Dynamic bids - up and down</option>
                <option value="FIXED">Fixed bids</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href="/campaigns" className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Launch Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
