'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Menu, Plus, Trash2, Save } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function SuperAdminSettingsPage() {
  const { user } = useAuthStore();
  
  // Theme State
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('ticketing_theme');
    if (saved) setTheme(saved);
    setIsThemeLoaded(true);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('ticketing_theme', newTheme);
  };

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'impacts'

  // Data Fetching (Using the endpoint we created earlier)
  const { data: options, mutate, isLoading } = useSWR('/tickets/options', fetcher);

  // Form State for Adding
  const [newItem, setNewItem] = useState('');
  const [busy, setBusy] = useState(false);

  // --- Handlers (Placeholder for API logic) ---
  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    setBusy(true);
    try {
        // NOTE: You will need to create this POST endpoint in your backend later
        // await apiFetch('/admin/config/add', { 
        //   method: 'POST', 
        //   body: { type: activeTab, value: newItem } 
        // });
        alert(`Simulated: Added "${newItem}" to ${activeTab}. (Backend implementation needed)`);
        setNewItem('');
        mutate(); // Refresh list
    } catch (e) {
        console.error(e);
        alert('Failed to add item');
    } finally {
        setBusy(false);
    }
  };

  // Styles
  const bgClass = theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white' : 'bg-slate-50 text-slate-900';
  const cardBg = theme === 'dark' ? 'bg-white/10 border border-white/10' : 'bg-white border border-slate-200';
  const inputClass = theme === 'dark' ? 'bg-white/5 border-white/20 text-white' : 'bg-white border-slate-300 text-slate-900';

  if (!isThemeLoaded) return <div className="min-h-screen bg-slate-900" />;

  const currentList = activeTab === 'categories' ? (options?.categories || []) : (options?.impacts || []);

  return (
    <div className={`min-h-screen w-full ${bgClass}`}>
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={handleThemeChange}
        userType="superadmin"
      />

      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden ${theme === 'dark' ? 'bg-slate-900/70 backdrop-blur' : 'bg-white/90 backdrop-blur'}`}>
           <span className="font-bold">System Settings</span>
           <button onClick={() => setSidebarOpen(true)}><Menu/></button>
        </header>

        <main className="w-full px-4 sm:px-6 pt-8 pb-8 space-y-6">
          <div className="hidden md:block">
            <h1 className="text-3xl font-semibold">System Configuration</h1>
            <p className="opacity-80 text-sm">Manage ticket dropdown options and system variables.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            
            {/* Settings Navigation */}
            <div className={`md:col-span-1 rounded-xl p-4 h-fit ${cardBg}`}>
                <div className="space-y-2">
                    <button 
                        onClick={() => setActiveTab('categories')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}
                    >
                        Ticket Categories
                    </button>
                    <button 
                        onClick={() => setActiveTab('impacts')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'impacts' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}
                    >
                        Impact Levels
                    </button>
                </div>
            </div>

            {/* Settings Content */}
            <div className={`md:col-span-3 rounded-xl p-6 ${cardBg}`}>
                <h2 className="text-xl font-bold mb-4 capitalize">{activeTab} Management</h2>
                
                {/* Add New Item */}
                <div className="flex gap-2 mb-6">
                    <input 
                        className={`flex-1 rounded-lg px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                        placeholder={`Add new ${activeTab.slice(0, -1)}...`}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                    />
                    <button 
                        onClick={handleAddItem}
                        disabled={busy}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                        {busy ? <Save size={18} className="animate-spin" /> : <Plus size={18} />}
                        Add
                    </button>
                </div>

                {/* List Items */}
                {isLoading ? (
                    <div className="opacity-60">Loading options...</div>
                ) : (
                    <div className="space-y-2">
                        {currentList.length === 0 && <div className="opacity-50 italic">No items found.</div>}
                        {currentList.map((item, idx) => (
                            <div key={item.id || idx} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                <span className="font-medium">{item.name || item.label}</span>
                                <div className="flex gap-2">
                                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">Active</span>
                                    {/* Delete/Edit buttons would go here */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}