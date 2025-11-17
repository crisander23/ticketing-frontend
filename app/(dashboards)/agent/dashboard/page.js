'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar'; 
import { Menu } from 'lucide-react';
import TicketCharts from '@/components/TicketCharts'; // <-- 1. Import charts
import Link from 'next/link'; // <-- 2. Import Link

export default function AgentDashboardPage() {
  const { user } = useAuthStore();
  const agentId = user?.user_id ?? null;

  /* THEME: 'dark' (gradient/dark) or 'light' */
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('nea_theme') || 'dark';
    setTheme(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('nea_theme', theme);
  }, [theme]);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop

  // Data
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } = useSWR(
    agentId ? `/tickets?agent_id=${agentId}` : null,
    fetcher
  );

  const counts = useMemo(() => {
    const list = tickets || [];
    const by = (s) => list.filter(t => (t.status || '').toLowerCase() === s).length;
    return { all: list.length, open: by('open'), in_progress: by('in_progress'), resolved: by('resolved'), closed: by('closed') };
  }, [tickets]);

  // --- 3. Added Memos for Priority Lists ---
  const newlyAssigned = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .filter(t => (t.status || 'open').toLowerCase() === 'open')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Newest first
      .slice(0, 5); // Get top 5
  }, [tickets]);

  const highPriority = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .filter(t => 
        ['critical', 'high'].includes((t.impact || '').toLowerCase()) &&
        !['resolved', 'closed'].includes((t.status || '').toLowerCase())
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Oldest first
      .slice(0, 5); // Get top 5
  }, [tickets]);
  // --- End Memos ---


  // Mutations
  const refreshAll = useCallback(() => {
    mutateTickets();
  }, [mutateTickets]);

  /* KPI card */
  const Kpi = ({ label, value, color }) => {
    const tone =
      {
        slate: theme === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-900 text-white',
        blue: theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white',
        amber: theme === 'dark' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-slate-900',
        violet: theme === 'dark' ? 'bg-violet-500 text-white' : 'bg-violet-600 text-white',
        emerald: theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white',
      }[color] || '';
    return (
      <div className={`rounded-xl px-4 py-4 shadow-sm ${tone}`}>
        <div className="text-xs opacity-90">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
  };

  /* --- Theme Styles --- */
  const bgClass =
    theme === 'dark'
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
      : 'bg-slate-50 text-slate-900';

  const cardTitle = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTitle = theme === 'dark' ? 'text-white/80' : 'text-slate-600';
  const cardBg = theme === 'dark'
    ? 'rounded-xl border border-white/15 bg-white/5'
    : 'rounded-xl border border-slate-200 bg-white';

  const buttonGhost =
    theme === 'dark'
      ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
      : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
  /* --- End Theme Styles --- */

  return (
    <div className={`min-h-screen w-full ${bgClass}`}>
      
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
          <h1 className={`text-lg font-semibold ${cardTitle}`}>Agent Dashboard</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* --- Main Content --- */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${cardTitle}`}>Agent Dashboard</h1>
            <p className={`text-sm ${subTitle}`}>Welcome, {user?.first_name || user?.email}. Here is your ticket summary.</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
            <Kpi label="Total Assigned" value={counts.all} color="slate" />
            <Kpi label="Open" value={counts.open} color="blue" />
            <Kpi label="In Progress" value={counts.in_progress} color="amber" />
            <Kpi label="Resolved" value={counts.resolved} color="violet" />
            <Kpi label="Closed" value={counts.closed} color="emerald" />
          </div>
          
          {/* --- 4. Added Priority Lists --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MiniTicketList 
              title="Newly Assigned" 
              tickets={newlyAssigned} 
              theme={theme}
              emptyText="No new tickets. Great job!"
            />
            <MiniTicketList 
              title="High Priority Active" 
              tickets={highPriority} 
              theme={theme}
              emptyText="No high-priority tickets."
            />
          </div>

          {/* --- 5. Added Charts Section --- */}
          <section>
            <h2 className={`text-xl font-semibold ${cardTitle} mb-3`}>My Workload Analytics</h2>
            {ticketsLoading ? (
              <div className={`rounded-xl p-6 text-center ${subTitle} ${cardBg}`}>
                Loading charts...
              </div>
            ) : ticketsError ? (
              <div
                className={`${
                  theme === 'dark'
                    ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100'
                    : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700'
                } px-4 py-3 text-sm`}
              >
                Failed to load chart data.
              </div>
            ) : (
              <TicketCharts 
                tickets={tickets || []} 
                theme={theme}
                // Only show charts relevant to an agent
                show={{
                  status: true,
                  impact: true,
                  category: true,
                  agent: false, // Hide admin-only charts
                  department: false, // Hide admin-only charts
                  time: true
                }}
              />
            )}
          </section>

        </main>
      
      </div> {/* --- End of content wrapper --- */}
    </div>
  );
}

// --- 6. Added MiniTicketList Sub-component ---
function MiniTicketList({ title, tickets = [], theme, emptyText }) {
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'rounded-xl border border-white/15 bg-white/5' : 'rounded-xl border border-slate-200 bg-white';
  const cardTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMain = isDark ? 'text-white/90' : 'text-slate-800';
  const textSub = isDark ? 'text-white/70' : 'text-slate-500';
  const itemHover = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50';
  const divider = isDark ? 'divide-white/10' : 'divide-slate-200';

  // Get impact color
  const getImpactColor = (impact) => {
    switch ((impact || '').toLowerCase()) {
      case 'critical': return 'bg-rose-500';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return isDark ? 'bg-slate-600' : 'bg-slate-400';
    }
  };

  return (
    <div className={`${cardBg}`}>
      <h3 className={`text-lg font-semibold ${cardTitle} p-4 border-b ${divider}`}>
        {title}
      </h3>
      {tickets.length === 0 ? (
        <p className={`p-4 text-sm ${textSub}`}>{emptyText}</p>
      ) : (
        <ul className={`divide-y ${divider}`}>
          {tickets.map(t => (
            <li key={t.ticket_id}>
              <Link href={`/tickets/${t.ticket_id}`}>
                <div className={`flex items-center gap-3 p-3 transition-colors ${itemHover}`}>
                  <span 
                    title={t.impact}
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${getImpactColor(t.impact)}`}
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${textMain} truncate`}>
                      #{t.ticket_id} - {t.title}
                    </p>
                    <p className={`text-xs ${textSub} truncate`}>
                      {t.category}
                    </p>
                  </div>
                  <span className={`text-xs ${textSub} ml-auto shrink-0`}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}