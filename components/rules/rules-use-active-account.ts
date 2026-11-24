'use client';

import { useState, useEffect, useCallback } from 'react';
import { rulesApiClient } from './rules-api-client';

const STORAGE_KEY = 'ads_manager_active_account_id';

export interface RulesAdsAccount {
  id: number;
  amazon_account_name?: string;
  account_name?: string;
  profile_id?: string;
  marketplace?: string;
  currency?: string;
  [key: string]: any;
}

export function useActiveAccount() {
  const [account, setAccount] = useState<RulesAdsAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncAccount = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const savedIdStr = localStorage.getItem(STORAGE_KEY);
    const savedId = savedIdStr ? parseInt(savedIdStr, 10) : null;

    try {
      const accounts = await rulesApiClient<RulesAdsAccount[]>('/ads-accounts');
      if (Array.isArray(accounts) && accounts.length > 0) {
        const found = savedId ? accounts.find((a) => a.id === savedId) : null;
        const current = found || accounts[0];
        setAccount(current);
        if (!savedId || !found) {
          localStorage.setItem(STORAGE_KEY, String(current.id));
        }
      } else {
        setAccount(null);
      }
    } catch {
      // If fetching fails, still use savedId if present as a minimal stub
      if (savedId) {
        setAccount((prev) => (prev?.id === savedId ? prev : { id: savedId }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncAccount();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        syncAccount();
      }
    };

    const handleCustomChange = () => {
      syncAccount();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('active_account_changed', handleCustomChange);
    window.addEventListener('focus', syncAccount);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('active_account_changed', handleCustomChange);
      window.removeEventListener('focus', syncAccount);
    };
  }, [syncAccount]);

  return { account, loading };
}
