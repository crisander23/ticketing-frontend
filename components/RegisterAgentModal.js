'use client';

import Modal from './ui/Modal';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function RegisterAgentModal({ open, onClose, onSuccess, theme = 'dark' }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    department: 'Support', position: 'Agent',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Copied theme styles from your admin page ---
  const isDark = theme === 'dark';

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/80' : 'text-slate-600';

  const inputField = `w-full rounded-lg px-3 py-2 text-sm ${
    isDark 
      ? 'bg-white/10 border border-white/15 text-white placeholder-white/60' 
      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
  } outline-none focus:ring-2 focus:ring-blue-500`;

  const buttonGhost = `rounded-lg px-3 py-2 text-sm ${isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10' : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'}`;
  const buttonPrimary = `rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-slate-900 text-white hover:bg-slate-800'} disabled:opacity-60`;

  const errorBox = isDark
    ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100 px-4 py-3 text-sm'
    : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm';
  // --- End theme styles ---

  // Helper component for styled inputs
  const FormInput = ({ label, id, ...props }) => (
    <div>
      <label htmlFor={id} className={`block text-xs font-medium mb-1 ${textSub}`}>
        {label}
      </label>
      <input id={id} className={inputField} {...props} />
    </div>
  );

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      // Basic validation
      if (!form.first_name || !form.last_name || !form.email || !form.password) {
        throw new Error('All fields are required.');
      }
      
      await apiFetch('/admin/users', {
        method: 'POST',
        body: { ...form, user_type: 'agent', status: 'active' },
      });
      onSuccess?.();
      onClose?.(); // Close on success
      setForm({ // Reset form
        first_name: '', last_name: '', email: '', password: '',
        department: 'Support', position: 'Agent',
      });
    } catch (e) {
      setError(e.message || 'Failed to register agent');
    } finally {
      setSaving(false);
    }
  }

  // Use a custom close handler to also clear errors
  const handleClose = () => {
    setError(null);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      // --- 2. Pass theme styles to the Modal and its slots ---
      surface={theme === 'dark' ? 'dark' : 'light'}
      title={<span className={textMain}>Register New Agent</span>}
      footer={
        <div className="flex justify-end gap-2">
          <button className={buttonGhost} onClick={handleClose}>Cancel</button>
          <button className={buttonPrimary} onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Register Agent'}
          </button>
        </div>
      }
    >
      {/* --- 3. Replaced generic <Input> with styled <input> --- */}
      <div className="grid grid-cols-2 gap-4">
        {error && (
          <div className={`col-span-2 ${errorBox}`}>{error}</div>
        )}

        <FormInput
          label="First Name"
          id="reg_first_name"
          placeholder="First name"
          value={form.first_name}
          onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
        />
        <FormInput
          label="Last Name"
          id="reg_last_name"
          placeholder="Last name"
          value={form.last_name}
          onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
        />
        <div className="col-span-2">
          <FormInput
            label="Email"
            id="reg_email"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="col-span-2">
          <FormInput
            label="Initial Password"
            id="reg_password"
            placeholder="Initial Password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
        </div>
        <FormInput
          label="Department"
          id="reg_dept"
          placeholder="Department"
          value={form.department}
          onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
        />
        <FormInput
          label="Position"
          id="reg_pos"
          placeholder="Position"
          value={form.position}
          onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
        />
      </div>
    </Modal>
  );
}