'use client';
import { useState, useEffect } from 'react';

export default function ResolutionModal({ open, onCancel, onSubmit }) {
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (open) setDetails('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 text-white shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="text-lg font-semibold">Add Resolution Details</div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          <label className="text-sm text-white/80" htmlFor="resolutionDetails">
            What was done to resolve this ticket?
          </label>
          <textarea
            id="resolutionDetails"
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Reconfigured network settings, replaced faulty cable, verified with client…"
          />
          <p className="text-xs text-white/60">This will be saved with the ticket as <b>resolution_details</b>.</p>
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 border border-white/15 bg-white/10 hover:bg-white/15"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(details)}
            className="rounded-lg px-4 py-2 font-semibold bg-white text-gray-900 hover:bg-gray-100"
          >
            Save & Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
