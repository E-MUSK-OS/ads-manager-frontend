import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import type { RuleAction, Meta, AffectedParameter } from '@/lib/types/recommendation';

interface ActionRowProps {
  action: RuleAction;
  index: number;
  affectedParameter: AffectedParameter;
  meta: Meta | null;
  currencySymbol: string;
  error?: string;
  onChange: (index: number, updated: RuleAction) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function ActionRow({
  action,
  index,
  affectedParameter,
  meta,
  currencySymbol,
  error,
  onChange,
  onRemove,
  canRemove,
}: ActionRowProps) {
  // Available actions for the selected affected parameter
  const actionDefinitions = React.useMemo(() => {
    if (!meta?.actions || !meta.actions[affectedParameter]) return {};
    return meta.actions[affectedParameter];
  }, [meta?.actions, affectedParameter]);

  const actionOptions = React.useMemo(() => {
    return Object.entries(actionDefinitions).map(([key, val]) => ({
      value: key,
      label: val.label,
    }));
  }, [actionDefinitions]);

  // Handle Type Change: clears the value when type changes
  const handleTypeChange = (newType: string) => {
    if (newType === action.type) return;

    let defaultParams: Record<string, string | number | null> = {};
    if (newType === 'INCREASE_BID' || newType === 'DECREASE_BID') {
      defaultParams = { mode: 'percent', value: null };
    } else if (newType === 'INCREASE_BUDGET' || newType === 'DECREASE_BUDGET') {
      defaultParams = { mode: 'percent', value: null };
    } else if (newType === 'SET_BUDGET') {
      defaultParams = { mode: 'amount', value: null };
    } else if (newType === 'ENABLE_CAMPAIGN' || newType === 'PAUSE_CAMPAIGN' || newType === 'PAUSE_TARGET') {
      defaultParams = {};
    } else if (newType === 'ADD_AS_NEGATIVE') {
      defaultParams = { match_type: 'NEGATIVE_EXACT', level: 'AD_GROUP' };
    } else {
      defaultParams = {};
    }

    onChange(index, {
      type: newType,
      params: defaultParams,
    });
  };

  // Derive mode: defaults to 'percent' unless 'amount' specified
  const currentMode = (action.params?.mode as string) || (action.params?.pct !== undefined ? 'percent' : 'percent');
  const currentValue = action.params?.value !== undefined && action.params?.value !== null
    ? action.params.value
    : (action.params?.pct !== undefined && action.params?.pct !== null ? action.params.pct : '');

  const handleModeChange = (newMode: 'percent' | 'amount') => {
    onChange(index, {
      ...action,
      params: {
        ...action.params,
        mode: newMode,
        value: null, // clear value on unit switch
      },
    });
  };

  const handleValueChange = (valStr: string) => {
    const num = valStr === '' ? null : Number(valStr);
    onChange(index, {
      ...action,
      params: {
        ...action.params,
        mode: currentMode,
        value: num,
      },
    });
  };

  const handleParamKeyChange = (paramKey: string, val: string | number | null) => {
    onChange(index, {
      ...action,
      params: {
        ...action.params,
        [paramKey]: val,
      },
    });
  };

  const isBidOrBudgetChange =
    action.type === 'INCREASE_BID' ||
    action.type === 'DECREASE_BID' ||
    action.type === 'INCREASE_BUDGET' ||
    action.type === 'DECREASE_BUDGET';

  const isSetBudget = action.type === 'SET_BUDGET';
  const isEnableCampaign = action.type === 'ENABLE_CAMPAIGN';
  const isAddNegative = action.type === 'ADD_AS_NEGATIVE';

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-md bg-slate-50/70 border border-border-dim">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Action Type Select */}
        <div className="min-w-[190px] flex-1 sm:flex-initial">
          <Select
            value={action.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            options={actionOptions}
            placeholder="Select action..."
            aria-label={`Action ${index + 1} type`}
          />
        </div>

        {/* Bid/Budget Percentage or Amount Controls */}
        {isBidOrBudgetChange && (
          <div className="flex items-center gap-2">
            {/* Mode switch */}
            <div className="inline-flex items-center rounded-md border border-border-dim bg-white p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleModeChange('percent')}
                className={`px-2 py-1 rounded transition-colors ${
                  currentMode === 'percent'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="Percentage"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('amount')}
                className={`px-2 py-1 rounded transition-colors ${
                  currentMode === 'amount'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="Fixed Amount"
              >
                {currencySymbol}
              </button>
            </div>

            {/* Value with unit inside box */}
            <div className="relative w-28">
              {currentMode === 'amount' && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted pointer-events-none select-none">
                  {currencySymbol}
                </span>
              )}
              <input
                type="number"
                inputMode="decimal"
                min={currentMode === 'percent' ? 1 : 0.01}
                max={currentMode === 'percent' ? (action.type.includes('INCREASE') ? 500 : 90) : undefined}
                step={currentMode === 'percent' ? 1 : 0.01}
                value={currentValue !== null && currentValue !== undefined ? currentValue : ''}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                }}
                placeholder={currentMode === 'percent' ? '10' : '5.00'}
                className={`w-full h-8 rounded-md border border-border-dim text-sm bg-surface font-mono tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
                  currentMode === 'percent' ? 'px-2.5 pr-6' : 'pl-6 pr-2.5'
                }`}
                aria-label={`Action ${index + 1} value`}
              />
              {currentMode === 'percent' && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted pointer-events-none select-none">
                  %
                </span>
              )}
            </div>
          </div>
        )}

        {/* Set Budget Controls */}
        {isSetBudget && (
          <div className="flex items-center gap-2">
            <div className="relative w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted pointer-events-none select-none">
                {currencySymbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={100}
                step={1}
                value={currentValue !== null && currentValue !== undefined ? currentValue : ''}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                }}
                placeholder="100"
                className="w-full h-8 pl-6 pr-2.5 rounded-md border border-border-dim text-sm bg-surface font-mono tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                aria-label="Daily budget value"
              />
            </div>
            <span className="text-[11px] text-text-muted">(Min {currencySymbol}100)</span>
          </div>
        )}

        {/* Enable Campaign Warning Badge */}
        {isEnableCampaign && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 rounded border border-amber-200">
            <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
            <span>This will start spending</span>
          </div>
        )}

        {/* Add As Negative Parameters */}
        {isAddNegative && (
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select
                value={String(action.params?.match_type || 'NEGATIVE_EXACT')}
                onChange={(e) => handleParamKeyChange('match_type', e.target.value)}
                options={[
                  { value: 'NEGATIVE_EXACT', label: 'Negative Exact' },
                  { value: 'NEGATIVE_PHRASE', label: 'Negative Phrase' },
                ]}
                aria-label={`Match type for action ${index + 1}`}
              />
            </div>
            <div className="w-32">
              <Select
                value={String(action.params?.level || 'AD_GROUP')}
                onChange={(e) => handleParamKeyChange('level', e.target.value)}
                options={[
                  { value: 'AD_GROUP', label: 'Ad Group' },
                  { value: 'CAMPAIGN', label: 'Campaign' },
                ]}
                aria-label={`Level for action ${index + 1}`}
              />
            </div>
          </div>
        )}

        {/* Remove Button */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Remove action"
            aria-label={`Remove action ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {error && <span className="text-xs text-danger ml-0.5">{error}</span>}
    </div>
  );
}
