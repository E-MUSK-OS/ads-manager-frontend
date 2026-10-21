'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs } from '@/components/ui/Tabs';
import { RecommendationsTab } from '@/components/recommendations/RecommendationsTab';
import { ConfigurationTab } from '@/components/recommendations/ConfigurationTab';
import { useRecommendations } from '@/components/recommendations/useRecommendations';
import { Loader2 } from 'lucide-react';

function RecommendationsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab') || 'recommendations';
  const activeTab = tabParam === 'configuration' ? 'configuration' : 'recommendations';

  const { counts } = useRecommendations();

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    {
      id: 'recommendations',
      label: 'Recommendations',
      count: counts.OPEN > 0 ? counts.OPEN : undefined,
    },
    {
      id: 'configuration',
      label: 'Recommendation Configuration',
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-main">Recommendations</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Automate campaign optimization insights, search term harvesting, and budget/bid rules.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="border-b border-border-dim pb-3">
          <Tabs
            items={tabs}
            value={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'recommendations' ? (
        <RecommendationsTab onGoToConfiguration={() => handleTabChange('configuration')} />
      ) : (
        <ConfigurationTab />
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <RecommendationsPageContent />
    </Suspense>
  );
}
