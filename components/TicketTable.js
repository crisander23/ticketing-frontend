'use client';

import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

/**
 * Reusable Notion-like tickets table.
 * Props:
 * - rows: array of ticket rows (must include ticket_id, title, status, created_at)
 * - role: 'admin' | 'agent' | 'client'
 * - onAssign?: (ticketId:number, agentId:number) => void  // admin only
 * - agentOptions?: [{id:number,label:string}]             // admin only
 * - onStatusChange?: (ticketId:number, newStatus:string) => void // admin/agent
 */
export default function TicketTable({
  rows = [],
  role = 'client',
  onAssign,
  agentOptions = [],
  onStatusChange,
}) {
  const isAdmin = role === 'admin';
  const isAgent = role === 'agent';
  const showAssign = isAdmin && typeof onAssign === 'function';
  const showStatus = (isAdmin || isAgent) && typeof onStatusChange === 'function';

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Title</th>
            {(isAdmin || isAgent) && <th className="px-4 py-3 text-left">Client</th>}
            <th className="px-4 py-3 text-left">Agent</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--line)]">
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                No tickets found.
              </td>
            </tr>
          )}

          {rows.map((t) => {
            const clientName = `${t.client_first_name || ''} ${t.client_last_name || ''}`.trim();
            const agentName = t.agent_first_name
              ? `${t.agent_first_name} ${t.agent_last_name}`.trim()
              : (t.agent_name || 'Unassigned');
            const created = t.created_at ? new Date(t.created_at).toLocaleString() : '-';

            return (
              <tr key={t.ticket_id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/tickets/${t.ticket_id}`} className="text-blue-600 hover:underline">
                    #{t.ticket_id}
                  </Link>
                </td>

                <td className="px-4 py-3">{t.title || '(no title)'}</td>

                {(isAdmin || isAgent) && (
                  <td className="px-4 py-3">{clientName || '-'}</td>
                )}

                <td className="px-4 py-3">
                  {showAssign ? (
                    <select
                      className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1 text-sm"
                      defaultValue={t.agent_id ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') return;
                        const intVal = parseInt(val, 10);
                        if (Number.isInteger(intVal) && intVal > 0) onAssign(t.ticket_id, intVal);
                      }}
                    >
                      <option value="">Unassigned</option>
                      {agentOptions.map((a) => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{agent_first_name}</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {showStatus ? (
                    <select
                      className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-sm"
                      defaultValue={t.status}
                      onChange={(e) => onStatusChange(t.ticket_id, e.target.value)}
                    >
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="resolved">resolved</option>
                      <option value="closed">closed</option>
                    </select>
                  ) : (
                    <StatusBadge value={t.status} asClient={role === 'client'} />
                  )}
                </td>

                <td className="px-4 py-3">{created}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
