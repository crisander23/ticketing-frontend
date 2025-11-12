// components/TicketTable.js
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function TicketTable({
  rows = [],
  role = 'client',
  agentOptions = [],
  onAssign,
  onStatusChange,
  inlineAction = false,
  surface = 'light',
  perPage = 10,
}) {
  const isAdmin = role === 'admin' || role === 'agent';

  // pagination
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  // inline edit state
  const [editRowId, setEditRowId] = useState(null);
  const [draftAgent, setDraftAgent] = useState('');
  const [draftStatus, setDraftStatus] = useState('open');
  const [saving, setSaving] = useState(false);

  const beginEdit = (row) => {
    setEditRowId(row.ticket_id);
    setDraftAgent(row.agent_id ?? '');
    setDraftStatus((row.status || 'open').toLowerCase());
  };
  const cancelEdit = () => { setEditRowId(null); setSaving(false); };
  const saveEdit = async (row) => {
    try {
      setSaving(true);
      const ops = [];
      if (typeof onAssign === 'function' && (draftAgent ?? '') !== (row.agent_id ?? '')) {
        ops.push(onAssign(row.ticket_id, draftAgent ? parseInt(draftAgent, 10) : null));
      }
      if (typeof onStatusChange === 'function' && draftStatus !== (row.status || 'open')) {
        ops.push(onStatusChange(row.ticket_id, draftStatus));
      }
      await Promise.all(ops);
      setEditRowId(null);
    } finally {
      setSaving(false);
    }
  };

  const headCls = 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200';
  const th = 'px-4 py-3 text-left font-semibold';
  const divide = 'divide-y divide-slate-200 dark:divide-slate-800';
  const hover = 'hover:bg-slate-50 dark:hover:bg-slate-800/60';
  const linkCls = 'text-slate-800 hover:underline dark:text-slate-100';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className={headCls}>
          <tr className="text-xs uppercase">
            <th className={th}>ID</th>
            <th className={th}>Title</th>
            {isAdmin && <th className={`${th} hidden md:table-cell`}>Client</th>}
            <th className={th}>Agent</th>
            <th className={th}>Status</th>
            <th className={`${th} whitespace-nowrap hidden sm:table-cell`}>Created</th>
            {isAdmin && <th className={`${th} w-40`}>Action</th>}
          </tr>
        </thead>

        <tbody className={divide}>
          {pageRows.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={7}>
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
            const tone = statusTone((t.status || '').toLowerCase());

            return (
              <tr key={t.ticket_id} className={hover}>
                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap dark:text-slate-100">
                  <Link href={`/tickets/${t.ticket_id}`} className={linkCls}>
                    #{t.ticket_id}
                  </Link>
                </td>

                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{t.title || '(no title)'}</td>

                {isAdmin && (
                  <td className="px-4 py-3 text-slate-700 hidden md:table-cell dark:text-slate-200">{clientName || '—'}</td>
                )}

                <td className="px-4 py-3">
                  {inlineAction && isEditing ? (
                    <select
                      value={draftAgent}
                      onChange={(e) => setDraftAgent(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300
                                 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-slate-700"
                    >
                      <option value="">Unassigned</option>
                      {agentOptions.map((a) => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-700 dark:text-slate-200">{agentName}</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {inlineAction && isEditing ? (
                    <select
                      value={draftStatus}
                      onChange={(e) => setDraftStatus(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300
                                 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-slate-700"
                    >
                      {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${tone.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      {t.status}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-600 whitespace-nowrap hidden sm:table-cell dark:text-slate-400">{created}</td>

                {isAdmin && (
                  <td className="px-4 py-3">
                    {inlineAction ? (
                      isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(t)}
                            disabled={saving}
                            className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-60
                                       dark:bg-slate-700 dark:hover:bg-slate-600"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50
                                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => beginEdit(t)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50
                                     dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Action
                        </button>
                      )
                    ) : (
                      <span className="text-slate-500 text-xs dark:text-slate-400">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="flex items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-600
                      dark:border-slate-800 dark:text-slate-400">
        <div>
          Showing <b>{pageRows.length}</b> of <b>{total}</b> — Page {page}/{totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50 disabled:opacity-50
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50 disabled:opacity-50
                       dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function statusTone(status) {
  switch (status) {
    case 'open':
      return { dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800' };
    case 'in_progress':
      return { dot: 'bg-amber-500',  pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800' };
    case 'resolved':
      return { dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800' };
    case 'closed':
      return { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800' };
    default:
      return { dot: 'bg-slate-400',  pill: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700' };
  }
}
