'use client';

import { useMemo, useState } from 'react';

export default function UserTable({ rows = [], perPage = 10, surface = 'dark' }) {
  const [page, setPage] = useState(1);

  // --- 1. STATE FOR FILTERS ---
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    email: '',
    position: '',
    type: '',
    status: '',
  });

  const handleFilterChange = (key, value) => {
    setPage(1); // Reset to first page on any filter change
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- 2. FILTER LOGIC ---
  const filteredRows = useMemo(() => {
    return rows.filter(u => {
      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase();
      const email = (u.email || '').toLowerCase();
      const position = (u.position || '').toLowerCase();
      const type = (u.user_type || '').toLowerCase();
      const status = (u.status || '').toLowerCase();

      // Check all filters
      if (filters.id && !String(u.user_id).includes(filters.id)) return false;
      if (filters.name && !name.includes(filters.name.toLowerCase())) return false;
      if (filters.email && !email.includes(filters.email.toLowerCase())) return false;
      if (filters.position && !position.includes(filters.position.toLowerCase())) return false;
      if (filters.type && type !== filters.type) return false;
      if (filters.status && status !== filters.status) return false;
      
      return true;
    });
  }, [rows, filters]);
  
  // --- 3. PAGINATION BASED ON FILTERED ROWS ---
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, page, perPage]);

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
    // --- 4. NEW STYLES FOR FILTER ROW ---
    filterCell: `p-2 ${isDark ? 'border-b border-white/10' : 'border-b border-slate-200'}`,
    filterInput: `w-full rounded border px-2 py-1 text-xs ${
      isDark ? 'border-white/15 bg-transparent text-white placeholder-white/60' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
    } focus:outline-none focus:ring-1 focus:ring-blue-500`,
  };

  // --- 5. NEW FILTER INPUT/SELECT COMPONENTS ---
  const FilterInput = ({ filterKey, placeholder }) => (
    <input
      type="text"
      placeholder={placeholder || 'Filter...'}
      value={filters[filterKey]}
      onChange={(e) => handleFilterChange(filterKey, e.target.value)}
      className={tone.filterInput}
    />
  );
  
  const FilterSelect = ({ filterKey, options, placeholder }) => (
    <select
      value={filters[filterKey]}
      onChange={(e) => handleFilterChange(filterKey, e.target.value)}
      className={tone.filterInput}
    >
      <option value="">{placeholder || 'All'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className={tone.wrap}>
      <div className="overflow-x-auto">
        {/* --- 6. FIXED MOBILE OVERFLOW --- */}
        <table className="w-full min-w-[700px] table-auto text-sm">
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
            
            {/* --- 7. NEW FILTER ROW --- */}
            <tr>
              <th className={tone.filterCell}><FilterInput filterKey="id" placeholder="ID..." /></th>
              <th className={tone.filterCell}><FilterInput filterKey="name" placeholder="Name..." /></th>
              <th className={tone.filterCell}><FilterInput filterKey="email" placeholder="Email..." /></th>
              <th className={`${tone.filterCell} hidden md:table-cell`}><FilterInput filterKey="position" placeholder="Position..." /></th>
              <th className={tone.filterCell}>
                <FilterSelect 
                  filterKey="type" 
                  placeholder="All Types"
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'agent', label: 'Agent' },
                    { value: 'client', label: 'Client' },
                  ]}
                />
              </th>
              <th className={tone.filterCell}>
                <FilterSelect 
                  filterKey="status" 
                  placeholder="All Statuses"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </th>
            </tr>
            {/* --- END FILTER ROW --- */}
            
          </thead>
          <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-slate-200'}>
            {pageRows.length === 0 && (
              <tr><td className={`${tone.td} text-center`} colSpan={6}>
                No users found{rows.length > 0 ? ' for these filters' : ''}.
              </td></tr>
            )}
            {pageRows.map((u) => {
              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
              const isActive = (u.status || '').toLowerCase() === 'active';
              const pill = isDark ? 'bg-white/[0.06] text-white border-white/15' : 'bg-slate-100 text-slate-800 border-slate-200';
              const dot = isActive ? (isDark ? 'bg-emerald-400' : 'bg-emerald-600') : (isDark ? 'bg-rose-400' : 'bg-rose-600');
              return (
                <tr key={u.user_id} className={tone.rowHover}>
                  {/* --- 8. ADDED whitespace-nowrap TO CELLS --- */}
                  <td className={`${tone.td} whitespace-nowrap`}>{u.user_id}</td>
                  <td className={`${tone.td} whitespace-nowrap`}>{name}</td>
                  <td className={`${tone.sub} whitespace-nowrap`}>{u.email}</td>
                  <td className={`${tone.sub} hidden md:table-cell whitespace-nowrap`}>{u.position || 'N/A'}</td>
                  <td className={`${tone.sub} whitespace-nowrap`}>{u.user_type}</td>
                  <td className={`${tone.td} whitespace-nowrap`}>
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