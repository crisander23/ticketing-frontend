'use client';

import Link from 'next/link';
import useSWR from 'swr';
import Header from '@/components/Header';
import TicketTable from '@/components/TicketTable';
import Button from '@/components/ui/Button';
import { fetcher } from '@/lib/fetcher';
import { useAuthStore } from '@/store/useAuthStore';

export default function ClientDashboardPage() {
  const { user } = useAuthStore();
  const customerId = user?.user_id;

  const { data: tickets } = useSWR(
    customerId ? `/tickets/my?customer_id=${customerId}` : null,
    fetcher
  );

  // Notification rule: tickets not "open" (in_progress, resolved, closed)
  const notifCount = (tickets || []).filter(t =>
    t.status === 'in_progress' || t.status === 'resolved' || t.status === 'closed'
  ).length;

  return (
    <div>
      <Header
        title="Client Dashboard"
        subtitle={`Logged in as ${user?.email} (Client)`}
        notifCount={notifCount}
        extra={
          <Link href="/create-ticket">
            <Button variant="primary">Create New Ticket</Button>
          </Link>
        }
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">My Tickets</h2>
          <TicketTable rows={tickets || []} role="client" />
        </section>
      </div>
    </div>
  );
}
