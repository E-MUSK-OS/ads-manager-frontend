import React, { useState, useMemo } from 'react';
import { Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Select';
import { ConditionRow } from './ConditionRow';
import { ActionRow } from './ActionRow';
import { RulePreview } from './RulePreview';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiError } from '@/lib/api-client';
import type {
  RuleDraft,
  Rule,
  Meta,
  AffectedParameter,
  Condition,
  RuleAction,
} from '@/lib/types/recommendation';

interface RuleFormProps {
  adsAccountId: number | null;
  initialDraft?: Partial<RuleDraft>;
  ruleId?: number; // if editing
  existingRules: Rule[];
  meta: Meta | null;
  currencySymbol: string;
  onSuccess: (savedRule: Rule, matchCount?: number) => void;
  onCancel: () => void;
  onBack?: () => void;
  isSaving: boolean;
  onSubmit: (draft: RuleDraft) => Promise<{ rule: Rule; run?: { match_count?: number } | unknown } | Rule>;
}

export function RuleForm({
  adsAccountId,
  initialDraft,
  ruleId,
  existingRules,
  meta,
  currencySymbol,
  onSuccess,
  onCancel,
  onBack,
  isSaving,
  onSubmit,
}: RuleFormProps) {
  // Form State
  const [name, setName] = useState<string>(initialDraft?.name || '');
  const [affectedParameter, setAffectedParameter] = useState<AffectedParameter>(
    initialDraft?.affected_parameter || 'SEARCH_TERM'
  );
  const [dateFilter, setDateFilter] = useState<string>(
    initialDraft?.date_filter || 'LAST_30_DAYS'
  );
  const [minClicks, setMinClicks] = useState<number>(initialDraft?.min_clicks || 0);

  const defaultConditionValue = currencySymbol === '$' ? 5 : 20;

  const [conditions, setConditions] = useState<Condition[]>(() => {
    if (initialDraft?.conditions && initialDraft.conditions.length > 0) {
      return initialDraft.conditions;
    }
    return [{ metric: 'spend', op: 'GTE', value: defaultConditionValue }];
  });

  const [actions, setActions] = useState<RuleAction[]>(() => {
    if (initialDraft?.actions && initialDraft.actions.length > 0) {
      return initialDraft.actions;
    }
    return [{ type: 'add_negative_search_term', params: { match_type: 'EXACT' } }];
  });

  // Parameter change confirmation dialog
  const [pendingParamChange, setPendingParamChange] = useState<AffectedParameter | null>(null);

  // Field validation & server error mappings
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Unsaved changes tracking
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  // Date filters options
  const dateFilterOptions = meta?.date_filters
    ? Object.entries(meta.date_filters).map(([k, label]) => ({
        value: k,
        label,
      }))
    : [];

  // Affected parameters options
  const affectedParameterOptions = meta?.affected_parameters
    ? Object.entries(meta.affected_parameters).map(([k, val]) => ({
        value: k,
        label: val.label + (!val.available ? ' (Coming soon)' : ''),
        disabled: !val.available,
      }))
    : [];

  // Name uniqueness hint
  const nameCollision = useMemo(() => {
    if (!name.trim()) return false;
    const lower = name.trim().toLowerCase();
    return existingRules.some(
      (r) => r.name.toLowerCase() === lower && (!ruleId || r.id !== ruleId)
    );
  }, [name, existingRules, ruleId]);

  // Datalist suggestions of previous names
  const previousNames = useMemo(() => {
    return existingRules.map((r) => r.name);
  }, [existingRules]);

  // Amazon reporting lag warning if date filter includes TODAY
  const showDateLagNotice = useMemo(() => {
    return dateFilter.includes('TODAY') || dateFilter === 'LAST_1_DAY';
  }, [dateFilter]);

  // Action conflict & duplicate detection
  const actionErrors = useMemo(() => {
    const errs: Record<number, string> = {};
    const seenTypes = new Set<string>();

    let hasBidChange = false;
    let hasPause = false;

    actions.forEach((act, idx) => {
      if (!act.type) return;

      // Duplicate check
      if (seenTypes.has(act.type)) {
        errs[idx] = 'Duplicate action type';
      }
      seenTypes.add(act.type);

      // Conflict checks
      if (act.type.includes('bid')) {
        if (hasBidChange) {
          errs[idx] = 'Conflicting bid action already present';
        }
        hasBidChange = true;
      }
      if (act.type.includes('pause')) {
        hasPause = true;
      }
    });

    if (hasPause && hasBidChange) {
      actions.forEach((act, idx) => {
        if (act.type.includes('bid') || act.type.includes('pause')) {
          errs[idx] = 'Cannot combine pausing with bid changes';
        }
      });
    }

    return errs;
  }, [actions]);

  const hasActionConflict = Object.keys(actionErrors).length > 0;

  // Handle Affected Parameter change (with confirmation if actions exist)
  const handleAffectedParameterChange = (newParam: AffectedParameter) => {
    if (newParam === affectedParameter) return;
    if (actions.length > 0 && actions.some((a) => Boolean(a.type))) {
      setPendingParamChange(newParam);
    } else {
      setAffectedParameter(newParam);
      setIsDirty(true);
    }
  };

  const confirmParamChange = () => {
    if (pendingParamChange) {
      setAffectedParameter(pendingParamChange);
      setActions([]); // clear incompatible actions
      setPendingParamChange(null);
      setIsDirty(true);
    }
  };

  // Conditions management
  const maxConditions = meta?.limits?.max_conditions || 6;
  const maxActions = meta?.limits?.max_actions || 4;

  const handleAddCondition = () => {
    if (conditions.length >= maxConditions) return;
    setConditions((prev) => [...prev, { metric: 'spend', op: 'GTE', value: defaultConditionValue }]);
    setIsDirty(true);
  };

  const handleUpdateCondition = (index: number, updated: Condition) => {
    setConditions((prev) => prev.map((c, i) => (i === index ? updated : c)));
    setIsDirty(true);
    // Clear error on this row if any
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`conditions.${index}.value`];
      delete next[`conditions.${index}.metric`];
      return next;
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Actions management
  const handleAddAction = () => {
    if (actions.length >= maxActions) return;
    // Default action according to parameter
    const availableTypes = meta?.actions?.[affectedParameter]
      ? Object.keys(meta.actions[affectedParameter])
      : [];
    const firstType = availableTypes[0] || '';
    setActions((prev) => [...prev, { type: firstType, params: {} }]);
    setIsDirty(true);
  };

  const handleUpdateAction = (index: number, updated: RuleAction) => {
    setActions((prev) => prev.map((a, i) => (i === index ? updated : a)));
    setIsDirty(true);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`actions.${index}.type`];
      return next;
    });
  };

  const handleRemoveAction = (index: number) => {
    if (actions.length <= 1) return;
    setActions((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Validation
  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (nameCollision) return false;
    if (conditions.length === 0) return false;
    const allCondsValid = conditions.every(
      (c) => Boolean(c.metric) && Boolean(c.op) && c.value !== null && c.value !== undefined
    );
    if (!allCondsValid) return false;
    if (actions.length === 0) return false;
    const allActionsValid = actions.every((a) => Boolean(a.type));
    if (!allActionsValid) return false;
    if (hasActionConflict) return false;
    return true;
  }, [name, nameCollision, conditions, actions, hasActionConflict]);

  // Current draft for preview
  const currentDraft: RuleDraft = useMemo(() => {
    return {
      id: ruleId,
      name,
      affected_parameter: affectedParameter,
      date_filter: dateFilter,
      min_clicks: minClicks,
      conditions,
      actions,
      scope_mode: initialDraft?.scope_mode || 'ALL',
      campaign_ids: initialDraft?.campaign_ids || [],
    };
  }, [
    ruleId,
    name,
    affectedParameter,
    dateFilter,
    minClicks,
    conditions,
    actions,
    initialDraft?.scope_mode,
    initialDraft?.campaign_ids,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) return;

    setFieldErrors({});
    setFormError(null);

    try {
      const res = await onSubmit(currentDraft);
      const savedRule = 'rule' in res ? res.rule : res;
      const matchCount =
        'run' in res && res.run && typeof res.run === 'object' && 'match_count' in res.run
          ? Number((res.run as { match_count?: number }).match_count)
          : undefined;
      onSuccess(savedRule, matchCount);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            name: 'A rule with this name already exists in this account.',
          }));
        } else if (err.fields && Array.isArray(err.fields)) {
          // Map server fields onto fieldErrors (e.g. conditions.1.value -> conditions.1.value)
          const mapped: Record<string, string> = {};
          for (const f of err.fields) {
            mapped[f.field] = f.message;
          }
          setFieldErrors(mapped);
        } else {
          setFormError(err.message);
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to save rule';
        setFormError(msg);
      }
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && (
        <div className="flex items-center gap-2 p-3 text-xs text-danger bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Row 1: Name and Affected Parameter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name with datalist */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-main flex items-center justify-between">
            <span>
              Rule Name <span className="text-danger">*</span>
            </span>
            {nameCollision && (
              <span className="text-[11px] text-danger font-normal">
                Name already taken
              </span>
            )}
          </label>
          <input
            type="text"
            list="rule-name-suggestions"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsDirty(true);
              if (fieldErrors.name) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.name;
                  return next;
                });
              }
            }}
            placeholder="e.g. Pause zero-order search terms"
            maxLength={meta?.limits?.name_max || 100}
            className={`w-full h-8 px-2.5 rounded-md border text-sm bg-surface transition-all outline-none ${
              nameCollision || fieldErrors.name
                ? 'border-danger focus:ring-1 focus:ring-danger'
                : 'border-border-dim focus:border-primary focus:ring-1 focus:ring-primary'
            }`}
            required
          />
          <datalist id="rule-name-suggestions">
            {previousNames.map((n, i) => (
              <option key={i} value={n} />
            ))}
          </datalist>
          {fieldErrors.name && (
            <span className="text-xs text-danger">{fieldErrors.name}</span>
          )}
        </div>

        {/* Affected Parameter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-main">
            Affected Parameter <span className="text-danger">*</span>
          </label>
          <Select
            value={affectedParameter}
            onChange={(e) => handleAffectedParameterChange(e.target.value as AffectedParameter)}
            options={affectedParameterOptions}
          />
        </div>
      </div>

      {/* Row 2: Date filter and Min Clicks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-main">
            Evaluation Date Window <span className="text-danger">*</span>
          </label>
          <Select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setIsDirty(true);
            }}
            options={dateFilterOptions}
          />
          {showDateLagNotice && (
            <span className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200/60 leading-tight">
              Notice: Today&apos;s metrics may be delayed by up to 12 hours due to Amazon reporting lag.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-main flex items-center justify-between">
            <span>Minimum Clicks Threshold</span>
            <span className="text-[11px] font-normal text-text-muted">Optional</span>
          </label>
          <input
            type="number"
            min={0}
            value={minClicks || ''}
            onChange={(e) => {
              setMinClicks(e.target.value === '' ? 0 : Number(e.target.value));
              setIsDirty(true);
            }}
            placeholder="0"
            className="w-full h-8 px-2.5 rounded-md border border-border-dim text-sm bg-surface font-mono tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span className="text-[11px] text-text-muted">
            Ignore items with fewer clicks — avoids decisions on tiny samples.
          </span>
        </div>
      </div>

      {/* Conditions Section */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border-dim/60">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">
              Conditions <span className="text-danger">*</span>
            </h4>
            <p className="text-[11px] text-text-muted">
              Entities must match all conditions to trigger recommendations.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleAddCondition}
            disabled={conditions.length >= maxConditions}
            className="gap-1"
          >
            <Plus className="size-3" />
            <span>Add Condition</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {conditions.map((cond, idx) => {
            const err =
              fieldErrors[`conditions.${idx}.value`] ||
              fieldErrors[`conditions.${idx}.metric`] ||
              fieldErrors[`conditions.${idx}`];
            return (
              <ConditionRow
                key={idx}
                index={idx}
                condition={cond}
                meta={meta}
                currencySymbol={currencySymbol}
                error={err}
                onChange={handleUpdateCondition}
                onRemove={handleRemoveCondition}
                canRemove={conditions.length > 1}
              />
            );
          })}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border-dim/60">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">
              Suggested Actions <span className="text-danger">*</span>
            </h4>
            <p className="text-[11px] text-text-muted">
              Choose what actions should be recommended when conditions match.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleAddAction}
            disabled={actions.length >= maxActions}
            className="gap-1"
          >
            <Plus className="size-3" />
            <span>Add Action</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {actions.map((act, idx) => {
            const err =
              actionErrors[idx] ||
              fieldErrors[`actions.${idx}.type`] ||
              fieldErrors[`actions.${idx}`];
            return (
              <ActionRow
                key={idx}
                index={idx}
                action={act}
                affectedParameter={affectedParameter}
                meta={meta}
                currencySymbol={currencySymbol}
                error={err}
                onChange={handleUpdateAction}
                onRemove={handleRemoveAction}
                canRemove={actions.length > 1}
              />
            );
          })}
        </div>
      </div>

      {/* Live Preview Rail */}
      <div className="pt-1">
        <RulePreview
          adsAccountId={adsAccountId}
          ruleDraft={currentDraft}
          meta={meta}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Form Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border-dim">
        <div>
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1 text-text-muted hover:text-text-main"
            >
              <ArrowLeft className="size-4" />
              <span>Back to templates</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelClick}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!isValid || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? 'Saving...' : ruleId ? 'Update Rule' : 'Save Rule'}
          </Button>
        </div>
      </div>

      {/* Confirmation when changing affected parameter with existing actions */}
      <ConfirmDialog
        open={Boolean(pendingParamChange)}
        onClose={() => setPendingParamChange(null)}
        onCancel={() => setPendingParamChange(null)}
        onConfirm={confirmParamChange}
        title="Change Affected Parameter?"
        description="Changing the affected parameter will clear existing actions because they are incompatible with the new parameter."
        confirmLabel="Change & Clear Actions"
        cancelLabel="Keep Current"
        variant="danger"
      />

      {/* Confirmation on Cancel with unsaved changes */}
      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={onCancel}
        title="Discard Unsaved Changes?"
        description="You have unsaved changes in this rule. Are you sure you want to discard them?"
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        variant="danger"
      />
    </form>
  );
}
