'use client';
export default function Button({ as: As = 'button', variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-black/5';
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    subtle: 'bg-white border border-[var(--line)] hover:bg-gray-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const cls = `${base} ${variants[variant] || variants.default} ${className}`;
  return <As className={cls} {...props} />;
}
