'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { routeForUser } from '@/lib/guards';
import ResolutionModal from '@/components/ResolutionModal';
import Sidebar from '@/components/Sidebar'; 
import { Menu } from 'lucide-react'; 
import TicketAudit from '@/components/TicketAudit';

/* --- HELPER FUNCTIONS (Unchanged) --- */
function pick(obj, keys, fallback = undefined) {
  for (const k of keys) {
    const v = k.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
    if (v !== undefined && v !== null) return v;
  }
  return fallback;
}

function normalizeAttachment(a, idx = 0) {
  const id = pick(a, ['attachment_id', 'id']);
  const filename = pick(a, ['filename', 'original_name', 'name', 'file_name'], 'download');
  const path = pick(a, ['url', 'path', 'file_url', 'location']);
  
  let absoluteUrl = path;
  if (path && path.startsWith('/uploads')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7230';
    absoluteUrl = `${baseUrl}${path}`;
  }
  
  return {
    id: id ?? `${filename}-${idx}`,
    filename,
    url: absoluteUrl, 
  };
}

function normalizeNote(n, idx = 0) {
  const id = pick(n, ['note_id', 'id']) ?? `${pick(n, ['created_at'], '')}-${idx}`;
  const text = pick(n, ['note', 'note_text', 'text', 'content', 'body'], '');
  const author = pick(n, ['author_name', 'authorFullName', 'user_name', 'user.full_name'], 'Unknown');
  const createdAt = pick(n, ['created_at', 'timestamp', 'date'], null);
  return { id, text, author, createdAt };
}

function normalizeTicket(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw.ticket ?? raw;
  const client = raw.client ?? {};
  const rawAttachments = Array.isArray(raw.attachments) ? raw.attachments : (t.attachments || []);
  const ticket_id = pick(t, ['ticket_id', 'id']);
  const title = pick(t, ['title'], '(no title)');
  const status = pick(t, ['status'], 'open');
  const impact = pick(t, ['impact'], '-');
  const category = pick(t, ['category'], '-');
  const description = pick(t, ['description'], '-');
  const resolution_details = pick(t, ['resolution_details'], null);
  const customer_id = pick(t, ['customer_id']);
  const customer_first_name = pick(client, ['first_name'], '');
  const customer_last_name = pick(client, ['last_name'], '');
  const customer_name = `${customer_first_name} ${customer_last_name}`.trim();
  const customer_email = pick(client, ['email'], '');
  const customer_department = pick(client, ['department'], '');
  const customer_position = pick(client, ['position'], '');
  const agent_id = pick(t, ['agent_id'], null);
  const agent_first_name = pick(t, ['agent_first_name'], '');
  const agent_last_name = pick(t, ['agent_last_name'], '');
  const agent_name = `${agent_first_name} ${agent_last_name}`.trim() || null;
  const updated_at = pick(t, ['updated_at']);
  const attachments = Array.isArray(rawAttachments)
    ? rawAttachments.map((a, idx) => normalizeAttachment(a, idx))
    : [];
  return {
    ticket_id, title, status, impact, category, description, resolution_details,
    customer_id, customer_first_name, customer_last_name, customer_name,
    customer_email, customer_department, customer_position,
    agent_id, agent_name, updated_at, attachments,
  };
}

