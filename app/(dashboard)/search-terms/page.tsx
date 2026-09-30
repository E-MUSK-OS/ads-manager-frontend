'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function SearchTerms() {
  const [searchTerms, setSearchTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const camps = await apiClient('/campaigns');
        if (camps.length > 0) {
          const sts = await apiClient(`/search-terms?campaign_id=${camps[0].id}`);
          setSearchTerms(sts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading search terms...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Search Terms</h1>
      {searchTerms.length === 0 ? (
        <div className="bg-white border rounded-lg shadow p-4 text-gray-500">No search terms yet.</div>
      ) : (
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Search Term</th>
                <th className="p-4 font-medium text-gray-600">Clicks</th>
                <th className="p-4 font-medium text-gray-600">Spend</th>
                <th className="p-4 font-medium text-gray-600">Sales</th>
              </tr>
            </thead>
            <tbody>
              {searchTerms.map(s => (
                <tr key={s.id} className="border-b">
                  <td className="p-4">{s.search_term}</td>
                  <td className="p-4">{s.clicks}</td>
                  <td className="p-4">${s.spend}</td>
                  <td className="p-4">${s.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}