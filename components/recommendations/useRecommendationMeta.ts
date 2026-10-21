import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from '@/lib/useActiveAccount';
import { getRecommendationMeta } from '@/lib/recommendations-api';
import type { Meta } from '@/lib/types/recommendation';

export function useRecommendationMeta() {
  const { account } = useActiveAccount();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeta = useCallback(async () => {
    if (!account?.id) {
      setMeta(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendationMeta(account.id);
      setMeta(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load recommendation metadata';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchMeta();
    });
    return () => {
      active = false;
    };
  }, [fetchMeta]);

  return {
    meta,
    loading,
    error,
    refreshMeta: fetchMeta,
    currencySymbol: meta?.currency?.symbol || '₹',
  };
}