/* --- MAIN COMPONENT --- */
export default function TicketDetailPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const { user } = useAuthStore();

  // --- 1. THEME STATE WITH MEMORY (Synchronized) ---
  const [theme, setTheme] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false); // Prevents flash

  useEffect(() => {
    // Use 'ticketing_theme' to match the Admin pages
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

  // --- 2. ROLE LOGIC (UPDATED) ---
  const rolePath = routeForUser(user);
  
  const isSuperAdmin = rolePath === '/superadmin/dashboard';
  // SuperAdmin should have all Admin privileges on this page (assigning agents, viewing audit logs)
  const isAdmin = rolePath === '/admin/dashboard' || isSuperAdmin; 
  const isAgent = rolePath === '/agent/dashboard';
  
  const canManage = isAdmin || isAgent;
  
  // Determine the correct Sidebar type
  const userType = isSuperAdmin ? 'superadmin' : (rolePath === '/admin/dashboard' ? 'admin' : (isAgent ? 'agent' : 'client'));

  // --- 3. DATA FETCHING ---
  const { data: rawTicket, isLoading, error, mutate } = useSWR(
    id ? `/tickets/${id}` : null,
    fetcher
  );
  const { data: rawNotes, mutate: mutateNotes } = useSWR(
    canManage && id ? `/tickets/${id}/notes` : null,
    fetcher
  );
  // Admin/SuperAdmin needs user list for assignment dropdown
  const { data: allUsers } = useSWR(isAdmin ? '/admin/users' : null, fetcher);

  const normalized = useMemo(() => normalizeTicket(rawTicket), [rawTicket]);

  // --- 4. LOCAL UI STATE ---
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [showResolution, setShowResolution] = useState(false);
  const pendingStatusRef = useRef(null);
  const [modalState, setModalState] = useState({ open: false, list: [], startIndex: 0 });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useEffect(() => {
    if (normalized?.status) setStatus(normalized.status);
  }, [normalized]);

  // --- 5. HELPERS & MUTATIONS ---
  const refreshHistory = useCallback(() => {
    globalMutate(`/tickets/${id}/history`); 
  }, [id]);

  const refreshAll = useCallback(() => {
    mutate();
    if (canManage) {
      mutateNotes();
    }
    refreshHistory();
  }, [mutate, mutateNotes, canManage, refreshHistory]);

  const agentOptions = useMemo(() => {
    if (!isAdmin || !Array.isArray(allUsers)) return [];
    return allUsers
      .filter(u => (u.user_type || '').toLowerCase() === 'agent')
      .filter(u => (u.status || '').toLowerCase() === 'active')
      .map(u => ({
        id: u.user_id,
        label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allUsers, isAdmin]);

  const notes = useMemo(() => {
    const arr = Array.isArray(rawNotes) ? rawNotes : rawNotes?.notes;
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map((n, idx) => normalizeNote(n, idx));
  }, [rawNotes]);

  async function updateStatus(newStatus, resolution_details) {
    await apiFetch(`/tickets/${id}`, {
      method: 'PUT',
      body: { 
        status: newStatus, 
        resolution_details: resolution_details || undefined,
        user_id: user?.user_id 
      },
    });
    await mutate(); 
    refreshHistory();
    globalMutate('/tickets');
    if (isAgent) globalMutate(`/tickets?agent_id=${user.user_id}`);
    if (userType === 'client') {
      globalMutate(`/tickets/my?customer_id=${user.user_id}`);
    }
  }

  async function onChangeStatus(e) {
    const next = e.target.value;
    setStatus(next);
    if (next === 'resolved') {
      pendingStatusRef.current = next;
      setShowResolution(true);
    } else {
      try {
        await updateStatus(next);
      } catch (err) {
        alert(err.message || 'Failed to update status');
      }
    }
  }

  async function onSaveResolution(resolutionText) {
    const next = pendingStatusRef.current || 'resolved';
    setShowResolution(false);
    try {
      await updateStatus(next, resolutionText);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  }

  async function assignAgent(newAgentId) {
    if (newAgentId === '' || newAgentId == null) return;
    const agentIdInt = parseInt(newAgentId, 10);
    if (!Number.isInteger(agentIdInt) || agentIdInt <= 0) {
      alert('Invalid agent id.');
      return;
    }
    const nextStatus = 'in_progress';
    try {
      await apiFetch(`/tickets/${id}`, {
        method: 'PUT',
        body: {
          agent_id: agentIdInt,
          status: nextStatus,
          user_id: user?.user_id 
        },
      });
      setStatus(nextStatus);
      await mutate(); 
      refreshHistory();
      globalMutate('/tickets');
      globalMutate(`/tickets/${id}`);
      if (isAgent) globalMutate(`/tickets?agent_id=${user.user_id}`);
      if (userType === 'client') {
        globalMutate(`/tickets/my?customer_id=${user.user_id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to assign agent.');
    }
  }

  async function addNote(text) {
    if (!text?.trim()) return;
    await apiFetch(`/tickets/${id}/notes`, {
      method: 'POST',
      body: { 
        noteText: text,
        loggedInUserId: user?.user_id
      },
    });
    mutateNotes();
  }

  // --- 6. STYLES ---
  const isDark = theme === 'dark';

  const pageBg = isDark
    ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700'
    : 'bg-slate-100';

  const mobileHeaderCls = isDark
    ? 'sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden bg-slate-900/70 border-b border-white/10 backdrop-blur'
    : 'sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden bg-white/90 border-b border-slate-200 backdrop-blur';

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/80' : 'text-slate-600';

  const buttonGhost = isDark
    ? 'rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm'
    : 'rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-sm';

  const buttonSolid = isDark
    ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm'
    : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm';

  const cardBg = isDark
    ? 'rounded-xl border border-white/15 bg-white/5'
    : 'rounded-xl border border-slate-200 bg-white';
  
  const selectField = isDark
    ? 'w-full rounded-md border border-white/20 bg-white/10 text-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
    : 'w-full rounded-md border border-slate-300 bg-white text-slate-800 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';
  
  const chip = isDark
    ? `inline-block rounded-full px-3 py-1 text-sm ${textMain} bg-white/10 border border-white/20`
    : `inline-block rounded-full px-3 py-1 text-sm ${textMain} bg-slate-100 border border-slate-300`;

  const errorText = isDark ? 'text-rose-400' : 'text-rose-600';

  // --- 7. RENDER GUARDS ---
  
  // 1. Wait for theme load to prevent flicker
  if (!isThemeLoaded) return <div className="min-h-screen bg-slate-900" />;

  // 2. Loading state
  if (isLoading) return (
    <div className={`min-h-screen w-full ${pageBg} p-8`}>
      <div className={`${cardBg} p-6 ${textMain}`}>Loading…</div>
    </div>
  );
  
  // 3. Auth check
  if (!user) {
    router.replace('/login');
    return null;
  }
  
  // 4. Error states
  if (!id) return (
    <div className={`min-h-screen w-full ${pageBg} p-8`}>
      <div className={`${cardBg} p-6 ${errorText}`}>No ticket ID in URL.</div>
    </div>
  );
  if (error) return (
    <div className={`min-h-screen w-full ${pageBg} p-8`}>
      <div className={`${cardBg} p-6 ${errorText}`}>Failed to load ticket.</div>
    </div>
  );
  if (!normalized) {
    return (
      <div className={`min-h-screen w-full ${pageBg} p-8 space-y-4`}>
        <div className={`${cardBg} p-6 ${errorText}`}>No ticket data returned for ID: {id}</div>
      </div>
    );
  }

  // --- 8. DATA PREP ---
  const clientInfo = {
    name: normalized.customer_name || '-',
    email: normalized.customer_email || '-',
    id: normalized.customer_id ?? '-',
    dept: normalized.customer_department || '-',
    pos: normalized.customer_position || '-',
  };

  // --- 9. JSX ---
  return (
    <div className={`min-h-screen w-full ${pageBg}`}>
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(prev => !prev)}
        theme={theme}
        setTheme={handleThemeChange} // Connected to localStorage wrapper
        onRefresh={refreshAll}
        userType={userType} // <-- Now correctly passes 'superadmin' if needed
      />
      
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>

        <header className={mobileHeaderCls}>
          <div className="min-w-0">
            <h1 className={`truncate text-lg font-semibold ${textMain} uppercase`}>
              Ticket #{normalized.ticket_id ?? id}
            </h1>
            <p className={`text-xs ${textSub} truncate`}>
              {normalized.title}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className={`${buttonGhost} px-3 py-2 text-sm`} onClick={() => router.back()}>
              Back
            </button>
            <button onClick={() => setSidebarOpen(true)} className={`p-2 ${buttonGhost}`}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 md:pt-8 pb-8 space-y-6">
          
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl font-semibold ${textMain} flex items-baseline`}>
                <span className="uppercase">Ticket #{normalized.ticket_id ?? id}</span>
                <span className={`mx-3 font-light ${isDark ? 'text-white/50' : 'text-slate-300'}`}>|</span>
                <span className="font-bold">{normalized.title}</span>
              </h1>
              <p className={`text-sm ${textSub} truncate`}>
                View and manage all ticket details
              </p>
            </div>
            <button className={`${buttonGhost} px-3 py-2 text-sm`} onClick={() => router.back()}>
              Back to list
            </button>
          </div>
          
          <div className={`${cardBg} p-4 sm:p-6`}>
            <div className="space-y-4">
              <div>
                <div className={`text-lg font-semibold ${textMain}`}>Client Information</div>
                <div className="mt-2 space-y-1">
                  <div className={`font-medium ${textMain}`}>{clientInfo.name}</div>
                  <div className={`text-sm ${textSub}`}>{clientInfo.email}</div>
                  <div className={`text-xs ${textSub} opacity-80`}>ID: {clientInfo.id}</div>
                  <div className={`text-xs ${textSub} opacity-80`}>Dept: {clientInfo.dept} · Position: {clientInfo.pos}</div>
                </div>
              </div>

              <hr className={`my-2 ${isDark ? 'border-white/15' : 'border-slate-200'}`} />
              
              <div>
                <div className={`text-lg font-semibold ${textMain} mb-2`}>Ticket Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className={`text-sm ${textSub}`}>Status</div>
                    <div className="mt-1">
                      {canManage ? (
                        <select value={status} onChange={onChangeStatus} className={selectField}>
                          <option className="text-black" value="open">open</option>
                          <option className="text-black" value="in_progress">in_progress</option>
                          <option className="text-black" value="resolved">resolved</option>
                          <option className="text-black" value="closed">closed</option>
                        </select>
                      ) : (
                        <StatusSolid value={displayStatus} />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className={`text-sm ${textSub}`}>Impact</div>
                    <div className="mt-1">
                      <ImpactBadge value={normalized.impact} dark={isDark} />
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-sm ${textSub}`}>Category</div>
                    <div className="mt-1">
                      <span className={chip}>{normalized.category}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-sm ${textSub}`}>Updated</div>
                    <div className={`mt-1 ${textMain}`}>
                      {normalized.updated_at ? new Date(normalized.updated_at).toLocaleString() : '-'}
                    </div>
                  </div>
                </div>
              </div>
              
              <hr className={`my-2 ${isDark ? 'border-white/15' : 'border-slate-200'}`} />

              <div>
                <div className={`text-lg font-semibold ${textMain}`}>Assignment</div>
                <div className={`text-sm ${textSub} mt-2`}>Assigned Agent</div>
                <div className="mt-1">
                  {isAdmin ? (
                    <select
                      value={normalized.agent_id || ''}
                      onChange={(e) => assignAgent(e.target.value)}
                      className={selectField}
                    >
                      <option className="text-black" value="">— Select agent —</option>
                      {agentOptions.map(opt => (
                        <option className="text-black" key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={chip}>
                      {normalized.agent_name || '—'}
                    </div>
                  )}
                </div>
              </div>

              {normalized?.resolution_details && (
                <>
                  <hr className={`my-2 ${isDark ? 'border-white/15' : 'border-slate-200'}`} />
                  <div>
                    <div className={`text-lg font-semibold ${textMain}`}>Resolution</div>
                    <div className={`mt-1 whitespace-pre-wrap ${textMain}`}>{normalized.resolution_details}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={`${cardBg} p-4 sm:p-6`}>
            <div className={`text-sm ${textSub}`}>Description</div>
            <div className={`mt-1 whitespace-pre-wrap ${textMain}`}>{normalized.description}</div>
          </div>

          <div className={`${cardBg} p-4 sm:p-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className={`font-medium ${textMain}`}>Attachments</div>
            </div>

            <ul className={`mt-3 space-y-1 text-sm ${textMain}`}>
              {(normalized.attachments || []).length === 0 && (
                <li className={textSub}>No attachments</li>
              )}
              
              {(normalized.attachments || []).map((a, idx) => (
                <li key={a.id ?? `${a.filename}-${idx}`}>
                  <button 
                    className="underline hover:text-blue-400 text-left" 
                    onClick={() => setModalState({ open: true, list: normalized.attachments, startIndex: idx })}
                  >
                    {a.filename}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {isAdmin && (
            <div className={`${cardBg} p-4 sm:p-6 space-y-4`}>
              <h3 className={`text-lg font-semibold ${textMain}`}>Audit History</h3>
              <div className="mt-4">
                <TicketAudit ticketId={id} theme={theme} />
              </div>
            </div>
          )}

          {canManage && (
            <div className={`${cardBg} p-4 sm:p-6 space-y-4`}>
              <div className={`font-medium ${textMain}`}>Internal Notes</div>
              <NoteComposer onAdd={addNote} theme={theme} />

              <div className="space-y-3">
                {(notes || []).length === 0 && (
                  <div className={`text-sm ${textSub}`}>No notes yet.</div>
                )}

                {(notes || []).map((n, idx) => (
                  <div key={n.id ?? `${n.createdAt || ''}-${idx}`} 
                    className={`rounded-lg p-3 ${isDark ? 'border border-white/15' : 'border border-slate-200 bg-slate-50'}`}
                  >
                    <div className={`text-xs ${textSub}`}>
                      {n.author} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </div>
                    <div className={`mt-1 whitespace-pre-wrap text-sm ${textMain}`}>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <ResolutionModal
        open={showResolution}
        onClose={() => setShowResolution(false)}
        onSubmit={onSaveResolution}
        theme={theme}
      />
      
      <AttachmentModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, list: [], startIndex: 0 })}
        attachments={modalState.list}
        startIndex={modalState.startIndex}
        theme={theme}
      />
    </div>
  );
}

/* --- SUB-COMPONENTS (Unchanged) --- */

function StatusSolid({ value }) {
  const v = (value || '').toLowerCase();
  let cls = 'bg-slate-200 text-slate-900';
  if (v === 'open')           cls = 'bg-blue-600 text-white';
  else if (v === 'in_progress') cls = 'bg-amber-500 text-slate-900';
  else if (v === 'resolved')    cls = 'bg-violet-600 text-white';
  else if (v === 'closed')      cls = 'bg-emerald-600 text-white';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value || '—'}
    </span>
  );
}

function ImpactBadge({ value, dark }) {
  const v = (value || '').toString().toLowerCase();

  let label = value ? value.toUpperCase() : 'UNKNOWN';
  let cls = dark ? 'bg-white text-gray-900' : 'bg-slate-300 text-slate-900';

  if (v === 'critical') {
    cls = 'bg-rose-600 text-white';
    label = 'CRITICAL';
  } else if (v === 'high') {
    cls = 'bg-red-500 text-white';
    label = 'HIGH';
  } else if (v === 'medium') {
    cls = 'bg-amber-500 text-slate-900';
    label = 'MEDIUM';
  } else if (v === 'low') {
    cls = 'bg-emerald-600 text-white';
    label = 'LOW';
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function NoteComposer({ onAdd, theme }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const isDark = theme === 'dark';

  const inputWrap = isDark
    ? 'rounded-xl bg-white/10 border border-white/15'
    : 'rounded-xl bg-white border border-slate-300';
  
  const inputField = isDark
    ? 'w-full bg-transparent text-white placeholder-white/60 outline-none'
    : 'w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none';
  
  const buttonSolid = isDark
    ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm disabled:opacity-60'
    : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60';

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onAdd(text);
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className={`${inputWrap} px-3 py-2`}>
        <textarea
          rows={3}
          className={inputField}
          placeholder="Add an internal note (visible to admins/agents only)…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button onClick={save} className={buttonSolid} disabled={saving || !text.trim()}>
          {saving ? 'Saving…' : 'Add Note'}
        </button>
      </div>
    </div>
  );
}

function AttachmentModal({ open, onClose, attachments = [], startIndex = 0, theme }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (open) {
      setCurrentIndex(startIndex);
    }
  }, [open, startIndex]);

  const attachment = attachments[currentIndex];
  if (!open || !attachment) return null;

  const total = attachments.length;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  const goPrev = (e) => {
    e.stopPropagation(); 
    if (canGoPrev) setCurrentIndex(currentIndex - 1);
  };
  
  const goNext = (e) => {
    e.stopPropagation(); 
    if (canGoNext) setCurrentIndex(currentIndex + 1);
  };

  const isDark = theme === 'dark'; 
  
  const cardBg = isDark ? 'bg-slate-800 border border-white/15' : 'bg-white border border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/80' : 'text-slate-600';
  const buttonGhost = isDark ? 'rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm' : 'rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 text-sm';
  const buttonSolid = isDark ? 'rounded-lg bg-white text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm' : 'rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-sm';
  const navButton = `absolute top-1/2 -translate-y-1/2 rounded-full p-2
    ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}
    disabled:opacity-20 disabled:cursor-not-allowed`;

  const isImage = attachment.url && /\.(jpe?g|png|gif|webp|svg)$/i.test(attachment.url);
  const isVideo = attachment.url && /\.(mp4|webm|ogg)$/i.test(attachment.url);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl shadow-lg ${cardBg}`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/15' : 'border-slate-200'}`}>
          <h3 className={`font-medium ${textMain} truncate`}>{attachment.filename}</h3>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${textSub}`}>{currentIndex + 1} of {total}</span>
            <button onClick={onClose} className={buttonGhost + ' !py-1 !px-2'}>&times;</button>
          </div>
        </div>
        
        <div className="p-4 overflow-auto relative">
          {isImage && (
            <img src={attachment.url} alt={attachment.filename} className="w-full h-auto max-h-[70vh] object-contain" />
          )}
          
          {isVideo && (
            <video src={attachment.url} controls className="w-full h-auto max-h-[70vh]">
              Your browser does not support the video tag.
            </video>
          )}

          {!isImage && !isVideo && (
            <div className="text-center p-8 space-y-4">
              <p className={textSub}>This file type cannot be previewed.</p>
              <a 
                href={attachment.url} 
                download={attachment.filename}
                className={buttonSolid}
              >
                Download "{attachment.filename}"
              </a>
            </div>
          )}

          <button onClick={goPrev} disabled={!canGoPrev} className={`${navButton} left-6`}>
            &lt;
          </button>
          <button onClick={goNext} disabled={!canGoNext} className={`${navButton} right-6`}>
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}