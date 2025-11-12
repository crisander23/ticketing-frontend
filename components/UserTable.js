'use client';

import { useMemo, useState } from 'react';

export default function UserTable({ rows = [], perPage = 10, surface = 'dark' }) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

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
  };

  return (
    <div className={tone.wrap}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[80px]" />
            <col />
            <col />
            <col className="hidden md:table-column w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className={tone.head}>
            <tr>
              <th className={tone.th}>ID</th>
              <th className={tone.th}>Name</th>
              <th className={tone.th}>Email</th>
              <th className={`${tone.th} hidden md:table-cell`}>Position</th>
              <th className={tone.th}>Type</th>
              <th className={tone.th}>Status</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-slate-200'}>
            {pageRows.length === 0 && (
              <tr><td className={`${tone.td} text-center`} colSpan={6}>No users.</td></tr>
            )}
            {pageRows.map((u) => {
              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
              const isActive = (u.status || '').toLowerCase() === 'active';
              const pill = isDark ? 'bg-white/[0.06] text-white border-white/15' : 'bg-slate-100 text-slate-800 border-slate-200';
              const dot = isActive ? (isDark ? 'bg-emerald-400' : 'bg-emerald-600') : (isDark ? 'bg-rose-400' : 'bg-rose-600');
              return (
                <tr key={u.user_id} className={tone.rowHover}>
                  <td className={tone.td}>{u.user_id}</td>
                  <td className={tone.td}>{name}</td>
                  <td className={tone.sub}>{u.email}</td>
                  <td className={`${tone.sub} hidden md:table-cell`}>{u.position || 'N/A'}</td>
                  <td className={tone.sub}>{u.user_type}</td>
                  <td className={tone.td}>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                      {u.status}
                    </span>
                  </td>
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
