// app/(protected)/admin/page.js
'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketTable from '@/components/TicketTable';
import UserTable from '@/components/UserTable';
import RegisterAgentModal from '@/components/RegisterAgentModal';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  // THEME: dark-mode
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'
  useEffect(() => {
    // hydrate theme from storage or prefers-color-scheme
    const saved = localStorage.getItem('nea_theme');
    const initial =
      saved ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');
    setTheme(initial);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('nea_theme', theme);
  }, [theme]);

  // UI state
  const [openReg, setOpenReg] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|open|in_progress|resolved|closed

  // Data
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } =
    useSWR('/tickets', fetcher);
  const { data: users, error: usersError, isLoading: usersLoading, mutate: mutateUsers } =
    useSWR('/admin/users', fetcher);

  const agentOptions = useMemo(
    () =>
      (users || [])
        .filter(u => (u.user_type || '').toLowerCase() === 'agent' && (u.status || '').toLowerCase() === 'active')
        .map(u => ({ id: u.user_id, label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [users]
  );

  const counts = useMemo(() => {
    const list = tickets || [];
    const by = (s) => list.filter(t => (t.status || '').toLowerCase() === s).length;
    return {
      all: list.length,
      open: by('open'),
      in_progress: by('in_progress'),
      resolved: by('resolved'),
      closed: by('closed'),
    };
  }, [tickets]);

  // Mutations
  const onAssign = useCallback(
    async (ticketId, agentId) => {
      await apiFetch(`/tickets/${ticketId}`, { method: 'PUT', body: { agent_id: agentId } });
      await mutateTickets();
    },
    [mutateTickets]
  );

  const onStatusChange = useCallback(
    async (ticketId, newStatus) => {
      await apiFetch(`/tickets/${ticketId}`, { method: 'PUT', body: { status: newStatus } });
      await mutateTickets();
    },
    [mutateTickets]
  );

  const refreshAll = useCallback(() => {
    mutateTickets();
    mutateUsers();
  }, [mutateTickets, mutateUsers]);

  // Filters
  const filteredTickets = useMemo(() => {
    let list = tickets || [];
    if (statusFilter !== 'all') list = list.filter(t => (t.status || '').toLowerCase() === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(t =>
        [t.title, t.description, t.category, t.status, t.ticket_id, t.customer_id, t.agent_id]
          .map(v => (v ?? '').toString().toLowerCase())
          .some(s => s.includes(q))
      );
    }
    return list;
  }, [tickets, statusFilter, query]);

  const Kpi = ({ label, value, color }) => {
    const map = {
      slate:   'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
      blue:    'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800',
      amber:   'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800',
      violet:  'bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-900/30 dark:text-violet-100 dark:border-violet-800',
      emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-800',
    };
    return (
      <div className={`rounded-xl border px-4 py-4 shadow-sm ${map[color]}`}>
        <div className="text-xs">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
  };

  const Card = ({ title, subtitle, right, children }) => (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
      {(title || right) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            {title && <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-0">{children}</div>
    </section>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Ticketing — Admin</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Logged in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              className="rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 px-3 py-2 text-sm
                         dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              onClick={() => setOpenReg(true)}
              className="rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 px-3 py-2 text-sm
                         dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Register Agent
            </button>
            <button
              onClick={refreshAll}
              className="rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm
                         dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Search (no border) */}
        <div className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
          <input
            type="search"
            placeholder="Search tickets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md bg-white px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-slate-300
                       dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:ring-slate-700"
          />
        </div>

        {/* Status filter DROPDOWN — ABOVE KPI cards */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-slate-700"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <Kpi label="Total"       value={counts.all}         color="slate"  />
          <Kpi label="Open"        value={counts.open}        color="blue"   />
          <Kpi label="In Progress" value={counts.in_progress} color="amber"  />
          <Kpi label="Resolved"    value={counts.resolved}    color="violet" />
          <Kpi label="Closed"      value={counts.closed}      color="emerald"/>
        </div>

        {/* Tickets */}
        <Card
          title="Tickets"
          subtitle={ticketsLoading ? 'Loading…' : `${filteredTickets.length} of ${counts.all} shown`}
        >
          {ticketsError ? (
            <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
              Failed to load tickets. Please refresh.
            </div>
          ) : (
            <TicketTable
              rows={filteredTickets || []}
              role="admin"
              agentOptions={agentOptions}
              onAssign={onAssign}
              onStatusChange={onStatusChange}
              inlineAction
              surface="light"
              perPage={10}
            />
          )}
        </Card>

        {/* Users */}
        <Card
          title="Users"
          subtitle={usersLoading ? 'Loading…' : `${(users || []).length} users`}
        >
          <UserTable rows={users || []} perPage={10} />
        </Card>
      </main>

      <RegisterAgentModal open={openReg} onClose={() => setOpenReg(false)} onSuccess={() => mutateUsers()} />
    </div>
  );
}
