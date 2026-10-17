'use client';

import React from 'react';

interface MoneyInputProps {
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
}

export function MoneyInput({
  value,
  onChange,
  symbol,
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
}: MoneyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Reject exponential 'e', minus '-', plus '+'
    if (['e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <div className={`relative flex items-center rounded-md ${className}`}>
      <span
        aria-hidden="true"
        className="absolute left-3 font-mono text-sm text-slate-500 pointer-events-none select-none"
      >
        {currencySymbol || symbol || '$'}
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
        className={`w-full pl-8 pr-3 py-2 bg-surface text-sm text-text-main font-mono tabular-nums rounded-md border transition-colors outline-none focus:ring-1 focus:ring-primary ${
          error
            ? 'border-spend focus:border-spend focus:ring-spend'
            : 'border-border-dim focus:border-primary'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
