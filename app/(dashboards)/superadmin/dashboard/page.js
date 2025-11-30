'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RegisterAgentModal from '@/components/RegisterAgentModal'; 
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar'; 
import { Menu } from 'lucide-react';
import TicketCharts from '@/components/TicketCharts'; 

export default function SuperAdminDashboardPage() {
  const { user } = useAuthStore();

  // --- 1. THEME STATE ---
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ticketing_theme');
    if (savedTheme) setTheme(savedTheme);
    setIsThemeLoaded(true);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('ticketing_theme', newTheme);
  };

  // --- 2. UI STATE ---
  const [openReg, setOpenReg] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // --- 3. DATA FETCHING ---
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } =
    useSWR('/tickets', fetcher);
    
  const { data: users, mutate: mutateUsers } = useSWR('/admin/users', fetcher);

  const counts = useMemo(() => {
    const list = tickets || [];
    const by = (s) => list.filter((t) => (t.status || '').toLowerCase() === s).length;
    return {
      all: list.length,
      open: by('open'),
      in_progress: by('in_progress'),
      resolved: by('resolved'),
      closed: by('closed'),
      admins: (users || []).filter(u => u.user_type === 'admin').length
    };
  }, [tickets, users]);

  const refreshAll = useCallback(() => {
    mutateTickets();
    mutateUsers();
  }, [mutateTickets, mutateUsers]);


  // --- 4. STYLES ---
  const bgClass = theme === 'dark' 
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
      : 'bg-slate-50 text-slate-900';

  const cardTitle = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTitle = theme === 'dark' ? 'text-white/80' : 'text-slate-600';
  const buttonGhost = theme === 'dark'
      ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
      : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';

  const Kpi = ({ label, value, color }) => {
    const tone = {
        slate: theme === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-900 text-white',
        blue: theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white',
        amber: theme === 'dark' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-slate-900',
        violet: theme === 'dark' ? 'bg-violet-500 text-white' : 'bg-violet-600 text-white',
        emerald: theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white',
        red: theme === 'dark' ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white', 
      }[color] || '';
    return (
      <div className={`rounded-xl px-4 py-4 shadow-sm ${tone}`}>
        <div className="text-xs opacity-90">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      </div>
    );
  };

  if (!isThemeLoaded) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className={`min-h-screen w-full ${bgClass}`}>
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={handleThemeChange}
        onRefresh={refreshAll}
        userType="superadmin"
      />

      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>

        {/* Mobile Header */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden ${
          theme === 'dark' ? 'bg-slate-900/70 border-b border-white/10 backdrop-blur' : 'bg-white/90 border-b border-slate-200 backdrop-blur'
        }`}>
          <h1 className={`text-lg font-semibold ${cardTitle}`}>System Overview</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          <div className="hidden md:block">
             <h1 className={`text-3xl font-semibold ${cardTitle}`}>System Overview</h1>
             <p className={`text-sm ${subTitle}`}>Super Admin Control Panel</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi label="Total Tickets" value={counts.all} color="slate" />
            <Kpi label="Open" value={counts.open} color="blue" />
            <Kpi label="In Progress" value={counts.in_progress} color="amber" />
            <Kpi label="Resolved" value={counts.resolved} color="violet" />
            <Kpi label="Closed" value={counts.closed} color="emerald" />
            <Kpi label="Active Admins" value={counts.admins} color="red" />
          </div>

          {/* Charts */}
          <section>
            <h2 className={`text-xl font-semibold ${cardTitle} mb-3`}>Global Ticket Analytics</h2>
            {ticketsLoading ? (
              <div className={`rounded-xl p-6 text-center ${subTitle}`}>Loading charts...</div>
            ) : (
              <TicketCharts tickets={tickets || []} theme={theme} />
            )}
          </section>

        </main>
      </div>
    </div>
  );
}