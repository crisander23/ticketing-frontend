'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TicketTable from '@/components/TicketTable';
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function ClientTicketsPage() {
  const { user } = useAuthStore();
  const customerId = user?.user_id ?? null;

  // --- 1. THEME STATE WITH MEMORY (Synchronized) ---
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false); // Prevents flash

  useEffect(() => {
    // Use 'ticketing_theme' to match Admin/Agent pages
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

  // --- 2. DATA FETCHING ---
  const { data: tickets, error, isLoading, mutate } = useSWR(
    customerId ? `/tickets/my?customer_id=${customerId}` : null,
    fetcher
  );
  
  // --- 3. UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|open|in_progress|resolved|closed

  // --- 4. DATA PROCESSING ---
  const counts = useMemo(() => {
    return { all: (tickets || []).length };
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
  
  const refreshAll = useCallback(() => {
    mutate();
  }, [mutate]);

  // --- 5. THEME STYLES ---
  const pageBg =
    theme === 'dark'
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
      : 'bg-slate-50 text-slate-900';

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSub  = theme === 'dark' ? 'text-white/80' : 'text-slate-600';
  
  const buttonGhost =
    theme === 'dark'
      ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
      : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';

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
      ? 'rounded-md border border-white/20 bg-white/10 text-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
      : 'rounded-md border border-slate-300 bg-white text-slate-800 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';

  // Prevent rendering until theme is loaded
  if (!isThemeLoaded) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className={`min-h-screen w-full ${pageBg}`}>
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={handleThemeChange} // <-- Connected to localStorage
        onRefresh={refreshAll}
        userType="client"
      />

      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>

        {/* --- Mobile-only Top Bar --- */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden ${
          theme === 'dark'
            ? 'bg-slate-900/70 border-b border-white/10 backdrop-blur'
            : 'bg-white/90 border-b border-slate-200 backdrop-blur'
        }`}>
          <h1 className={`text-lg font-semibold ${textMain}`}>My Tickets</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${textMain}`}>My Tickets</h1>
            <p className={`text-sm ${textSub}`}>Here is a list of all tickets you have submitted.</p>
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

          {/* Status filter (dropdown above KPIs) */}
          <div className="flex items-center gap-2">
            <label className={textSub + ' text-sm'}>Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectField}
            >
              <option className="text-black" value="all">All</option>
              <option className="text-black" value="open">Open</option>
              <option className="text-black" value="in_progress">In Progress</option>
              <option className="text-black" value="resolved">Resolved</option>
              <option className="text-black" value="closed">Closed</option>
            </select>
          </div>

          {/* Tickets Table */}
          <section className="space-y-3">
            <div>
              <h2 className={`text-lg font-semibold ${textMain}`}>My Tickets</h2>
              <p className={`${textSub} text-sm`}>
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
                role="client"
                inlineAction={false}  // Client can't edit
                showImpact={true}     // Ensure the Impact is passed
                perPage={10}
                surface={theme === 'dark' ? 'dark' : 'light'}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}