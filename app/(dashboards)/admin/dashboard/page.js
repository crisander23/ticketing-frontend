'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import TicketTable from '@/components/TicketTable';
import UserTable from '@/components/UserTable';
import Button from '@/components/ui/Button';
import RegisterAgentModal from '@/components/RegisterAgentModal';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [openReg, setOpenReg] = useState(false);

  const { data: tickets, mutate: mutateTickets } = useSWR('/tickets', fetcher);
  const { data: users, mutate: mutateUsers } = useSWR('/admin/users', fetcher);

  // Notification rule: admin sees count of open tickets
  const notifCount = (tickets || []).filter(t => t.status === 'open').length;

  const agentOptions = useMemo(() => (users || [])
    .filter(u => (u.user_type || '').toLowerCase() === 'agent' && (u.status || '').toLowerCase() === 'active')
    .map(u => ({ id: u.user_id, label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }))
    .sort((a, b) => a.label.localeCompare(b.label)), [users]);

  async function onAssign(ticketId, agentId) {
    await apiFetch(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: { agent_id: agentId, status: 'in_progress' },
    });
    mutateTickets();
  }

  async function onStatusChange(ticketId, newStatus) {
    await apiFetch(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: { status: newStatus },
    });
    mutateTickets();
  }

  return (
    <div>
      <Header
        title="Admin Dashboard"
        subtitle={`Logged in as ${user?.email} (Admin)`}
        notifCount={notifCount}
        extra={<Button variant="primary" onClick={() => setOpenReg(true)}>Register Agent</Button>}
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">All Tickets</h2>
          <TicketTable
            rows={tickets || []}
            role="admin"
            agentOptions={agentOptions}
            onAssign={onAssign}
            onStatusChange={onStatusChange}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">User Management</h2>
          <UserTable rows={users || []} />
        </section>
      </div>

      <RegisterAgentModal
        open={openReg}
        onClose={() => setOpenReg(false)}
        onSuccess={() => mutateUsers()}
      />
    </div>
  );
}
