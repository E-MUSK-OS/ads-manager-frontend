import React, { Suspense } from 'react';
import { RulesPageContent } from '@/components/rules/RulesPageContent';

export default function TargetingRulesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="text-xs font-mono text-slate-400">Loading targeting rules...</span>
        </div>
      }
    >
      <RulesPageContent defaultSection="targeting" />
    </Suspense>
  );
}
