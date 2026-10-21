import React, { useState, useEffect } from 'react';
import { Layers, Wand2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TemplateGallery } from './TemplateGallery';
import { RuleForm } from './RuleForm';
import { createRule, updateRule, getRule } from '@/lib/recommendations-api';
import { useToast } from '@/components/ui/toast';
import type {
  RuleDraft,
  Rule,
  Meta,
  Template,
  Condition,
  RuleAction,
} from '@/lib/types/recommendation';

interface AddRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  adsAccountId: number | null;
  meta: Meta | null;
  currencySymbol: string;
  existingRules: Rule[];
  editRuleId?: number | null;
  onRuleSaved: (savedRule: Rule) => void;
}

export function AddRecommendationModal({
  open,
  onClose,
  adsAccountId,
  meta,
  currencySymbol,
  existingRules,
  editRuleId,
  onRuleSaved,
}: AddRecommendationModalProps) {
  const { success } = useToast();

  // Steps: 'CHOOSE_MODE' | 'TEMPLATE_GALLERY' | 'RULE_FORM'
  const [step, setStep] = useState<'CHOOSE_MODE' | 'TEMPLATE_GALLERY' | 'RULE_FORM'>('CHOOSE_MODE');
  const [activeDraft, setActiveDraft] = useState<Partial<RuleDraft>>({});
  const [loadingEditRule, setLoadingEditRule] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize or reset when modal opens / editRuleId changes
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!open) {
        setStep('CHOOSE_MODE');
        setActiveDraft({});
        setLoadingEditRule(false);
        return;
      }

      if (editRuleId) {
        setStep('RULE_FORM');
        setLoadingEditRule(true);
        getRule(editRuleId)
          .then((rule) => {
            if (!active) return;
            setActiveDraft({
              id: rule.id,
              name: rule.name,
              affected_parameter: rule.affected_parameter,
              date_filter: rule.date_filter,
              min_clicks: rule.min_clicks,
              conditions: rule.conditions,
              actions: rule.actions,
              scope_mode: rule.scope_mode,
              campaign_ids: rule.campaign_ids,
            });
          })
          .catch(() => {
            if (!active) return;
            const found = existingRules.find((r) => r.id === editRuleId);
            if (found) {
              setActiveDraft({
                id: found.id,
                name: found.name,
                affected_parameter: found.affected_parameter,
                date_filter: found.date_filter,
                min_clicks: found.min_clicks,
                conditions: found.conditions,
                actions: found.actions,
                scope_mode: found.scope_mode,
                campaign_ids: found.campaign_ids,
              });
            }
          })
          .finally(() => {
            if (active) setLoadingEditRule(false);
          });
      } else {
        setStep('CHOOSE_MODE');
        setActiveDraft({});
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, editRuleId, existingRules]);

  const handleStartCustom = () => {
    setActiveDraft({});
    setStep('RULE_FORM');
  };

  const handleStartTemplateGallery = () => {
    setStep('TEMPLATE_GALLERY');
  };

  const handleSelectTemplate = (template: Template) => {
    const defaultVal = currencySymbol === '$' ? 5 : 20;
    const conds: Condition[] = template.conditions.map((c) => ({
      metric: c.metric,
      op: c.op,
      value: c.value ?? defaultVal,
    }));
    const acts: RuleAction[] = template.actions.map((a) => ({
      type: a.type,
      params: a.params || {},
    }));

    setActiveDraft({
      name: template.name,
      affected_parameter: template.affected_parameter,
      date_filter: template.date_filter,
      min_clicks: template.min_clicks,
      conditions: conds,
      actions: acts,
      template_key: template.key,
      scope_mode: 'ALL',
      campaign_ids: [],
    });
    setStep('RULE_FORM');
  };

  const handleSubmitRule = async (draft: RuleDraft) => {
    if (!adsAccountId) throw new Error('No active advertising account selected');
    setIsSaving(true);
    try {
      if (editRuleId) {
        const updated = await updateRule(editRuleId, draft);
        return updated;
      } else {
        const res = await createRule(adsAccountId, draft);
        return res;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccess = (savedRule: Rule, matchCount?: number) => {
    const countText =
      matchCount !== undefined
        ? ` — ${matchCount} recommendation${matchCount === 1 ? '' : 's'} found`
        : '';
    success(`Rule saved${countText}`);
    onRuleSaved(savedRule);
    onClose();
  };

  const modalTitle = editRuleId
    ? 'Edit Recommendation Rule'
    : step === 'CHOOSE_MODE'
    ? 'Create new recommendation rule'
    : step === 'TEMPLATE_GALLERY'
    ? 'Recommendation Templates'
    : 'Rule Configuration';

  const modalSubtitle =
    step === 'CHOOSE_MODE'
      ? 'Automation helps you optimise your account. Choose how to start building your logic.'
      : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size={step === 'CHOOSE_MODE' ? 'md' : 'xl'}
    >
      {modalSubtitle && (
        <p className="text-xs text-text-muted mb-5 leading-relaxed">{modalSubtitle}</p>
      )}

      {loadingEditRule ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm">Loading rule configuration…</span>
        </div>
      ) : step === 'CHOOSE_MODE' ? (
        /* Step 1: Two Large Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Option A: Browse Templates */}
          <button
            type="button"
            onClick={handleStartTemplateGallery}
            className="flex flex-col text-left p-5 rounded-lg border border-border-dim bg-surface hover:border-primary hover:bg-indigo-50/20 hover:shadow-sm transition-all group"
          >
            <div className="size-10 rounded-md bg-indigo-50 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
              Browse templates
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Pre-configured rules for pausing wasteful targets or harvesting search terms.
            </p>
          </button>

          {/* Option B: Build Custom Rule */}
          <button
            type="button"
            onClick={handleStartCustom}
            className="flex flex-col text-left p-5 rounded-lg border border-border-dim bg-surface hover:border-primary hover:bg-indigo-50/20 hover:shadow-sm transition-all group"
          >
            <div className="size-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Wand2 className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
              Build custom rule
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Start from a blank rule and define your own conditions and suggested actions.
            </p>
          </button>
        </div>
      ) : step === 'TEMPLATE_GALLERY' ? (
        <TemplateGallery
          meta={meta}
          currencySymbol={currencySymbol}
          onSelectTemplate={handleSelectTemplate}
        />
      ) : (
        <RuleForm
          adsAccountId={adsAccountId}
          initialDraft={activeDraft}
          ruleId={editRuleId || undefined}
          existingRules={existingRules}
          meta={meta}
          currencySymbol={currencySymbol}
          isSaving={isSaving}
          onSubmit={handleSubmitRule}
          onSuccess={handleSuccess}
          onCancel={onClose}
          onBack={!editRuleId ? () => setStep('TEMPLATE_GALLERY') : undefined}
        />
      )}
    </Modal>
  );
}
