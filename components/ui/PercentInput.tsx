'use client';

import React from 'react';

interface PercentInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  id?: string;
  name?: string;
  className?: string;
  allowDecimals?: boolean;
  autoFocus?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export function PercentInput({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  error = false,
  min = 0,
  max = 900,
  step = 1,
  id,
  name,
  className = '',
  allowDecimals = false,
  autoFocus,
  onBlur,
  onKeyDown,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: PercentInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
    if (!allowDecimals && e.key === '.') {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <div className={`relative flex items-center rounded-md ${className}`}>
      <input
        type="number"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
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
        className={`w-full pl-3 pr-8 py-2 bg-surface text-sm text-text-main font-mono tabular-nums rounded-md border transition-colors outline-none focus:ring-1 focus:ring-primary ${
          error
            ? 'border-spend focus:border-spend focus:ring-spend'
            : 'border-border-dim focus:border-primary'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
      />
      <span
        aria-hidden="true"
        className="absolute right-3 font-mono text-sm text-slate-500 pointer-events-none select-none"
      >
        %
      </span>
    </div>
  );
}
