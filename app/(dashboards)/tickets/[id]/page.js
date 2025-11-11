'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { routeForUser } from '@/lib/guards';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ResolutionModal from '@/components/ResolutionModal';

/* =========================
   Normalizers tailored to your API
   ========================= */

function pick(obj, keys, fallback = undefined) {
  for (const k of keys) {
    const v = k.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
    if (v !== undefined && v !== null) return v;
  }
  return fallback;
}

function normalizeAttachment(a, idx = 0) {
  const id = pick(a, ['attachment_id', 'id']);
  const filename = pick(a, ['filename', 'original_name', 'name', 'file_name'], 'download');
  const path = pick(a, ['url', 'path', 'file_url', 'location']);
  return {
    id: id ?? `${filename}-${idx}`,
    filename,
    url: path,
  };
}

function normalizeNote(n, idx = 0) {
  // Your notes: { id, authorFullName, note_text, created_at }
  const id = pick(n, ['note_id', 'id']) ?? `${pick(n, ['created_at'], '')}-${idx}`;
  const text = pick(n, ['note', 'note_text', 'text', 'content', 'body'], '');
  const author = pick(n, ['author_name', 'authorFullName', 'user_name', 'user.full_name'], 'Unknown');
  const createdAt = pick(n, ['created_at', 'timestamp', 'date'], null);
  return { id, text, author, createdAt };
}

function normalizeTicket(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // Your API: { ticket: {...}, client: {...}, attachments: [...] }
  const t = raw.ticket ?? raw;
  const client = raw.client ?? {};
  const rawAttachments = Array.isArray(raw.attachments) ? raw.attachments : (t.attachments || []);

  const ticket_id = pick(t, ['ticket_id', 'id']);
  const title = pick(t, ['title'], '(no title)');
  const status = pick(t, ['status'], 'open');
  const impact = pick(t, ['impact'], '-');
  const category = pick(t, ['category'], '-');
  const description = pick(t, ['description'], '-');
  const resolution_details = pick(t, ['resolution_details'], null);

  const customer_id = pick(t, ['customer_id']);
  const customer_first_name = pick(client, ['first_name'], '');
  const customer_last_name = pick(client, ['last_name'], '');
  const customer_name = `${customer_first_name} ${customer_last_name}`.trim();
  const customer_email = pick(client, ['email'], '');
  const customer_department = pick(client, ['department'], '');
  const customer_position = pick(client, ['position'], '');

  const agent_id = pick(t, ['agent_id'], null);
  const agent_first_name = pick(t, ['agent_first_name'], '');
  const agent_last_name = pick(t, ['agent_last_name'], '');
  const agent_name = `${agent_first_name} ${agent_last_name}`.trim() || null;

  const updated_at = pick(t, ['updated_at']);

  const attachments = Array.isArray(rawAttachments)
    ? rawAttachments.map((a, idx) => normalizeAttachment(a, idx))
    : [];

  return {
    ticket_id,
    title,
    status,
    impact,
    category,
    description,
    resolution_details,
    customer_id,
    customer_first_name,
    customer_last_name,
    customer_name,
    customer_email,
    customer_department,
    customer_position,
    agent_id,
    agent_name,
    updated_at,
    attachments,
  };
}

/* =========================
   Page Component
   ========================= */

