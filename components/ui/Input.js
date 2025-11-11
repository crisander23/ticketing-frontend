'use client';
export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5 ${className}`}
      {...props}
    />
  );
}
