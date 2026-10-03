'use client';
import { useState } from 'react';
import { setTokens } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await apiClient('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ id_token: tokenResponse.access_token }),
        });
        setTokens(data.access_token, data.refresh_token);
        window.location.href = '/connect-amazon';
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }

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

        <button 
          onClick={() => googleLogin()}
          className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or continue with email</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

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
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-border-dim rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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