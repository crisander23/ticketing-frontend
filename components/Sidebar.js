'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCcw, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Ticket,
  PlusSquare,
  History, 
  Settings, // <--- New Icon
  Shield // <--- New Icon
} from 'lucide-react';

/* --- Helper: NavLink Component --- */
function NavLink({ href, icon: Icon, children, theme, isCollapsed }) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  const isDark = theme === 'dark';

  let linkClasses = `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors`;
  
  if (isActive) {
    linkClasses += isDark ? ' bg-white/10 text-white' : ' bg-slate-200 text-slate-900'; 
  } else {
    linkClasses += isDark ? ' text-white/80 hover:bg-white/10 hover:text-white' : ' text-slate-600 hover:bg-slate-100 hover:text-slate-900'; 
  }
  
  if (isCollapsed) linkClasses += ' justify-center';

  return (
    <a 
      href={href} 
      onClick={(e) => { e.preventDefault(); router.push(href); }}
      className={linkClasses}
      title={isCollapsed ? children : ''}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={isCollapsed ? 'hidden' : 'block'}>{children}</span>
    </a>
  );
}

/* --- Main Sidebar Component --- */
export default function Sidebar({
  isOpen, 
  onClose, 
  isDesktopCollapsed, 
  onToggleDesktopCollapse, 
  theme,
  setTheme,
  onRefresh,
  userType = 'admin'
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const dashboardHref = useMemo(() => {
    if (userType === 'superadmin') return '/superadmin/dashboard';
    if (userType === 'admin') return '/admin/dashboard';
    if (userType === 'agent') return '/agent/dashboard';
    if (userType === 'client') return '/client/dashboard'; 
    return '/';
  }, [userType]);

  const doLogout = () => {
    try { logout?.(); } catch {}
    try { localStorage.removeItem('ticketing_auth'); } catch {}
    window.location.href = '/login';
  };

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-900 text-white border-r border-white/10' : 'bg-white text-slate-900 border-r border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/80' : 'text-slate-600';
  const buttonGhost = `flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm ${isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10' : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'}`;
  const headerClass = isDark ? 'border-b border-white/10' : 'border-b border-slate-200';
  const footerClass = isDark ? 'border-t border-white/10' : 'border-t border-slate-200';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <div className={`fixed left-0 top-0 z-50 flex h-screen flex-col ${bgClass} transition-all duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isDesktopCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Header */}
        <div className={`flex h-16 shrink-0 items-center justify-between px-4 ${headerClass}`}>
          <h1 className={`text-xl font-semibold whitespace-nowrap overflow-hidden ${textMain} transition-opacity duration-200 ${isDesktopCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            DDCC HELPDESK
          </h1>
          <button onClick={onToggleDesktopCollapse} className={`hidden md:flex p-2 rounded-lg ${isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`} title={isDesktopCollapsed ? 'Expand' : 'Collapse'}>
            {isDesktopCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button onClick={onClose} className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} md:hidden`}>
            <X className={`h-5 w-5 ${textMain}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
          
          <NavLink href={dashboardHref} icon={LayoutDashboard} theme={theme} isCollapsed={isDesktopCollapsed}>
            Dashboard
          </NavLink>
          
          {/* --- SUPER ADMIN LINKS (NEW) --- */}
          {userType === 'superadmin' && (
            <>
              <NavLink href="/superadmin/tickets" icon={Ticket} theme={theme} isCollapsed={isDesktopCollapsed}>
                All Tickets
              </NavLink>
              <NavLink href="/superadmin/users" icon={Shield} theme={theme} isCollapsed={isDesktopCollapsed}>
                System Users
              </NavLink>
              <NavLink href="/superadmin/history" icon={History} theme={theme} isCollapsed={isDesktopCollapsed}>
                Global Logs
              </NavLink>
              <div className={`pt-2 pb-1 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}></div>
              <NavLink href="/superadmin/settings" icon={Settings} theme={theme} isCollapsed={isDesktopCollapsed}>
                System Settings
              </NavLink>
            </>
          )}

          {/* --- Admin Links --- */}
          {userType === 'admin' && (
            <>
              <NavLink href="/admin/tickets" icon={Ticket} theme={theme} isCollapsed={isDesktopCollapsed}>
                Tickets
              </NavLink>
              <NavLink href="/admin/users" icon={Users} theme={theme} isCollapsed={isDesktopCollapsed}>
                Users
              </NavLink>
              <NavLink href="/admin/history" icon={History} theme={theme} isCollapsed={isDesktopCollapsed}>
                History
              </NavLink>
            </>
          )}

          {/* --- Agent Links --- */}
          {userType === 'agent' && (
            <NavLink href="/agent/tickets" icon={Ticket} theme={theme} isCollapsed={isDesktopCollapsed}>
              My Tickets
            </NavLink>
          )}

          {/* --- Client Links --- */}
          {userType === 'client' && (
            <>
              <NavLink href="/client/tickets" icon={Ticket} theme={theme} isCollapsed={isDesktopCollapsed}>
                My Tickets
              </NavLink>
              <NavLink href="/create-ticket" icon={PlusSquare} theme={theme} isCollapsed={isDesktopCollapsed}>
                Create Ticket
              </NavLink>
            </>
          )}
          
          <div className="pt-4 space-y-2">
            <button onClick={onRefresh} className={buttonGhost} title={isDesktopCollapsed ? 'Refresh Data' : ''}>
              <RefreshCcw className="h-4 w-4 shrink-0" />
              <span className={isDesktopCollapsed ? 'hidden' : 'block'}>Refresh Data</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className={`p-4 ${footerClass} space-y-3 shrink-0`}>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={buttonGhost} title={isDesktopCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}>
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />} 
            <span className={isDesktopCollapsed ? 'hidden' : 'block'}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span> 
          </button>
          <div className={`text-center ${isDesktopCollapsed ? 'hidden' : 'block'}`}>
            <p className={`text-xs ${textSub} truncate`}>Logged in as</p>
            <p className={`text-sm font-medium ${textMain} truncate`}>{user?.email}</p>
          </div>
          <button onClick={doLogout} className={buttonGhost} title={isDesktopCollapsed ? 'Logout' : ''}>
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={isDesktopCollapsed ? 'hidden' : 'block'}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}