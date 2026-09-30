'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function AutomationRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient('/automation-rules');
        setRules(res);
      } catch(e) {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Automation Rules</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Create Rule</button>
      </div>
      {rules.length === 0 ? (
        <div className="bg-white border rounded-lg shadow p-4 text-gray-500">No rules configured.</div>
      ) : (
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Rule Name</th>
                <th className="p-4 font-medium text-gray-600">Metric</th>
                <th className="p-4 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-4">{r.name}</td>
                  <td className="p-4">{r.metric} {r.operator} {r.value}</td>
                  <td className="p-4">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}