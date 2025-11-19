'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import Sidebar from '@/components/Sidebar'; 
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminHistoryPage() {
  const router = useRouter();

  // --- 1. THEME STATE WITH MEMORY (Synchronized) ---
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false); // Prevents flash

  useEffect(() => {
    // Use 'ticketing_theme' to match the Dashboard page
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  
  // --- 3. DATA FETCHING ---
  const { data: tickets, error, isLoading, mutate } = useSWR('/tickets', fetcher);

  const refreshAll = useCallback(() => {
    mutate();
  }, [mutate]);

  // --- 4. FILTER & SORT LOGIC ---
  const processedTickets = useMemo(() => {
    let list = tickets || [];
    
    // Filter by search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) =>
        [t.title, t.status, String(t.ticket_id)]
          .map((v) => (v ?? '').toString().toLowerCase())
          .some((s) => s.includes(q))
      );
    }

    // Sort by Updated At (Most recent first)
    return list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [tickets, query]);

  // --- 5. STYLES BASED ON THEME ---
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white' : 'bg-slate-50 text-slate-900';
  const cardTitle = isDark ? 'text-white' : 'text-slate-900';
  const subTitle = isDark ? 'text-white/80' : 'text-slate-600';
  const buttonGhost = isDark ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10' : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
  const inputWrap = isDark ? 'rounded-xl bg-white/10 border border-white/15' : 'rounded-xl bg-white border border-slate-300';
  const inputField = isDark ? 'bg-transparent text-white placeholder-white/60' : 'bg-transparent text-slate-900 placeholder-slate-400';

  // Table Styles
  const tableWrap = `overflow-hidden rounded-xl border ${isDark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'}`;
  const headClass = isDark ? 'bg-white/10 text-white/90' : 'bg-slate-50 text-slate-700';
  const thClass = 'px-6 py-4 text-left text-xs uppercase font-semibold tracking-wider';
  const rowClass = isDark ? 'hover:bg-white/10 cursor-pointer border-b border-white/5' : 'hover:bg-slate-50 cursor-pointer border-b border-slate-100';
  const tdClass = `px-6 py-4 text-sm ${isDark ? 'text-white/90' : 'text-slate-800'}`;

  // Prevent rendering until theme is loaded to avoid flickering
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

      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>

        {/* Mobile Header */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden ${
          isDark ? 'bg-slate-900/70 border-b border-white/10 backdrop-blur' : 'bg-white/90 border-b border-slate-200 backdrop-blur'
        }`}>
          <h1 className={`text-lg font-semibold ${cardTitle}`}>Ticket History</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          <div className="hidden md:block">
            <h1 className={`text-3xl font-semibold ${cardTitle}`}>Recently Updated Tickets</h1>
            <p className={`text-sm ${subTitle}`}>A simplified history view showing the latest activity per ticket.</p>
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

          {/* Table Section */}
          <section>
             {isLoading ? (
                <div className={`p-8 text-center opacity-70 ${subTitle}`}>Loading tickets...</div>
             ) : error ? (
                <div className="p-8 text-center text-red-400">Failed to load tickets.</div>
             ) : (
                <div className={tableWrap}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] table-auto text-left">
                      <thead className={headClass}>
                        <tr>
                          <th className={thClass}>Ticket Title</th>
                          <th className={thClass}>Latest Action</th>
                          <th className={thClass}>Date of Latest Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedTickets.map((t) => (
                          <tr 
                            key={t.ticket_id} 
                            className={rowClass}
                            onClick={() => router.push(`/tickets/${t.ticket_id}`)}
                          >
                            {/* Column 1: Ticket Title */}
                            <td className={tdClass}>
                              <div className="flex flex-col">
                                <span className="font-medium text-base">{t.title}</span>
                                <span className={`text-xs ${subTitle} uppercase tracking-wider`}>#{t.ticket_id}</span>
                              </div>
                            </td>

                            {/* Column 2: Latest Action (Status Badge) */}
                            <td className={tdClass}>
                               <StatusBadge status={t.status} />
                            </td>

                            {/* Column 3: Date */}
                            <td className={`${tdClass} whitespace-nowrap opacity-80`}>
                              {new Date(t.updated_at || t.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}

                        {processedTickets.length === 0 && (
                          <tr>
                            <td colSpan="3" className="p-8 text-center opacity-60">
                              No tickets found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
             )}
          </section>

        </main>
      </div>
    </div>
  );
}

// --- Helper: Status Badge Component ---
function StatusBadge({ status }) {
  const s = (status || 'open').toLowerCase();
  let colorClass = 'bg-slate-200 text-slate-900';
  let label = status;

  if (s === 'open') {
    colorClass = 'bg-blue-600 text-white';
    label = 'Open';
  } else if (s === 'in_progress') {
    colorClass = 'bg-amber-500 text-slate-900';
    label = 'In Progress';
  } else if (s === 'resolved') {
    colorClass = 'bg-violet-600 text-white';
    label = 'Resolved';
  } else if (s === 'closed') {
    colorClass = 'bg-emerald-600 text-white';
    label = 'Closed';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}