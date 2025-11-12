// app/(dashboards)/layout.js
'use client';
import { useMemo } from 'react';
import { redirect } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

function getStoredAuth() {
  try {
    const raw = localStorage.getItem('ticketing_auth');
    if (!raw) return { isLoggedIn: false, user: null };
    const parsed = JSON.parse(raw);
    return parsed?.state ?? { isLoggedIn: false, user: null };
  } catch {
    return { isLoggedIn: false, user: null };
  }
}

export default function DashboardLayout({ children }) {
  const { isLoggedIn, user, login } = useAuthStore();

  const session = useMemo(() => {
    if (isLoggedIn && user) return { isLoggedIn, user };
    if (typeof window !== 'undefined') {
      const s = getStoredAuth();
      if (!isLoggedIn && s.isLoggedIn && s.user) login(s.user);
      return s;
    }
    return { isLoggedIn: false, user: null };
  }, [isLoggedIn, user, login]);

  if (!session.isLoggedIn) redirect('/login');

  return (
    // No Header. No max-width container. Let pages control their own styling.
    <div className="min-h-screen w-full">
      <main className="w-full">{children}</main>
    </div>
  );
}
