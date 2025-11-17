'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import UserTable from '@/components/UserTable';
import RegisterAgentModal from '@/components/RegisterAgentModal';
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar'; 
import { Menu, UserPlus } from 'lucide-react'; // <-- Import UserPlus

export default function AdminUsersPage() {
  const { user } = useAuthStore();

  /* THEME: 'dark' (gradient/dark) or 'light' */
  const [theme, setTheme] = useState('dark'); 
  useEffect(() => {
    const saved = localStorage.getItem('nea_theme') || 'dark'; 
    setTheme(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('nea_theme', theme);
  }, [theme]);

  // UI state
  const [openReg, setOpenReg] = useState(false);
  const [query, setQuery] = useState('');
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // For desktop

  // Data
  const { data: users, error: usersError, isLoading: usersLoading, mutate: mutateUsers } =
    useSWR('/admin/users', fetcher);

  // Mutations
  const refreshAll = useCallback(() => {
    mutateUsers();
  }, [mutateUsers]);

  // Filters
  const filteredUsers = useMemo(() => {
    let list = users || [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((u) =>
        [u.first_name, u.last_name, u.email, u.user_type, u.status, u.user_id]
          .map((v) => (v ?? '').toString().toLowerCase())
          .some((s) => s.includes(q))
      );
    }
    return list;
  }, [users, query]);

  /* --- Theme Styles --- */
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

  const buttonGhost =
    theme === 'dark' 
      ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10'
      : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
  
  // This style is correct, but the button below was just using the wrong variable
  const buttonPrimary =
    theme === 'dark' 
      ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100'
      : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800';
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
        // onRegisterAgent={() => setOpenReg(true)} // <-- Removed this
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
          <h1 className={`text-lg font-semibold ${cardTitle}`}>User Management</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* --- Main Content --- */}
        <main className="w-full px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          {/* Page Title (Desktop-only) */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl font-semibold ${cardTitle}`}>User Management</h1>
              <p className={`text-sm ${subTitle}`}>Register, view, and manage all users</p>
            </div>
            {/* --- FIXED: Added px-3 py-2 text-sm for padding --- */}
            <button 
              onClick={() => setOpenReg(true)} 
              className={`${buttonGhost} flex items-center gap-2 px-3 py-2 text-sm`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Register Agent</span>
            </button>
          </div>

          {/* Search */}
          <div className={`${inputWrap} px-3 py-2`}>
            <input
              type="search"
              placeholder="Search users by name, email, type, or status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputField}`}
            />
          </div>

          {/* Users Table */}
          <section className="space-y-3">
            <div>
              <h2 className={`text-lg font-semibold ${cardTitle}`}>All Users</h2>
              <p className={`text-sm ${subTitle}`}>
                {usersLoading ? 'Loading…' : `${filteredUsers.length} of ${(users || []).length} shown`}
              </p>
            </div>

            {usersError ? (
              <div
                className={`${
                  theme === 'dark' 
                    ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100'
                    : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700'
                } px-4 py-3 text-sm`}
              >
                Failed to load users.
              </div>
            ) : (
              <UserTable 
                rows={filteredUsers || []} 
                perPage={10} 
                surface={theme === 'dark' ? 'dark' : 'light'} 
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