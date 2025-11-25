'use client';

import { useMemo, useState } from 'react';
import { Edit2, Check, X, Save, AlertTriangle } from 'lucide-react';

// --- INTERNAL MODAL COMPONENT ---
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, isDark }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 fade-in">
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

export default function UserTable({ 
  rows = [], 
  perPage = 10, 
  surface = 'dark',
  onToggleStatus, 
  onChangeRole,   
  busyId,         
  isSuperAdmin    
}) {
  const [page, setPage] = useState(1);

  // --- EDIT STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ role: '', status: '' });

  // --- CONFIRMATION STATE ---
  const [confirmModal, setConfirmModal] = useState(null); 
  // Shape: { isOpen: boolean, title: string, message: string, action: () => void }

  // --- PAGINATION ---
  // Using 'rows' directly since internal filtering is removed. 
  // Ensure 'rows' passed from parent are already filtered by global search if needed.
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  // --- HANDLERS ---
  const startEdit = (user) => {
    setEditingId(user.user_id);
    setEditValues({ role: user.user_type, status: user.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ role: '', status: '' });
  };

  // Triggered by "Save" (Check) button in Edit Mode
  const requestSaveEdit = (user) => {
    // Check if anything actually changed
    const roleChanged = editValues.role !== user.user_type;
    const statusChanged = editValues.status !== user.status;

    if (!roleChanged && !statusChanged) {
      cancelEdit();
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Save Changes?',
      message: `You are about to update the role/status for ${user.email}. Are you sure?`,
      action: () => {
        if (roleChanged && onChangeRole) onChangeRole(user, editValues.role);
        if (statusChanged && onToggleStatus) onToggleStatus(user); 
        
        setEditingId(null);
        setConfirmModal(null);
      }
    });
  };

  const isDark = surface === 'dark';
  const tone = {
    wrap: `overflow-hidden rounded-xl border ${isDark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'}`,
    head: isDark ? 'bg-white/10 text-white/90' : 'bg-slate-50 text-slate-700',
    th: 'px-4 py-3 text-left text-xs uppercase font-semibold',
    rowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50',
    td: `px-4 py-3 ${isDark ? 'text-white/90' : 'text-slate-800'}`,
    sub: isDark ? 'text-white/80' : 'text-slate-700',
    footer: `flex items-center justify-between p-3 border-t ${isDark ? 'border-white/10 text-white/80' : 'border-slate-200 text-slate-600'} text-xs`,
    paginateBtn: `rounded-md px-2 py-1 ${
      isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10 disabled:opacity-50'
             : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50'
    }`,
    selectEdit: `w-full rounded border px-2 py-1 text-sm ${
        isDark ? 'bg-black/40 border-white/20 text-white' : 'bg-white border-slate-300 text-slate-900'
    } focus:outline-none focus:ring-1 focus:ring-blue-500`
  };

  return (
    <div className={tone.wrap}>
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
          <colgroup>
            <col className="w-[80px]" />
            <col />
            <col />
            <col className="hidden md:table-column w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            {isSuperAdmin && <col className="w-[120px]" />}
          </colgroup>
          <thead className={tone.head}>
            <tr>
              <th className={tone.th}>ID</th>
              <th className={tone.th}>Name</th>
              <th className={tone.th}>Email</th>
              <th className={`${tone.th} hidden md:table-cell`}>Position</th>
              <th className={tone.th}>Type</th>
              <th className={tone.th}>Status</th>
              {isSuperAdmin && <th className={tone.th}>Action</th>}
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-slate-200'}>
            {pageRows.length === 0 && (
              <tr><td className={`${tone.td} text-center`} colSpan={isSuperAdmin ? 7 : 6}>
                No users found{rows.length > 0 ? ' for these filters' : ''}.
              </td></tr>
            )}
            {pageRows.map((u) => {
              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
              const isActive = (u.status || '').toLowerCase() === 'active';
              const pill = isDark ? 'bg-white/[0.06] text-white border-white/15' : 'bg-slate-100 text-slate-800 border-slate-200';
              const dot = isActive ? (isDark ? 'bg-emerald-400' : 'bg-emerald-600') : (isDark ? 'bg-rose-400' : 'bg-rose-600');
              
              const isBusy = busyId === u.user_id;
              const isEditing = editingId === u.user_id;

              return (
                <tr key={u.user_id} className={tone.rowHover}>
                  <td className={`${tone.td} whitespace-nowrap`}>{u.user_id}</td>
                  <td className={`${tone.td} whitespace-nowrap`}>{name}</td>
                  <td className={`${tone.sub} whitespace-nowrap`}>{u.email}</td>
                  <td className={`${tone.sub} hidden md:table-cell whitespace-nowrap`}>{u.position || 'N/A'}</td>
                  
                  {/* --- TYPE COLUMN (Editable) --- */}
                  <td className={`${tone.sub} whitespace-nowrap`}>
                    {isEditing ? (
                        <select 
                            value={editValues.role} 
                            onChange={e => setEditValues(p => ({ ...p, role: e.target.value }))}
                            className={tone.selectEdit}
                        >
                            <option className="text-black" value="client">Client</option>
                            <option className="text-black" value="agent">Agent</option>
                            <option className="text-black" value="admin">Admin</option>
                            <option className="text-black" value="superadmin">Super Admin</option>
                        </select>
                    ) : (
                        <span className="capitalize">{u.user_type}</span>
                    )}
                  </td>

                  {/* --- STATUS COLUMN (Editable) --- */}
                  <td className={`${tone.td} whitespace-nowrap`}>
                    {isEditing ? (
                        <select 
                            value={editValues.status} 
                            onChange={e => setEditValues(p => ({ ...p, status: e.target.value }))}
                            className={tone.selectEdit}
                        >
                            <option className="text-black" value="active">Active</option>
                            <option className="text-black" value="inactive">Inactive</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${pill}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                            {u.status}
                        </span>
                    )}
                  </td>
                  
                  {/* --- ACTION COLUMN --- */}
                  {isSuperAdmin && (
                    <td className={`${tone.td} whitespace-nowrap`}>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => requestSaveEdit(u)} 
                                    className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" 
                                    title="Save Changes"
                                >
                                    <Check size={16} />
                                </button>
                                <button 
                                    onClick={cancelEdit} 
                                    className="p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors" 
                                    title="Cancel"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => startEdit(u)}
                                    disabled={isBusy || (u.user_type === 'superadmin' && u.user_id !== 999)}
                                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                                        isDark 
                                            ? 'border-white/20 hover:bg-white/10 text-white' 
                                            : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Edit2 size={12} />
                                    Edit
                                </button>
                            </div>
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
        <div>Showing <b>{pageRows.length}</b> of <b>{total}</b></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={tone.paginateBtn}>Previous</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={tone.paginateBtn}>Next</button>
        </div>
      </div>
    </div>
  );
}