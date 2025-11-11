'use client';
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const submit = async () => {
    try {
      await apiFetch('/auth/verify-email', { method:'POST', body: { token: code } });
      alert('Verified! You can sign in now.');
      window.location.href = '/login';
    } catch (e) { alert(e.message || 'Verification failed'); }
  };
  return (
    <div className="container-narrow py-20">
      <div className="mx-auto max-w-md card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Verify Email</h1>
        <Input label="6-digit code" value={code} onChange={e=>setCode(e.target.value)} />
        <Button variant="primary" onClick={submit}>Verify</Button>
      </div>
    </div>
  );
}
