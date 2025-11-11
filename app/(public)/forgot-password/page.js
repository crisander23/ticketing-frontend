'use client';
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');

  const handleStep1 = async () => {
    try {
      await apiFetch('/auth/forgot-password', { method:'POST', body: { email } });
      alert('Check your email for a reset code.');
      setStep(2);
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const handleStep2 = async () => {
    try {
      await apiFetch('/auth/reset-password', { method:'POST', body: { token, new_password: password } });
      alert('Password updated. Sign in with your new password.');
      window.location.href = '/login';
    } catch (e) { alert(e.message || 'Failed'); }
  };

  return (
    <div className="container-narrow py-20">
      <div className="mx-auto max-w-md card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        {step === 1 && (
          <>
            <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <Button variant="primary" onClick={handleStep1}>Send Code</Button>
          </>
        )}
        {step === 2 && (
          <>
            <Input label="6-digit token" value={token} onChange={e=>setToken(e.target.value)} />
            <Input label="New password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <Button variant="primary" onClick={handleStep2}>Update Password</Button>
          </>
        )}
      </div>
    </div>
  );
}
