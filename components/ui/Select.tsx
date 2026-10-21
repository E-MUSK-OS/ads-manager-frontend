'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FieldError } from './FieldError';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string | boolean;
  placeholder?: string;
  options?: SelectOption[];
  containerClassName?: string;
  size?: 'sm' | 'md';
}

export function Select({
  label,
  error,
  placeholder,
  options,
  children,
  className = '',
  containerClassName = '',
  disabled = false,
  id,
  size = 'md',
  value,
  ...props
}: SelectProps) {
  const isSm = size === 'sm';
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative inline-flex w-full">
        <select
          id={id}
          disabled={disabled}
          value={value ?? ''}
          aria-invalid={hasError}
          className={`w-full appearance-none rounded-md border bg-surface pr-8 font-sans transition-colors outline-none cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 focus:border-primary focus:ring-1 focus:ring-primary ${
            isSm ? 'h-7 px-2.5 text-xs' : 'h-8.5 px-3 text-xs'
          } ${
            hasError
              ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-border-dim text-text-main hover:border-slate-400'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {errorMessage && <FieldError error={errorMessage} />}
    </div>
  );
}
