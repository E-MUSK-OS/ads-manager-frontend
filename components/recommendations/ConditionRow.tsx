import React from 'react';
import { Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { getMetricUnitAdornment } from './describe';
import type { Condition, Meta, Operator } from '@/lib/types/recommendation';

interface ConditionRowProps {
  condition: Condition;
  index: number;
  meta: Meta | null;
  currencySymbol: string;
  error?: string;
  onChange: (index: number, updated: Condition) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function ConditionRow({
  condition,
  index,
  meta,
  currencySymbol,
  error,
  onChange,
  onRemove,
  canRemove,
}: ConditionRowProps) {
  const metricOptions = meta?.metrics
    ? Object.entries(meta.metrics).map(([key, val]) => ({
        value: key,
        label: val.label,
      }))
    : [];

  const operatorOptions = meta?.operators
    ? Object.entries(meta.operators).map(([key, val]) => ({
        value: key,
        label: `${val.symbol} (${val.label})`,
      }))
    : [];

  const isMetricSelected = Boolean(condition.metric);
  const isOperatorSelected = Boolean(condition.op);
  const unitAdornment = getMetricUnitAdornment(condition.metric, meta, currencySymbol);

  const handleMetricChange = (val: string) => {
    onChange(index, {
      ...condition,
      metric: val,
      // If operator not set, default to GTE if available
      op: condition.op || 'GTE',
    });
  };

  const handleOperatorChange = (val: string) => {
    onChange(index, {
      ...condition,
      op: val as Operator,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(index, { ...condition, value: null });
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(index, { ...condition, value: parsed });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Reject exponential 'e', minus '-', plus '+'
    if (['e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* Metric Select */}
        <div className="flex-1 min-w-[140px]">
          <Select
            value={condition.metric}
            onChange={(e) => handleMetricChange(e.target.value)}
            options={metricOptions}
            placeholder="Select metric..."
            aria-label={`Condition ${index + 1} metric`}
          />
        </div>

        {/* Operator Select */}
        <div className="w-[170px]">
          <Select
            value={condition.op || ''}
            onChange={(e) => handleOperatorChange(e.target.value)}
            options={operatorOptions}
            placeholder="Select operator..."
            disabled={!isMetricSelected}
            aria-label={`Condition ${index + 1} operator`}
          />
        </div>

        {/* Value Input */}
        <div className="w-[140px] relative">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={condition.value !== null && condition.value !== undefined ? condition.value : ''}
            onChange={handleValueChange}
            onKeyDown={handleKeyDown}
            disabled={!isOperatorSelected}
            placeholder="0"
            className={`w-full h-8 px-2.5 rounded-md border text-sm bg-surface transition-all outline-none font-mono tabular-nums ${
              unitAdornment ? 'pr-7' : ''
            } ${
              !isOperatorSelected
                ? 'bg-slate-50 border-border-dim text-text-muted cursor-not-allowed'
                : 'border-border-dim focus:border-primary focus:ring-1 focus:ring-primary'
            } ${error ? 'border-danger' : ''}`}
            aria-label={`Condition ${index + 1} value`}
          />
          {unitAdornment && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted pointer-events-none select-none">
              {unitAdornment}
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Remove condition"
          aria-label={`Remove condition ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {error && <span className="text-xs text-danger ml-1">{error}</span>}
    </div>
  );
}
