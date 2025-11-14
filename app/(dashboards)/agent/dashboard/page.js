// app/(protected)/agent/page.js
'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketTable from '@/components/TicketTable';
import ResolutionModal from '@/components/ResolutionModal';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AgentDashboardPage() {
  const { user, logout } = useAuthStore();
  const agentId = user?.user_id ?? null;

  // Theme (same key as admin so they stay in sync)
  const [theme, setTheme] = useState('ocean');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nea_theme') : null;
    const t = saved || 'ocean';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'ocean' ? 'light' : 'ocean';
      localStorage.setItem('nea_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  // UI
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);

  // Data
  const { data: tickets, error, isLoading, mutate } = useSWR(
    agentId ? `/tickets?agent_id=${agentId}` : null,
    fetcher
  );

  const counts = useMemo(() => {
    const list = tickets || [];
    const by = (s) => list.filter(t => (t.status || '').toLowerCase() === s).length;
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

  // Mutations — intercept "resolved" to open modal
  const onStatusChange = useCallback(
    async (ticketId, newStatus) => {
      if ((newStatus || '').toLowerCase() === 'resolved') {
        setResolvingTicketId(ticketId);
        setResolveOpen(true);
        return;
      }
      await apiFetch(`/tickets/${ticketId}`, { method: 'PUT', body: { status: newStatus } });
      await mutate();
    },
    [mutate]
  );

  const submitResolution = useCallback(
    async (details) => {
      if (!resolvingTicketId) return;
      await apiFetch(`/tickets/${resolvingTicketId}`, {
        method: 'PUT',
        body: { status: 'resolved', resolution_details: details || '', resolved_at: new Date().toISOString() },
      });
      setResolveOpen(false);
      setResolvingTicketId(null);
      await mutate();
    },
    [resolvingTicketId, mutate]
  );

  const cancelResolution = () => { setResolveOpen(false); setResolvingTicketId(null); };

  const handleLogout = () => {
    try { logout?.(); } catch {}
    try { localStorage.removeItem('ticketing_auth'); } catch {}
    window.location.href = '/login';
  };

  // Theming tokens (same sizing & feel as admin)
  const pageBg = theme === 'ocean'
    ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
    : 'bg-slate-50 text-slate-900';
  const headerCls = theme === 'ocean'
    ? 'fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/70 border-b border-white/10 backdrop-blur'
    : 'fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 border-b border-slate-200 backdrop-blur';
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

  const Kpi = ({ label, value, color }) => {
    const tone =
      theme === 'ocean'
        ? { slate:'bg-white/10 text-white', blue:'bg-blue-500 text-white', amber:'bg-amber-400 text-slate-900', violet:'bg-violet-500 text-white', emerald:'bg-emerald-500 text-white' }
        : { slate:'bg-slate-900 text-white', blue:'bg-blue-600 text-white', amber:'bg-amber-500 text-slate-900', violet:'bg-violet-600 text-white', emerald:'bg-emerald-600 text-white' };
    const cls = tone[color] || tone.slate;
    return (
      <div className={`rounded-xl px-4 py-4 shadow-sm ${cls}`}>
        <div className="text-xs opacity-90">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-full ${pageBg}`}>
      {/* Sticky transparent header (same as admin) */}
      <header className={headerCls}>
        <div className="w-full h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`truncate text-lg sm:text-xl font-semibold ${cardTitle}`}>Ticketing — Agent</h1>
            <p className={`text-xs sm:text-sm ${subTitle}`}>
              Logged in as <span className="font-medium">{user?.email}</span> · Assigned: {counts.all}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={toggleTheme} className={buttonGhost + ' px-3 py-2 text-sm'} title="Toggle theme">
              {theme === 'ocean' ? '☀️ Light' : '🌊 Ocean'}
            </button>
            <button onClick={() => mutate()} className={buttonPrimary + ' px-3 py-2 text-sm'}>
              Refresh
            </button>
            <button onClick={handleLogout} className={buttonGhost + ' px-3 py-2 text-sm'}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Canvas (offset for fixed header) */}
      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-6">
        {/* Search */}
        <div className={`${inputWrap} px-3 py-2`}>
          <input
            type="search"
            placeholder="Search my tickets…"
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

        {/* Tickets (Action edits STATUS only) */}
        <section className="space-y-3">
          <div>
            <h2 className={`text-lg font-semibold ${cardTitle}`}>My Assigned Tickets</h2>
            <p className={`text-sm ${subTitle}`}>
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
  role="agent"
  inlineAction
  agentEditable={false}                 // Action edits STATUS only
  surface={theme === 'ocean' ? 'dark' : 'light'}
  perPage={10}
  showImpact
  onStatusChange={onStatusChange}       // handles non-resolved statuses
  onRequestResolve={(ticketId) => {     // NEW: open modal first for "resolved"
    setResolvingTicketId(ticketId);
    setResolveOpen(true);
  }}
/>
          )}
        </section>
      </main>

      {/* Resolution details modal */}
      <ResolutionModal open={resolveOpen} onCancel={cancelResolution} onSubmit={submitResolution} />
    </div>
  );
}
