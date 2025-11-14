'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiFetch } from '@/lib/api';

export default function CreateTicketPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Auth gate
  if (!user) redirect('/login');
  if (user.user_type !== 'client') redirect('/login');

  /* ================= Theme (ocean/light) ================= */
  const [theme, setTheme] = useState('ocean');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ticketing_theme') : null;
    const t = saved || 'ocean';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'ocean' ? 'light' : 'ocean';
      localStorage.setItem('ticketing_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  const pageBg =
    theme === 'ocean'
      ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700'
      : 'bg-slate-100';

  const headerCls =
    theme === 'ocean'
      ? 'fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-md'
      : 'fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur';

  const textMain = theme === 'ocean' ? 'text-white' : 'text-slate-900';
  const textSub  = theme === 'ocean' ? 'text-white/80' : 'text-slate-600';

  const inputWrap = theme === 'ocean'
    ? 'rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-blue-300'
    : 'rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-300';

  const selectWrap = inputWrap;
  const areaWrap   = inputWrap;

  const buttonGhost = theme === 'ocean'
    ? 'rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm'
    : 'rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-sm';

  const buttonSolid = theme === 'ocean'
    ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm'
    : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm';

  /* ================= Form State ================= */
  const [form, setForm] = useState({
    title: '',
    category: '',
    impact: '',
    description: '',
    requested_by_date: '',
  });
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
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

  /* ================= Submit ================= */
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: '', text: '' });

  // Decide where to POST uploads:
  // - If you proxy through Next API: leave UPLOAD_BASE empty and we’ll use `/api/...`
  // - If you hit backend directly: set NEXT_PUBLIC_API_BASE (e.g. http://localhost:7230)
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
      // STEP 1 — Create ticket (JSON)
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

      // STEP 2 — Upload attachments (if any)
      if (files.length > 0) {
        setMsg({ kind: 'info', text: 'Uploading attachments…' });

        const fd = new FormData();
        fd.append('user_id', String(user.user_id));
        files.forEach(f => fd.append('attachments', f));

        // Use the right base:
        // - If UPLOAD_BASE is set -> `${UPLOAD_BASE}/tickets/${id}/upload`
        // - Else use Next proxy -> `/api/tickets/${id}/upload`
        const uploadUrl = UPLOAD_BASE
          ? `${UPLOAD_BASE.replace(/\/$/, '')}/tickets/${newId}/upload`
          : `/api/tickets/${newId}/upload`;

        const upload = await fetch(uploadUrl, {
          method: 'POST',
          body: fd,
          // If your backend needs cookies/session:
          // credentials: 'include',
        });
        if (!upload.ok) {
          const j = await upload.json().catch(() => ({}));
          throw new Error(j?.message || 'Ticket created, but file upload failed.');
        }
      }

      setMsg({ kind: 'success', text: `Success! Ticket #${newId} created.` });
      setTimeout(() => router.replace('/client/dashboard'), 800);
    } catch (e) {
      setMsg({ kind: 'error', text: e?.message || 'Failed to create ticket.' });
      setBusy(false);
    }
  }, [files, form, isFeature, router, user?.user_id, UPLOAD_BASE]);

  const goBack = () => router.back();

  /* ================= Render ================= */
  return (
    <div className={`min-h-screen w-full ${pageBg}`}>
      {/* Sticky translucent header */}
      <header className={headerCls}>
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className={textMain + ' min-w-0'}>
            <h1 className="truncate text-lg sm:text-xl font-semibold">Create Ticket</h1>
            <p className={textSub + ' text-xs sm:text-sm'}>
              Logged in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className={buttonGhost} onClick={toggleTheme}>
              {theme === 'ocean' ? '☀️ Light' : '🌊 Ocean'}
            </button>
            <button className={buttonSolid} onClick={goBack}>
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 pt-20 pb-10">
        <p className={`${textSub} mb-4`}>
          Please provide as much detail as possible. Attach up to 5 screenshots or files if needed.
        </p>

        {/* Message banner */}
        {msg.text && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              msg.kind === 'error'
                ? theme === 'ocean'
                  ? 'border border-red-400/30 bg-red-900/25 text-red-100'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
                : msg.kind === 'success'
                ? theme === 'ocean'
                  ? 'border border-emerald-400/30 bg-emerald-900/25 text-emerald-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : theme === 'ocean'
                ? 'border border-white/20 bg-white/10 text-white'
                : 'border border-slate-200 bg-white text-slate-900'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Form card */}
        <div
          className={`rounded-2xl p-5 sm:p-6 ${
            theme === 'ocean'
              ? 'border border-white/15 bg-white/5 text-white'
              : 'border border-slate-200 bg-white text-slate-900'
          }`}
        >
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

            {/* Category */}
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
                <option className="text-black" value="System Issue">System Issue</option>
                <option className="text-black" value="Software Exception Report">Software Exception Report</option>
                <option className="text-black" value="Access Request / Issue">Access Request / Issue</option>
                <option className="text-black" value="New Feature Request">New Feature Request</option>
                <option className="text-black" value="Network Issue">Network Issue</option>
                <option className="text-black" value="Hardware Issue">Hardware Issue</option>
                <option className="text-black" value="Business Process / Policy Issue">Business Process / Policy Issue</option>
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

            {/* Impact */}
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
                <option className="text-black" value="Critical">Critical (System Down) — Complete outage</option>
                <option className="text-black" value="High">High (Key Function Affected)</option>
                <option className="text-black" value="Medium">Medium (Degraded Service)</option>
                <option className="text-black" value="Minor">Minor (Irregularities)</option>
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
                  theme === 'ocean'
                    ? 'block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:bg-white/10 file:text-white hover:file:bg-white/15'
                    : 'block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                }
                accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"
              />
              {fileError && (
                <div className={`mt-2 text-sm ${theme === 'ocean' ? 'text-red-200' : 'text-rose-600'}`}>
                  {fileError}
                </div>
              )}
              {files.length > 0 && (
                <ul className={`mt-2 text-sm ${theme === 'ocean' ? 'text-white/90' : 'text-slate-700'}`}>
                  {files.map((f, i) => <li key={i}>• {f.name}</li>)}
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => router.back()} className={buttonGhost}>
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
  );
}
