'use client';
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { apiFetch } from '@/lib/api';
import { redirect, useRouter } from 'next/navigation';

export default function CreateTicketPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  if (!user) redirect('/login');
  if (user.user_type !== 'client') redirect('/login');

  const [form, setForm] = useState({ title:'', category:'', impact:'', description:'' });

  const create = async () => {
    try {
      await apiFetch('/tickets', { method:'POST', body: { ...form, customer_id: user.user_id } });
      router.replace('/client/dashboard');
    } catch (e) { alert(e.message || 'Failed to create ticket'); }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Create Ticket</h1>
      <div className="card p-6 space-y-4">
        <Input label="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
        <Input label="Category" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}/>
        <Select label="Impact" value={form.impact} onChange={e=>setForm({...form, impact:e.target.value})}>
          <option value="">Select impact</option>
          <option>low</option><option>medium</option><option>high</option>
        </Select>
        <label className="block space-y-1.5">
          <span className="text-sm text-gray-700">Description</span>
          <textarea className="input min-h-[120px]" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
        </label>
        <div className="flex justify-end">
          <Button variant="primary" onClick={create}>Submit</Button>
        </div>
      </div>
    </div>
  );
}
