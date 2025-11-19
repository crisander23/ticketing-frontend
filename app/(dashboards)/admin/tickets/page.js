'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketTable from '@/components/TicketTable';
import RegisterAgentModal from '@/components/RegisterAgentModal';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar'; 
import { Menu } from 'lucide-react';

export default function AdminTicketsPage() {
  const { user } = useAuthStore();

  // --- 1. THEME STATE WITH MEMORY (Synchronized) ---
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false); // Prevents flash

  useEffect(() => {
    // Use 'ticketing_theme' to match Dashboard & History
    const saved = localStorage.getItem('ticketing_theme'); 
    if (saved) {
      setTheme(saved);
    }
    setIsThemeLoaded(true);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('ticketing_theme', newTheme);
  };

  // --- 2. UI STATE ---
  const [openReg, setOpenReg] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|open|in_progress|resolved|closed
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop

  // --- 3. DATA FETCHING ---
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } =
    useSWR('/tickets', fetcher);
  // We still need to fetch users to populate the "assign agent" dropdown
  const { data: users, mutate: mutateUsers } =
    useSWR('/admin/users', fetcher);

  const agentOptions = useMemo(
    () =>
      (users || [])
        .filter(
          (u) =>
            (u.user_type || '').toLowerCase() === 'agent' &&
            (u.status || '').toLowerCase() === 'active'
        )
        .map((u) => ({
          id: u.user_id,
          label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [users]
  );

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
    if (statusFilter !== 'all')
      list = list.filter((t) => (t.status || '').toLowerCase() === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) =>
        [t.title, t.description, t.category, t.status, t.ticket_id, t.customer_id, t.agent_id, t.impact]
          .map((v) => (v ?? '').toString().toLowerCase())
          .some((s) => s.includes(q))
      );
    }
    return list;
  }, [tickets, statusFilter, query]);


  /* --- 4. THEME STYLES --- */
  const bgClass =
    theme === 'dark' 
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
      : 'bg-slate-50 text-slate-900';

  const cardTitle = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTitle = theme === 'dark' ? 'text-white/80' : 'text-slate-600';

  const inputWrap =
    theme === 'dark' 
      ? 'rounded-xl bg-white/10 border border-white/15'
      : 'rounded-xl bg-white border border-slate-300';

  const inputField =
    theme === 'dark'
      ? 'bg-transparent text-white placeholder-white/60'
      : 'bg-transparent text-slate-900 placeholder-slate-400';

  const selectField =
    theme === 'dark'
      ? 'rounded-md border border-white/15 bg-transparent text-white'
      : 'rounded-md border border-slate-300 bg-white text-slate-900';

  const buttonGhost =
    theme === 'dark'
      ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
      : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';

  // Prevent rendering until theme is loaded
  if (!isThemeLoaded) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className={`min-h-screen w-full ${bgClass}`}>
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={handleThemeChange} // <-- Connected to localStorage
        onRefresh={refreshAll}
        userType="admin"
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
          <h1 className={`text-lg font-semibold ${cardTitle}`}>All Tickets</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* --- Main Content --- */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${cardTitle}`}>All Tickets</h1>
            <p className={`text-sm ${subTitle}`}>View, search, and manage all tickets</p>
          </div>

          {/* Search */}
          <div className={`${inputWrap} px-3 py-2`}>
            <input
              type="search"
              placeholder="Search tickets..."
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
              <option className="text-black" value="all">
                All
              </option>
              <option className="text-black" value="open">
                Open
              </option>
              <option className="text-black" value="in_progress">
                In Progress
              </option>
              <option className="text-black" value="resolved">
                Resolved
              </option>
              <option className="text-black" value="closed">
                Closed
              </option>
            </select>
          </div>

          {/* Tickets Table */}
          <section className="space-y-3">
            <div>
              <h2 className={`text-lg font-semibold ${cardTitle}`}>Tickets</h2>
              <p className={`text-sm ${subTitle}`}>
                {ticketsLoading ? 'Loading…' : `${filteredTickets.length} of ${(tickets || []).length} shown`}
              </p>
            </div>

            {ticketsError ? (
              <div
                className={`${
                  theme === 'dark'
                    ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100'
                    : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700'
                } px-4 py-3 text-sm`}
              >
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
                surface={theme === 'dark' ? 'dark' : 'light'} // Pass current theme
                perPage={10}
                showImpact
              />
            )}
          </section>
        </main>
      
      </div> {/* --- End of content wrapper --- */}

      {/* Register Agent modal */}
      <RegisterAgentModal
          open={openReg}
          onClose={() => setOpenReg(false)}
          onSuccess={() => mutateUsers()}
          theme={theme}
        />
    </div>
  );
}