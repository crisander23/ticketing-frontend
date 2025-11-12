// app/(public)/forgot-password/page.js
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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const rules = useMemo(() => {
    const p = password || '';
    return {
      len: p.length >= 8,
      up: /[A-Z]/.test(p),
      lo: /[a-z]/.test(p),
      num: /\d/.test(p),
    };
  }, [password]);

  const meetsAll = rules.len && rules.up && rules.lo && rules.num;

  const blockClipboard = (e) => e.preventDefault();

  const handleStep1 = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!emailValid) {
      setErr('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
      setMsg('Check your email for a reset code.');
      setStep(2);
    } catch (e) {
      setErr(e?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  }, [email, emailValid]);

  const handleStep2 = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (token.length !== 6) {
      setErr('Please enter the 6-digit code.');
      return;
    }
    if (!meetsAll) {
      setErr('Password must meet all the rules.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: { token, new_password: password } });
      alert('Password updated. Sign in with your new password.');
      window.location.href = '/login';
    } catch (e) {
      setErr(e?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }, [token, password, meetsAll]);

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (step === 1) handleStep1();
    else handleStep2();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center px-4 py-8 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">NEA DDCC EC Help Desk</h1>
          <p className="mt-2 text-sm text-white/80">Reset Password</p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label htmlFor="email" className="block text-[11px] sm:text-xs font-medium text-white/80">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {email && !emailValid && (
                  <p className="mt-1 text-[11px] sm:text-xs text-red-300">Enter a valid email address.</p>
                )}
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
                onClick={handleStep1}
                className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Code'}
              </Button>

              <div className="flex items-center gap-3 text-white/60 text-xs select-none">
                <div className="h-px flex-1 bg-white/10" />
                <span>Remembered your password?</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <a
                href="/login"
                className="block w-full text-center py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Back to login
              </a>
            </>
          )}

          {step === 2 && (
            <>
              {/* Token */}
              <div>
                <label htmlFor="token" className="block text-[11px] sm:text-xs font-medium text-white/80">
                  6-digit token
                </label>
                <input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  value={token}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setToken(digits);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Enter the code"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* New password */}
              <div>
                <label htmlFor="password" className="block text-[11px] sm:text-xs font-medium text-white/80">
                  New password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Rules checker */}
                <div className="mt-3 space-y-1.5" aria-live="polite">
                  <RuleLine ok={rules.len}>≥ 8 characters</RuleLine>
                  <RuleLine ok={rules.up}>1 uppercase</RuleLine>
                  <RuleLine ok={rules.lo}>1 lowercase</RuleLine>
                  <RuleLine ok={rules.num}>1 number</RuleLine>
                </div>
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
                onClick={handleStep2}
                className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
                disabled={loading || !meetsAll || token.length !== 6}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </Button>

              <div className="flex items-center gap-3 text-white/60 text-xs select-none">
                <div className="h-px flex-1 bg-white/10" />
                <span>Wrong email?</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <a
                href="/forgot-password"
                className="block w-full text-center py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => {
                  setStep(1);
                  setToken('');
                  setPassword('');
                  setErr(null);
                  setMsg(null);
                }}
              >
                Restart reset flow
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
