'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

// UI Component for the validation dots
const RuleLine = ({ ok, children }) => (
  <div className={`flex items-center gap-2 text-[11px] sm:text-xs transition-colors duration-200 ${ok ? 'text-emerald-300' : 'text-white/70'}`}>
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-200
        ${ok ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/10 border-white/30 text-white/70'}`}
      aria-hidden
    >
      {ok ? '✓' : '•'}
    </span>
    <span>{children}</span>
  </div>
);

export default function ForgotPasswordPage() {
  // --- State Management ---
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); 
  const [err, setErr] = useState(null);
  
  // Timer state for Resend Code
  const [timer, setTimer] = useState(0);

  // Refs for the 6 input cards
  const inputRefs = useRef([]);

  // --- Logic & Validation ---
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const rules = useMemo(() => {
    const p = password || '';
    return {
      len: p.length >= 8,
      up: /[A-Z]/.test(p),
      lo: /[a-z]/.test(p),
      num: /\d/.test(p),
      spec: /[!@#$%^&*(),.?":{}|<>]/.test(p)
    };
  }, [password]);

  const meetsAll = rules.len && rules.up && rules.lo && rules.num && rules.spec;

  const blockClipboard = (e) => e.preventDefault();

  // --- Timer Logic ---
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- OTP Input Handlers ---
  const handleTokenChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newToken = token.split('');
    newToken[index] = value.substring(value.length - 1);
    const finalToken = newToken.join('').substring(0, 6);
    setToken(finalToken);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleTokenKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleStep2();
  };

  const handleTokenPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      setToken(pastedData);
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // --- API Steps ---
  const handleStep1 = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!emailValid) {
      setErr('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
      setMsg('A 6-digit code has been sent to your email.');
      setTimer(60); // Start cooldown
      setTimeout(() => {
        setMsg(null);
        setStep(2);
      }, 1000);
    } catch (e) {
      setErr(e?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  }, [email, emailValid]);

  const handleResend = useCallback(async () => {
    if (timer > 0) return;
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
      setMsg('Code resent successfully!');
      setTimer(60); // Reset cooldown
    } catch (e) {
      setErr(e?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  }, [email, timer]);

  const handleStep2 = useCallback(async () => {
    setErr(null);
    setMsg(null);
    
    if (token.length !== 6) {
      setErr('Please enter the complete 6-digit code.');
      return;
    }
    if (!meetsAll) {
      setErr('Password does not meet all security requirements.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { 
        method: 'POST', 
        body: { 
          token, 
          password 
        } 
      });
      
      setMsg('Password reset successful! Redirecting...');
      setTimeout(() => window.location.href = '/login', 2000);
      
    } catch (e) {
      setErr(e?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }, [token, password, meetsAll]);

  const onKeyDownGlobal = (e) => {
    if (e.key === 'Enter' && step === 1) handleStep1();
  };

  // Auto-focus first OTP input on Step 2
  useEffect(() => {
    if (step === 2) setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [step]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center px-4 py-8 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">NEA DDCC EC Help Desk</h1>
          <p className="mt-2 text-sm text-white/80">
            {step === 1 ? 'Reset Password' : 'Set New Password'}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          
          {/* === STEP 1 FORM === */}
          {step === 1 && (
            <>
              <div>
                <label htmlFor="email" className="block text-[11px] sm:text-xs font-medium text-white/80">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDownGlobal}
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {err && <div className="rounded-xl border border-red-400/40 bg-red-500/15 text-red-200 px-4 py-3 text-sm">{err}</div>}
              {msg && <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 px-4 py-3 text-sm">{msg}</div>}

              <Button
                variant="white"
                onClick={handleStep1}
                className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </Button>
            </>
          )}

          {/* === STEP 2 FORM === */}
          {step === 2 && (
            <>
              <div className="text-center text-sm text-white/80 mb-2">
                Code sent to <span className="font-semibold text-white">{email}</span>
              </div>

              {/* 6-Card Token Input */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-white/80 mb-2">6-digit Code</label>
                <div className="flex gap-2 justify-between sm:justify-center sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={token[index] || ''}
                      onChange={(e) => handleTokenChange(index, e.target.value)}
                      onKeyDown={(e) => handleTokenKeyDown(index, e)}
                      onPaste={handleTokenPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border border-white/20 bg-white/10 text-center text-xl sm:text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all placeholder-white/20"
                      placeholder="•"
                    />
                  ))}
                </div>
              </div>

              {/* New Password Input */}
              <div>
                <label htmlFor="password" className="block text-[11px] sm:text-xs font-medium text-white/80">New Password</label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleStep2(); }}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    onPaste={blockClipboard}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute inset-y-0 right-2 px-2 grid place-items-center z-10 focus:outline-none hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Rules checker */}
                <div className="mt-4 space-y-1.5 bg-white/5 p-3 rounded-lg border border-white/5" aria-live="polite">
                  <RuleLine ok={rules.len}>At least 8 characters</RuleLine>
                  <RuleLine ok={rules.up}>At least 1 Uppercase</RuleLine>
                  <RuleLine ok={rules.lo}>At least 1 Lowercase</RuleLine>
                  <RuleLine ok={rules.num}>At least 1 Number</RuleLine>
                  <RuleLine ok={rules.spec}>At least 1 Special char</RuleLine>
                </div>
              </div>

              {err && <div className="rounded-xl border border-red-400/40 bg-red-500/15 text-red-200 px-4 py-3 text-sm">{err}</div>}
              {msg && <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 px-4 py-3 text-sm">{msg}</div>}

              <Button
                variant="white"
                onClick={handleStep2}
                className="w-full py-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
                disabled={loading || !meetsAll || token.length !== 6}
              >
                {loading ? 'Updating...' : 'Set New Password'}
              </Button>

              {/* --- Step 2 Footer Actions --- */}
              <div className="flex items-center justify-between text-xs font-medium text-white/80 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0 || loading}
                  className={`flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none ${timer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${timer === 0 && loading ? 'animate-spin' : ''}`} />
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setToken('');
                    setPassword('');
                    setErr(null);
                    setMsg(null);
                    setTimer(0);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                >
                  Change Email
                </button>
              </div>
            </>
          )}

          {/* --- Common Footer for Both Steps --- */}
          <div>
            <div className="flex items-center gap-3 text-white/60 text-xs select-none pt-2">
              <div className="h-px flex-1 bg-white/10" />
              <span>Remembered your password?</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <a
              href="/login"
              className="mt-4 block w-full text-center py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
            >
              Back to Login
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}