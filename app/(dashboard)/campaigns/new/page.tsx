'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Save,
  RotateCw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import {
  createCampaign,
  createCampaignDraft,
  updateCampaignDraft,
  deleteCampaignDraft,
  getCampaignDrafts,
  ApiError,
} from '@/lib/api-client';
import type {
  CampaignDraft,
  ProductLite,
} from '@/lib/types/campaign';
import { Stepper, STEPS } from '@/components/campaigns/wizard/Stepper';
import { ForecastRail } from '@/components/campaigns/wizard/ForecastRail';
import { Step1Details } from '@/components/campaigns/wizard/Step1Details';
import { Step2Products } from '@/components/campaigns/wizard/Step2Products';
import { Step3Targeting } from '@/components/campaigns/wizard/Step3Targeting';
import { Step4Negatives } from '@/components/campaigns/wizard/Step4Negatives';
import { Step5Review } from '@/components/campaigns/wizard/Step5Review';
import { defaultDraft, toPayload, STEP_OF, validateStep } from '@/components/campaigns/wizard/helpers';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function CreateCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get('draft') ? Number(searchParams.get('draft')) : null;

  const { account, rules, todayInTz } = useActiveAccount();
  const { showToast } = useToast();
  const todayStr = todayInTz();

  const [draft, setDraft] = useState<CampaignDraft>(() => defaultDraft(account, rules));
  const [serverDraftId, setServerDraftId] = useState<number | null>(draftIdParam);
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving'>('saved');

  // Step validation state
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Close confirmation dialog
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const localKey = account ? `campaign.draft.${account.id}` : null;

  // Initialize draft when account/rules load or when restoring from draft
  useEffect(() => {
    if (!account) return;

    if (draftIdParam) {
      getCampaignDrafts(account.id)
        .then((drafts) => {
          const matched = drafts.find((d) => d.id === draftIdParam);
          if (matched && matched.payload) {
            setDraft(matched.payload);
            setServerDraftId(matched.id);
            showToast({ title: 'Draft resumed', message: `Resumed "${matched.name}" at step ${matched.step}`, type: 'info' });
          }
        })
        .catch(() => {});
    } else if (localKey) {
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved) as CampaignDraft;
          if (parsed && parsed.version === 1) {
            setDraft(parsed);
          }
        } else {
          setDraft(defaultDraft(account, rules));
        }
      } catch {
        setDraft(defaultDraft(account, rules));
      }
    }
  }, [account?.id, draftIdParam]);

  // Debounced autosave to localStorage & server draft
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const persistDraft = useCallback(
    async (currentDraft: CampaignDraft) => {
      if (!account) return;
      setAutosaveStatus('saving');

      // Local storage save
      if (localKey) {
        try {
          localStorage.setItem(localKey, JSON.stringify(currentDraft));
        } catch {}
      }

      // Server draft save
      try {
        if (serverDraftId) {
          await updateCampaignDraft(serverDraftId, {
            name: currentDraft.details.name,
            step: currentDraft.step,
            payload: currentDraft,
          });
        } else {
          const res = await createCampaignDraft({
            ads_account_id: account.id,
            name: currentDraft.details.name,
            step: currentDraft.step,
            payload: currentDraft,
          });
          setServerDraftId(res.id);
        }
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('saved');
      }
    },
    [account, localKey, serverDraftId]
  );

  const updateDraft = (updater: (prev: CampaignDraft) => CampaignDraft) => {
    setIsDirty(true);
    setDraft((prev) => {
      const next = updater(prev);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        persistDraft(next);
      }, 1000);
      return next;
    });
  };

  // Warn on page unload when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Navigate between steps with validation
  const goToStep = (targetStep: 1 | 2 | 3 | 4 | 5) => {
    if (targetStep < draft.step) {
      // Going back is always allowed
      setFieldErrors({});
      setDraft((prev) => ({ ...prev, step: targetStep }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Moving forward validates current step
    const val = validateStep(draft.step, draft, rules, todayStr);
    if (!val.valid) {
      setFieldErrors(val.errors);
      setStepErrors((prev) => ({ ...prev, [draft.step]: true }));
      const errorCount = Object.keys(val.errors).length;
      showToast({
        title: 'Validation failed',
        message: `Fix ${errorCount} field${errorCount > 1 ? 's' : ''} to continue.`,
        type: 'error',
      });

      // Scroll/focus first invalid element
      const firstKey = Object.keys(val.errors)[0];
      const el = document.querySelector(`[aria-invalid="true"], #${firstKey}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFieldErrors({});
    setStepErrors((prev) => ({ ...prev, [draft.step]: false }));
    const maxReached = Math.max(draft.maxStepReached, targetStep);
    setDraft((prev) => ({
      ...prev,
      step: targetStep,
      maxStepReached: maxReached,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (draft.step < 5) {
      goToStep((draft.step + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleBack = () => {
    if (draft.step > 1) {
      goToStep((draft.step - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleManualSaveDraft = async () => {
    await persistDraft(draft);
    showToast({ title: 'Draft saved', message: 'Campaign draft has been saved to your account.', type: 'success' });
  };

  const handleDiscardAndExit = async () => {
    if (serverDraftId) {
      try {
        await deleteCampaignDraft(serverDraftId);
      } catch {}
    }
    if (localKey) {
      try {
        localStorage.removeItem(localKey);
      } catch {}
    }
    router.push('/campaigns');
  };

  // Launch campaign
  const handleLaunch = async (state: 'ENABLED' | 'PAUSED') => {
    if (submitting) return;
    setSubmitting(true);

    const payload = toPayload(draft, rules);
    payload.state = state;

    try {
      const res = await createCampaign(payload);
      showToast({
        title: 'Campaign created',
        message: `Campaign "${res.name}" launched successfully as ${state.toLowerCase()}.`,
        type: 'success',
      });

      // Cleanup local & server draft
      if (serverDraftId) {
        try {
          await deleteCampaignDraft(serverDraftId);
        } catch {}
      }
      if (localKey) {
        try {
          localStorage.removeItem(localKey);
        } catch {}
      }

      router.push(`/campaigns?highlight=${res.id}`);
    } catch (err: any) {
      if (err instanceof ApiError && err.fields && err.fields.length > 0) {
        const newStepErrors: Record<number, boolean> = {};
        const newFieldErrors: Record<string, string> = {};

        err.fields.forEach((f) => {
          const stepNum = STEP_OF(f.field);
          newStepErrors[stepNum] = true;
          newFieldErrors[f.field] = f.message;
        });

        setStepErrors(newStepErrors);
        setFieldErrors(newFieldErrors);
        showToast({
          title: 'Launch rejected',
          message: err.message || 'Please fix the highlighted fields in the indicated steps.',
          type: 'error',
        });
      } else {
        showToast({
          title: 'Launch failed',
          message: err?.message || 'Could not launch campaign. Please check your inputs.',
          type: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const countryName = account?.marketplace === 'IN' ? 'India' : 'United States';
  const nextStepName = STEPS[draft.step]?.title || 'Next';

  return (
    <div className="min-h-screen bg-graph-paper-faint flex flex-col font-mono text-xs text-text-main pb-20">
      {/* Top Bar */}
      <header className="bg-surface border-b border-border-dim sticky top-0 z-40 px-6 py-3 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isDirty) setCloseConfirmOpen(true);
              else router.push('/campaigns');
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close builder"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <span className="font-bold text-sm uppercase tracking-wide text-slate-900 block">
              Create Campaign
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Sponsored Products • Step {draft.step} of 5: {STEPS[draft.step - 1].title}
            </span>
          </div>
        </div>

        {/* Top bar right actions */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            {autosaveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <RotateCw className="w-3 h-3 animate-spin text-primary" />
                <span>Autosaving...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Saved just now</span>
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={handleManualSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-dim bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save as draft</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Stepper (280px / 3 cols) */}
        <div className="lg:col-span-3 sticky top-20">
          <Stepper
            currentStep={draft.step}
            maxStepReached={draft.maxStepReached}
            onStepClick={goToStep}
            stepErrors={stepErrors}
          />
        </div>

        {/* Center Col: Active Step Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {draft.step === 1 && (
            <Step1Details
              draft={draft}
              onChange={(updated) =>
                updateDraft((prev) => ({
                  ...prev,
                  details: { ...prev.details, ...updated },
                }))
              }
              rules={rules}
              countryName={countryName}
              errors={fieldErrors}
              todayStr={todayStr}
            />
          )}

          {draft.step === 2 && (
            <Step2Products
              draft={draft}
              onUpdateSelected={(selected: ProductLite[]) =>
                updateDraft((prev) => ({
                  ...prev,
                  products: { selected },
                }))
              }
              rules={rules}
              errors={fieldErrors}
              warnings={warnings}
            />
          )}

          {draft.step === 3 && (
            <Step3Targeting
              draft={draft}
              onChange={(updated) =>
                updateDraft((prev) => ({
                  ...prev,
                  targeting: { ...prev.targeting, ...updated },
                }))
              }
              onGoToStep1={() => goToStep(1)}
              rules={rules}
              errors={fieldErrors}
              warnings={warnings}
            />
          )}

          {draft.step === 4 && (
            <Step4Negatives
              draft={draft}
              onChange={(updated) =>
                updateDraft((prev) => ({
                  ...prev,
                  negatives: { ...prev.negatives, ...updated },
                }))
              }
              rules={rules}
              errors={fieldErrors}
              warnings={warnings}
            />
          )}

          {draft.step === 5 && (
            <Step5Review
              draft={draft}
              rules={rules}
              countryName={countryName}
              onGoToStep={goToStep}
              onLaunch={handleLaunch}
              onSaveDraft={handleManualSaveDraft}
              submitting={submitting}
            />
          )}
        </div>

        {/* Right Col: Forecast & Summary Rail (320px / 3 cols) */}
        <div className="lg:col-span-3 sticky top-20">
          <ForecastRail draft={draft} rules={rules} countryName={countryName} />
        </div>
      </main>

      {/* Sticky Bottom Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-dim px-6 py-3 shadow-lg flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (isDirty) setCloseConfirmOpen(true);
            else router.push('/campaigns');
          }}
          className="text-slate-500 hover:text-spend font-medium text-xs px-2 py-1"
        >
          Discard
        </button>

        <div className="flex items-center gap-3">
          {draft.step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-border-dim bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {draft.step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-primary hover:bg-indigo-800 text-white font-bold shadow-xs transition-colors"
            >
              <span>Next: {nextStepName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleLaunch('PAUSED')}
                className="px-4 py-2 border border-border-dim rounded hover:bg-slate-50 font-medium text-slate-800"
              >
                Launch as paused
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleLaunch('ENABLED')}
                className="px-6 py-2 bg-primary text-white rounded font-bold shadow-xs hover:bg-indigo-800 flex items-center gap-2"
              >
                {submitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Launch campaign</span>
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Close & Discard Confirmation Dialog */}
      <ConfirmDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="Discard campaign draft?"
        description="You have unsaved changes in this campaign wizard. Would you like to discard them and return to the campaigns list?"
        confirmLabel="Discard & exit"
        destructive
        onConfirm={handleDiscardAndExit}
      />
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-graph-paper-faint p-6 flex items-center justify-center font-mono text-xs text-slate-400">
          Loading campaign wizard...
        </div>
      }
    >
      <CreateCampaignContent />
    </Suspense>
  );
}
