'use client';

import React from 'react';

export interface MoneyInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  symbol?: string;
  currencySymbol?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  id?: string;
  name?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  'aria-describedby'?: string;
  'aria-label'?: string;
  helperText?: string;
}

export function MoneyInput({
  value,
  onChange,
  symbol = '₹',
  currencySymbol,
  placeholder = '0.00',
  disabled = false,
  error = false,
  min = 0,
  max,
  step = '0.01',
  id,
  name,
  className = '',
  autoFocus,
  onBlur,
  onKeyDown,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  helperText,
}: MoneyInputProps) {
  // Normalize any non-Indian currency signs ($ or USD) to ₹
  const rawSymbol = currencySymbol || symbol || '₹';
  const displaySymbol = rawSymbol === '$' || rawSymbol === 'USD' ? '₹' : rawSymbol;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    const numVal = parseFloat(raw);
    if (!Number.isNaN(numVal)) {
      onChange(numVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent invalid exponent inputs
    if (['e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div className="relative flex items-center w-full rounded-md">
        <span
          aria-hidden="true"
          className="absolute left-3 font-mono text-sm font-semibold text-slate-700 pointer-events-none select-none"
        >
          {displaySymbol}
        </span>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          id={id}
          name={name}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          className={`w-full pl-8 pr-3 py-2 bg-white text-sm text-slate-900 font-mono tabular-nums rounded-md border transition-colors outline-none focus:ring-1 focus:ring-indigo-600 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-indigo-600 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        />
      </div>
      {helperText && (
        <span className="block text-[11px] text-slate-500 mt-1 font-sans">{helperText}</span>
      )}
    </div>
  );
}
