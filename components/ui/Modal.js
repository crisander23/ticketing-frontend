'use client';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    function onEsc(e){ if(e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-24 w-full max-w-lg rounded-xl border border-[var(--line)] bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <div className="mb-3 text-lg font-semibold">{title}</div> : null}
        <div>{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
