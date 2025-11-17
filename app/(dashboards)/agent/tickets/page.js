'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketTable from '@/components/TicketTable';
import ResolutionModal from '@/components/ResolutionModal';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function AgentTicketsPage() {
  const { user } = useAuthStore();
  const agentId = user?.user_id ?? null;

  // Theme
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nea_theme') : null;
    const t = saved || 'dark';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  // UI
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop

  // Data
  const { data: tickets, error, isLoading, mutate } = useSWR(
    agentId ? `/tickets?agent_id=${agentId}` : null,
    fetcher
  );

  const counts = useMemo(() => {
    const list = tickets || [];
    return { all: list.length };
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

  // Mutations
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

  const refreshAll = useCallback(() => {
    mutate();
  }, [mutate]);

  // Theming tokens
  const pageBg = theme === 'dark'
    ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
    : 'bg-slate-50 text-slate-900';
  const cardTitle = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTitle  = theme === 'dark' ? 'text-white/80' : 'text-slate-600';
  const inputWrap = theme === 'dark'
    ? 'rounded-xl bg-white/10 border border-white/15'
    : 'rounded-xl bg-white border border-slate-300';
  const inputField = theme === 'dark'
    ? 'bg-transparent text-white placeholder-white/60'
    : 'bg-transparent text-slate-900 placeholder-slate-400';
  const selectField = theme === 'dark'
    ? 'rounded-md border border-white/15 bg-transparent text-white'
    : 'rounded-md border border-slate-300 bg-white text-slate-900';
  const buttonGhost = theme === 'dark'
    ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
    : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';

  return (
    <div className={`min-h-screen w-full ${pageBg}`}>
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={setTheme}
        onRefresh={refreshAll}
        userType="agent"
      />

      {/* --- Content Wrapper --- */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>

        {/* --- Mobile-only Top Bar --- */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden ${
          theme === 'dark'
            ? 'bg-slate-900/70 border-b border-white/10 backdrop-blur'
            : 'bg-white/90 border-b border-slate-200 backdrop-blur'
        }`}>
          <h1 className={`text-lg font-semibold ${cardTitle}`}>My Tickets</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Canvas */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${cardTitle}`}>My Assigned Tickets</h1>
            <p className={`text-sm ${subTitle}`}>View, search, and manage all tickets assigned to you.</p>
          </div>

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

          {/* Tickets */}
          <section className="space-y-3">
            <div>
              <h2 className={`text-lg font-semibold ${cardTitle}`}>My Assigned Tickets</h2>
              <p className={`text-sm ${subTitle}`}>
                {isLoading ? 'Loading…' : error ? 'Failed to load tickets' : `${filteredTickets.length} of ${counts.all} shown`}
              </p>
            </div>

            {error ? (
              <div className={`${theme === 'dark'
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
            agentEditable={false} // Action edits STATUS only
            surface={theme === 'dark' ? 'dark' : 'light'}
            perPage={10}
            showImpact
            onStatusChange={onStatusChange} // handles non-resolved statuses
            onRequestResolve={(ticketId) => { // NEW: open modal first for "resolved"
              setResolvingTicketId(ticketId);
              setResolveOpen(true);
            }}
          />
            )}
          </section>
        </main>
      </div>

      {/* Resolution details modal */}
      <ResolutionModal 
        open={resolveOpen} 
        onCancel={cancelResolution} 
        onSubmit={submitResolution}
        theme={theme} // Pass the theme to the modal
      />
    </div>
  );
}