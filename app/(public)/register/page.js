'use client';
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

const rules = ['≥8 chars', '1 uppercase', '1 lowercase', '1 number'];

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', department:'', position:'', password:'' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/register', { method:'POST', body: form });
      alert('Check your email for a 6-digit code');
      window.location.href = '/verify-email';
    } catch (e) { alert(e.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const set = (k,v)=>setForm(s=>({...s,[k]:v}));

  return (
    <div className="container-narrow py-20">
      <div className="mx-auto max-w-md card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <Input label="First Name" value={form.first_name} onChange={e=>set('first_name', e.target.value)} />
        <Input label="Last Name" value={form.last_name} onChange={e=>set('last_name', e.target.value)} />
        <Input label="Email" type="email" value={form.email} onChange={e=>set('email', e.target.value)} />
        <Input label="Department" value={form.department} onChange={e=>set('department', e.target.value)} />
        <Input label="Position" value={form.position} onChange={e=>set('position', e.target.value)} />
        <Input label="Password" type="password" value={form.password} onChange={e=>set('password', e.target.value)} />
        <div className="text-xs text-gray-600">Password rules: {rules.join(' • ')}</div>
        <Button variant="primary" onClick={submit} disabled={loading}>{loading?'Submitting…':'Register'}</Button>
      </div>
    </div>
  );
}
