'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import Link from 'next/link'; // <-- 1. Import Link
import TicketCharts from '@/components/TicketCharts'; // <-- 2. Import TicketCharts

export default function ClientDashboardPage() {
  const { user } = useAuthStore();
  const customerId = user?.user_id ?? null;

  /* ============ Theme ============ */
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nea_theme') : null;
    const t = saved || 'dark';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('nea_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* ============ Data ============ */
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading, mutate } = useSWR(
    customerId ? `/tickets/my?customer_id=${customerId}` : null,
    fetcher
  );
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop

  /* ============ Derived ============ */
  const counts = useMemo(() => {
    const list = tickets || [];
    const by = s => list.filter(t => (t.status || '').toLowerCase() === s).length;
    return { all: list.length, open: by('open'), in_progress: by('in_progress'), resolved: by('resolved'), closed: by('closed') };
  }, [tickets]);
  
  // --- 3. Added Memos for Priority Lists ---
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
  
  const recentlyClosed = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .filter(t => ['resolved', 'closed'].includes((t.status || '').toLowerCase()))
      .sort((a, b) => new Date(b.resolved_at || b.updated_at) - new Date(a.resolved_at || a.updated_at)) // Most recent first
      .slice(0, 5); // Get top 5
  }, [tickets]);
  // --- End Memos ---
  
  const refreshAll = useCallback(() => {
    mutate();
  }, [mutate]);

  /* ============ UI bits (shared look) ============ */
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

  // --- 4. Added cardBg style ---
  const cardBg = theme === 'dark'
    ? 'rounded-xl border border-white/15 bg-white/5'
    : 'rounded-xl border border-slate-200 bg-white';
  const cardTitle = theme === 'dark' ? 'text-white' : 'text-slate-900';
  /* --- End Added style --- */


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
          <h1 className={`text-lg font-semibold ${textMain}`}>Client Dashboard</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${textMain}`}>Client Dashboard</h1>
            <p className={`text-sm ${textSub}`}>Welcome, {user?.first_name || user?.email}.</p>
          </div>
          
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
            <Kpi label="Total" value={counts.all} color="slate" />
            <Kpi label="Open" value={counts.open} color="blue" />
            <Kpi label="In Progress" value={counts.in_progress} color="amber" />
            <Kpi label="Resolved" value={counts.resolved} color="violet" />
            <Kpi label="Closed" value={counts.closed} color="emerald" />
          </div>

          {/* --- 5. Added Priority Lists --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MiniTicketList 
              title="My High Priority Tickets" 
              tickets={highPriority} 
              theme={theme}
              emptyText="No high-priority open tickets."
            />
            <MiniTicketList 
              title="My Recently Closed Tickets" 
              tickets={recentlyClosed} 
              theme={theme}
              emptyText="No recently closed tickets."
            />
          </div>

          {/* --- 6. Added Charts Section --- */}
          <section>
            <h2 className={`text-xl font-semibold ${cardTitle} mb-3`}>My Ticket Analytics</h2>
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
                // Only show charts relevant to a client
                show={{
                  status: true,
                  impact: true,
                  category: true,
                  time: true,
                  agent: false, // Hide admin-only
                  department: false // Hide admin-only
                }}
              />
            )}
          </section>

        </main>
      </div>
    </div>
  );
}

// --- 7. Added MiniTicketList Sub-component ---
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
                    {/* Show resolved date if available, otherwise created date */}
                    {new Date(t.resolved_at || t.created_at).toLocaleDateString()}
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