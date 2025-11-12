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

  /* THEME: 'ocean' (gradient/dark) or 'light' */
  const [theme, setTheme] = useState('ocean');
  useEffect(() => {
    const saved = localStorage.getItem('nea_theme') || 'ocean';
    setTheme(saved);
  }, []);
  useEffect(() => {
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
  const onAssign = useCallback(async (ticketId, agentId) => {
    await apiFetch(`/tickets/${ticketId}`, { method: 'PUT', body: { agent_id: agentId } });
    await mutateTickets();
  }, [mutateTickets]);

  const onStatusChange = useCallback(async (ticketId, newStatus) => {
    await apiFetch(`/tickets/${ticketId}`, { method: 'PUT', body: { status: newStatus } });
    await mutateTickets();
  }, [mutateTickets]);

  const refreshAll = useCallback(() => { mutateTickets(); mutateUsers(); }, [mutateTickets, mutateUsers]);

  const doLogout = useCallback(() => {
    try {
      localStorage.removeItem('ticketing_auth');
    } catch {}
    window.location.href = '/login';
  }, []);

  // Filters
  const filteredTickets = useMemo(() => {
    let list = tickets || [];
    if (statusFilter !== 'all') list = list.filter(t => (t.status || '').toLowerCase() === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(t =>
        [t.title, t.description, t.category, t.status, t.ticket_id, t.customer_id, t.agent_id, t.impact]
          .map(v => (v ?? '').toString().toLowerCase())
          .some(s => s.includes(q))
      );
    }
    return list;
  }, [tickets, statusFilter, query]);

  /* KPI card */
  const Kpi = ({ label, value, color }) => {
    const tone = {
      slate:   theme === 'ocean' ? 'bg-white/10 text-white'         : 'bg-slate-900 text-white',
      blue:    theme === 'ocean' ? 'bg-blue-500 text-white'         : 'bg-blue-600 text-white',
      amber:   theme === 'ocean' ? 'bg-amber-400 text-slate-900'    : 'bg-amber-500 text-slate-900',
      violet:  theme === 'ocean' ? 'bg-violet-500 text-white'       : 'bg-violet-600 text-white',
      emerald: theme === 'ocean' ? 'bg-emerald-500 text-white'      : 'bg-emerald-600 text-white',
    }[color];
    return (
      <div className={`rounded-xl px-4 py-4 shadow-sm ${tone}`}>
        <div className="text-xs opacity-90">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
  };

  const bgClass = theme === 'ocean'
    ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
    : 'bg-slate-50 text-slate-900';

  const cardTitle = theme === 'ocean' ? 'text-white' : 'text-slate-900';
  const subTitle  = theme === 'ocean' ? 'text-white/80' : 'text-slate-600';

  const inputWrap = theme === 'ocean'
    ? 'rounded-xl bg-white/10 border border-white/15'
    : 'rounded-xl bg-white border border-slate-300';

  const inputField = theme === 'ocean'
    ? 'bg-transparent text-white placeholder-white/60'
    : 'bg-transparent text-slate-900 placeholder-slate-400';

  const selectField = theme === 'ocean'
    ? 'rounded-md border border-white/15 bg-transparent text-white'
    : 'rounded-md border border-slate-300 bg-white text-slate-900';

  const buttonGhost = theme === 'ocean'
    ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
    : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';

  const buttonPrimary = theme === 'ocean'
    ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100'
    : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800';

  /* HEADER HEIGHT (fixed) */
  const headerHeight = 'h-16'; // ~64px

  return (
    <div className={`min-h-screen w-full ${bgClass}`}>
      {/* Fixed Top bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${headerHeight} ${
          theme === 'ocean'
            ? 'bg-slate-900/70 border-b border-white/10 backdrop-blur'
            : 'bg-white/90 border-b border-slate-200 backdrop-blur'
        }`}
      >
        <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`truncate text-lg sm:text-xl font-semibold ${cardTitle}`}>Ticketing — Admin</h1>
            <p className={`text-xs sm:text-sm ${subTitle}`}>
              Logged in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setTheme(t => (t === 'ocean' ? 'light' : 'ocean'))}
              className={buttonGhost + ' px-3 py-2 text-sm'}
              title="Toggle theme"
            >
              {theme === 'ocean' ? '☀️ Light' : '🌊 Ocean'}
            </button>
            <button
              onClick={() => setOpenReg(true)}
              className={buttonGhost + ' px-3 py-2 text-sm'}
            >
              Register Agent
            </button>
            <button onClick={refreshAll} className={buttonPrimary + ' px-3 py-2 text-sm'}>
              Refresh
            </button>
            <button onClick={doLogout} className={buttonGhost + ' px-3 py-2 text-sm'}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Canvas (padded down so content doesn't go under fixed header) */}
      <main className={`w-full px-4 sm:px-6 pt-20 pb-8 space-y-6`}>
        {/* Search */}
        <div className={`${inputWrap} px-3 py-2`}>
          <input
            type="search"
            placeholder="Search tickets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputField}`}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className={`text-sm ${subTitle}`}>Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${selectField} px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
          <Kpi label="Total"       value={counts.all}         color="slate"  />
          <Kpi label="Open"        value={counts.open}        color="blue"   />
          <Kpi label="In Progress" value={counts.in_progress} color="amber"  />
          <Kpi label="Resolved"    value={counts.resolved}    color="violet" />
          <Kpi label="Closed"      value={counts.closed}      color="emerald"/>
        </div>

        {/* Tickets */}
        <section className="space-y-3">
          <div>
            <h2 className={`text-lg font-semibold ${cardTitle}`}>Tickets</h2>
            <p className={`text-sm ${subTitle}`}>
              {ticketsLoading ? 'Loading…' : `${filteredTickets.length} of ${counts.all} shown`}
            </p>
          </div>

          {ticketsError ? (
            <div className={`${theme === 'ocean'
                ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100'
                : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700'
              } px-4 py-3 text-sm`}>
              Failed to load tickets.
            </div>
          ) : (
            <TicketTable
              rows={filteredTickets || []}
              role="admin"
              agentOptions={agentOptions}
              onAssign={onAssign}
              onStatusChange={onStatusChange}
              inlineAction
              surface={theme === 'ocean' ? 'dark' : 'light'}
              perPage={10}
              showImpact
            />
          )}
        </section>

        {/* Users */}
        <section className="space-y-3">
          <div>
            <h2 className={`text-lg font-semibold ${cardTitle}`}>Users</h2>
            <p className={`text-sm ${subTitle}`}>{usersLoading ? 'Loading…' : `${(users || []).length} users`}</p>
          </div>

          <UserTable
            rows={users || []}
            perPage={10}
            surface={theme === 'ocean' ? 'dark' : 'light'}
          />
        </section>
      </main>

      <RegisterAgentModal open={openReg} onClose={() => setOpenReg(false)} onSuccess={() => mutateUsers()} />
    </div>
  );
}
