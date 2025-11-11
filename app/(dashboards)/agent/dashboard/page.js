'use client';

import useSWR from 'swr';
import Header from '@/components/Header';
import TicketTable from '@/components/TicketTable';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AgentDashboardPage() {
  const { user } = useAuthStore();
  const agentId = user?.user_id;

  const { data: tickets, mutate } = useSWR(
    agentId ? `/tickets?agent_id=${agentId}` : null,
    fetcher
  );

  // Notification rule: total assigned tickets
  const notifCount = (tickets || []).length;

  async function onStatusChange(ticketId, newStatus) {
    await apiFetch(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: { status: newStatus },
    });
    mutate();
  }

  return (
    <div>
      <Header
        title="Agent Dashboard"
        subtitle={`Logged in as ${user?.email} (Agent)`}
        notifCount={notifCount}
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">My Assigned Tickets</h2>
          <TicketTable
            rows={tickets || []}
            role="agent"
            onStatusChange={onStatusChange}
          />
        </section>
      </div>
    </div>
  );
}
