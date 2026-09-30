'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function Keywords() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const camps = await apiClient('/campaigns');
        if (camps.length > 0) {
          const adGroups = await apiClient(`/ad-groups?campaign_id=${camps[0].id}`);
          if (adGroups.length > 0) {
            const kws = await apiClient(`/keywords?ad_group_id=${adGroups[0].id}`);
            setKeywords(kws);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading keywords...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Keywords</h1>
      {keywords.length === 0 ? (
        <div className="bg-white border rounded-lg shadow p-4 text-gray-500">No keywords yet.</div>
      ) : (
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Keyword</th>
                <th className="p-4 font-medium text-gray-600">Match Type</th>
                <th className="p-4 font-medium text-gray-600">State</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map(k => (
                <tr key={k.id} className="border-b">
                  <td className="p-4">{k.keyword_text}</td>
                  <td className="p-4">{k.match_type}</td>
                  <td className="p-4">{k.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}