'use client';
import { useMemo } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { useAuthStore } from '@/store/useAuthStore';

// Single source of truth: store; fallback to localStorage synchronously
function getStoredAuth() {
  try {
    const raw = localStorage.getItem('ticketing_auth');
    if (!raw) return { isLoggedIn: false, user: null };
    const parsed = JSON.parse(raw);
    // Zustand persist saves { state: { user, isLoggedIn } }
    return parsed?.state ?? { isLoggedIn: false, user: null };
  } catch {
    return { isLoggedIn: false, user: null };
  }
}

export default function DashboardLayout({ children }) {
  const { isLoggedIn, user, login } = useAuthStore();

  // compute session with immediate localStorage fallback
  const session = useMemo(() => {
    if (isLoggedIn && user) return { isLoggedIn, user };
    if (typeof window !== 'undefined') {
      const s = getStoredAuth();
      // if store is empty but storage has a user, hydrate the store quickly
      if (!isLoggedIn && s.isLoggedIn && s.user) login(s.user);
      return s;
    }
    return { isLoggedIn: false, user: null };
  }, [isLoggedIn, user, login]);

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
