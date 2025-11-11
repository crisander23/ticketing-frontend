'use client';
const cls = {
  open:        'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved:    'bg-purple-100 text-purple-800',
  closed:      'bg-green-100 text-green-800',
  default:     'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ value, asClient = false }) {
  let text = value || 'open';
  if (asClient && (value === 'in_progress' || value === 'resolved')) text = 'In Progress';
  const c = cls[value] || cls.default;
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c}`}>{text}</span>;
}
