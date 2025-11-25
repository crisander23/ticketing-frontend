'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiFetch } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function CreateTicketPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // --- 1. AUTH GUARD ---
  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  // --- 2. THEME STATE ---
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ticketing_theme');
    if (saved) setTheme(saved);
    setIsThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (isThemeLoaded) localStorage.setItem('ticketing_theme', theme);
  }, [theme, isThemeLoaded]);

  // --- 3. SIDEBAR STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const refreshAll = useCallback(() => {}, []); 

  // --- 4. DATA FETCHING (NEW) ---
  const [categories, setCategories] = useState([]);
  const [impacts, setImpacts] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch from the new API route we just created
        const data = await apiFetch('/tickets/options'); 
        if (data) {
          setCategories(data.categories || []);
          setImpacts(data.impacts || []);
        }
      } catch (err) {
        console.error('Failed to load ticket options:', err);
      }
    };
    if (user) fetchOptions(); // Only fetch if logged in
  }, [user]);

  // --- 5. FORM STATE ---
  const [form, setForm] = useState({
    title: '',
    category: '',
    impact: '',
    description: '',
    requested_by_date: '',
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  // Note: Ensure your Database string matches this exactly for the date field to show
  const isFeature = useMemo(() => form.category === 'New Feature Request', [form.category]);

  // Attachments (max 5)
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  
  const onFilesChange = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length > 5) {
      setFileError('You can upload up to 5 files only.');
      setFiles(list.slice(0, 5));
    } else {
      setFileError('');
      setFiles(list);
    }
  };

  // --- 6. SUBMISSION LOGIC ---
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: '', text: '' });
  const UPLOAD_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || '';

  const validate = () => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.category) return 'Category is required.';
    if (!form.impact) return 'Impact is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (isFeature && !form.requested_by_date) return 'Requested By Date is required for New Feature Request.';
    return '';
  };

  const create = useCallback(async () => {
    const err = validate();
    if (err) {
      setMsg({ kind: 'error', text: err });
      return;
    }

    setBusy(true);
    setMsg({ kind: 'info', text: 'Creating ticket…' });

    try {
      // STEP 1 — Create ticket
      const payload = {
        customer_id: user.user_id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        impact: form.impact,
        requested_by_date: isFeature ? (form.requested_by_date || null) : null,
      };

      const ticketRes = await apiFetch('/tickets', { method: 'POST', body: payload });
      const newId = ticketRes?.ticket_id || ticketRes?.id || ticketRes?.ticketId;
      if (!newId) throw new Error('Ticket created but no ticket ID returned.');

      // STEP 2 — Upload attachments
      if (files.length > 0) {
        setMsg({ kind: 'info', text: 'Uploading attachments…' });

        const fd = new FormData();
        fd.append('user_id', String(user.user_id));
        files.forEach(f => fd.append('attachments', f));

        const uploadUrl = UPLOAD_BASE
          ? `${UPLOAD_BASE.replace(/\/$/, '')}/tickets/${newId}/upload`
          : `/api/tickets/${newId}/upload`;

        const upload = await fetch(uploadUrl, { method: 'POST', body: fd });
        
        if (!upload.ok) {
          const j = await upload.json().catch(() => ({}));
          throw new Error(j?.message || 'Ticket created, but file upload failed.');
        }
      }

      setMsg({ kind: 'success', text: `Success! Ticket #${newId} created.` });
      setTimeout(() => router.replace('/client/dashboard'), 1000);
    } catch (e) {
      setMsg({ kind: 'error', text: e?.message || 'Failed to create ticket.' });
      setBusy(false);
    }
  }, [files, form, isFeature, router, user?.user_id, UPLOAD_BASE]);

  const goBack = () => router.back();

  // --- 7. STYLES ---
  if (!user || !isThemeLoaded) return null;

  const pageBg = theme === 'dark'
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white'
      : 'bg-slate-50 text-slate-900';

  const mobileHeaderCls = theme === 'dark'
      ? 'sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden bg-slate-900/70 border-b border-white/10 backdrop-blur'
      : 'sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden bg-white/90 border-b border-slate-200 backdrop-blur';

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSub  = theme === 'dark' ? 'text-white/80' : 'text-slate-600';

  const inputWrap = theme === 'dark'
    ? 'rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-blue-300'
    : 'rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-300';
    
  const selectWrap = inputWrap;
  const areaWrap   = inputWrap;

  const buttonGhost = theme === 'dark'
    ? 'rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm'
    : 'rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-sm';

  const buttonSolid = theme === 'dark'
    ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm'
    : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm';

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

        {/* Mobile Header */}
        <header className={mobileHeaderCls}>
          <h1 className={`truncate text-lg sm:text-xl font-semibold ${textMain}`}>Create Ticket</h1>
          <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 pt-4 md:pt-8 pb-10">

          <div className="hidden md:block mb-4">
            <h1 className={`text-3xl font-semibold ${textMain}`}>Create New Ticket</h1>
            <p className={`text-sm ${textSub}`}>
              Please provide as much detail as possible. Attach up to 5 screenshots or files if needed.
            </p>
          </div>

          {/* Message Banner */}
          {msg.text && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                msg.kind === 'error'
                  ? theme === 'dark' ? 'border border-red-400/30 bg-red-900/25 text-red-100' : 'border border-rose-200 bg-rose-50 text-rose-700'
                  : msg.kind === 'success'
                  ? theme === 'dark' ? 'border border-emerald-400/30 bg-emerald-900/25 text-emerald-100' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : theme === 'dark' ? 'border border-white/20 bg-white/10 text-white' : 'border border-slate-200 bg-white text-slate-900'
              }`}>
              {msg.text}
            </div>
          )}

          {/* Form Card */}
          <div className={`rounded-2xl p-5 sm:p-6 ${
              theme === 'dark' ? 'border border-white/15 bg-white/5 text-white' : 'border border-slate-200 bg-white text-slate-900'
            }`}>
            <div className="space-y-5">
              
              {/* Title */}
              <div>
                <label className="block text-sm mb-1 opacity-90">
                  Subject / Title of Request <span className="text-red-400">*</span>
                </label>
                <input
                  className={`w-full px-3 py-2 ${inputWrap}`}
                  placeholder="e.g., Cannot access shared drive"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>

              {/* Category (DYNAMIC) */}
              <div>
                <label className="block text-sm mb-1 opacity-90">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2 ${selectWrap}`}
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                >
                  <option className="text-black" value="">Select a category…</option>
                  {/* Map over categories fetched from DB */}
                  {categories.map((cat) => (
                    <option key={cat.id} className="text-black" value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requested By Date (feature only) */}
              {isFeature && (
                <div>
                  <label className="block text-sm mb-1 opacity-90">New Feature — Requested By Date</label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 ${inputWrap}`}
                    value={form.requested_by_date}
                    onChange={(e) => setField('requested_by_date', e.target.value)}
                  />
                </div>
              )}

              {/* Impact (DYNAMIC) */}
              <div>
                <label className="block text-sm mb-1 opacity-90">
                  Impact of Issue <span className="text-red-400">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2 ${selectWrap}`}
                  value={form.impact}
                  onChange={(e) => setField('impact', e.target.value)}
                >
                  <option className="text-black" value="">Select the impact level…</option>
                  {/* Map over impacts fetched from DB */}
                  {impacts.map((imp) => (
                    <option key={imp.id} className="text-black" value={imp.value}>
                      {imp.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-1 opacity-90">
                  Description of Issue <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`min-h-[140px] w-full px-3 py-2 ${areaWrap}`}
                  placeholder="Please provide as much detail as possible…"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm mb-1 opacity-90">Supporting Files / Screenshots (Up to 5)</label>
                <input
                  type="file"
                  multiple
                  onChange={onFilesChange}
                  className={
                    theme === 'dark'
                      ? 'block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:bg-white/10 file:text-white hover:file:bg-white/15'
                      : 'block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                  }
                  accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"
                />
                {fileError && (
                  <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-red-200' : 'text-rose-600'}`}>
                    {fileError}
                  </div>
                )}
                {files.length > 0 && (
                  <ul className={`mt-2 text-sm ${theme === 'dark' ? 'text-white/90' : 'text-slate-700'}`}>
                    {files.map((f, i) => <li key={i}>• {f.name}</li>)}
                  </ul>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={goBack} className={buttonGhost}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={create}
                  className={`${buttonSolid} disabled:opacity-60`}
                >
                  {busy ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}