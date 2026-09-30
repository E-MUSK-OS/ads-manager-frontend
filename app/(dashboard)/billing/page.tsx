'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function Billing() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient('/billing/plan');
        setPlan(res);
      } catch(e) {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>
      <div className="bg-white border rounded-lg shadow p-6 max-w-2xl">
        <h2 className="font-semibold mb-4">Current Plan</h2>
        <div className="text-3xl font-bold mb-2">{plan?.plan || 'Free'} <span className="text-sm font-normal text-gray-500">forever</span></div>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Upgrade to Pro</button>
      </div>
    </div>
  )
}