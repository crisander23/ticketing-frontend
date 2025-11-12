// app/(public)/verify-email/page.js
'use client';

import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  const submit = useCallback(async () => {
    if (loading) return;
    setErr(null);
    setMsg(null);
    if (code.length !== 6) {
      setErr('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/verify-email', { method: 'POST', body: { token: code } });
      alert('Verified! You can sign in now.');
      window.location.href = '/login';
    } catch (e) {
      setErr(e?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  }, [code, loading]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">NEA DDCC EC Help Desk</h1>
          <p className="mt-2 text-sm text-white/80">Verify your email</p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          <div>
            <label htmlFor="code" className="block text-[11px] sm:text-xs font-medium text-white/80">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              value={code}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(digits);
              }}
              onKeyDown={onKeyDown}
              placeholder="Enter the code"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/15 text-red-200 px-4 py-3 text-sm">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded-xl border border-white/20 bg-white/10 text-white px-4 py-3 text-sm">
              {msg}
            </div>
          )}

          <Button
            variant="white"
            onClick={submit}
            className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </Button>

          <div className="flex items-center gap-3 text-white/60 text-xs select-none">
            <div className="h-px flex-1 bg-white/10" />
            <span>Didn’t get an email?</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <a
            href="/forgot-password"
            className="block w-full text-center py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Try password reset
          </a>
        </div>
      </div>
    </div>
  );
}
