'use client';

import NotificationBell from '@/components/NotificationBell';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

export default function Header({ title, subtitle, notifCount = 0, extra = null }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="mb-6 flex items-center justify-between rounded-lg border border-[var(--line)] bg-white p-4">
      <div>
        <h1 className="text-2xl font-semibold">{title || 'Ticketing System'}</h1>
        {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
        {user?.first_name && !subtitle ? (
          <p className="text-sm text-gray-600">Welcome, {user.first_name}!</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell count={notifCount} />
        {extra}
        <Button variant="danger" onClick={logout}>Logout</Button>
      </div>
    </header>
  );
}
