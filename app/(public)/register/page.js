// app/(public)/register/page.js
'use client';

import { useState, useMemo, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

const RuleLine = ({ ok, children }) => (
  <div className={`flex items-center gap-2 text-[11px] sm:text-xs ${ok ? 'text-emerald-300' : 'text-white/70'}`}>
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border
        ${ok ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/10 border-white/30 text-white/70'}`}
      aria-hidden
    >
      {ok ? '✓' : '•'}
    </span>
    <span>{children}</span>
  </div>
);

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    position: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Password rule checks (only what you asked)
  const rules = useMemo(() => {
    const p = form.password || '';
    return {
      len: p.length >= 8,
      up: /[A-Z]/.test(p),
      lo: /[a-z]/.test(p),
      num: /\d/.test(p),
    };
  }, [form.password]);
  const meetsAll = rules.len && rules.up && rules.lo && rules.num;
  const passwordsMatch = form.password.length > 0 && form.password === form.confirm;

  const submit = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          department: form.department,
          position: form.position,
          password: form.password,
        },
      });
      alert('Check your email for a 6-digit code');
      window.location.href = '/verify-email';
    } catch (e) {
      setError(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [form, loading]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit();
  };

  const blockClipboard = (e) => e.preventDefault();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center px-4 py-8 text-white">
      {/* Centered glass "modal" card */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">NEA DDCC EC Help Desk</h1>
          <p className="mt-2 text-sm text-white/80">Create your account</p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="first_name" className="block text-[11px] sm:text-xs font-medium text-white/80">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="given-name"
                placeholder="e.g. Juan"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-[11px] sm:text-xs font-medium text-white/80">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="family-name"
                placeholder="e.g. Dela Cruz"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[11px] sm:text-xs font-medium text-white/80">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="email"
              placeholder="name@company.com"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-[11px] sm:text-xs font-medium text-white/80">
              Department
            </label>
            <input
              id="department"
              type="text"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="DDCC / DRRMD / etc."
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-[11px] sm:text-xs font-medium text-white/80">
              Position
            </label>
            <input
              id="position"
              type="text"
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="IT Specialist"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password + Confirm (no copy/paste/cut) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="password" className="block text-[11px] sm:text-xs font-medium text-white/80">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  onPaste={blockClipboard}
                  onCopy={blockClipboard}
                  onCut={blockClipboard}
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

              {/* Live password rules */}
              <div className="mt-3 space-y-1.5" aria-live="polite">
                <RuleLine ok={rules.len}>≥ 8 characters</RuleLine>
                <RuleLine ok={rules.up}>1 uppercase</RuleLine>
                <RuleLine ok={rules.lo}>1 lowercase</RuleLine>
                <RuleLine ok={rules.num}>1 number</RuleLine>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-[11px] sm:text-xs font-medium text-white/80">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm"
                  type={showPw2 ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  onPaste={blockClipboard}
                  onCopy={blockClipboard}
                  onCut={blockClipboard}
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((s) => !s)}
                  aria-label={showPw2 ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-2 px-2 grid place-items-center z-10 focus:outline-none hover:bg-white/10 rounded-lg"
                  title={showPw2 ? 'Hide password' : 'Show password'}
                >
                  {showPw2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {form.confirm.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-[10px] sm:text-[11px] text-red-300">Passwords do not match.</p>
              )}
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

          {/* Submit — white primary button */}
          <Button
            variant="white"
            onClick={submit}
            className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
            disabled={loading || !meetsAll || !passwordsMatch}
          >
            {loading ? 'Submitting…' : 'Register'}
          </Button>

          {/* Divider + link */}
          <div className="flex items-center gap-3 text-white/60 text-xs select-none">
            <div className="h-px flex-1 bg-white/10" />
            <span>Already have an account?</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <a
            href="/login"
            className="block w-full text-center py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
