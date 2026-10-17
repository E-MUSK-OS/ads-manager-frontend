'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { Popover } from '@/components/ui/Popover';

export interface DateRangeState {
  preset: string;
  start: string;
  end: string;
  compare: boolean;
}

interface DateRangePickerProps {
  value: DateRangeState;
  onChange: (value: DateRangeState) => void;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Calculate previous period of equal length immediately preceding start date
function getPreviousPeriod(startStr: string, endStr: string): { start: string; end: string } {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays + 1);

  return { start: formatDate(prevStart), end: formatDate(prevEnd) };
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { todayInTz } = useActiveAccount();
  const [open, setOpen] = useState(false);
  const todayStr = todayInTz();

  const [localPreset, setLocalPreset] = useState(value.preset);
  const [localStart, setLocalStart] = useState(value.start);
  const [localEnd, setLocalEnd] = useState(value.end);
  const [localCompare, setLocalCompare] = useState(value.compare);

  // Month navigation for internal calendar
  const [viewDate, setViewDate] = useState(() => parseDate(value.end || todayStr));

  useEffect(() => {
    setLocalPreset(value.preset);
    setLocalStart(value.start);
    setLocalEnd(value.end);
    setLocalCompare(value.compare);
  }, [value]);

  const calculatePreset = (key: string) => {
    const today = parseDate(todayStr);
    let s = new Date(today);
    let e = new Date(today);

    switch (key) {
      case 'today':
        break;
      case 'yesterday':
        s.setDate(s.getDate() - 1);
        e.setDate(e.getDate() - 1);
        break;
      case 'last_7_days':
        s.setDate(s.getDate() - 6);
        break;
      case 'last_14_days':
        s.setDate(s.getDate() - 13);
        break;
      case 'this_week': {
        // Monday as start of week
        const day = s.getDay();
        const diff = s.getDate() - day + (day === 0 ? -6 : 1);
        s.setDate(diff);
        break;
      }
      case 'last_week': {
        const day = s.getDay();
        const diff = s.getDate() - day + (day === 0 ? -6 : 1) - 7;
        s.setDate(diff);
        e = new Date(s);
        e.setDate(e.getDate() + 6);
        break;
      }
      case 'last_30_days':
        s.setDate(s.getDate() - 29);
        break;
      case 'this_month':
        s = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        e = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setLocalPreset(key);
    setLocalStart(formatDate(s));
    setLocalEnd(formatDate(e));
  };

  const handleApply = () => {
    onChange({
      preset: localPreset,
      start: localStart,
      end: localEnd,
      compare: localCompare,
    });
    setOpen(false);
  };

  const handleReset = () => {
    calculatePreset('last_7_days');
    setLocalCompare(false);
  };

  const prevPeriod = getPreviousPeriod(localStart, localEnd);

  const presets = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last_7_days', label: 'Last 7 days' },
    { key: 'last_14_days', label: 'Last 14 days' },
    { key: 'this_week', label: 'This week' },
    { key: 'last_week', label: 'Last week' },
    { key: 'last_30_days', label: 'Last 30 days' },
    { key: 'this_month', label: 'This month' },
    { key: 'last_month', label: 'Last month' },
    { key: 'custom', label: 'Custom' },
  ];

  // Calendar grid generation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  let startingDayOfWeek = firstDay.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInMonth = lastDay.getDate();
  const days: Array<{ dateStr: string; dayNum: number; disabled: boolean }> = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ dateStr: '', dayNum: 0, disabled: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = formatDate(new Date(year, month, d));
    const disabled = dStr > todayStr;
    days.push({ dateStr: dStr, dayNum: d, disabled });
  }

  const handleDayClick = (dateStr: string) => {
    setLocalPreset('custom');
    if (!localStart || (localStart && localEnd)) {
      setLocalStart(dateStr);
      setLocalEnd('');
    } else {
      if (dateStr < localStart) {
        setLocalEnd(localStart);
        setLocalStart(dateStr);
      } else {
        setLocalEnd(dateStr);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded-md border border-border-dim bg-surface hover:bg-slate-50 transition-colors shadow-2xs text-text-main"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {value.start} — {value.end}
          </span>
          {value.compare && (
            <span className="text-[10px] text-primary bg-indigo-50 px-1 py-0.5 rounded font-mono">
              CMP
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      }
    >
      <div className="w-[520px] p-3 text-text-main">
        <div className="flex gap-4">
          {/* Presets Column */}
          <div className="w-36 border-r border-border-dim pr-3 flex flex-col gap-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-2">
              Presets
            </span>
            {presets.map((p) => {
              const active = localPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => calculatePreset(p.key)}
                  className={`text-left px-2 py-1 text-xs rounded-md transition-colors ${
                    active
                      ? 'bg-primary text-white font-medium'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs + Calendar */}
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStart}
                  max={todayStr}
                  onChange={(e) => {
                    setLocalStart(e.target.value);
                    setLocalPreset('custom');
                  }}
                  className="w-full px-2 py-1 text-xs font-mono border border-border-dim rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEnd}
                  min={localStart}
                  max={todayStr}
                  onChange={(e) => {
                    setLocalEnd(e.target.value);
                    setLocalPreset('custom');
                  }}
                  className="w-full px-2 py-1 text-xs font-mono border border-border-dim rounded-md bg-white"
                />
              </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="px-1.5 py-0.5 text-xs border border-border-dim rounded hover:bg-slate-100"
              >
                ‹
              </button>
              <span className="text-xs font-mono font-medium">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                disabled={new Date(year, month + 1, 1) > parseDate(todayStr)}
                className="px-1.5 py-0.5 text-xs border border-border-dim rounded hover:bg-slate-100 disabled:opacity-40"
              >
                ›
              </button>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <div key={d} className="text-slate-400 py-0.5">
                  {d}
                </div>
              ))}
              {days.map((item, idx) => {
                if (!item.dateStr) return <div key={`empty-${idx}`} />;
                const inRange =
                  localStart &&
                  localEnd &&
                  item.dateStr >= localStart &&
                  item.dateStr <= localEnd;
                const isStart = item.dateStr === localStart;
                const isEnd = item.dateStr === localEnd;

                let cls = 'rounded py-1 text-xs transition-colors ';
                if (item.disabled) {
                  cls += 'text-slate-300 cursor-not-allowed';
                } else if (isStart || isEnd) {
                  cls += 'bg-primary text-white font-medium';
                } else if (inRange) {
                  cls += 'bg-indigo-50 text-indigo-900';
                } else {
                  cls += 'hover:bg-slate-100 text-slate-700 cursor-pointer';
                }

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleDayClick(item.dateStr)}
                    className={cls}
                  >
                    {item.dayNum}
                  </button>
                );
              })}
            </div>

            {/* Compare Toggle */}
            <div className="mt-3 pt-2 border-t border-border-dim flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={localCompare}
                  onChange={(e) => setLocalCompare(e.target.checked)}
                  className="rounded border-border-dim text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="font-medium">Compare to previous period</span>
              </label>
              {localCompare && localStart && localEnd && (
                <span className="text-[11px] font-mono text-slate-500">
                  vs {prevPeriod.start} – {prevPeriod.end}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-3 pt-2 border-t border-border-dim flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-2.5 py-1 rounded border border-border-dim hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!localStart || !localEnd}
              className="text-xs px-3 py-1 rounded bg-primary text-white font-medium hover:bg-indigo-800 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </Popover>
  );
}
