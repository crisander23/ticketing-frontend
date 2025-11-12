// components/UserTable.js
'use client';

import { useMemo, useState } from 'react';

export default function UserTable({ rows = [], perPage = 10 }) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          <tr className="text-xs uppercase">
            <th className="px-4 py-3 text-left font-semibold">ID</th>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Email</th>
            <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Position</th>
            <th className="px-4 py-3 text-left font-semibold">Type</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {pageRows.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={6}>No users.</td>
            </tr>
          )}

          {pageRows.map((u) => {
            const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
            const isActive = (u.status || '').toLowerCase() === 'active';

            return (
              <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{u.user_id}</td>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{name}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.email}</td>
                <td className="px-4 py-3 text-slate-700 hidden md:table-cell dark:text-slate-200">{u.position || 'N/A'}</td>
                <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">{u.user_type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {u.status}
                  </span>
                </td>
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
