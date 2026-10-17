'use client';

import React from 'react';

interface RadioCardProps {
  checked?: boolean;
  selected?: boolean;
  onChange?: () => void;
  onClick?: () => void;
  title: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function RadioCard({
  checked,
  selected,
  onChange,
  onClick,
  title,
  description,
  badge,
  disabled = false,
  name,
  value,
  icon,
  className = '',
}: RadioCardProps) {
  const isChecked = selected !== undefined ? selected : !!checked;
  const handleClick = onClick || onChange;

  return (
    <label
      onClick={() => {
        if (!disabled && handleClick) handleClick();
      }}
      className={`relative flex items-start gap-3.5 p-4 rounded-md border transition-all cursor-pointer select-none ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-slate-50 border-border-dim'
          : isChecked
          ? 'bg-indigo-50/40 border-primary shadow-xs ring-1 ring-primary'
          : 'bg-surface border-border-dim hover:border-slate-400'
      } ${className}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={isChecked}
        disabled={disabled}
        onChange={() => {
          if (!disabled && handleClick) handleClick();
        }}
        className="sr-only"
      />
      <div
        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
          isChecked ? 'border-primary bg-primary' : 'border-slate-400 bg-surface'
        }`}
      >
        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-600">{icon}</span>}
          <span className="text-sm font-semibold text-text-main">{title}</span>
          {badge && (
            <span className="text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
    </label>
  );
}
