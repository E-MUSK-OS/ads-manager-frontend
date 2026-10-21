'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}: SwitchProps) {
  const isSm = size === 'sm';

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isSm ? 'h-4 w-7' : 'h-5 w-9'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${checked ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-xs transform ring-0 transition duration-200 ease-in-out ${
            isSm
              ? `h-3 w-3 ${checked ? 'translate-x-3.5' : 'translate-x-0.5'} mt-0.5`
              : `h-4 w-4 ${checked ? 'translate-x-4.5' : 'translate-x-0.5'} mt-0.5`
          }`}
        />
      </button>
      {label && (
        <span
          onClick={handleToggle}
          className={`text-xs select-none ${
            disabled ? 'text-slate-400 cursor-not-allowed' : 'text-text-main cursor-pointer'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
