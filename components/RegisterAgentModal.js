'use client';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function RegisterAgentModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    department: 'Support', position: 'Agent',
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: { ...form, user_type: 'agent', status: 'active' },
      });
      onSuccess?.();
      onClose?.();
    } catch (e) {
      alert(e.message || 'Failed to register agent');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register New Agent"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Register Agent'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="First name" value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))}/>
        <Input placeholder="Last name" value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))}/>
        <div className="col-span-2"><Input placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
        <div className="col-span-2"><Input placeholder="Initial Password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>
        <Input placeholder="Department" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}/>
        <Input placeholder="Position" value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))}/>
      </div>
    </Modal>
  );
}
