'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function TicketAudit({ ticketId, theme = 'dark' }) {
  // Fetch from the new history endpoint
  const { data: logs, isLoading } = useSWR(ticketId ? `/tickets/${ticketId}/history` : null, fetcher);

  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/60' : 'text-slate-500';
  const timelineLine = isDark ? 'bg-white/10' : 'bg-slate-200';
  
  // Helper to format the log message based on your DB columns
  const getLogMessage = (log) => {
    const field = log.field_changed;
    const oldVal = log.old_value;
    const newVal = log.new_value;

    if (field === 'Ticket Created') return `Ticket created. ${newVal}`;
    if (field === 'Resolution Added') return `Resolution details updated.`;
    
    // Default format: "Changed [Field] from [Old] to [New]"
    if (oldVal && newVal) {
        return `Changed ${field} from "${oldVal}" to "${newVal}"`;
    }
    
    // Fallback if old value is missing
    return `${field} updated to "${newVal}"`;
  };

  if (isLoading) return <div className={`text-xs ${textSub} p-4`}>Loading history...</div>;
  if (!logs || logs.length === 0) return <div className={`text-xs ${textSub} p-4`}>No history yet.</div>;

  return (
    <div className="space-y-6 relative p-2">
      {/* Vertical Line */}
      <div className={`absolute left-[19px] top-4 bottom-4 w-px ${timelineLine}`} />

      {logs.map((log) => (
        <div key={log.id} className="relative flex gap-4 items-start group">
          {/* Dot */}
          <div className={`relative z-10 h-2.5 w-2.5 mt-1.5 rounded-full shrink-0 
            ${getActionColor(log.field_changed)} ring-4 ${isDark ? 'ring-[#0f172a]' : 'ring-slate-100'}`} 
          />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <p className={`text-sm font-medium ${textMain}`}>
                {getLogMessage(log)}
              </p>
              <span className={`text-xs ${textSub}`}>
                {new Date(log.changed_at).toLocaleString()}
              </span>
            </div>
            <p className={`text-xs ${textSub} mt-0.5`}>
              by <span className={isDark ? 'text-white/80' : 'text-slate-700'}>
                {log.first_name} {log.last_name}
              </span> ({log.user_type})
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getActionColor(field) {
  switch (field) {
    case 'Ticket Created': return 'bg-blue-500';
    case 'Status': return 'bg-amber-500';
    case 'Agent Assigned': return 'bg-purple-500';
    case 'Resolution Added': return 'bg-emerald-500';
    default: return 'bg-slate-500';
  }
}