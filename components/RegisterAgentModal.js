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

  // --- Theme Styles ---
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/80' : 'text-slate-600';
  
  const inputFieldClass = `w-full rounded-lg px-3 py-2 text-sm ${
    isDark 
      ? 'bg-white/10 border border-white/15 text-white placeholder-white/60' 
      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
  } outline-none focus:ring-2 focus:ring-blue-500`;

  const buttonGhost = `rounded-lg px-3 py-2 text-sm ${isDark ? 'border border-white/15 bg-transparent text-white hover:bg-white/10' : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'}`;
  const buttonPrimary = `rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-slate-900 text-white hover:bg-slate-800'} disabled:opacity-60`;

  const errorBox = isDark
    ? 'rounded-lg border border-rose-400/30 bg-rose-900/25 text-rose-100 px-4 py-3 text-sm'
    : 'rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm';

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (!form.first_name || !form.last_name || !form.email || !form.password) {
        throw new Error('All fields are required.');
      }
      
      // --- 1. GET THE LOGGED-IN ADMIN ID ---
      let currentAdminId = null;
      if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user'); 
          if (storedUser) {
              try {
                  const parsedUser = JSON.parse(storedUser);
                  currentAdminId = parsedUser.user_id || parsedUser.id || parsedUser.userId;
              } catch (err) {
                  console.error("Error parsing user from local storage:", err);
              }
          }
      }

      if (!currentAdminId) {
          console.warn("⚠️ Warning: sending request without actor_id. Audit log will likely be skipped.");
      }

      await apiFetch('/admin/users', {
        method: 'POST',
        body: { 
          ...form, 
          user_type: 'agent', 
          status: 'active',
          actor_id: currentAdminId 
        },
      });
      
      onSuccess?.();
      onClose?.(); 
      setForm({ 
        first_name: '', last_name: '', email: '', password: '',
        department: 'Support', position: 'Agent',
      });
    } catch (e) {
      setError(e.message || 'Failed to register agent');
    } finally {
      setSaving(false);
    }
  }

  const handleClose = () => {
    setError(null);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
          labelClass={textSub}
          inputClass={inputFieldClass}
          autoComplete="off"
        />
        <FormInput
          label="Last Name"
          id="reg_last_name"
          placeholder="Last name"
          value={form.last_name}
          onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
          labelClass={textSub}
          inputClass={inputFieldClass}
          autoComplete="off"
        />
        <div className="col-span-2">
          <FormInput
            label="Email"
            id="reg_email"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            labelClass={textSub}
            inputClass={inputFieldClass}
            autoComplete="off"
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
            labelClass={textSub}
            inputClass={inputFieldClass}
            autoComplete="new-password" // This tells the browser this is a NEW password, stopping autofill
          />
        </div>
        <FormInput
          label="Department"
          id="reg_dept"
          placeholder="Department"
          value={form.department}
          onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
          labelClass={textSub}
          inputClass={inputFieldClass}
          autoComplete="off"
        />
        <FormInput
          label="Position"
          id="reg_pos"
          placeholder="Position"
          value={form.position}
          onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
          labelClass={textSub}
          inputClass={inputFieldClass}
          autoComplete="off"
        />
      </div>
    </Modal>
  );
}

const FormInput = ({ label, id, labelClass, inputClass, ...props }) => (
  <div>
    <label htmlFor={id} className={`block text-xs font-medium mb-1 ${labelClass}`}>
      {label}
    </label>
    <input id={id} className={inputClass} {...props} />
  </div>
);