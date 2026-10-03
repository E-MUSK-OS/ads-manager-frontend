'use client';
import { useState } from 'react';
import { setTokens } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, company_name: company })
      });
      
      // Auto login
      try {
        const data = await apiClient('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username: email, password })
        });
        setTokens(data.access_token, data.refresh_token);
        window.location.href = '/connect-amazon';
      } catch (loginErr) {
        window.location.href = '/login';
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-graph-paper-faint">
      <div className="w-full max-w-md bg-surface border border-border-dim shadow-xl rounded-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Initialize workspace</h1>
          <p className="text-sm text-slate-500">Set up your AdsManager account.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-rose-200 bg-rose-50 rounded-md flex flex-col">
            <span className="text-sm font-semibold text-rose-800 mb-1">Signup failed</span>
            <span className="text-sm text-rose-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Company Name</label>
            <input 
              type="text" 
              required 
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-border-dim rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              placeholder="Acme Corp"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Work Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-border-dim rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              placeholder="name@company.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-border-dim rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-primary text-surface font-medium rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {loading ? 'Provisioning...' : 'Create account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Already registered? <a href="/login" className="font-medium text-primary hover:underline">Sign in instead</a>
        </div>
      </div>
    </div>
  );
}