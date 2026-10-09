"use client";

import { useState, useEffect, useCallback } from "react";

interface CampaignFiltersProps {
  filters: any;
  onChange: (filters: any) => void;
}

export function CampaignFilters({ filters, onChange }: CampaignFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localFilters);
    }, 400);
    return () => clearTimeout(timer);
  }, [localFilters, onChange]);

  const handleChange = (key: string, value: any) => {
    setLocalFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-wrap gap-4 items-center bg-surface border border-border-dim p-4 rounded-xl shadow-sm mb-6">
      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search</label>
        <input 
          type="text" 
          placeholder="Search campaigns..." 
          className="border border-border-dim rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={localFilters.q || ""}
          onChange={(e) => handleChange("q", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State</label>
        <select 
          className="border border-border-dim rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={localFilters.state?.[0] || ""}
          onChange={(e) => handleChange("state", e.target.value ? [e.target.value] : [])}
        >
          <option value="">All</option>
          <option value="ENABLED">Enabled</option>
          <option value="PAUSED">Paused</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Targeting</label>
        <select 
          className="border border-border-dim rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={localFilters.targeting_type || ""}
          onChange={(e) => handleChange("targeting_type", e.target.value)}
        >
          <option value="">All</option>
          <option value="AUTO">Auto</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Health</label>
        <select 
          className="border border-border-dim rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={localFilters.health || ""}
          onChange={(e) => handleChange("health", e.target.value)}
        >
          <option value="">All</option>
          <option value="HEALTHY">Healthy</option>
          <option value="NEEDS_ATTENTION">Needs Attention</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Budget</label>
        <input 
          type="number" 
          placeholder="Min Budget" 
          className="border border-border-dim rounded-md px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={localFilters.min_budget || ""}
          onChange={(e) => handleChange("min_budget", e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Max ACOS</label>
        <input 
          type="number" 
          placeholder="Max ACOS %" 
          className="border border-border-dim rounded-md px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={localFilters.max_acos || ""}
          onChange={(e) => handleChange("max_acos", e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
    </div>
  );
}
