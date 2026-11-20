'use client';

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActiveAccount } from './rules-use-active-account';
import { fetchRules } from './rules-api';
import { RulesTableManager } from './RulesTableManager';
import { RulesToastProvider } from './ui/RulesToast';
import type { RuleSection, AffectedParameter, Rule } from './rules-types';

interface SectionConfig {
  id: RuleSection;
  label: string;
  affectedParameter?: AffectedParameter;
  title: string;
  subtitle: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'all',
    label: 'All Rules',
    title: 'All rules',
    subtitle: 'View and manage all automated placement, budget, targeting, and search term rules.',
  },
  {
    id: 'placement',
    label: 'Placement Rules',
    affectedParameter: 'PLACEMENT',
    title: 'Placement rules',
    subtitle: 'Define automated conditions to evaluate placement performance and bid adjustments.',
  },
  {
    id: 'budget',
    label: 'Budget Rules',
    affectedParameter: 'CAMPAIGN',
    title: 'Budget rules',
    subtitle: 'Define automated conditions to optimize campaign daily budgets and scaling caps.',
  },
  {
    id: 'targeting',
    label: 'Targeting Rules',
    affectedParameter: 'TARGETING',
    title: 'Targeting rules',
    subtitle: 'Define automated conditions to adjust keyword bids and target performance.',
  },
  {
    id: 'search_term',
    label: 'Search Term Rules',
    affectedParameter: 'SEARCH_TERM',
    title: 'Search term rules',
    subtitle: 'Define automated conditions to evaluate search terms, harvesting, and negative keyword additions.',
  },
];

interface RulesPageContentProps {
  defaultSection?: RuleSection;
}

export function RulesPageContent({ defaultSection = 'all' }: RulesPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { account } = useActiveAccount();

  // Determine initial active section from query param or defaultSection
  const paramSection = searchParams.get('section') as RuleSection | null;
  const initialSection: RuleSection =
    paramSection && SECTIONS.some((s) => s.id === paramSection)
      ? paramSection
      : defaultSection;

  const [activeSection, setActiveSection] = useState<RuleSection>(initialSection);
  const [counts, setCounts] = useState<Record<AffectedParameter, number>>({
    PLACEMENT: 0,
    CAMPAIGN: 0,
    TARGETING: 0,
    SEARCH_TERM: 0,
  });

  const totalCount = useMemo(() => {
    return (
      (counts.PLACEMENT ?? 0) +
      (counts.CAMPAIGN ?? 0) +
      (counts.TARGETING ?? 0) +
      (counts.SEARCH_TERM ?? 0)
    );
  }, [counts]);

  // Sync state if query param changes externally
  useEffect(() => {
    if (paramSection && SECTIONS.some((s) => s.id === paramSection)) {
      setActiveSection(paramSection);
    }
  }, [paramSection]);

  // Load count of rules for all 4 sections
  const loadCounts = useCallback(async () => {
    if (!account?.id) return;
    try {
      const allRules: Rule[] = await fetchRules(account.id);
      const nextCounts: Record<AffectedParameter, number> = {
        PLACEMENT: 0,
        CAMPAIGN: 0,
        TARGETING: 0,
        SEARCH_TERM: 0,
      };
      (allRules || []).forEach((r) => {
        if (r.affected_parameter && nextCounts[r.affected_parameter] !== undefined) {
          nextCounts[r.affected_parameter]++;
        }
      });
      setCounts(nextCounts);
    } catch {
      // silent fail on counts
    }
  }, [account?.id]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Re-fetch counts when a rule is added, edited, or deleted
  useEffect(() => {
    const handleRulesChanged = () => {
      loadCounts();
    };
    window.addEventListener('rules:changed', handleRulesChanged);
    return () => {
      window.removeEventListener('rules:changed', handleRulesChanged);
    };
  }, [loadCounts]);

  const handleSelectSection = (sectionId: RuleSection) => {
    setActiveSection(sectionId);
    startTransition(() => {
      // Update the URL search param without full reload
      const url = new URL(window.location.href);
      url.searchParams.set('section', sectionId);
      window.history.replaceState(null, '', url.toString());
    });
  };

  const currentConfig = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <RulesToastProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Rules</h1>
          <p className="text-xs text-text-muted mt-1">
            Automate campaign optimization insights, search term harvesting, and budget/bid rules.
          </p>
        </div>

        {/* Horizontal Segmented Section Filter Tabs */}
        <div>
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200 shadow-xs">
            {SECTIONS.map((sec) => {
              const isActive = sec.id === activeSection;
              const count =
                sec.id === 'all'
                  ? totalCount
                  : sec.affectedParameter
                  ? counts[sec.affectedParameter] ?? 0
                  : 0;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleSelectSection(sec.id)}
                  className={`flex items-center px-4 py-2 text-xs rounded-md transition-all font-medium ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <span>{sec.label}</span>
                  <span
                    className={`ml-2 px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                      isActive ? 'bg-indigo-500/80 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div className="border-b border-border-dim pb-1" />

        {/* Selected Category Header */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-main">{currentConfig.title}</h2>
          <p className="text-xs text-text-muted mt-1">{currentConfig.subtitle}</p>
        </div>

        {/* Table Manager for active category */}
        <RulesTableManager
          key={currentConfig.id}
          activeSection={currentConfig.id}
          affectedParameter={currentConfig.affectedParameter}
          title={currentConfig.label}
        />
      </div>
    </RulesToastProvider>
  );
}
