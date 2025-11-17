'use client';

import useSWR from 'swr';
// --- Restored Imports ---
import { useCallback, useEffect, useMemo, useState } from 'react';
// import TicketTable from '@/components/TicketTable'; // No longer needed on this page
// import UserTable from '@/components/UserTable'; // No longer needed on this page
import RegisterAgentModal from '@/components/RegisterAgentModal';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
// --- End Restored Imports ---
import Sidebar from '@/components/Sidebar'; 
import { Menu } from 'lucide-react';
import TicketCharts from '@/components/TicketCharts'; // <-- 1. Import the new chart component

export default function AdminDashboardPage() {
  // --- Restored State and Hooks ---
  const { user } = useAuthStore();

  /* THEME: 'dark' (gradient/dark) or 'light' */
  const [theme, setTheme] = useState('dark'); // <-- Fixed
  useEffect(() => {
    const saved = localStorage.getItem('nea_theme') || 'dark'; // <-- Fixed
    setTheme(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('nea_theme', theme);
  }, [theme]);

  // UI state
  const [openReg, setOpenReg] = useState(false);
  // const [query, setQuery] = useState(''); // No longer needed on this page
  // const [statusFilter, setStatusFilter] = useState('all'); // No longer needed on this page
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop

  // Data
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } =
    useSWR('/tickets', fetcher);
  // --- Restored Data Fetching ---
  const { data: users, error: usersError, isLoading: usersLoading, mutate: mutateUsers } =
    useSWR('/admin/users', fetcher);
  // --- End Restored Data Fetching ---

  // --- Restored Memos and Callbacks ---
  // const agentOptions = useMemo( ... ); // No longer needed on this page

  const counts = useMemo(() => {
    const list = tickets || [];
    const by = (s) => list.filter((t) => (t.status || '').toLowerCase() === s).length;
    return {
      all: list.length,
      open: by('open'),
      in_progress: by('in_progress'),
      resolved: by('resolved'),
      closed: by('closed'),
    };
  }, [tickets]);

  // Mutations
  // const onAssign = useCallback( ... ); // No longer needed on this page
  // const onStatusChange = useCallback( ... ); // No longer needed on this page
  // --- End Restored Memos and Callbacks ---

  const refreshAll = useCallback(() => {
    mutateTickets();
    mutateUsers();
  }, [mutateTickets, mutateUsers]);

  // Filters
  // const filteredTickets = useMemo( ... ); // No longer needed on this page

  /* KPI card */
  const Kpi = ({ label, value, color }) => {
    // --- Restored KPI Logic ---
    const tone =
      {
        slate: theme === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-900 text-white', // <-- Fixed
        blue: theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white', // <-- Fixed
        amber: theme === 'dark' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-slate-900', // <-- Fixed
        violet: theme === 'dark' ? 'bg-violet-500 text-white' : 'bg-violet-600 text-white', // <-- Fixed
        emerald: theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white', // <-- Fixed
      }[color] || '';
    return (
      <div className={`rounded-xl px-4 py-4 shadow-sm ${tone}`}>
        <div className="text-xs opacity-90">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
    // --- End Restored KPI Logic ---
  };

  // --- Restored Theme Styles ---
  const bgClass =
    theme === 'dark' // <-- Fixed
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
      : 'bg-slate-50 text-slate-900';

  const cardTitle = theme === 'dark' ? 'text-white' : 'text-slate-900'; // <-- Fixed
  const subTitle = theme === 'dark' ? 'text-white/80' : 'text-slate-600'; // <-- Fixed

  // const inputWrap = ... // No longer needed on this page
  // const inputField = ... // No longer needed on this page
  // const selectField = ... // No longer needed on this page

  const buttonGhost =
    theme === 'dark' // <-- Fixed
      ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
      : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
  // --- End Restored Theme Styles ---

  return (
    <div className={`min-h-screen w-full ${bgClass}`}>
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={setTheme}
        // onRegisterAgent={() => setOpenReg(true)} // <-- Removed this
        onRefresh={refreshAll}
        userType="admin"
      />

      {/* --- 1. NEW CONTENT WRAPPER --- */}
      {/* This div wraps both the mobile header and main content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>

        {/* --- Mobile-only Top Bar --- */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden ${
          theme === 'dark' // <-- Fixed
            ? 'bg-slate-900/70 border-b border-white/10 backdrop-blur'
            : 'bg-white/90 border-b border-slate-200 backdrop-blur'
        }`}>
          <h1 className={`text-lg font-semibold ${cardTitle}`}>Admin Dashboard</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* --- 2. Main content no longer has dynamic padding --- */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${cardTitle}`}>Admin Dashboard</h1>
            <p className={`text-sm ${subTitle}`}>Welcome, {user?.first_name || user?.email}</p>
          </div>

          {/* Search (Removed) */}
          {/* Status filter (Removed) */}

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
            <Kpi label="Total" value={counts.all} color="slate" />
            <Kpi label="Open" value={counts.open} color="blue" />
            <Kpi label="In Progress" value={counts.in_progress} color="amber" />
            <Kpi label="Resolved" value={counts.resolved} color="violet" />
            <Kpi label="Closed" value={counts.closed} color="emerald" />
          </div>

          {/* --- 2. ADDED THE NEW CHART COMPONENT --- */}
          <section>
            <h2 className={`text-xl font-semibold ${cardTitle} mb-3`}>Ticket Analytics</h2>
            {ticketsLoading ? (
              <div className={`rounded-xl p-6 text-center ${subTitle} ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
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
              <TicketCharts tickets={tickets || []} theme={theme} />
            )}
          </section>

          {/* Tickets (Removed) */}
          {/* Users (Removed) */}

        </main>
      
      </div> {/* --- End of new content wrapper --- */}

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