'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: React.ReactNode;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  items: TabItem[];
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({
  value,
  onChange,
  items,
  className = '',
  size = 'md',
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-300 max-w-full overflow-x-auto ${className}`}
    >
      {items.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-md font-medium transition-all select-none cursor-pointer ${
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
            } ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-950 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