export default function TicketDetailPage() {
  const { id } = useParams(); // e.g., "6"
  const router = useRouter();
  const { user } = useAuthStore();

  const rolePath = routeForUser(user);
  const isAdmin = rolePath === '/admin/dashboard';
  const isAgent = rolePath === '/agent/dashboard';
  const canManage = isAdmin || isAgent;

  // Ticket + Notes (via /api proxy from next.config.mjs rewrites)
  const { data: rawTicket, isLoading, error, mutate } = useSWR(
    id ? `/tickets/${id}` : null,
    fetcher
  );
  const { data: rawNotes, mutate: mutateNotes } = useSWR(
    canManage && id ? `/tickets/${id}/notes` : null,
    fetcher
  );

  // Agents (admin only)
  const { data: allUsers } = useSWR(isAdmin ? '/admin/users' : null, fetcher);

  const [showDebug, setShowDebug] = useState(false);

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const normalized = useMemo(() => normalizeTicket(rawTicket), [rawTicket]);

  const [status, setStatus] = useState('');
  const [showResolution, setShowResolution] = useState(false);
  const pendingStatusRef = useRef(null);

  useEffect(() => {
    if (normalized?.status) setStatus(normalized.status);
  }, [normalized]);

  // Build agent options (active agents)
  const agentOptions = useMemo(() => {
    if (!isAdmin || !Array.isArray(allUsers)) return [];
    return allUsers
      .filter(u => (u.user_type || '').toLowerCase() === 'agent')
      .filter(u => (u.status || '').toLowerCase() === 'active')
      .map(u => ({
        id: u.user_id,
        label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allUsers, isAdmin]);

  // Normalize notes array
  const notes = useMemo(() => {
    const arr = Array.isArray(rawNotes) ? rawNotes : rawNotes?.notes;
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map((n, idx) => normalizeNote(n, idx));
  }, [rawNotes]);

  // Status handling
  async function updateStatus(newStatus, resolution_details) {
    await apiFetch(`/tickets/${id}`, {
      method: 'PUT',
      body: { status: newStatus, resolution_details: resolution_details || undefined },
    });
    await mutate();                  // refresh this ticket
    globalMutate('/tickets');        // refresh admin lists
    if (isAgent) globalMutate(`/tickets?agent_id=${user.user_id}`);
    if (rolePath === '/client/dashboard') {
      globalMutate(`/tickets/my?customer_id=${user.user_id}`);
    }
  }

  async function onChangeStatus(e) {
    const next = e.target.value;
    setStatus(next);
    if (next === 'resolved') {
      pendingStatusRef.current = next;
      setShowResolution(true);
    } else {
      try {
        await updateStatus(next);
      } catch (err) {
        alert(err.message || 'Failed to update status');
      }
    }
  }

  async function onSaveResolution(resolutionText) {
    const next = pendingStatusRef.current || 'resolved';
    setShowResolution(false);
    try {
      await updateStatus(next, resolutionText);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  }

  // Assign agent — auto set status to 'in_progress'
 async function assignAgent(newAgentId) {
  // 1) prevent placeholder/empty
  if (newAgentId === '' || newAgentId == null) {
    alert('Please select a valid agent.');
    return;
  }

  // 2) coerce → integer and validate
  const agentIdInt = parseInt(newAgentId, 10);
  if (!Number.isInteger(agentIdInt) || agentIdInt <= 0) {
    alert('Invalid agent id.');
    return;
  }

  // 3) only allow known statuses
  const nextStatus = 'in_progress';

  try {
    await apiFetch(`/tickets/${id}`, {
      method: 'PUT',
      body: {
        agent_id: agentIdInt,
        status: nextStatus, // backend expects one of: open/in_progress/resolved/closed
      },
    });

    // immediate UI feedback
    setStatus(nextStatus);

    // revalidate everywhere
    await mutate();
    globalMutate('/tickets');
    globalMutate(`/tickets/${id}`);
    if (isAgent) globalMutate(`/tickets?agent_id=${user.user_id}`);
    if (rolePath === '/client/dashboard') {
      globalMutate(`/tickets/my?customer_id=${user.user_id}`);
    }
  } catch (err) {
    // show raw server message to help debugging
    alert(err.message || 'Failed to assign agent.');
  }
}


  async function addNote(text) {
    if (!text?.trim()) return;
    await apiFetch(`/tickets/${id}/notes`, {
      method: 'POST',
      body: { note: text },
    });
    mutateNotes();
  }

  async function uploadAttachment() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file); // adjust if backend expects different field name
      const res = await fetch(`/api/tickets/${id}/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      await mutate(); // refresh ticket attachments
      fileRef.current.value = '';
    } catch (err) {
      alert(err.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  }

  /* ---------- Render states ---------- */
  if (!id) return <div className="card p-6 text-red-600">No ticket ID in URL.</div>;
  if (isLoading) return <div className="card p-6">Loading…</div>;
  if (error) return <div className="card p-6 text-red-600">Failed to load ticket.</div>;
  if (!normalized) {
    return (
      <div className="space-y-4">
        <div className="card p-6 text-red-600">No ticket data returned for ID: {id}</div>
        <DebugPanel show data={{ id, rawTicket, normalized }} />
      </div>
    );
  }

  // Client compact
  const clientInfo = {
    name: normalized.customer_name || '-',
    email: normalized.customer_email || '-',
    id: normalized.customer_id ?? '-',
    dept: normalized.customer_department || '-',
    pos: normalized.customer_position || '-',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Ticket #{normalized.ticket_id ?? id} — {normalized.title}
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowDebug((s) => !s)}>{showDebug ? 'Hide' : 'Show'} debug</Button>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>

      {showDebug && (
        <DebugPanel show data={{ id, rawTicket, normalized, rawNotes, notes, agentOptions }} />
      )}

      {/* Meta */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-1">
            {canManage ? (
              <Select value={status} onChange={onChangeStatus}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </Select>
            ) : (
              <div className="inline-block rounded-lg border border-[var(--line)] px-3 py-1">
                {normalized.status}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">Impact</div>
          <div className="mt-1">{normalized.impact}</div>

          <div className="mt-4 text-sm text-gray-600">Category</div>
          <div className="mt-1">{normalized.category}</div>

          {normalized?.resolution_details && (
            <>
              <div className="mt-4 text-sm text-gray-600">Resolution</div>
              <div className="mt-1 whitespace-pre-wrap">{normalized.resolution_details}</div>
            </>
          )}
        </div>

        <div className="card p-4">
          <div className="text-sm text-gray-600">Client</div>
          <div className="mt-1 space-y-1">
            <div className="font-medium">{clientInfo.name}</div>
            <div className="text-sm text-gray-600">{clientInfo.email}</div>
            <div className="text-xs text-gray-500">ID: {clientInfo.id}</div>
            <div className="text-xs text-gray-500">Dept: {clientInfo.dept} · Position: {clientInfo.pos}</div>
          </div>

          <div className="mt-4 text-sm text-gray-600">Assigned Agent</div>
          <div className="mt-1">
            {isAdmin ? (
              <Select
                value={normalized.agent_id || ''}
                onChange={(e) => assignAgent(e.target.value)}
              >
                <option value="">— Select agent —</option>
                {agentOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </Select>
            ) : (
              <div className="inline-block rounded-lg border border-[var(--line)] px-3 py-1">
                {normalized.agent_name || '—'}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">Updated</div>
          <div className="mt-1">
            {normalized.updated_at ? new Date(normalized.updated_at).toLocaleString() : '-'}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card p-4">
        <div className="text-sm text-gray-600">Description</div>
        <div className="mt-1 whitespace-pre-wrap">{normalized.description}</div>
      </div>

      {/* Attachments */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Attachments</div>
          {canManage && (
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" className="text-sm" />
              <Button onClick={uploadAttachment} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          )}
        </div>

        <ul className="mt-3 space-y-1 text-sm">
          {(normalized.attachments || []).length === 0 && (
            <li className="text-gray-500">No attachments</li>
          )}

          {(normalized.attachments || []).map((a, idx) => (
            <li key={a.id ?? `${a.filename}-${idx}`}>
              <a className="underline" href={a.url} target="_blank" rel="noreferrer">
                {a.filename}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Internal Notes (Admin/Agent only) */}
      {canManage && (
        <div className="card p-4 space-y-4">
          <div className="font-medium">Internal Notes</div>
          <NoteComposer onAdd={addNote} />

          <div className="space-y-3">
            {(notes || []).length === 0 && (
              <div className="text-sm text-gray-500">No notes yet.</div>
            )}

            {(notes || []).map((n, idx) => (
              <div key={n.id ?? `${n.createdAt || ''}-${idx}`} className="rounded-lg border border-[var(--line)] p-3">
                <div className="text-xs text-gray-600">
                  {n.author} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResolutionModal
        open={showResolution}
        onClose={() => setShowResolution(false)}
        onSubmit={onSaveResolution}
      />
    </div>
  );
}

/* ——— tiny inline component for notes composer ——— */
function NoteComposer({ onAdd }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onAdd(text);
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2">
      <textarea
        rows={3}
        className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/5"
        placeholder="Add an internal note (visible to admins/agents only)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={save} variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Add Note'}
        </Button>
      </div>
    </div>
  );
}

/* ——— compact debug card ——— */
function DebugPanel({ show = true, data }) {
  if (!show) return null;
  return (
    <div className="card p-4 text-xs overflow-auto">
      <div className="font-medium">Debug (raw & normalized)</div>
      <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
