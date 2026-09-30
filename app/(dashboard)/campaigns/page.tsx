'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Filter, MoreHorizontal, CheckSquare, Square } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState(10);
  const [creating, setCreating] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  async function loadData() {
    setLoading(true);
    try {
      const accounts = await apiClient('/ads-accounts');
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const camps = await apiClient('/campaigns');
        setCampaigns(camps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setCreating(true);
    try {
      await apiClient('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          daily_budget: newBudget,
          ads_account_id: account.id
        })
      });
      setIsModalOpen(false);
      setNewName('');
      setNewBudget(10);
      await loadData();
    } catch (err) {
      console.error('Failed to create campaign', err);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (campaign: any) => {
    const newState = campaign.state === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    try {
      await apiClient(`/campaigns/${campaign.id}/state`, {
        method: 'PUT',
        body: JSON.stringify({ state: newState })
      });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === campaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(campaigns.map(c => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  if (loading && campaigns.length === 0) {
    return <div className="p-8 text-sm font-mono text-slate-500 uppercase tracking-widest animate-pulse">Loading data...</div>;
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-bold tracking-tight mb-2">No Campaigns Found</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md">Connect your Amazon Ads account to view and manage campaigns directly from this interface.</p>
        <a href="/connect-amazon" className="px-5 py-2.5 bg-primary text-surface font-medium text-sm rounded-md hover:bg-indigo-600 transition-colors">Integrate Account</a>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Campaigns</h1>
          <p className="text-sm text-slate-500 font-mono tracking-tight">{campaigns.length} TOTAL CAMPAIGNS // ACTIVE WORKSPACE</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter campaigns..." 
              className="pl-9 pr-4 py-2 border border-border-dim rounded-md text-sm bg-surface w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="px-3 py-2 border border-border-dim bg-surface rounded-md flex items-center gap-2 text-sm font-medium hover:bg-slate-50 text-slate-700">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary text-surface rounded-md text-sm font-medium hover:bg-indigo-600 flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-md flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-indigo-800 font-medium">
            <CheckSquare className="w-4 h-4" />
            {selectedIds.size} campaigns selected
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-surface border border-indigo-200 rounded text-indigo-700 font-medium hover:bg-indigo-100">Pause Selected</button>
            <button className="px-3 py-1.5 bg-surface border border-indigo-200 rounded text-indigo-700 font-medium hover:bg-indigo-100">Enable Selected</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl border border-border-dim">
            <h2 className="text-lg font-bold tracking-tight mb-6">Create New Campaign</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-5 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Campaign Name</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-border-dim rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="mb-8 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Daily Budget (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input required type="number" min="1" step="0.01" value={newBudget} onChange={e => setNewBudget(Number(e.target.value))} className="w-full pl-8 p-2.5 bg-slate-50 border border-border-dim rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border-dim text-slate-700 font-medium rounded-md hover:bg-slate-50 text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-primary text-surface font-medium rounded-md hover:bg-indigo-600 disabled:opacity-50 text-sm">
                  {creating ? 'Deploying...' : 'Deploy Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border-dim rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border-dim bg-slate-50">
              <th className="px-4 py-3 w-12 text-center">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-primary">
                  {selectedIds.size === campaigns.length && campaigns.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-100 transition-colors">Campaign Name</th>
              <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider w-32">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors">Daily Budget</th>
              <th className="px-4 py-3 font-medium text-slate-600 uppercase text-xs tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors">Targeting</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dim">
            {campaigns.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No campaigns found matching the current criteria.</td></tr>
            ) : (
              campaigns.map(c => {
                const isSelected = selectedIds.has(c.id);
                const isEnabled = c.state === 'ENABLED';
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSelect(c.id)} className={`${isSelected ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleStatus(c)} 
                        className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                          isEnabled 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        } transition-colors`}
                      >
                        {c.state}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">${c.daily_budget.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.targeting_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}