'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Bot, Send, Sparkles, Check, X, ArrowRight } from 'lucide-react';

export default function AiInsights() {
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    {role: 'assistant', content: 'System ready. I am your autonomous Ads Intelligence agent. I constantly monitor your campaigns for inefficiencies and scaling opportunities.'}
  ]);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState([
    { id: 1, type: 'BID_OPTIMIZATION', target: 'Keyword: "wireless earbuds"', impact: 'High', description: 'ACOS is currently 42% (above 30% target). Recommend decreasing bid from $1.50 to $1.15 to improve efficiency.', status: 'PENDING' },
    { id: 2, type: 'BUDGET_REALLOCATION', target: 'Campaign: Q4 Electronics', impact: 'Medium', description: 'Campaign capping out by 2 PM daily with 15% ROAS. Recommend shifting $50/day from underperforming "Accessories" campaign.', status: 'PENDING' },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chat.trim()) return;
    
    const newMessages = [...messages, {role: 'user', content: chat}];
    setMessages(newMessages);
    setChat('');
    setLoading(true);

    try {
      const res = await apiClient(`/ai/chat?message=${encodeURIComponent(chat)}`, { method: 'POST' });
      setMessages([...newMessages, {role: 'assistant', content: res.response}]);
    } catch (err) {
      setMessages([...newMessages, {role: 'assistant', content: 'Connection to Intelligence core failed. Please retry.'}]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = (id: number, action: 'APPROVED' | 'DISMISSED') => {
    setSuggestions(suggestions.map(s => s.id === id ? { ...s, status: action } : s));
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] max-w-[1600px] mx-auto">
      
      {/* Suggestions Column (The proactive AI) */}
      <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Proactive Optimizations</h2>
        </div>
        
        {suggestions.map(suggestion => {
          if (suggestion.status !== 'PENDING') return null;
          return (
            <div key={suggestion.id} className="bg-surface border border-indigo-200 rounded-lg shadow-sm overflow-hidden flex flex-col relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-mono font-semibold text-indigo-600 tracking-wider">
                    {suggestion.type.replace('_', ' ')}
                  </div>
                  <div className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full ${
                    suggestion.impact === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {suggestion.impact} IMPACT
                  </div>
                </div>
                <div className="font-semibold text-slate-900 mb-1">{suggestion.target}</div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">{suggestion.description}</p>
                
                <div className="flex gap-3 justify-end border-t border-border-dim pt-4 mt-2">
                  <button onClick={() => handleSuggestionAction(suggestion.id, 'DISMISSED')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors">
                    <X className="w-4 h-4" /> Dismiss
                  </button>
                  <button onClick={() => handleSuggestionAction(suggestion.id, 'APPROVED')} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-surface border border-indigo-200 hover:border-indigo-600 rounded-md transition-colors">
                    <Check className="w-4 h-4" /> Apply Changes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {suggestions.every(s => s.status !== 'PENDING') && (
          <div className="p-8 border border-dashed border-border-dim rounded-lg text-center bg-surface">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">All clear</h3>
            <p className="text-sm text-slate-500">No pending optimizations. The system will alert you when new opportunities arise.</p>
          </div>
        )}
      </div>

      {/* Chat Column (The reactive AI) */}
      <div className="w-1/2 flex flex-col bg-slate-900 text-slate-50 border border-slate-800 rounded-lg shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50 backdrop-blur">
          <Bot className="w-5 h-5 text-indigo-400" />
          <span className="font-mono text-sm tracking-widest font-semibold text-slate-300">ADS_INTELLIGENCE_TERMINAL</span>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 font-mono text-sm">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className={`text-xs mb-1 opacity-50 flex items-center gap-1 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'user' ? 'YOU' : 'SYSTEM'} {m.role === 'assistant' && <Sparkles className="w-3 h-3 text-indigo-400" />}
              </span>
              <div className={`p-4 rounded-md leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="self-start flex flex-col max-w-[85%]">
              <span className="text-xs mb-1 opacity-50">SYSTEM</span>
              <div className="p-4 rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                Analyzing request...
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3 items-center">
          <div className="flex-1 relative">
            <ArrowRight className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input 
              type="text" 
              value={chat} 
              onChange={e => setChat(e.target.value)} 
              className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm transition-colors" 
              placeholder="Query the system..." 
              disabled={loading} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !chat.trim()} 
            className="p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}