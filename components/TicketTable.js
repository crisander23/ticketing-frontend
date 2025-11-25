'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Check, X, AlertTriangle } from 'lucide-react';

// --- HELPER: Confirmation Modal ---
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, isDark }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 fade-in" onClick={(e) => e.stopPropagation()}>
      <div className={`w-full max-w-sm rounded-xl border p-6 shadow-2xl transform transition-all scale-100 ${
        isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              {message}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={onCancel} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm} 
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER: Derive Impact ---
const deriveImpact = (row) => {
  let raw = row.impact ?? row.impact_level ?? row.priority ?? row.severity ?? row.p ?? row.Impact ?? '';
  if (raw === 0 || raw === 1 || raw === 2 || raw === 3 || raw === 4) raw = String(raw);
  if (typeof raw !== 'string') raw = String(raw ?? '');
  const v = raw.trim().toLowerCase();
  
  if (['0', 'p0', 'p-0', 'critical', 'severe', 'blocker', 'urgent', 'system down'].some(x => v.includes(x))) return 'critical';
  if (['1', 'p1', 'p-1', 'high', 'major', 'key', 'important'].some(x => v.includes(x))) return 'high';
  if (['2', 'p2', 'p-2', 'medium', 'moderate', 'normal'].some(x => v.includes(x))) return 'medium';
  if (['3', '4', 'p3', 'p4', 'low', 'minor', 'trivial'].some(x => v.includes(x))) return 'low';
  return ''; 
};

export default function TicketTable({
  rows = [],
  role = 'client',
  agentOptions = [],
  onAssign,
  onStatusChange,
  onRequestResolve, 
  inlineAction = false,
  surface = 'dark', 
  perPage = 10,
  showImpact = true,
  agentEditable = true,
}) {
  const router = useRouter(); 
  const isPrivileged = role === 'admin' || role === 'agent';

  // --- 1. FILTER LOGIC ---
  const filteredRows = useMemo(() => rows, [rows]);

  // --- 2. PAGINATION ---
  const [page, setPage] = useState(1);
  const total = filteredRows.length; 
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, page, perPage]);

  // --- 3. EDIT STATE ---
  const [editRowId, setEditRowId] = useState(null);
  const [draftAgent, setDraftAgent] = useState('');
  const [draftStatus, setDraftStatus] = useState('open');
  const [saving, setSaving] = useState(false);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null);

  const beginEdit = (row) => {
    setEditRowId(row.ticket_id);
    setDraftAgent(row.agent_id ?? '');
    setDraftStatus((row.status || 'open').toLowerCase());
  };

  const cancelEdit = () => { 
    setEditRowId(null); 
    setSaving(false); 
  };

  // --- 4. SAVE LOGIC ---
  const requestSaveEdit = (row) => {
    // Check values
    const finalAgentId = draftAgent ? parseInt(draftAgent, 10) : null;
    const agentDidChange = agentEditable && (finalAgentId ?? null) !== (row.agent_id ?? null);
    let finalStatus = draftStatus;

    // Auto-status logic
    if (agentDidChange && finalStatus === 'open') finalStatus = 'in_progress';

    const statusDidChange = finalStatus !== (row.status || 'open');

    // If nothing changed, just cancel
    if (!agentDidChange && !statusDidChange) {
        cancelEdit();
        return;
    }

    setConfirmModal({
        isOpen: true,
        title: 'Save Changes?',
        message: `You are about to update Ticket #${row.ticket_id}. Continue?`,
        action: () => executeSave(row, finalAgentId, finalStatus, agentDidChange, statusDidChange)
    });
  };

  const executeSave = async (row, finalAgentId, finalStatus, agentDidChange, statusDidChange) => {
    setConfirmModal(null); // Close modal
    try {
      setSaving(true);

      // Check for resolution modal logic
      if (typeof onRequestResolve === 'function' && finalStatus === 'resolved') {
        setEditRowId(null);
        setSaving(false);
        onRequestResolve(row.ticket_id); 
        return; 
      }

      const ops = [];
      if (agentDidChange && typeof onAssign === 'function') {
        ops.push(onAssign(row.ticket_id, finalAgentId));
      }
      if (statusDidChange && typeof onStatusChange === 'function') {
        ops.push(onStatusChange(row.ticket_id, finalStatus));
      }

      await Promise.all(ops);
      setEditRowId(null);
    } finally { 
      setSaving(false); 
    }
  };

  // --- THEME ---
  const isDark = surface === 'dark';
  const tone = {
    tableWrap: `overflow-hidden rounded-xl border ${isDark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'}`,
    head: isDark ? 'bg-white/10 text-white/90' : 'bg-slate-50 text-slate-700',
    th: 'px-4 py-3 text-left text-xs uppercase font-semibold',
    rowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50',
    td: `px-4 py-3 ${isDark ? 'text-white/90' : 'text-slate-800'}`,
    sub: isDark ? 'text-white/80' : 'text-slate-700',
    pale: isDark ? 'text-white/70' : 'text-slate-500',
    // Updated input style to match UserTable edit mode
    input: `w-full rounded border px-2 py-1 text-sm ${
        isDark ? 'bg-black/40 border-white/20 text-white' : 'bg-white border-slate-300 text-slate-900'
    } focus:outline-none focus:ring-1 focus:ring-blue-500`,
    paginateBtn: `rounded-md px-2 py-1 ${
      isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10 disabled:opacity-50' :
               'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50'
    }`,
    footer: `flex items-center justify-between p-3 border-t ${isDark ? 'border-white/10 text-white/80' : 'border-slate-200 text-slate-600'} text-xs`,
  };

  const colDefs = useMemo(() => ([
    <col key="id" className="w-[90px]" />,
    <col key="title" />,
    isPrivileged ? <col key="client" className="hidden md:table-column w-[18%]" /> : null,
    <col key="agent" className="w-[16%]" />,
    showImpact ? <col key="impact" className="w-[12%]" /> : null,
    <col key="status" className="w-[14%]" />,
    <col key="created" className="hidden sm:table-column w-[18%]" />,
    isPrivileged ? <col key="action" className="w-[120px]" /> : null,
  ].filter(Boolean)), [isPrivileged, showImpact]);

  return (
    <div className={tone.tableWrap}>
      
      {/* --- MODAL --- */}
      <ConfirmationModal 
        isOpen={confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.action}
        onCancel={() => setConfirmModal(null)}
        isDark={isDark}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] table-auto text-sm">
          <colgroup>{colDefs}</colgroup>

          <thead className={tone.head}>
            <tr>
              <th className={tone.th}>ID</th>
              <th className={tone.th}>Title</th>
              {isPrivileged && <th className={`${tone.th} hidden md:table-cell`}>Client</th>}
              <th className={tone.th}>Agent</th>
              {showImpact && <th className={tone.th}>Impact</th>}
              <th className={tone.th}>Status</th>
              <th className={`${tone.th} hidden sm:table-cell`}>Created</th>
              {isPrivileged && <th className={tone.th}>Action</th>}
            </tr>
          </thead>

          <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-slate-200'}>
            {pageRows.length === 0 && (
              <tr>
                <td className={`px-4 py-8 text-center ${tone.pale}`} colSpan={isPrivileged ? (showImpact ? 8 : 7) : (showImpact ? 7 : 6)}>
                  No tickets found.
                </td>
              </tr>
            )}

            {pageRows.map((t) => {
              const clientName = `${t.client_first_name || ''} ${t.client_last_name || ''}`.trim();
              const agentName = t.agent_first_name
                ? `${t.agent_first_name} ${t.agent_last_name}`.trim()
                : (t.agent_name || 'Unassigned');
              const created = t.created_at ? new Date(t.created_at).toLocaleString() : '—';
              const isEditing = editRowId === t.ticket_id;
              const impactNorm = deriveImpact(t); 

              const trueStatus = (t.status || 'open').toLowerCase();
              let displayStatus = trueStatus;
              if (role === 'client' && trueStatus === 'resolved') {
                displayStatus = 'in_progress';
              }

              return (
                <tr 
                  key={t.ticket_id} 
                  className={`${tone.rowHover} cursor-pointer`}
                  onClick={() => router.push(`/tickets/${t.ticket_id}`)}
                >
                  <td className={`${tone.td} whitespace-nowrap`}>
                    <span className={isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'}>
                      #{t.ticket_id}
                    </span>
                  </td>

                  <td className={`${tone.td} whitespace-nowrap`}>{t.title || '(no title)'}</td>

                  {isPrivileged && (
                    <td className={`${tone.td} hidden md:table-cell whitespace-nowrap`}>{clientName || '—'}</td>
                  )}

                  <td className={`${tone.td} whitespace-nowrap`}>
                    {inlineAction && isEditing && agentEditable ? (
                      <select
                        value={draftAgent}
                        onChange={(e) => setDraftAgent(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                        className={tone.input}
                      >
                        <option className="text-black" value="">Unassigned</option>
                        {agentOptions.map(a => <option className="text-black" key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    ) : (
                      <span className={tone.sub}>{agentName}</span>
                    )}
                  </td>

                  {showImpact && (
                    <td className={`${tone.td} whitespace-nowrap`}>
                      <ImpactBadge value={impactNorm} dark={isDark} />
                    </td>
                  )}

                  <td className={`${tone.td} whitespace-nowrap`}>
                    {inlineAction && isEditing ? (
                      <select
                        value={draftStatus}
                        onChange={(e) => setDraftStatus(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                        className={tone.input}
                      >
                        {['open','in_progress','resolved','closed'].map(s => (
                          <option className="text-black" key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusSolid value={displayStatus} />
                    )}
                  </td>

                  <td className={`${tone.td} whitespace-nowrap hidden sm:table-cell`}>{created}</td>

                  {isPrivileged && (
                    <td className={`${tone.td} whitespace-nowrap`}>
                      {inlineAction ? (
                        isEditing ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); requestSaveEdit(t); }} 
                              disabled={saving}
                              className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" 
                              title="Save Changes"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); cancelEdit(); }} 
                              disabled={saving}
                              className="p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors" 
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); beginEdit(t); }}
                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                                    isDark 
                                        ? 'border-white/20 hover:bg-white/10 text-white' 
                                        : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                                } disabled:opacity-50`}
                            >
                                <Edit2 size={12} />
                                Edit
                            </button>
                          </div>
                        )
                      ) : (
                        <span className={`${tone.pale} text-xs`}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={tone.footer}>
        <div>
          Showing <b>{pageRows.length}</b> of <b>{total}</b> — Page {page}/{totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={tone.paginateBtn}>
            Previous
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={tone.paginateBtn}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Solid status badge (matches KPI colors) ===== */
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

/* ===== Impact Badge ===== */
function ImpactBadge({ value, dark }) {
  const v = (value || '').toString().toLowerCase();
  let label = value ? value.toUpperCase() : 'UNKNOWN';
  let cls = dark ? 'bg-white text-gray-900' : 'bg-slate-300 text-slate-900';

  if (v === 'critical') { cls = 'bg-rose-600 text-white'; label = 'CRITICAL'; } 
  else if (v === 'high') { cls = 'bg-red-500 text-white'; label = 'HIGH'; } 
  else if (v === 'medium') { cls = 'bg-amber-500 text-slate-900'; label = 'MEDIUM'; } 
  else if (v === 'low') { cls = 'bg-emerald-600 text-white'; label = 'LOW'; }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}