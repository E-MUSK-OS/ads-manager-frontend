'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from './api-client';
import { AdsAccount, MarketplaceRules } from './types/campaign';
import { getAccessToken } from './auth';

export function todayIn(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(new Date());
  }
}

const DEFAULT_RULES: MarketplaceRules = {
  currency: 'USD',
  symbol: '$',
  locale: 'en-US',
  tz: 'America/Los_Angeles',
  min_budget: 1.0,
  recommended_budget: 10.0,
  min_bid: 0.02,
  max_bid: 49.0,
};

interface ActiveAccountContextValue {
  accounts: AdsAccount[];
  account: AdsAccount | null;
  rules: MarketplaceRules;
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
  loading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  todayInTz: () => string;
}

const ActiveAccountContext = createContext<ActiveAccountContextValue | undefined>(undefined);

const STORAGE_KEY = 'ads_manager_active_account_id';

export function ActiveAccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AdsAccount[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<number | null>(null);
  const [rules, setRules] = useState<MarketplaceRules>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRulesForAccount = useCallback(async (accountId: number) => {
    try {
      const data = await apiClient<MarketplaceRules>(`/ads-accounts/${accountId}/rules`);
      setRules(data);
    } catch {
      setRules(DEFAULT_RULES);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const accs = await apiClient<AdsAccount[]>('/ads-accounts');
      setAccounts(accs);

      if (accs.length > 0) {
        const savedIdStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const savedId = savedIdStr ? parseInt(savedIdStr, 10) : null;
        const matching = accs.find((a) => a.id === savedId);
        const chosenId = matching ? matching.id : accs[0].id;

        setActiveAccountIdState(chosenId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, chosenId.toString());
        }
        await fetchRulesForAccount(chosenId);
      } else {
        setActiveAccountIdState(null);
        setRules(DEFAULT_RULES);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load accounts';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchRulesForAccount]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const setActiveAccountId = useCallback(
    (id: number) => {
      setActiveAccountIdState(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, id.toString());
      }
      fetchRulesForAccount(id);
    },
    [fetchRulesForAccount]
  );

  const currentAccount = accounts.find((a) => a.id === activeAccountId) ?? null;

  return (
    <ActiveAccountContext.Provider
      value={{
        accounts,
        account: currentAccount,
        rules,
        activeAccountId,
        setActiveAccountId,
        loading,
        error,
        refreshAccounts: loadAccounts,
        todayInTz: () => todayIn(rules.tz),
      }}
    >
      {children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount(): ActiveAccountContextValue {
  const context = useContext(ActiveAccountContext);
  if (!context) {
    throw new Error('useActiveAccount must be used within an ActiveAccountProvider');
  }
  return context;
}
