'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TicketTable({
  rows = [],
  role = 'client',
  agentOptions = [],
  onAssign,
  onStatusChange,
  onRequestResolve,       // for agent "resolved" modal
  inlineAction = false,
  surface = 'dark',         // 'dark' | 'light'
  perPage = 10,
  showImpact = true,
  agentEditable = true,
}) {
  const router = useRouter(); 
  const isPrivileged = role === 'admin' || role === 'agent';

  // --- 1. STATE FOR FILTERS ---
  const [filters, setFilters] = useState({
    id: '',
    title: '',
    client: '',
    agent: '',
    impact: '',
    status: '',
    created: '',
  });
  
  const handleFilterChange = (key, value) => {
    setPage(1); // Reset to first page on any filter change
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- 2. FILTER LOGIC ---
  const filteredRows = useMemo(() => {
    return rows.filter(t => {
      const clientName = `${t.client_first_name || ''} ${t.client_last_name || ''}`.trim();
      const agentName = (t.agent_first_name ? `${t.agent_first_name} ${t.agent_last_name}`.trim() : (t.agent_name || 'Unassigned')).toLowerCase();
      const created = (t.created_at ? new Date(t.created_at).toLocaleString() : '').toLowerCase();
      const impactNorm = deriveImpact(t);
      const trueStatus = (t.status || 'open').toLowerCase();

      // Check all filters
      if (filters.id && !String(t.ticket_id).includes(filters.id)) return false;
      if (filters.title && !String(t.title || '').toLowerCase().includes(filters.title.toLowerCase())) return false;
      if (isPrivileged && filters.client && !clientName.toLowerCase().includes(filters.client.toLowerCase())) return false;
      if (filters.agent && (filters.agent === 'unassigned' ? agentName !== 'unassigned' : !agentName.includes(filters.agent.toLowerCase()))) return false;
      if (filters.impact && impactNorm !== filters.impact) return false;
      if (filters.status && trueStatus !== filters.status) return false;
      if (filters.created && !created.includes(filters.created.toLowerCase())) return false;
      
      return true;
    });
  }, [rows, filters, isPrivileged]);


  // pagination
  const [page, setPage] = useState(1);
  // --- 3. PAGINATION BASED ON FILTERED ROWS ---
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, page, perPage]);

  // inline edit
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

  // --- MODIFIED: Updated saveEdit logic ---
  const saveEdit = async (row) => {
    try {
      setSaving(true);

      // 1. Get final values from dropdowns
      const finalAgentId = draftAgent ? parseInt(draftAgent, 10) : null;
      let finalStatus = draftStatus;

      const agentDidChange = agentEditable && (finalAgentId ?? null) !== (row.agent_id ?? null);
      
      // 2. NEW LOGIC: If agent changed AND status was 'open', force status to 'in_progress'
      if (agentDidChange && finalStatus === 'open') {
        finalStatus = 'in_progress';
      }

      // 3. Check for resolution modal (using the *final* status)
      if (typeof onRequestResolve === 'function' && finalStatus === 'resolved') {
        setEditRowId(null);
        setSaving(false);
        onRequestResolve(row.ticket_id); // This will handle the API call
        return; // Stop here, modal will take over
      }

      // 4. Send API calls
      const ops = [];
      
      // Send agent update if it changed
      if (agentDidChange && typeof onAssign === 'function') {
        ops.push(onAssign(row.ticket_id, finalAgentId));
      }
      
      // Send status update if the *final* status is different from original
      if (finalStatus !== (row.status || 'open') && typeof onStatusChange === 'function') {
        ops.push(onStatusChange(row.ticket_id, finalStatus));
      }

      await Promise.all(ops);
      setEditRowId(null);
    } finally { setSaving(false); }
  };
  // --- END MODIFIED BLOCK ---

  // theme tokens
  const isDark = surface === 'dark';
  const tone = {
    tableWrap: `overflow-hidden rounded-xl border ${isDark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'}`,
    head: isDark ? 'bg-white/10 text-white/90' : 'bg-slate-50 text-slate-700',
    th: 'px-4 py-3 text-left text-xs uppercase font-semibold',
    // --- 4. NEW STYLE FOR FILTER ROW ---
    filterCell: `p-2 ${isDark ? 'border-b border-white/10' : 'border-b border-slate-200'}`,
    filterInput: `w-full rounded border px-2 py-1 text-xs ${
      isDark ? 'border-white/15 bg-transparent text-white placeholder-white/60' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
    } focus:outline-none focus:ring-1 focus:ring-blue-500`,
    
    rowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50',
    td: `px-4 py-3 ${isDark ? 'text-white/90' : 'text-slate-800'}`,
    sub: isDark ? 'text-white/80' : 'text-slate-700',
    pale: isDark ? 'text-white/70' : 'text-slate-500',
    input: `rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 ${
      isDark ? 'border-white/15 bg-transparent text-white focus:ring-blue-500' : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-300'
    }`,
    paginateBtn: `rounded-md px-2 py-1 ${
      isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10 disabled:opacity-50' :
               'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50'
    }`,
    actionBtn: `rounded-lg px-3 py-1.5 text-xs font-semibold ${
      isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10' :
               'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
    }`,
    footer: `flex items-center justify-between p-3 border-t ${isDark ? 'border-white/10 text-white/80' : 'border-slate-200 text-slate-600'} text-xs`,
  };

  // Derive/normalize Impact from multiple fields/encodings
  const deriveImpact = (row) => {
    // Try common field names
    let raw =
      row.impact ??
      row.impact_level ??
      row.priority ??
      row.severity ??
      row.p ??
      row.Impact ?? // if backend sends PascalCase
      '';

    // Some backends send numbers (0..4) or strings like "1"
    if (raw === 0 || raw === 1 || raw === 2 || raw === 3 || raw === 4) raw = String(raw);
    if (typeof raw !== 'string') raw = String(raw ?? '');

    const v = raw.trim().toLowerCase();

    // Map various aliases/numerics to standard buckets
    if (!v) return ''; // truly unknown

    // Numeric or p-levels
    if (['0', 'p0', 'p-0'].includes(v)) return 'critical';
    if (['1', 'p1', 'p-1'].includes(v)) return 'high';
    if (['2', 'p2', 'p-2'].includes(v)) return 'medium';
    if (['3', '4', 'p3', 'p4', 'p-3', 'p-4'].includes(v)) return 'low';

    // Wordy aliases
    if (['critical', 'severe', 'blocker', 'urgent', 'system down'].includes(v)) return 'critical';
    if (['high', 'major', 'key', 'important'].includes(v)) return 'high';
    if (['medium', 'moderate', 'normal'].includes(v)) return 'medium';
    if (['low', 'minor', 'trivial'].includes(v)) return 'low';

    // If they put full sentences, attempt quick keyword match
    if (v.includes('critical')) return 'critical';
    if (v.includes('high')) return 'high';
    if (v.includes('medium')) return 'medium';
    if (v.includes('low')) return 'low';
    if (v.includes('p0')) return 'critical';
    if (v.includes('p1')) return 'high';
    if (v.includes('p2')) return 'medium';
    if (v.includes('p3') || v.includes('p4')) return 'low';

    return ''; // unknown
  };

  // SAFE colgroup (no whitespace text nodes)
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

  // --- 5. NEW FILTER INPUT COMPONENT ---
  const FilterInput = ({ filterKey, placeholder }) => (
    <input
      type="text"
      placeholder={placeholder || 'Filter...'}
      value={filters[filterKey]}
      onChange={(e) => handleFilterChange(filterKey, e.target.value)}
      onClick={(e) => e.stopPropagation()} // Prevent row click
      className={tone.filterInput}
    />
  );
  
  // --- 6. NEW FILTER SELECT COMPONENT ---
  const FilterSelect = ({ filterKey, options, placeholder }) => (
    <select
      value={filters[filterKey]}
      onChange={(e) => handleFilterChange(filterKey, e.target.value)}
      onClick={(e) => e.stopPropagation()} // Prevent row click
      className={tone.filterInput}
    >
      <option value="">{placeholder || 'All'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className={tone.tableWrap}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
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
            
            {/* --- 7. NEW FILTER ROW --- */}
            <tr>
              <th className={tone.filterCell}><FilterInput filterKey="id" placeholder="ID..." /></th>
              <th className={tone.filterCell}><FilterInput filterKey="title" placeholder="Title..." /></th>
              {isPrivileged && <th className={`${tone.filterCell} hidden md:table-cell`}><FilterInput filterKey="client" placeholder="Client..." /></th>}
              <th className={tone.filterCell}>
                {isPrivileged ? (
                  <FilterSelect 
                    filterKey="agent" 
                    placeholder="All Agents"
                    options={[
                      { value: 'unassigned', label: 'Unassigned' },
                      ...agentOptions.map(a => ({ value: a.label.toLowerCase(), label: a.label }))
                    ]}
                  />
                ) : (
                  <FilterInput filterKey="agent" placeholder="Agent..." />
                )}
              </th>
              {showImpact && (
                <th className={tone.filterCell}>
                  <FilterSelect 
                    filterKey="impact" 
                    placeholder="All Impacts"
                    options={[
                      { value: 'critical', label: 'Critical' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
                    ]}
                  />
                </th>
              )}
              <th className={tone.filterCell}>
                <FilterSelect 
                  filterKey="status" 
                  placeholder="All Statuses"
                  options={[
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
              </th>
              <th className={`${tone.filterCell} hidden sm:table-cell`}><FilterInput filterKey="created" placeholder="Date..." /></th>
              {isPrivileged && <th className={tone.filterCell}></th>}
            </tr>
            {/* --- END FILTER ROW --- */}
            
          </thead>

          <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-slate-200'}>
            {pageRows.length === 0 && (
              <tr>
                <td className={`px-4 py-8 text-center ${tone.pale}`} colSpan={isPrivileged ? (showImpact ? 8 : 7) : (showImpact ? 7 : 6)}>
                  No tickets found{rows.length > 0 ? ' for these filters' : ''}.
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

              // --- MODIFIED: Client-side status display logic ---
              const trueStatus = (t.status || 'open').toLowerCase();
              let displayStatus = trueStatus;
          
              // If role is client, map 'resolved' to 'in_progress'
              if (role === 'client' && trueStatus === 'resolved') {
                displayStatus = 'in_progress';
              }
              // --- END MODIFIED ---

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

                  <td className={tone.td}>{t.title || '(no title)'}</td>

                  {isPrivileged && (
                    <td className={`${tone.td} hidden md:table-cell`}>{clientName || '—'}</td>
                  )}

                  <td className={tone.td}>
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
                    <td className={tone.td}>
                      <ImpactBadge value={impactNorm} dark={isDark} />
                    </td>
                  )}

                  <td className={tone.td}>
                    {inlineAction && isEditing ? (
                      <select
                        value={draftStatus} // This uses the real status for editing
                        onChange={(e) => setDraftStatus(e.target.value)}
                        onClick={(e) => e.stopPropagation()} 
                        className={tone.input}
                      >
                        {/* Admin/Agent can see all statuses in dropdown */}
                        {['open','in_progress','resolved','closed'].map(s => (
                          <option className="text-black" key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      // This uses the new mapped status for display
                      <StatusSolid value={displayStatus} />
                    )}
                  </td>

                  <td className={`${tone.td} whitespace-nowrap hidden sm:table-cell`}>{created}</td>

                  {isPrivileged && (
                    <td className={tone.td}>
                      {inlineAction ? (
                        isEditing ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); saveEdit(t); }} 
                              disabled={saving}
                              className={isDark ? 'rounded-lg bg-white text-gray-900 px-3 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-60'
                                              : 'rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-60'}>
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); cancelEdit(); }} 
                              disabled={saving}
                              className={isDark ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10 px-3 py-1.5 text-xs'
                                              : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 px-3 py-1.5 text-xs'}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); beginEdit(t); }}
                            className={isDark ? 'rounded-lg border border-white/15 bg-transparent text-white hover:bg-white/10 px-3 py-1.5 text-xs'
                                            : 'rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 px-3 py-1.5 text-xs'}>
                            Action
                          </button>
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

      {/* Pagination */}
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

/* ===== Robust Impact badge (now recognizes many encodings) ===== */
function ImpactBadge({ value, dark }) {
  const v = (value || '').toString().toLowerCase();

  // default: visible neutral chip (no more translucent '—')
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