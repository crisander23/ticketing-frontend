'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketTable from '@/components/TicketTable';
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';

export default function ClientDashboardPage() {
  const { user, logout } = useAuthStore();
  const customerId = user?.user_id ?? null;

  /* ============ Theme (same as admin/agent) ============ */
  const [theme, setTheme] = useState('ocean'); // 'ocean' | 'light'
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ticketing_theme') : null;
    const t = saved || 'ocean';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'ocean' ? 'light' : 'ocean';
      localStorage.setItem('ticketing_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  /* ============ Data ============ */
  const { data: tickets, error, isLoading, mutate } = useSWR(
    customerId ? `/tickets/my?customer_id=${customerId}` : null,
    fetcher
  );

  /* ============ UI State ============ */
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|open|in_progress|resolved|closed

  /* ============ Derived ============ */
  const counts = useMemo(() => {
    const list = tickets || [];
    const by = s => list.filter(t => (t.status || '').toLowerCase() === s).length;
    return { all: list.length, open: by('open'), in_progress: by('in_progress'), resolved: by('resolved'), closed: by('closed') };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let list = tickets || [];
    if (statusFilter !== 'all') list = list.filter(t => (t.status || '').toLowerCase() === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(t =>
        [t.ticket_id, t.title, t.description, t.category, t.impact, t.status]
          .map(v => (v ?? '').toString().toLowerCase())
          .some(s => s.includes(q))
      );
    }
    return list;
  }, [tickets, statusFilter, query]);

  const handleLogout = useCallback(() => {
    try { logout?.(); } catch {}
    try { localStorage.removeItem('ticketing_auth'); } catch {}
    window.location.href = '/login';
  }, [logout]);

  /* ============ UI bits (shared look) ============ */
  const pageBg =
    theme === 'ocean'
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700'
      : 'bg-slate-100';

  const headerCls =
    theme === 'ocean'
      ? 'fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-md'
      : 'fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur';

  const textMain = theme === 'ocean' ? 'text-white' : 'text-slate-900';
  const textSub  = theme === 'ocean' ? 'text-white/80' : 'text-slate-600';

  const buttonGhost = theme === 'ocean'
    ? 'rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm'
    : 'rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-sm';

  const buttonSolid = theme === 'ocean'
    ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm'
    : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm';

  const Kpi = ({ label, value, color }) => {
    const map =
      theme === 'ocean'
        ? {
            slate:   'bg-white/10 text-white border-white/15',
            blue:    'bg-blue-500/20 text-white border-white/15',
            amber:   'bg-amber-500/20 text-white border-white/15',
            violet:  'bg-violet-500/20 text-white border-white/15',
            emerald: 'bg-emerald-500/20 text-white border-white/15',
          }
        : {
            slate:   'bg-slate-900 text-white border-slate-900',
            blue:    'bg-blue-600 text-white border-blue-600',
            amber:   'bg-amber-500 text-slate-900 border-amber-500',
            violet:  'bg-violet-600 text-white border-violet-600',
            emerald: 'bg-emerald-600 text-white border-emerald-600',
          };
    const cls = map[color] || map.slate;
    return (
      <div className={`rounded-xl px-4 py-4 shadow-sm ${cls}`}>
        <div className="text-xs opacity-90">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-full ${pageBg}`}>
      {/* Sticky translucent header (same as admin) */}
      <header className={headerCls}>
        <div className="w-full h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`truncate text-lg sm:text-xl font-semibold ${textMain}`}>Ticketing — Client</h1>
            <p className={`text-xs sm:text-sm ${textSub}`}>
              Logged in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/create-ticket" className={buttonSolid}>
              Create Ticket
            </Link>
            <button className={buttonGhost} onClick={toggleTheme}>
              {theme === 'ocean' ? '☀️ Light' : '🌊 Ocean'}
            </button>
            <button className={buttonSolid} onClick={() => mutate()}>
              Refresh
            </button>
            <button className={buttonGhost} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Canvas (offset for fixed header) */}
      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-6">
        {/* Search */}
        <div className={`${buttonGhost} px-3 py-2`}>
          <input
            type="search"
            placeholder="Search my tickets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={
              theme === 'ocean'
                ? 'w-full rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-300'
                : 'w-full rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-slate-300'
            }
          />
        </div>

        {/* Status filter (dropdown above KPIs) */}
        <div className="flex items-center gap-2">
          <label className={textSub + ' text-sm'}>Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={
              theme === 'ocean'
                ? 'rounded-md border border-white/20 bg-white/10 text-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                : 'rounded-md border border-slate-300 bg-white text-slate-800 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300'
            }
          >
            <option className="text-black" value="all">All</option>
            <option className="text-black" value="open">Open</option>
            <option className="text-black" value="in_progress">In Progress</option>
            <option className="text-black" value="resolved">Resolved</option>
            <option className="text-black" value="closed">Closed</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
          <Kpi label="Total" value={counts.all} color="slate" />
          <Kpi label="Open" value={counts.open} color="blue" />
          <Kpi label="In Progress" value={counts.in_progress} color="amber" />
          <Kpi label="Resolved" value={counts.resolved} color="violet" />
          <Kpi label="Closed" value={counts.closed} color="emerald" />
        </div>

        {/* Tickets (full width table, impact column, no inline actions) */}
        <section className="space-y-3">
          <div>
            <h2 className={`text-lg font-semibold ${textMain}`}>My Tickets</h2>
            <p className={`${textSub} text-sm`}>
              {isLoading ? 'Loading…' : error ? 'Failed to load tickets' : `${filteredTickets.length} of ${counts.all} shown`}
            </p>
          </div>

          {error ? (
            <div className={`${theme === 'ocean'
                ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100'
                : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700'
              } px-4 py-3 text-sm`}>
              Failed to load tickets. Please refresh.
            </div>
          ) : (
            <TicketTable
              rows={filteredTickets || []}
              role="client"
              inlineAction={false}  // Client can't edit
              showImpact={true}     // Ensure the Impact is passed
              perPage={10}
              surface={theme === 'ocean' ? 'dark' : 'light'}
            />
          )}
        </section>
      </main>
    </div>
  );
}
