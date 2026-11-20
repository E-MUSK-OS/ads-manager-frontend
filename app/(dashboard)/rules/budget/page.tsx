import React, { Suspense } from 'react';
import { RulesPageContent } from '@/components/rules/RulesPageContent';

export default function BudgetRulesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="text-xs font-mono text-slate-400">Loading budget rules...</span>
        </div>
      }
    >
      <RulesPageContent defaultSection="budget" />
    </Suspense>
  );
}
