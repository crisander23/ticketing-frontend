// app/(public)/login/page.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { routeForUser } from '@/lib/guards';
import { normalizeUser } from '@/lib/auth-utils';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, user, login } = useAuthStore();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(routeForUser(user));
    }
  }, [isLoggedIn, user, router]);

  const submit = async () => {
    setLoading(true);
    try {
      const raw = await apiFetch('/auth/login', { method: 'POST', body: form });

      // DEBUG ONCE: uncomment to see exactly what backend returns
      // console.log('RAW LOGIN RESPONSE:', raw);

      const u = normalizeUser(raw);
      // DEBUG ONCE: console.log('NORMALIZED USER:', u, '→ route:', routeForUser(u));

      login(u);
      router.replace(routeForUser(u));
    } catch (e) {
      alert(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow py-20">
      <div className="mx-auto max-w-md card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <Input label="Email" type="email" value={form.email}
               onChange={e=>setForm({...form, email: e.target.value})}/>
        <Input label="Password" type="password" value={form.password}
               onChange={e=>setForm({...form, password: e.target.value})}/>
        <Button variant="primary" onClick={submit} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="text-sm text-gray-600">
          <a className="underline" href="/register">Create account</a> · <a className="underline" href="/forgot-password">Forgot password</a>
        </div>
      </div>
    </div>
  );
}
