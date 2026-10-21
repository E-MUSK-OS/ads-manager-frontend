import React from 'react';
import { Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { MoneyInput } from '@/components/ui/MoneyInput';
import type { RuleAction, Meta, AffectedParameter, ParamSchema } from '@/lib/types/recommendation';

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

  // Schema for current action type's params
  const paramSchemas: Record<string, ParamSchema> = React.useMemo(() => {
    if (!action.type || !actionDefinitions[action.type]) return {};
    return actionDefinitions[action.type].params || {};
  }, [action.type, actionDefinitions]);

  const handleTypeChange = (newType: string) => {
    // Populate default params from schema
    const defaultParams: Record<string, string | number | null> = {};
    const schema = actionDefinitions[newType]?.params || {};
    for (const [key, p] of Object.entries(schema)) {
      if (p.default !== undefined) {
        defaultParams[key] = p.default;
      } else if (p.type === 'enum' && p.options && p.options.length > 0) {
        defaultParams[key] = p.options[0];
      } else {
        defaultParams[key] = null;
      }
    }

    onChange(index, {
      type: newType,
      params: defaultParams,
    });
  };

  const handleParamChange = (paramKey: string, val: string | number | null) => {
    onChange(index, {
      ...action,
      params: {
        ...action.params,
        [paramKey]: val,
      },
    });
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-md bg-slate-50/70 border border-border-dim">
      <div className="flex items-center gap-2">
        {/* Action Type Select */}
        <div className="flex-1 min-w-[200px]">
          <Select
            value={action.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            options={actionOptions}
            placeholder="Select action..."
            aria-label={`Action ${index + 1} type`}
          />
        </div>

        {/* Remove Button */}
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

      {/* Dynamic Parameters */}
      {Object.keys(paramSchemas).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {Object.entries(paramSchemas).map(([pKey, pSchema]) => {
            const rawVal = action.params[pKey];
            const pLabel = pSchema.label || pKey.replace(/_/g, ' ');

            if (pSchema.type === 'enum') {
              const enumOpts = (pSchema.options || []).map((opt) => ({
                value: opt,
                label: opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase(),
              }));
              return (
                <div key={pKey} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted capitalize">{pLabel}:</span>
                  <div className="w-36">
                    <Select
                      value={rawVal ? String(rawVal) : ''}
                      onChange={(e) => handleParamChange(pKey, e.target.value)}
                      options={enumOpts}
                      aria-label={`${pLabel} for action ${index + 1}`}
                    />
                  </div>
                </div>
              );
            }

            if (pSchema.type === 'money') {
              return (
                <div key={pKey} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted capitalize">{pLabel}:</span>
                  <div className="w-32">
                    <MoneyInput
                      value={rawVal !== null && rawVal !== undefined ? Number(rawVal) : null}
                      onChange={(num) => handleParamChange(pKey, num)}
                      symbol={currencySymbol}
                      min={pSchema.min ?? 0}
                      max={pSchema.max}
                      aria-label={`${pLabel} for action ${index + 1}`}
                    />
                  </div>
                </div>
              );
            }

            // percent or int
            return (
              <div key={pKey} className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-muted capitalize">{pLabel}:</span>
                <div className="w-28 relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={pSchema.min}
                    max={pSchema.max}
                    value={rawVal !== null && rawVal !== undefined ? rawVal : ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value);
                      handleParamChange(pKey, v);
                    }}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    placeholder={String(pSchema.default ?? '')}
                    className="w-full h-8 px-2.5 rounded-md border border-border-dim text-sm bg-surface font-mono tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-6"
                    aria-label={`${pLabel} for action ${index + 1}`}
                  />
                  {pSchema.type === 'percent' && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted pointer-events-none">
                      %
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <span className="text-xs text-danger ml-0.5">{error}</span>}
    </div>
  );
}
