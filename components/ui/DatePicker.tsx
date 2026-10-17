'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value?: string | null; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string | null; // YYYY-MM-DD
  maxDate?: string | null; // YYYY-MM-DD
  disabled?: boolean;
  placeholder?: string;
  error?: boolean | string;
  id?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Select date',
  error = false,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view month/year based on value or today
  const initDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth()); // 0-11

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  // Compute month days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday is 0 in our grid: JS Sunday is 0 -> convert: (getDay() + 6) % 7
  const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const days: Array<{ dateStr: string; dayNum: number; disabled: boolean; isCurrentMonth: boolean }> = [];

  // Blank slots for previous month
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${y}-${pad2(m + 1)}-${pad2(dayNum)}`;
    days.push({
      dateStr,
      dayNum,
      disabled: true,
      isCurrentMonth: false,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
    let isDisabled = false;
    if (minDate && dateStr < minDate) isDisabled = true;
    if (maxDate && dateStr > maxDate) isDisabled = true;
    days.push({
      dateStr,
      dayNum: d,
      disabled: isDisabled,
      isCurrentMonth: true,
    });
  }

  // Fill remaining slots to make 35 or 42 cells
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${y}-${pad2(m + 1)}-${pad2(d)}`;
    days.push({
      dateStr,
      dayNum: d,
      disabled: true,
      isCurrentMonth: false,
    });
  }

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const displayLabel = value || '';

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between px-3 py-2 bg-surface text-sm font-mono tabular-nums rounded-md border text-left transition-colors outline-none focus:ring-1 focus:ring-primary ${
          error
            ? 'border-spend focus:border-spend focus:ring-spend'
            : 'border-border-dim focus:border-primary'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-text-main cursor-pointer'}`}
      >
        <span className={displayLabel ? 'text-text-main' : 'text-slate-400'}>
          {displayLabel || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendar date picker"
          className="absolute z-50 mt-1 left-0 bg-surface border border-border-dim rounded-md shadow-xl p-3 w-64 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border-dim">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-semibold font-mono text-text-main tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-mono text-slate-400 font-medium">
                {w}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((item, idx) => {
              const isSelected = value === item.dateStr;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => handleSelectDay(item.dateStr)}
                  className={`w-7 h-7 text-xs font-mono rounded flex items-center justify-center transition-colors ${
                    !item.isCurrentMonth
                      ? 'text-slate-300 pointer-events-none'
                      : item.disabled
                      ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                      : isSelected
                      ? 'bg-primary text-white font-bold'
                      : 'text-text-main hover:bg-slate-100'
                  }`}
                >
                  {item.dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
