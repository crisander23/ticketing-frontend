// app/(public)/login/page.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { routeForUser } from '@/lib/guards';
import { normalizeUser } from '@/lib/auth-utils';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);

  const { isLoggedIn, user, login } = useAuthStore();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(routeForUser(user));
    }
  }, [isLoggedIn, user, router]);

  const submit = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await apiFetch('/auth/login', { method: 'POST', body: form });
      const u = normalizeUser(raw);
      login(u);
      router.replace(routeForUser(u));
    } catch (e) {
      // --- MODIFIED ---
      // Always show a user-friendly message instead of the raw API error (e.message)
      setError('Login failed. Please check your credentials and try again.');
      // --- END MODIFICATION ---
    } finally {
      setLoading(false);
    }
  }, [form, loading, login, router]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_-20px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">NEA DDCC EC Help Desk</h1>
          <p className="mt-2 text-sm text-white/80">Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          {/* Email (now same glass style as password) */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-white/80">Email</label>
            <div className="mt-1 relative">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onKeyDown={onKeyDown}
                autoComplete="email"
                placeholder="name@company.com"
                className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-white/80">Password</label>
            <div className="mt-1 relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                onKeyDown={onKeyDown}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-2 px-2 grid place-items-center z-10 focus:outline-none hover:bg-white/10 rounded-lg"
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl border border-red-400/40 bg-red-500/15 text-red-200 px-4 py-3 text-sm"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {/* Login (white button) */}
          <Button
            variant="white"
            onClick={submit}
            className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Login'}
          </Button>

          {/* Forgot password */}
          <a
            href="/forgot-password"
            className="block w-full text-center py-2 rounded-xl text-sm text-blue-300 hover:text-blue-400 focus:outline-none"
          >
            Forgot your password?
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 text-white/60 text-xs select-none">
            <div className="h-px flex-1 bg-white/10" />
            <span>Don’t have an account?</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Register */}
          <a
            href="/register"
            className="block w-full text-center py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}