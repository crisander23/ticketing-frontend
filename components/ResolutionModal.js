'use client';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useState } from 'react';

export default function ResolutionModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Provide Resolution Details"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSubmit(text)} disabled={!text.trim()}>
            Submit Resolution
          </Button>
        </>
      }
    >
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
        placeholder="Describe the resolution applied…"
      />
    </Modal>
  );
}
