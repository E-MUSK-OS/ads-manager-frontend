'use client';

import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

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

function FieldError({ error }: { error: string }) {
  return (
    <p role="alert" className="text-xs text-red-600 flex items-center gap-1.5 mt-1.5 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  );
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
        <label htmlFor={id} className="text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative inline-flex w-full">
        <select
          id={id}
          disabled={disabled}
          value={value ?? ''}
          aria-invalid={hasError}
          className={`w-full appearance-none rounded-md border bg-white text-slate-900 pr-8 font-sans transition-colors outline-none cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 ${
            isSm ? 'h-7 px-2.5 text-xs' : 'h-8.5 px-3 text-xs'
          } ${
            hasError
              ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-white text-slate-500">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-white text-slate-900"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500"
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
      {errorMessage && <FieldError error={errorMessage} />}
    </div>
  );
}
